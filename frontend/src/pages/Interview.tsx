import { useEffect, useRef, useState, useCallback } from "react";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Send, MessageSquare, BookOpenCheck, Loader2, X, Star, TrendingUp, AlertCircle, Lightbulb } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";



// Assume the backend is running locally on port 5000 as per the Python script
// NOTE: Ensure this matches your actual backend host/port, e.g., http://localhost:5000
const API_BASE_URL = "http://localhost:5000/api";
const API_BASE_URL2 = "http://localhost:8090/api";

// Define the state for the interview session
type InterviewState = "initial" | "waiting_intro" | "in_interview" | "completed";

// Define the structure for the interviewer's response
interface InterviewResponse {
    error: any;
    session_id: string;
    response: string;
    state: InterviewState;
    action: "new_question" | "end_interview";
    questions_count?: number;
    audio_url?: string;
}

// Define the structure for the conversation messages (for display)
interface ChatMessage {
    sender: "user" | "interviewer";
    text: string;
    type: "intro" | "answer" | "question";
}

// Define the structure for the final feedback
interface Feedback {
    overall_rating: number;
    summary: string;
    strengths: string[];
    areas_for_improvement: string[];
    recommended_next_steps: string[];

    // NEW
    emotion_analysis?: {
        emotions_3?: any;
        emotions_6?: any;
        gender?: any;
        speaking_style?: {
            label: string;
            score: number;
            features: any;
        };
    };
}

// // Define the structure for the transcription response
// interface TranscriptionResponse {
//     transcribed_text: string;
//     error: any;
// }


// --- Component for Feedback Modal (Internal) ---
const FeedbackModal: React.FC<{ feedback: Feedback, onClose: () => void }> = ({ feedback, onClose }) => {
    const rating = Number(feedback.overall_rating) || 0;
    const ratingColor = rating >= 8 ? "text-green-600" : rating >= 5 ? "text-yellow-600" : "text-red-500";
    const ratingRing = rating >= 8 ? "border-green-200 bg-green-50" : rating >= 5 ? "border-yellow-200 bg-yellow-50" : "border-red-200 bg-red-50";

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.14)] w-full max-w-2xl max-h-[88vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2">
                        <BookOpenCheck className="h-5 w-5 text-gray-700" />
                        <h2 className="text-lg font-semibold text-gray-800">Interview Feedback</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">

                    {/* Rating + Summary row */}
                    <div className="flex gap-4">
                        <div className={`flex flex-col items-center justify-center rounded-2xl border-2 ${ratingRing} p-5 shrink-0 w-32`}>
                            <span className={`text-4xl font-bold ${ratingColor}`}>{feedback.overall_rating}</span>
                            <span className="text-[10px] text-gray-400 mt-1 font-medium uppercase tracking-wide">/ 10</span>
                        </div>
                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col justify-center">
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Summary</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{feedback.summary}</p>
                        </div>
                    </div>

                    {/* Strengths + Areas */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white border border-gray-200 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                                <TrendingUp className="h-4 w-4 text-green-500" /> Strengths
                            </div>
                            <ul className="flex flex-col gap-1.5">
                                {feedback.strengths?.map((s, i) => (
                                    <li key={i} className="text-xs text-gray-600 flex gap-2 leading-snug">
                                        <span className="text-green-500 shrink-0 mt-0.5">•</span> {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                                <AlertCircle className="h-4 w-4 text-red-400" /> Areas to Improve
                            </div>
                            <ul className="flex flex-col gap-1.5">
                                {feedback.areas_for_improvement?.map((a, i) => (
                                    <li key={i} className="text-xs text-gray-600 flex gap-2 leading-snug">
                                        <span className="text-red-400 shrink-0 mt-0.5">•</span> {a}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Next Steps */}
                    {feedback.recommended_next_steps?.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                                <Lightbulb className="h-4 w-4 text-yellow-500" /> Recommended Next Steps
                            </div>
                            <ul className="flex flex-col gap-1.5">
                                {feedback.recommended_next_steps.map((r, i) => (
                                    <li key={i} className="text-xs text-gray-600 flex gap-2 leading-snug">
                                        <span className="text-yellow-500 shrink-0 mt-0.5">•</span> {r}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Emotion Analysis */}
                    {feedback.emotion_analysis && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                                <Star className="h-4 w-4 text-purple-400" /> Voice Emotion Analysis
                            </div>
                            <div className="flex flex-col gap-1 text-xs text-gray-600">
                                {feedback.emotion_analysis.speaking_style && (
                                    <p><span className="font-medium text-gray-700">Speaking Style:</span> {feedback.emotion_analysis.speaking_style.label} ({(feedback.emotion_analysis.speaking_style.score * 100).toFixed(1)}%)</p>
                                )}
                                {feedback.emotion_analysis.emotions_3 && (
                                    <p><span className="font-medium text-gray-700">Primary Emotion:</span> {feedback.emotion_analysis.emotions_3.emotion}</p>
                                )}
                                {feedback.emotion_analysis.emotions_6 && (
                                    <p><span className="font-medium text-gray-700">Detailed Emotion:</span> {feedback.emotion_analysis.emotions_6.emotion}</p>
                                )}
                                {feedback.emotion_analysis.gender && (
                                    <p><span className="font-medium text-gray-700">Gender Prediction:</span> {feedback.emotion_analysis.gender.gender}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};



interface SimulationData {
    role: string;
    resume: string;
    jd: string;
    interview_level: string;
    interview_duration: string;
}

export default function WebinarUI({ simulation }: { simulation: SimulationData }) {
    const location = useLocation();
    const state = location.state as {
        company: string;
        role: string;
        jobDescription: string;
        level: string;
        duration: string;
        interviewType: string;
        resume: any;
    };

    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chatEndRef = useRef<HTMLDivElement | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // --- State for Media and UI ---
    const [hasMedia, setHasMedia] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [permissionError, setPermissionError] = useState<string | null>(null);
    const [liveTime, setLiveTime] = useState(0); // seconds
    const liveIntervalRef = useRef<number | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // --- NEW State for Recording and Transcription ---
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

    // --- State for Interview Logic ---
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [interviewState, setInterviewState] = useState<InterviewState>("initial");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false); // New state for modal

    const [emotionResult, setEmotionResult] = useState<any | null>(null);

    // --- Time Formatting Helper ---
    const formatTime = (s: number) => {
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = s % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // --- Media Setup and Cleanup (Initial useEffect) ---
    useEffect(() => {
        const initMedia = async () => {
            try {
                // Request both video and audio access
                const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                streamRef.current = s;

                // Attach the stream to the video element
                if (videoRef.current) {
                    videoRef.current.srcObject = s;
                    videoRef.current.play();
                }
                setHasMedia(true);
                setPermissionError(null);
            } catch (err: any) {
                console.error("Media access error:", err);
                setPermissionError(err?.message || "Permission denied. Check your browser settings.");
            }
        };

        initMedia();

        // Cleanup: Stop all media tracks when the component unmounts
        return () => {
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
            if (mediaRecorder) mediaRecorder.stop(); // Stop recorder if running
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // --- Timer and Current Time Effects ---
    useEffect(() => {
        // Live time counter
        if (videoEnabled && hasMedia) {
            if (!liveIntervalRef.current) {
                liveIntervalRef.current = window.setInterval(() => {
                    setLiveTime(prev => prev + 1);
                }, 1000);
            }
        } else {
            if (liveIntervalRef.current) {
                clearInterval(liveIntervalRef.current);
                liveIntervalRef.current = null;
            }
        }
    }, [videoEnabled, hasMedia]);

    useEffect(() => {
        // Clock
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // --- Chat Auto-Scroll Effect ---
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);


    // --- Core Interview Logic Functions ---

    /**
     * Handles the AI's response: updates the chat, plays audio, and updates state.
     */
    const handleAiResponse = useCallback((data: InterviewResponse) => {
        // 1. Add AI message to chat history
        setMessages(prev => [...prev, {
            sender: "interviewer",
            text: data.response,
            type: "question"
        }]);

        // 2. Update session state
        setSessionId(data.session_id);
        setInterviewState(data.state);

        // 3. Play audio response if URL is provided
        if (data.audio_url) {
            // Prepend the full base URL because the audio_url is relative (e.g., /api/static/...)
            const fullAudioUrl = `${API_BASE_URL.replace("/api", "")}${data.audio_url}`;

            console.log("Attempting to play audio from FULL URL:", fullAudioUrl);

            try {
                // Stop any currently playing audio
                if (audioRef.current) {
                    audioRef.current.pause();
                }
                const audio = new Audio(fullAudioUrl);
                audioRef.current = audio;
                audio.onended = () => { audioRef.current = null; };
                audio.play();
            } catch (e) {
                console.error("Error playing audio:", e);
                console.warn("If audio is not playing, check browser console for CORS or network errors for URL:", fullAudioUrl);
            }
        }
    }, []);

    // --- NEW Audio Recording and Transcription Logic ---

    const startRecording = () => {
        console.log("here")
        if (!streamRef.current || isProcessing) return;

        try {
            const audioTracks = streamRef.current.getAudioTracks();
            if (audioTracks.length === 0 || !audioTracks[0].enabled) {
                setMessages(prev => [...prev, { sender: "interviewer", text: "Error: Microphone is muted or unavailable. Please enable it before recording.", type: "question" }]);
                return;
            }

            setInput("");
            setAudioChunks([]);

            let mimeType = "audio/webm";
            if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "";

            const audioStream = new MediaStream(audioTracks);
            const recorder = new MediaRecorder(audioStream, { mimeType });

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    setAudioChunks(prev => [...prev, event.data]);
                }
            };

            recorder.onstart = () => setIsRecording(true);
            recorder.onstop = () => setIsRecording(false);

            recorder.onerror = () => {
                setIsRecording(false);
                setMessages(prev => [...prev, { sender: "interviewer", text: "Recording error occurred. Please try typing your answer.", type: "question" }]);
            };

            recorder.start();
            setMediaRecorder(recorder);

            setMessages(prev => [...prev, { sender: "interviewer", text: "Recording started. Click the mic icon again to stop and transcribe.", type: "question" }]);

        } catch (error) {
            console.error("Failed to start recording:", error);
            setMessages(prev => [...prev, { sender: "interviewer", text: "Could not start recording. Check browser permissions.", type: "question" }]);
        }
    };

    const analyzeEmotion = async (audioBlob: Blob) => {
        const formData = new FormData();
        formData.append("file", audioBlob, "user_answer.webm");
        formData.append("model_type", "mfccs");
        formData.append("emotions_3", "true");
        formData.append("emotions_6", "true");
        formData.append("gender", "true");

        try {
            const res = await fetch(`${API_BASE_URL2}/predict`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (res.ok) return data.predictions;

            console.error("Emotion API error:", data);
            return null;
        } catch (err) {
            console.error("Emotion analysis failed:", err);
            return null;
        }
    };


    const transcribeAudio = async (audioBlob: Blob) => {
        setIsProcessing(true);

        const formData = new FormData();
        formData.append("audio", audioBlob, "user_answer.webm");

        try {
            const response = await fetch(`${API_BASE_URL}/transcribe_audio`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            // 🔥 NEW — Call emotion model
            const emotionData = await analyzeEmotion(audioBlob);

            // you can store it in state to show later
            setEmotionResult(emotionData);

            if (response.ok && data.transcribed_text) {
                setInput(data.transcribed_text);

                setMessages(prev => [
                    ...prev,
                    {
                        sender: "interviewer",
                        text: "Transcription received. Review your answer and click 'Send'.",
                        type: "question",
                    },
                ]);
            } else {
                console.error("Transcription API error:", data.error);
                setMessages(prev => [
                    ...prev,
                    {
                        sender: "interviewer",
                        text: `Transcription failed: ${data.error || "Unknown error"}. Please type your answer.`,
                        type: "question",
                    },
                ]);
            }
        } catch (error) {
            console.error("Transcription network error:", error);
            setMessages(prev => [
                ...prev,
                {
                    sender: "interviewer",
                    text: "Network error during transcription. Please try typing your answer.",
                    type: "question",
                },
            ]);
        } finally {
            setIsProcessing(false);
        }
    };




    const stopRecording = () => {
        if (!mediaRecorder) return;

        // Stop the media recorder. This will trigger ondataavailable and then onstop.
        mediaRecorder.stop();
        setMediaRecorder(null);
        // isRecording is set to false in the recorder's onstop callback
    };

    // Effect to handle the transcription once the audio chunks are collected and recording has stopped
    useEffect(() => {
        if (!isRecording && audioChunks.length > 0) {
            // Combine all chunks into a single Blob
            const mimeType = audioChunks[0].type;
            const audioBlob = new Blob(audioChunks, { type: mimeType });

            // Clear chunks so we don't re-transcribe if state updates unexpectedly
            setAudioChunks([]);

            transcribeAudio(audioBlob);
        }
    }, [isRecording, audioChunks]); // Depend on isRecording and audioChunks

    // --- Core Interview Logic Functions ---

    /**
     * Placeholder function to start a new interview session.
     */
    const startInterview = async () => {
        if (isProcessing) return;
        if (!state) return setPermissionError("Simulation data missing");

        setIsProcessing(true);
        setMessages([]);
        setFeedback(null);
        setLiveTime(0);
        console.log(state)
        try {
            const response = await fetch("http://localhost:5000/api/start_interview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    company: state.company,
                    role: state.role,
                    resume: state.resume,
                    jd: state.jobDescription,
                    interview_level: state.level,
                    interview_duration: state.duration,
                    interview_type: state.interviewType,
                }),

            });

            const data = await response.json();

            if (response.ok) {
                setSessionId(data.session_id);
                setInterviewState("waiting_intro");
                setMessages([{
                    sender: "interviewer",
                    text: "Welcome! Please click the microphone button to record your self-introduction (or type it in the box) and click 'Send' to begin the interview.",
                    type: "question"
                }]);
            } else {
                setPermissionError(`Failed to start interview: ${data.error}`);
            }
        } catch (error) {
            console.error("Start interview error:", error);
            setPermissionError("Network error while starting session.");
        } finally {
            setIsProcessing(false);
        }
    };


    /**
     * Main function to handle user input (Intro or Answer)
     */
    const handleSubmitInput = async () => {
        // Input check now uses the editable 'input' state
        if (!input.trim() || isProcessing || !sessionId || isRecording) return;

        const userMessage = input.trim();
        setIsProcessing(true);

        // 1. Add user message to local chat history
        const messageType = interviewState === "waiting_intro" ? "intro" : "answer";
        setMessages(prev => [...prev, { sender: "user", text: userMessage, type: messageType }]);
        setInput(""); // Clear input after queuing for submission

        try {
            const endpoint = interviewState === "waiting_intro"
                ? `${API_BASE_URL}/submit_intro`
                : `${API_BASE_URL}/submit_answer`;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sessionId, text: userMessage })
            });
            const data: InterviewResponse = await response.json();

            if (response.ok) {
                handleAiResponse(data);
                if (data.state === "completed") {
                    // Automatically trigger feedback generation after a short delay for audio playback
                    setTimeout(() => getFeedback(), 2000);
                }
            } else {
                console.error("API error:", data.error);
                // Re-add input as a temporary message to inform user of error
                setMessages(prev => [...prev, { sender: "interviewer", text: `Error processing response: ${data.error}`, type: "question" }]);
            }
        } catch (error) {
            console.error("Submission error:", error);
            setMessages(prev => [...prev, { sender: "interviewer", text: `Network error. Please try again.`, type: "question" }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const buildTranscript = (msgs: ChatMessage[]) => {
        const qa: { question: string; answer: string }[] = [];
        let currentQ = "";
        for (const msg of msgs) {
            if (msg.sender === "interviewer" && msg.type === "question") {
                currentQ = msg.text;
            } else if (msg.sender === "user" && currentQ) {
                qa.push({ question: currentQ, answer: msg.text });
                currentQ = "";
            }
        }
        return qa;
    };

    const getFeedback = async () => {
        if (!sessionId || interviewState !== "completed" || isProcessing) return;
        setIsProcessing(true);

        try {
            const response = await fetch(`${API_BASE_URL}/get_feedback/${sessionId}`, { method: "GET" });
            const data = await response.json();

            if (response.ok) {
                const fb = data.feedback;
                setFeedback(fb);
                setMessages(prev => [...prev, {
                    sender: "interviewer",
                    text: "Your feedback is ready — click the View Feedback button below.",
                    type: "question"
                }]);

                // Save session to backend
                const BACKEND = import.meta.env.VITE_API_BASE_URL;
                fetch(`${BACKEND}/interview/save`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        role:          state?.role        || "",
                        company:       state?.company     || "",
                        interviewType: state?.interviewType || "",
                        level:         state?.level       || "",
                        duration:      state?.duration    || "",
                        transcript:    buildTranscript(messages),
                        feedback:      fb,
                    }),
                }).catch(err => console.error("Failed to save interview session:", err));
            } else {
                setMessages(prev => [...prev, { sender: "interviewer", text: `Failed to fetch feedback: ${data.error}`, type: "question" }]);
            }
        } catch (error) {
            console.error("Feedback error:", error);
            setMessages(prev => [...prev, { sender: "interviewer", text: `Network error fetching feedback.`, type: "question" }]);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- Media Control Handlers ---

    const handleEnable = async () => {
        // Re-run initial media setup to attempt permission grant again
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        try {
            const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = s;
            if (videoRef.current) {
                videoRef.current.srcObject = s;
                videoRef.current.play();
            }
            setHasMedia(true);
            setPermissionError(null);
        } catch (err: any) {
            setPermissionError(err?.message || "Permission denied");
        }
    };

    const toggleAudio = () => {
        if (!streamRef.current) return;
        const tracks = streamRef.current.getAudioTracks();
        if (tracks.length > 0) {
            tracks.forEach(t => (t.enabled = !t.enabled));
            setAudioEnabled(prev => !prev);
            if (isRecording) stopRecording(); // Stop recording if audio is disabled mid-session
        }
    };

    const toggleVideo = () => {
        if (!streamRef.current) return;
        const tracks = streamRef.current.getVideoTracks();
        if (tracks.length > 0) {
            tracks.forEach(t => (t.enabled = !t.enabled));
            setVideoEnabled(prev => !prev);
        }
    };

    const endCall = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setHasMedia(false);
        // In a real app, this would navigate to the dashboard
        navigate("/dashboard");
    };

    // --- JSX Rendering ---
    const isStartable = interviewState === "initial" && !sessionId && !isProcessing;
    const isReadyForInput = (interviewState === "waiting_intro" || interviewState === "in_interview") && sessionId;
    const isWaitingForTranscription = !isRecording && audioChunks.length > 0 && isProcessing;

    return (
        <div className="w-screen h-screen bg-white text-black flex overflow-hidden font-sans">
            <div className="flex-1 flex flex-col">
                {/* --- VIDEO AREA - CANDIDATE'S FEED --- */}
                <div className="flex-1 p-4 relative bg-black flex items-center justify-center overflow-hidden">

                    {/* Candidate's video feed */}
                    <div className={`absolute inset-0 bg-black overflow-hidden z-20 ${!hasMedia && 'hidden'}`}>
                        <video
                            ref={videoRef}
                            className={`w-full h-full object-cover transform scale-x-[-1] ${!videoEnabled && 'opacity-30'}`}
                            playsInline
                            muted
                        />


                        {/* Video Disabled Overlay */}
                        {!videoEnabled && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                <VideoOff className="text-white" size={64} />
                            </div>
                        )}

                        {/* 'You' label and Audio Status */}
                        <div className="absolute bottom-4 left-4 text-white text-lg font-bold">You</div>
                        <div className="absolute bottom-4 right-4 p-2 rounded-full bg-black/50">
                            {audioEnabled ? <Mic size={20} className="text-white" /> : <MicOff size={20} className="text-red-500" />}
                        </div>
                    </div>


                    {/* Overlay for Camera Access Required */}
                    {!hasMedia && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-30">
                            <div className="bg-white text-black rounded-xl shadow-xl p-8 text-center border border-neutral-300">
                                <div className="mb-4 font-bold text-xl">
                                    Camera & Microphone Access Required
                                </div>
                                <p className="mb-4 text-neutral-600">
                                    The interview requires your video and audio input.
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={handleEnable}
                                        className="px-6 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                                    >
                                        Enable Media
                                    </button>
                                    <button
                                        onClick={endCall}
                                        className="px-6 py-2 border border-black rounded-lg hover:bg-neutral-100 transition-colors"
                                    >
                                        Exit
                                    </button>
                                </div>
                                {permissionError && (
                                    <div className="text-red-500 mt-4 text-sm font-medium">{permissionError}</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* LIVE Status */}
                    {sessionId && (
                        <div className="absolute top-4 left-4 bg-black text-white rounded-full px-3 py-1 text-sm z-10 flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            {interviewState === "completed" ? "ENDED" : `LIVE ${formatTime(liveTime)}`}
                        </div>
                    )}

                </div>

                {/* --- CONTROL BAR --- */}
                <div className="w-full border-t border-neutral-200 bg-white flex justify-center gap-8 py-4 items-center relative">
                    <div className="text-black font-medium text-lg absolute left-4">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {/* Media Controls */}
                    <button
                        onClick={toggleVideo}
                        disabled={!hasMedia}
                        className={`p-3 rounded-full transition-colors ${videoEnabled ? 'bg-black text-white hover:bg-gray-800' : 'bg-red-500 text-white hover:bg-red-600'}`}
                    >
                        {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                    </button>

                    {/* Microphone/Record Button */}
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={!hasMedia || !audioEnabled || isProcessing || !isReadyForInput}
                        className={`p-4 rounded-full transition-all shadow-lg ring-4 
                            ${!isRecording
                                ? 'bg-red-600 text-white ring-red-300  hover:bg-red-700'
                                : 'bg-black text-white ring-black/10 animate-pulse hover:bg-gray-800'
                            }`}
                    >
                        {isRecording ? <Mic size={24} /> : <MicOff size={24} />}
                    </button>

                    {/* End Call Button */}
                    <button
                        onClick={endCall}
                        className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                        <PhoneOff size={20} />
                    </button>

                    {/* Start Interview Button */}
                    {isStartable && (
                        <button
                            onClick={startInterview}
                            className="absolute right-4 px-6 py-2 bg-green-600 text-white font-medium rounded-full hover:bg-green-700 transition-colors"
                            disabled={!hasMedia || isProcessing}
                        >
                            Start AI Interview
                        </button>
                    )}

                    {/* Get Feedback Button */}
                    {interviewState === "completed" && !feedback && (
                        <button
                            onClick={getFeedback}
                            className="absolute right-4 px-6 py-2 bg-gray-600 text-white font-medium rounded-full hover:bg-gray-700 transition-colors flex items-center gap-2"
                            disabled={isProcessing}
                        >
                            {isProcessing ? <Loader2 size={20} className="animate-spin" /> : "Get Feedback"}
                            {!isProcessing && <BookOpenCheck size={20} />}
                        </button>
                    )}

                    {/* View Feedback Button */}
                    {feedback && (
                        <button
                            onClick={() => setShowFeedbackModal(true)}
                            className="absolute right-4 px-6 py-2 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                            View Feedback
                            <BookOpenCheck size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* --- CHAT PANEL --- */}
            <div className="w-[400px] border-l border-neutral-300 bg-white p-4">
                <div className="bg-[#F2F2F5] flex flex-col h-full rounded-3xl">
                    <div className="p-4 px-6 border-b border-neutral-200 flex items-center gap-2">
                        <MessageSquare size={20} className="text-neutral-500" />
                        <div className="text-lg font-semibold">Interview Chat</div>
                    </div>

                    {/* Status/Instructions Block */}
                    <div className="flex flex-col px-4 py-2 mx-4 mt-4 rounded-xl text-[.8rem] text-center overflow-hidden bg-[#e2e2e5] text-neutral-700">
                        <span className="font-semibold">Current State:</span> {interviewState.replace('_', ' ').toUpperCase()}
                        <span className="mt-1 text-[.75rem]">
                            {isRecording ? "🎤 Recording voice. Click MicOff to stop." : isWaitingForTranscription ? "⏳ Transcribing audio..." : "Text messages are analyzed in real time."}
                        </span>
                    </div>

                    {/* Message Display Area */}
                    <div className="flex-1 overflow-y-auto space-y-3 p-6 pr-3 flex flex-col justify-end">
                        {messages.length === 0 && (
                            <div className="text-neutral-400 text-sm text-center italic">
                                Click 'Start AI Interview' to begin.
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`p-3 rounded-xl max-w-[85%] text-sm shadow-sm ${m.sender === "user"
                                    ? "bg-black text-white self-end ml-auto"
                                    : "bg-white text-black self-start mr-auto border border-neutral-200"
                                    }`}
                            >
                                <span className="font-semibold text-xs opacity-70 block mb-1">
                                    {m.sender === "user" ? "You" : "Interviewer"} ({m.type.toUpperCase()})
                                </span>
                                {m.text}
                            </div>
                        ))}
                        {isProcessing && interviewState !== "completed" && (
                            <div className="self-start mr-auto">
                                <div className="bg-white text-black p-3 rounded-xl text-sm border border-neutral-200">
                                    <Loader2 className="animate-spin inline mr-2 h-4 w-4" />
                                    Interviewer is thinking...
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmitInput(); }} className="p-4 pt-2">
                        <div className="flex gap-3 items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="flex-1 p-3 border border-neutral-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                                placeholder={isReadyForInput ? "Type your answer or record your voice..." : "Click 'Start AI Interview' to begin"}
                                disabled={!isReadyForInput || isProcessing || isRecording}
                            />
                            <button
                                type="submit"
                                className={`p-3 rounded-full w-10 h-10 transition-colors flex items-center justify-center 
                                    ${(input.trim() && isReadyForInput && !isProcessing && !isRecording) ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'}`}
                                disabled={!input.trim() || !isReadyForInput || isProcessing || isRecording}
                            >
                                {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Feedback Modal */}
            {showFeedbackModal && feedback && (
                <FeedbackModal
                    feedback={feedback}
                    onClose={() => setShowFeedbackModal(false)}
                />
            )}
        </div>
    );
}