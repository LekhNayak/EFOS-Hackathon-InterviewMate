import base64
import io
import os
import re
import wave
from concurrent.futures import ThreadPoolExecutor, as_completed

import httpx

SARVAM_BASE_URL = "https://api.sarvam.ai"

SUPPORTED_LANGUAGES = [
    "hi-IN", "bn-IN", "te-IN", "mr-IN", "ta-IN",
    "gu-IN", "kn-IN", "ml-IN", "pa-IN", "or-IN", "en-IN",
]

DEFAULT_LANGUAGE = "en-IN"


def _get_api_key() -> str:
    key = os.getenv("SARVAM_API_KEY")
    if not key:
        raise RuntimeError("Missing SARVAM_API_KEY in api_service/data/config.env")
    return key.strip()


def _headers() -> dict:
    return {"api-subscription-key": _get_api_key()}


def _split_into_chunks(text: str, limit: int = 490) -> list[str]:
    """Split text into chunks ≤ limit chars, breaking at sentence boundaries."""
    sentences = re.split(r'(?<=[.?!।])\s+', text.strip())
    chunks, current = [], ""
    for sentence in sentences:
        if not sentence:
            continue
        # Single sentence longer than limit — hard-split it
        if len(sentence) > limit:
            if current:
                chunks.append(current.strip())
                current = ""
            for i in range(0, len(sentence), limit):
                chunks.append(sentence[i:i + limit])
            continue
        if len(current) + len(sentence) + 1 > limit:
            chunks.append(current.strip())
            current = sentence
        else:
            current = (current + " " + sentence).strip()
    if current:
        chunks.append(current.strip())
    return chunks


def _concat_wav_bytes(wav_buffers: list[bytes]) -> bytes:
    """Concatenate multiple WAV byte strings into one WAV."""
    out = io.BytesIO()
    params = None
    all_frames = []
    for buf in wav_buffers:
        with wave.open(io.BytesIO(buf), "rb") as w:
            if params is None:
                params = w.getparams()
            all_frames.append(w.readframes(w.getnframes()))
    with wave.open(out, "wb") as w:
        w.setparams(params)
        for frames in all_frames:
            w.writeframes(frames)
    return out.getvalue()


_MIME_MAP = {
    ".wav":  "audio/wav",
    ".webm": "audio/webm",
    ".mp3":  "audio/mpeg",
    ".m4a":  "audio/mp4",
    ".ogg":  "audio/ogg",
    ".flac": "audio/flac",
}


def speech_to_text(audio_bytes: bytes, language: str = DEFAULT_LANGUAGE, filename: str = "audio.wav") -> dict:
    """
    Convert audio to text using Sarvam STT API (saarika:v2).
    Returns: {"transcript": str, "language_code": str}
    """
    if language not in SUPPORTED_LANGUAGES:
        language = DEFAULT_LANGUAGE

    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ".wav"
    mimetype = _MIME_MAP.get(ext, "audio/wav")

    with httpx.Client(timeout=30) as client:
        response = client.post(
            f"{SARVAM_BASE_URL}/speech-to-text",
            headers=_headers(),
            files={"file": (filename, audio_bytes, mimetype)},
            data={"language_code": language, "model": "saarika:v2"},
        )
        response.raise_for_status()
        data = response.json()
        return {
            "transcript": data.get("transcript", ""),
            "language_code": data.get("language_code", language),
        }


def _tts_chunk(text: str, language: str, client: httpx.Client) -> bytes:
    """Synthesize a single chunk (≤490 chars) and return raw WAV bytes."""
    response = client.post(
        f"{SARVAM_BASE_URL}/text-to-speech",
        headers={**_headers(), "Content-Type": "application/json"},
        json={
            "inputs": [text],
            "target_language_code": language,
            "speaker": "anushka",
            "model": "bulbul:v2",
            "pace": 1,
        },
    )
    if not response.is_success:
        print(f"[Sarvam TTS error] status={response.status_code} body={response.text}")
        response.raise_for_status()
    return base64.b64decode(response.json()["audios"][0])


def text_to_speech(text: str, language: str = DEFAULT_LANGUAGE) -> bytes:
    """
    Convert text to audio using Sarvam TTS API (bulbul:v2).
    Splits text into ≤490-char sentence chunks, synthesizes all chunks in
    parallel, then concatenates the WAV audio in order.
    """
    if language not in SUPPORTED_LANGUAGES:
        language = DEFAULT_LANGUAGE

    chunks = _split_into_chunks(text)
    if len(chunks) == 1:
        with httpx.Client(timeout=30) as client:
            return _tts_chunk(chunks[0], language, client)

    wav_buffers = [None] * len(chunks)

    def _fetch(idx: int, chunk: str) -> tuple[int, bytes]:
        with httpx.Client(timeout=30) as client:
            return idx, _tts_chunk(chunk, language, client)

    with ThreadPoolExecutor(max_workers=len(chunks)) as pool:
        futures = {pool.submit(_fetch, i, c): i for i, c in enumerate(chunks)}
        for future in as_completed(futures):
            idx, wav = future.result()
            wav_buffers[idx] = wav

    return _concat_wav_bytes(wav_buffers)


def translate(text: str, source_language: str = "en-IN", target_language: str = DEFAULT_LANGUAGE) -> str:
    """
    Translate text using Sarvam Translate API (mayura:v1).
    Returns translated string.
    """
    if source_language not in SUPPORTED_LANGUAGES:
        source_language = "en-IN"
    if target_language not in SUPPORTED_LANGUAGES:
        target_language = DEFAULT_LANGUAGE

    with httpx.Client(timeout=30) as client:
        response = client.post(
            f"{SARVAM_BASE_URL}/translate",
            headers={**_headers(), "Content-Type": "application/json"},
            json={
                "input": text,
                "source_language_code": source_language,
                "target_language_code": target_language,
                "model": "mayura:v1",
                "enable_preprocessing": True,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data.get("translated_text", text)
