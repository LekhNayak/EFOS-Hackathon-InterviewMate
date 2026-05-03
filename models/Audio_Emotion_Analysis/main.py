import numpy as np
import cv2
import librosa
import librosa.display
from tensorflow.keras.models import load_model
import os
import traceback
from datetime import datetime
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
from PIL import Image
import io
import base64
from flask import Flask, request, jsonify, abort
from flask_cors import CORS
from werkzeug.utils import secure_filename
from melspec import plot_colored_polar, get_melspec, CAT6, CAT7, CAT3, COLOR_DICT
from pydub import AudioSegment
import imageio_ffmpeg
import subprocess as _sp

# Point pydub at the bundled ffmpeg binary so no system install is needed
_FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
AudioSegment.converter = _FFMPEG
AudioSegment.ffmpeg = _FFMPEG
AudioSegment.ffprobe = _FFMPEG.replace("ffmpeg", "ffprobe") if "ffmpeg" in _FFMPEG else _FFMPEG

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load models
MODEL_6_EMOTIONS = load_model("model3.h5")
MODEL_7_EMOTIONS = load_model("model4.h5")
MODEL_GENDER = load_model("model_mw.h5")

# Constants
MAX_FILE_SIZE = 9000000  # 9MB
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'ogg', 'webm'}


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def save_audio_file(file) -> str:
    """Save uploaded audio file and return path"""
    if not os.path.exists("audio"):
        os.makedirs("audio")

    # Clear old files
    for filename in os.listdir("audio"):
        file_path = os.path.join("audio", filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
        except Exception as e:
            print(f'Failed to delete {file_path}. Reason: {e}')

    # Save new file
    filename = secure_filename(file.filename)
    file_path = os.path.join("audio", filename)
    content = file.read()

    # Check file size
    if len(content) > MAX_FILE_SIZE:
        abort(400, description="File size is too large. Maximum size is 4MB.")

    # Reset file pointer
    file.seek(0)

    with open(file_path, "wb") as f:
        f.write(content)

    return file_path


def get_mfccs(audio_path: str, limit: int):
    """Extract MFCC features from audio file"""
    y, sr = librosa.load(audio_path)
    a = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
    if a.shape[1] > limit:
        mfccs = a[:, :limit]
    elif a.shape[1] < limit:
        mfccs = np.zeros((a.shape[0], limit))
        mfccs[:, :a.shape[1]] = a
    else:
        mfccs = a
    return mfccs


def get_title(predictions, categories):
    """Get title string for predictions"""
    return f"Detected emotion: {categories[predictions.argmax()]} - {predictions.max() * 100:.2f}%"


def fig_to_base64(fig):
    """Convert matplotlib figure to base64 string"""
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', dpi=100)
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    return img_base64


def str_to_bool(value):
    """Convert string to boolean"""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ('true', '1', 'yes', 'on')
    return bool(value)


# ---------- NEW: speaking confidence helpers ----------

def compute_confidence_features(y, sr):
    """
    Compute basic prosodic features related to speaking confidence:
    - energy (RMS)
    - voiced_ratio (how much of the time you're speaking)
    - pitch_mean and pitch_std (average pitch and its stability)
    """
    # Energy / loudness
    rms = librosa.feature.rms(y=y)[0]
    energy = float(np.mean(rms))

    # Voice activity (how much of the time you're actually speaking)
    try:
        intervals = librosa.effects.split(y, top_db=30)
        voiced_dur = sum((end - start) for start, end in intervals) / sr
        total_dur = len(y) / sr
        voiced_ratio = voiced_dur / total_dur if total_dur > 0 else 0.0
    except Exception:
        voiced_ratio = 0.0

    # Pitch (fundamental frequency) and stability
    try:
        f0 = librosa.yin(y, fmin=50, fmax=400)
        f0 = f0[f0 > 0]  # keep only valid pitches
        pitch_mean = float(np.mean(f0)) if len(f0) > 0 else 0.0
        pitch_std = float(np.std(f0)) if len(f0) > 0 else 0.0
    except Exception:
        pitch_mean, pitch_std = 0.0, 0.0

    return {
        "energy": energy,
        "voiced_ratio": voiced_ratio,
        "pitch_mean": pitch_mean,
        "pitch_std": pitch_std,
    }


def simple_confidence_score(features):
    """
    Rough heuristic score:
    0.0 = low confidence / more anxious
    1.0 = high confidence
    """
    energy = features["energy"]
    voiced_ratio = features["voiced_ratio"]
    pitch_std = features["pitch_std"]

    # Rough normalization / scaling – tweak as you like
    energy_term = min(energy / 0.05, 1.0)              # louder → more confident
    voiced_term = min(voiced_ratio / 0.7, 1.0)         # speaking most of the time
    stability_term = 1.0 - min(pitch_std / 60.0, 1.0)  # more stable pitch → more confident

    score = 0.4 * energy_term + 0.4 * voiced_term + 0.2 * stability_term
    return float(score)  # 0–1

# ------------------------------------------------------


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "message": "Speech Emotion Recognition API is running"
    })


def convert_to_wav(path):
    if path.lower().endswith(".wav"):
        return path

    wav_path = path.rsplit(".", 1)[0] + ".wav"
    try:
        result = _sp.run(
            [_FFMPEG, "-y", "-i", path, wav_path],
            capture_output=True,
        )
        if result.returncode != 0:
            raise Exception(result.stderr.decode(errors="replace"))
        return wav_path
    except Exception as e:
        raise Exception(f"FFmpeg conversion failed: {str(e)}")

@app.route("/api/predict", methods=["POST"])
def predict_emotion():
    """
    Main prediction endpoint

    Parameters (form data):
    - file: Audio file (wav, mp3, ogg) - required
    - model_type: "mfccs" or "mel-specs" (default: "mfccs")
    - emotions_3: true/false (default: true) - Predict 3 emotions
    - emotions_6: true/false (default: true) - Predict 6 emotions
    - emotions_7: true/false (default: false) - Predict 7 emotions
    - gender: true/false (default: false) - Predict gender
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            abort(400, description="No file provided")

        file = request.files['file']

        if file.filename == '':
            abort(400, description="No file selected")

        # Validate file type
        if not allowed_file(file.filename):
            abort(400, description="Invalid file type. ")

        # Get parameters
        model_type = request.form.get('model_type', 'mfccs')
        emotions_3 = str_to_bool(request.form.get('emotions_3', 'true'))
        emotions_6 = str_to_bool(request.form.get('emotions_6', 'true'))
        emotions_7 = str_to_bool(request.form.get('emotions_7', 'false'))
        gender = str_to_bool(request.form.get('gender', 'false'))
        audio_path = save_audio_file(file)
        # Save audio file
        try:
    # Convert unsupported formats like webm → wav
            audio_path = convert_to_wav(audio_path)
            wav, sr = librosa.load(audio_path, sr=44100)
        except Exception as e:
            abort(400, description=f"Error loading audio file: {str(e)}")


        results = {}

        # ---------- NEW: compute confidence / anxiety style ----------
        confidence_features = compute_confidence_features(wav, sr)
        style_score = simple_confidence_score(confidence_features)
        style_label = "confident" if style_score >= 0.5 else "anxious"
        # ------------------------------------------------------------

        if model_type == "mfccs":
            # Get MFCC features
            mfccs = get_mfccs(audio_path, MODEL_6_EMOTIONS.input_shape[-1])
            mfccs = mfccs.reshape(1, *mfccs.shape)
            pred = MODEL_6_EMOTIONS.predict(mfccs, verbose=0)[0]

            # 3 emotions prediction
            if emotions_3:
                pos = pred[3] + pred[5] * .5
                neu = pred[2] + pred[5] * .5 + pred[4] * .5
                neg = pred[0] + pred[1] + pred[4] * .5
                data3 = np.array([pos, neu, neg])
                emotion_3 = CAT3[data3.argmax()]
                results["emotions_3"] = {
                    "emotion": emotion_3,
                    "confidence": float(data3.max()),
                    "predictions": {
                        CAT3[i]: float(data3[i]) for i in range(len(CAT3))
                    }
                }

            # 6 emotions prediction
            if emotions_6:
                emotion_6 = CAT6[pred.argmax()]
                results["emotions_6"] = {
                    "emotion": emotion_6,
                    "confidence": float(pred.max()),
                    "predictions": {
                        CAT6[i]: float(pred[i]) for i in range(len(CAT6))
                    }
                }

            # 7 emotions prediction
            if emotions_7:
                mfccs_7 = get_mfccs(audio_path, MODEL_7_EMOTIONS.input_shape[-2])
                mfccs_7 = mfccs_7.T.reshape(1, *mfccs_7.T.shape)
                pred_7 = MODEL_7_EMOTIONS.predict(mfccs_7, verbose=0)[0]
                emotion_7 = CAT7[pred_7.argmax()]
                results["emotions_7"] = {
                    "emotion": emotion_7,
                    "confidence": float(pred_7.max()),
                    "predictions": {
                        CAT7[i]: float(pred_7[i]) for i in range(len(CAT7))
                    }
                }

            # Gender prediction
            if gender:
                gmfccs = get_mfccs(audio_path, MODEL_GENDER.input_shape[-1])
                gmfccs = gmfccs.reshape(1, *gmfccs.shape)
                gpred = MODEL_GENDER.predict(gmfccs, verbose=0)[0]
                gender_result = "female" if gpred.argmax() == 0 else "male"
                results["gender"] = {
                    "gender": gender_result,
                    "confidence": float(gpred.max()),
                    "predictions": {
                        "female": float(gpred[0]),
                        "male": float(gpred[1])
                    }
                }

        # ---------- NEW: attach speaking style to results ----------
        results["speaking_style"] = {
            "label": style_label,
            "score": style_score,
            "features": confidence_features
        }
        # -----------------------------------------------------------

        return jsonify({
            "success": True,
            "message": "Prediction completed successfully",
            "file_name": file.filename,
            "predictions": results
        })

    except Exception as e:
        traceback.print_exc()
        if hasattr(e, 'code') and hasattr(e, 'description'):
            abort(e.code, description=str(e.description))
        abort(500, description=f"Internal server error: {str(e)}")


@app.route("/api/predict/emotions", methods=["POST"])
def predict_emotions_only():

    

    """
    Predict emotions only (3, 6, or 7 emotions)

    Parameters (form data):
    - file: Audio file - required
    - num_emotions: Number of emotions to predict (3, 6, or 7) - default: 6
    """
    if 'file' not in request.files:
        abort(400, description="No file provided")

    file = request.files['file']

    if file.filename == '':
        abort(400, description="No file selected")

    num_emotions = request.form.get('num_emotions', 6, type=int)

    if num_emotions not in [3, 6, 7]:
        abort(400, description="num_emotions must be 3, 6, or 7")

    emotions_3 = num_emotions == 3
    emotions_6 = num_emotions == 6
    emotions_7 = num_emotions == 7

    try:
        if not allowed_file(file.filename):
            abort(400, description="Invalid file type. Supported: wav, mp3, ogg")

        audio_path = save_audio_file(file)
        try:
    # Convert unsupported formats like webm → wav
            audio_path = convert_to_wav(audio_path)

            wav, sr = librosa.load(audio_path, sr=44100)
        except Exception as e:
            abort(400, description=f"Error loading audio file: {str(e)}")

        results = {}

        if emotions_6:
            mfccs = get_mfccs(audio_path, MODEL_6_EMOTIONS.input_shape[-1])
            mfccs = mfccs.reshape(1, *mfccs.shape)
            pred = MODEL_6_EMOTIONS.predict(mfccs, verbose=0)[0]
            emotion_6 = CAT6[pred.argmax()]
            results["emotions_6"] = {
                "emotion": emotion_6,
                "confidence": float(pred.max()),
                "predictions": {
                    CAT6[i]: float(pred[i]) for i in range(len(CAT6))
                }
            }
        elif emotions_7:
            mfccs_7 = get_mfccs(audio_path, MODEL_7_EMOTIONS.input_shape[-2])
            mfccs_7 = mfccs_7.T.reshape(1, *mfccs_7.T.shape)
            pred_7 = MODEL_7_EMOTIONS.predict(mfccs_7, verbose=0)[0]
            emotion_7 = CAT7[pred_7.argmax()]
            results["emotions_7"] = {
                "emotion": emotion_7,
                "confidence": float(pred_7.max()),
                "predictions": {
                    CAT7[i]: float(pred_7[i]) for i in range(len(CAT7))
                }
            }
        else:  # 3 emotions
            mfccs = get_mfccs(audio_path, MODEL_6_EMOTIONS.input_shape[-1])
            mfccs = mfccs.reshape(1, *mfccs.shape)
            pred = MODEL_6_EMOTIONS.predict(mfccs, verbose=0)[0]
            pos = pred[3] + pred[5] * .5
            neu = pred[2] + pred[5] * .5 + pred[4] * .5
            neg = pred[0] + pred[1] + pred[4] * .5
            data3 = np.array([pos, neu, neg])
            emotion_3 = CAT3[data3.argmax()]
            results["emotions_3"] = {
                "emotion": emotion_3,
                "confidence": float(data3.max()),
                "predictions": {
                    CAT3[i]: float(data3[i]) for i in range(len(CAT3))
                }
            }

        return jsonify({
            "success": True,
            "message": "Prediction completed successfully",
            "file_name": file.filename,
            "predictions": results
        })
    except Exception as e:
        if hasattr(e, 'code') and hasattr(e, 'description'):
            abort(e.code, description=str(e.description))
        abort(500, description=f"Error: {str(e)}")


@app.route("/api/predict/gender", methods=["POST"])
def predict_gender_only():
    """
    Predict gender only

    Parameters (form data):
    - file: Audio file - required
    """
    if 'file' not in request.files:
        abort(400, description="No file provided")

    file = request.files['file']

    if file.filename == '':
        abort(400, description="No file selected")

    try:
        if not allowed_file(file.filename):
            abort(400, description="Invalid file type. Supported: wav, mp3, ogg")

        audio_path = save_audio_file(file)
        wav, sr = librosa.load(audio_path, sr=44100)

        # Gender prediction
        gmfccs = get_mfccs(audio_path, MODEL_GENDER.input_shape[-1])
        gmfccs = gmfccs.reshape(1, *gmfccs.shape)
        gpred = MODEL_GENDER.predict(gmfccs, verbose=0)[0]
        gender_result = "female" if gpred.argmax() == 0 else "male"

        results = {
            "gender": {
                "gender": gender_result,
                "confidence": float(gpred.max()),
                "predictions": {
                    "female": float(gpred[0]),
                    "male": float(gpred[1])
                }
            }
        }

        return jsonify({
            "success": True,
            "message": "Prediction completed successfully",
            "file_name": file.filename,
            "predictions": results
        })
    except Exception as e:
        if hasattr(e, 'code') and hasattr(e, 'description'):
            abort(e.code, description=str(e.description))
        abort(500, description=f"Error: {str(e)}")


@app.route("/api/analyze/features", methods=["POST"])
def analyze_audio_features():
    """
    Extract and return audio features (MFCCs, mel-spectrogram)

    Parameters (form data):
    - file: Audio file - required
    """
    if 'file' not in request.files:
        abort(400, description="No file provided")

    file = request.files['file']

    if file.filename == '':
        abort(400, description="No file selected")

    try:
        if not allowed_file(file.filename):
            abort(400, description="Invalid file type. Supported: wav, mp3, ogg")

        audio_path = save_audio_file(file)

        # Load audio
        wav, sr = librosa.load(audio_path, sr=44100)

        # Get MFCCs
        mfccs = librosa.feature.mfcc(y=wav, sr=sr)

        # Get mel-spectrogram
        Xdb = get_melspec(audio_path)[1]

        return jsonify({
            "success": True,
            "message": "Features extracted successfully",
            "file_name": file.filename,
            "sample_rate": int(sr),
            "duration": float(len(wav) / sr),
            "mfcc_shape": list(mfccs.shape),
            "mel_spec_shape": list(Xdb.shape)
        })

    except Exception as e:
        if hasattr(e, 'code') and hasattr(e, 'description'):
            abort(e.code, description=str(e.description))
        abort(500, description=f"Error: {str(e)}")


@app.route("/api/visualize/polar", methods=["POST"])
def visualize_polar_plot():
    """
    Generate and return polar plot visualization as base64 image

    Parameters (form data):
    - file: Audio file - required
    - num_emotions: Number of emotions (3, 6, or 7) - default: 6
    """
    if 'file' not in request.files:
        abort(400, description="No file provided")

    file = request.files['file']

    if file.filename == '':
        abort(400, description="No file selected")

    try:
        num_emotions = request.form.get('num_emotions', 6, type=int)

        if num_emotions not in [3, 6, 7]:
            abort(400, description="num_emotions must be 3, 6, or 7")

        if not allowed_file(file.filename):
            abort(400, description="Invalid file type. Supported: wav, mp3, ogg")

        audio_path = save_audio_file(file)

        # Get predictions
        if num_emotions == 6:
            mfccs = get_mfccs(audio_path, MODEL_6_EMOTIONS.input_shape[-1])
            mfccs = mfccs.reshape(1, *mfccs.shape)
            pred = MODEL_6_EMOTIONS.predict(mfccs, verbose=0)[0]
            categories = CAT6
        elif num_emotions == 7:
            mfccs = get_mfccs(audio_path, MODEL_7_EMOTIONS.input_shape[-2])
            mfccs = mfccs.T.reshape(1, *mfccs.T.shape)
            pred = MODEL_7_EMOTIONS.predict(mfccs, verbose=0)[0]
            categories = CAT7
        else:  # 3 emotions
            mfccs = get_mfccs(audio_path, MODEL_6_EMOTIONS.input_shape[-1])
            mfccs = mfccs.reshape(1, *mfccs.shape)
            pred = MODEL_6_EMOTIONS.predict(mfccs, verbose=0)[0]
            pos = pred[3] + pred[5] * .5
            neu = pred[2] + pred[5] * .5 + pred[4] * .5
            neg = pred[0] + pred[1] + pred[4] * .5
            pred = np.array([pos, neu, neg])
            categories = CAT3

        # Create plot
        fig = plt.figure(figsize=(5, 5))
        title = get_title(pred, categories)
        plot_colored_polar(fig, predictions=pred, categories=categories, title=title, colors=COLOR_DICT)

        # Convert to base64
        img_base64 = fig_to_base64(fig)

        return jsonify({
            "success": True,
            "image": img_base64,
            "format": "png"
        })

    except Exception as e:
        if hasattr(e, 'code') and hasattr(e, 'description'):
            abort(e.code, description=str(e.description))
        abort(500, description=f"Error: {str(e)}")


@app.errorhandler(400)
def bad_request(error):
    return jsonify({
        "success": False,
        "error": "Bad Request",
        "message": str(error.description) if hasattr(error, 'description') else str(error)
    }), 400


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "success": False,
        "error": "Internal Server Error",
        "message": str(error.description) if hasattr(error, 'description') else str(error)
    }), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8090, debug=False)
