'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { useHealthData } from '../context/HealthDataContext';

export default function FaceAI() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const hiddenCanvasRef = useRef(null);
    const intervalRef = useRef(null);

    // ============ STATE FOR ALL HEALTH METRICS ============
    const [isLoading, setIsLoading] = useState(true);
    const [cameraReady, setCameraReady] = useState(false);

    // Vital Signs
    const [heartRate, setHeartRate] = useState(null);
    const [hrv, setHrv] = useState(null);
    const [spo2, setSpo2] = useState(null);

    // Breathing & Distress
    const [breathing, setBreathing] = useState(null);
    const [distress, setDistress] = useState(null);

    // Neurological
    const [facialSymmetry, setFacialSymmetry] = useState(null);
    const [headTremor, setHeadTremor] = useState(null);
    const [gazeDirection, setGazeDirection] = useState(null);

    // Mental Health
    const [emotion, setEmotion] = useState(null);
    const [fatigue, setFatigue] = useState(null);

    // Physical Health
    const [skinColor, setSkinColor] = useState(null);
    const [lipColor, setLipColor] = useState(null);

    // Speech
    const [speechState, setSpeechState] = useState(null);

    // ============ REFS FOR TRACKING DATA ============
    const breathingBuffer = useRef([]);
    const blinkCount = useRef(0);
    const startTime = useRef(Date.now());
    const eyeClosedFrames = useRef(0);
    const totalFrames = useRef(0);

    // rPPG Heart Rate
    const rgbBuffer = useRef([]);
    const heartRateHistory = useRef([]);
    const lastPeakTime = useRef(null);
    const rrIntervals = useRef([]);

    // Head Tremor
    const headPositionBuffer = useRef([]);

    // Facial Symmetry
    const symmetryBuffer = useRef([]);

    // Context for sharing data
    let healthContext = null;
    try {
        healthContext = useHealthData();
    } catch (e) {
        // Context not available (component used outside provider)
    }

    // Push metrics to shared context every 5 seconds
    useEffect(() => {
        if (!healthContext) return;

        const pushInterval = setInterval(() => {
            healthContext.updateFaceMetrics({
                heart_rate: heartRate?.bpm || null,
                heart_rate_confidence: heartRate?.confidence || null,
                hrv: hrv?.rmssd || null,
                spo2: spo2?.value || null,
                breathing_rate: breathing?.bpm || null,
                breathing_status: breathing?.rate || null,
                facial_symmetry: facialSymmetry?.score || null,
                symmetry_status: facialSymmetry?.status || null,
                head_tremor: headTremor?.variance || null,
                tremor_status: headTremor?.status || null,
                gaze_direction: gazeDirection?.direction || null,
                fatigue_level: fatigue?.level || null,
                fatigue_perclos: fatigue?.perclos || null,
                distress_score: distress?.score || null,
                primary_emotion: emotion?.primary || null,
                emotion_confidence: emotion?.confidence || null,
                skin_status: skinColor?.status || null,
                skin_rgb: skinColor?.rgb || { r: null, g: null, b: null },
                lip_status: lipColor?.status || null,
            });
        }, 5000);

        return () => clearInterval(pushInterval);
    }, [healthContext, heartRate, hrv, spo2, breathing, facialSymmetry, headTremor, gazeDirection, fatigue, distress, emotion, skinColor, lipColor]);

    // ============ LOAD MODELS ============
    useEffect(() => {
        const loadModels = async () => {
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models'),
                    faceapi.nets.faceExpressionNet.loadFromUri('/models'),
                ]);
                setIsLoading(false);
                startCamera();
                startSpeechRecognition();
            } catch (error) {
                console.error('Error loading models:', error);
            }
        };
        loadModels();

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraReady(true);
            }
        } catch (error) {
            console.error('Camera error:', error);
        }
    };

    // ============ 1. HEART RATE (rPPG) ============
    const estimateHeartRate = useCallback((landmarks) => {
        if (!hiddenCanvasRef.current || !videoRef.current) return;

        const canvas = hiddenCanvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);

        // Get forehead region (between eyebrows, above nose)
        const leftEyebrow = landmarks.getLeftEyeBrow();
        const rightEyebrow = landmarks.getRightEyeBrow();
        const nose = landmarks.getNose();

        const foreheadX = (leftEyebrow[0].x + rightEyebrow[4].x) / 2 - 30;
        const foreheadY = Math.min(leftEyebrow[0].y, rightEyebrow[4].y) - 40;
        const foreheadWidth = 60;
        const foreheadHeight = 30;

        try {
            const imageData = ctx.getImageData(
                Math.max(0, foreheadX),
                Math.max(0, foreheadY),
                foreheadWidth,
                foreheadHeight
            );

            // Calculate average RGB
            let r = 0, g = 0, b = 0;
            const pixels = imageData.data;
            const pixelCount = pixels.length / 4;

            for (let i = 0; i < pixels.length; i += 4) {
                r += pixels[i];
                g += pixels[i + 1];
                b += pixels[i + 2];
            }

            r /= pixelCount;
            g /= pixelCount;
            b /= pixelCount;

            // Use green channel (best for rPPG)
            rgbBuffer.current.push({ g, timestamp: Date.now() });

            // Keep last 5 seconds of data (assuming ~30fps = 150 frames)
            if (rgbBuffer.current.length > 150) {
                rgbBuffer.current.shift();
            }

            if (rgbBuffer.current.length >= 90) {
                // Simple peak detection for heart rate
                const greenValues = rgbBuffer.current.map(d => d.g);
                const mean = greenValues.reduce((a, b) => a + b) / greenValues.length;
                const normalized = greenValues.map(v => v - mean);

                // Count peaks (zero crossings from negative to positive)
                let peaks = 0;
                for (let i = 1; i < normalized.length; i++) {
                    if (normalized[i - 1] < 0 && normalized[i] >= 0) {
                        peaks++;
                    }
                }

                // Calculate BPM (peaks in ~3 seconds, extrapolate to 60 seconds)
                const durationSec = (rgbBuffer.current[rgbBuffer.current.length - 1].timestamp - rgbBuffer.current[0].timestamp) / 1000;
                const bpm = Math.round((peaks / durationSec) * 60);

                // Clamp to realistic range
                if (bpm >= 50 && bpm <= 150) {
                    heartRateHistory.current.push(bpm);
                    if (heartRateHistory.current.length > 10) {
                        heartRateHistory.current.shift();
                    }
                    const avgBpm = Math.round(heartRateHistory.current.reduce((a, b) => a + b) / heartRateHistory.current.length);
                    setHeartRate({ bpm: avgBpm, confidence: 0.7 });

                    // Calculate HRV (simplified RMSSD)
                    if (heartRateHistory.current.length >= 5) {
                        const intervals = heartRateHistory.current.map(bpm => 60000 / bpm);
                        let sumSquaredDiff = 0;
                        for (let i = 1; i < intervals.length; i++) {
                            sumSquaredDiff += Math.pow(intervals[i] - intervals[i - 1], 2);
                        }
                        const rmssd = Math.sqrt(sumSquaredDiff / (intervals.length - 1));
                        setHrv({ rmssd: Math.round(rmssd), status: rmssd > 30 ? 'Good' : 'Low' });
                    }
                }
            }
        } catch (e) {
            // Ignore canvas errors
        }
    }, []);

    // ============ 2. SpO2 ESTIMATION ============
    const estimateSpO2 = useCallback((landmarks) => {
        if (!hiddenCanvasRef.current || !videoRef.current) return;

        const canvas = hiddenCanvasRef.current;
        const ctx = canvas.getContext('2d');

        // Get lip region for SpO2 estimation
        const lips = landmarks.getMouth();
        const lipX = lips[0].x;
        const lipY = lips[2].y;
        const lipWidth = lips[6].x - lips[0].x;
        const lipHeight = lips[9].y - lips[2].y;

        try {
            const imageData = ctx.getImageData(
                Math.max(0, lipX),
                Math.max(0, lipY),
                Math.max(1, lipWidth),
                Math.max(1, lipHeight)
            );

            let r = 0, g = 0, b = 0;
            const pixels = imageData.data;
            const pixelCount = pixels.length / 4;

            for (let i = 0; i < pixels.length; i += 4) {
                r += pixels[i];
                g += pixels[i + 1];
                b += pixels[i + 2];
            }

            r /= pixelCount;
            g /= pixelCount;
            b /= pixelCount;

            // Simplified SpO2 estimation based on red/blue ratio
            const ratio = r / (b + 1);
            // Map ratio to SpO2 range (very simplified)
            const spo2Value = Math.min(100, Math.max(85, 85 + (ratio - 1) * 10));

            setSpo2({ value: Math.round(spo2Value), confidence: 0.5 });
        } catch (e) {
            // Ignore errors
        }
    }, []);

    // ============ 3. BREATHING RATE ============
    const estimateBreathing = useCallback((landmarks) => {
        const nose = landmarks.getNose()[0];
        breathingBuffer.current.push({ y: nose.y, timestamp: Date.now() });

        if (breathingBuffer.current.length > 150) {
            breathingBuffer.current.shift();
        }

        if (breathingBuffer.current.length < 60) return;

        const values = breathingBuffer.current.map(d => d.y);
        const mean = values.reduce((a, b) => a + b) / values.length;
        const normalized = values.map(v => v - mean);

        // Count breathing cycles (peaks)
        let cycles = 0;
        for (let i = 1; i < normalized.length - 1; i++) {
            if (normalized[i] > normalized[i - 1] && normalized[i] > normalized[i + 1] && normalized[i] > 0.5) {
                cycles++;
            }
        }

        const durationMin = (breathingBuffer.current[breathingBuffer.current.length - 1].timestamp - breathingBuffer.current[0].timestamp) / 60000;
        const breathsPerMin = Math.round(cycles / durationMin);

        let rate = 'Normal';
        if (breathsPerMin < 12) rate = 'Slow';
        else if (breathsPerMin > 20) rate = 'Fast';

        setBreathing({ rate, bpm: breathsPerMin, confidence: 0.6 });
    }, []);

    // ============ 4. DISTRESS SCORE ============
    const estimateDistress = useCallback((landmarks) => {
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        const eyeAspectRatio = (eye) => {
            const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
            return (dist(eye[1], eye[5]) + dist(eye[2], eye[4])) / (2 * dist(eye[0], eye[3]));
        };

        const leftEAR = eyeAspectRatio(leftEye);
        const rightEAR = eyeAspectRatio(rightEye);
        const ear = (leftEAR + rightEAR) / 2;

        if (ear < 0.2) blinkCount.current++;

        const elapsedMin = (Date.now() - startTime.current) / 60000;
        const blinkRate = blinkCount.current / Math.max(0.1, elapsedMin);

        let score = 0;
        if (blinkRate > 25) score += 0.3;
        if (blinkRate > 35) score += 0.2;
        if (ear < 0.18) score += 0.3;

        setDistress({ score: Math.min(score, 1), blinkRate: Math.round(blinkRate), confidence: 0.6 });
    }, []);

    // ============ 5. FACIAL SYMMETRY (Stroke Detection) ============
    const analyzeFacialSymmetry = useCallback((landmarks) => {
        const jawline = landmarks.getJawOutline();
        const nose = landmarks.getNose();
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        const mouth = landmarks.getMouth();

        // Calculate nose center as midline reference
        const noseTip = nose[3];

        // Compare left vs right distances from nose
        const leftJawDist = Math.hypot(jawline[0].x - noseTip.x, jawline[0].y - noseTip.y);
        const rightJawDist = Math.hypot(jawline[16].x - noseTip.x, jawline[16].y - noseTip.y);

        const leftEyeCenter = { x: (leftEye[0].x + leftEye[3].x) / 2, y: (leftEye[1].y + leftEye[5].y) / 2 };
        const rightEyeCenter = { x: (rightEye[0].x + rightEye[3].x) / 2, y: (rightEye[1].y + rightEye[5].y) / 2 };

        const leftEyeDist = Math.hypot(leftEyeCenter.x - noseTip.x, leftEyeCenter.y - noseTip.y);
        const rightEyeDist = Math.hypot(rightEyeCenter.x - noseTip.x, rightEyeCenter.y - noseTip.y);

        // Mouth corners
        const leftMouthDist = Math.hypot(mouth[0].x - noseTip.x, mouth[0].y - noseTip.y);
        const rightMouthDist = Math.hypot(mouth[6].x - noseTip.x, mouth[6].y - noseTip.y);

        // Calculate symmetry ratios
        const jawSymmetry = Math.min(leftJawDist, rightJawDist) / Math.max(leftJawDist, rightJawDist);
        const eyeSymmetry = Math.min(leftEyeDist, rightEyeDist) / Math.max(leftEyeDist, rightEyeDist);
        const mouthSymmetry = Math.min(leftMouthDist, rightMouthDist) / Math.max(leftMouthDist, rightMouthDist);

        const overallSymmetry = ((jawSymmetry + eyeSymmetry + mouthSymmetry) / 3) * 100;

        symmetryBuffer.current.push(overallSymmetry);
        if (symmetryBuffer.current.length > 30) symmetryBuffer.current.shift();

        const avgSymmetry = symmetryBuffer.current.reduce((a, b) => a + b) / symmetryBuffer.current.length;

        let status = 'Normal';
        let alert = false;
        if (avgSymmetry < 85) {
            status = 'Asymmetric';
            alert = true;
        } else if (avgSymmetry < 92) {
            status = 'Mild Asymmetry';
        }

        setFacialSymmetry({ score: Math.round(avgSymmetry), status, alert, confidence: 0.7 });
    }, []);

    // ============ 6. HEAD TREMOR DETECTION ============
    const detectHeadTremor = useCallback((landmarks) => {
        const nose = landmarks.getNose()[3];

        headPositionBuffer.current.push({ x: nose.x, y: nose.y, timestamp: Date.now() });
        if (headPositionBuffer.current.length > 60) {
            headPositionBuffer.current.shift();
        }

        if (headPositionBuffer.current.length < 30) return;

        // Calculate movement variance
        const xPositions = headPositionBuffer.current.map(p => p.x);
        const yPositions = headPositionBuffer.current.map(p => p.y);

        const xMean = xPositions.reduce((a, b) => a + b) / xPositions.length;
        const yMean = yPositions.reduce((a, b) => a + b) / yPositions.length;

        const xVariance = xPositions.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0) / xPositions.length;
        const yVariance = yPositions.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0) / yPositions.length;

        const totalVariance = Math.sqrt(xVariance + yVariance);

        let status = 'Stable';
        if (totalVariance > 5) status = 'Mild Tremor';
        if (totalVariance > 10) status = 'Significant Tremor';

        setHeadTremor({ variance: totalVariance.toFixed(2), status, confidence: 0.6 });
    }, []);

    // ============ 7. GAZE DIRECTION ============
    const analyzeGaze = useCallback((landmarks) => {
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        const leftEyeCenter = {
            x: leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length,
            y: leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length
        };

        const rightEyeCenter = {
            x: rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length,
            y: rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length
        };

        const noseTip = landmarks.getNose()[3];

        // Determine gaze based on eye-nose relationship
        const avgEyeX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
        const diffX = avgEyeX - noseTip.x;

        let direction = 'Center';
        if (diffX < -5) direction = 'Looking Left';
        else if (diffX > 5) direction = 'Looking Right';

        setGazeDirection({ direction, confidence: 0.5 });
    }, []);

    // ============ 8. FATIGUE / DROWSINESS (PERCLOS) ============
    const detectFatigue = useCallback((landmarks) => {
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        const eyeAspectRatio = (eye) => {
            const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
            return (dist(eye[1], eye[5]) + dist(eye[2], eye[4])) / (2 * dist(eye[0], eye[3]));
        };

        const ear = (eyeAspectRatio(leftEye) + eyeAspectRatio(rightEye)) / 2;

        totalFrames.current++;
        if (ear < 0.2) {
            eyeClosedFrames.current++;
        }

        // PERCLOS: percentage of time eyes are closed
        const perclos = (eyeClosedFrames.current / totalFrames.current) * 100;

        let level = 'Alert';
        if (perclos > 15) level = 'Mild Fatigue';
        if (perclos > 30) level = 'Drowsy';
        if (perclos > 50) level = 'Severe Fatigue';

        setFatigue({ perclos: perclos.toFixed(1), level, confidence: 0.7 });
    }, []);

    // ============ 9. SKIN COLOR ANALYSIS ============
    const analyzeSkinColor = useCallback((landmarks) => {
        if (!hiddenCanvasRef.current || !videoRef.current) return;

        const canvas = hiddenCanvasRef.current;
        const ctx = canvas.getContext('2d');

        const cheek = landmarks.getJawOutline()[4];

        try {
            const imageData = ctx.getImageData(
                Math.max(0, cheek.x - 15),
                Math.max(0, cheek.y - 15),
                30,
                30
            );

            let r = 0, g = 0, b = 0;
            const pixels = imageData.data;
            const pixelCount = pixels.length / 4;

            for (let i = 0; i < pixels.length; i += 4) {
                r += pixels[i];
                g += pixels[i + 1];
                b += pixels[i + 2];
            }

            r /= pixelCount;
            g /= pixelCount;
            b /= pixelCount;

            // Analyze color indicators
            let status = 'Normal';
            let alerts = [];

            // Yellow tint (jaundice) - high yellow, low blue
            if (g > 150 && b < 100 && r > 150) {
                status = 'Yellowish';
                alerts.push('Possible Jaundice');
            }
            // Pale (low saturation, high brightness)
            else if (r > 200 && g > 200 && b > 200) {
                status = 'Pale';
                alerts.push('Possible Anemia');
            }
            // Bluish (cyanosis)
            else if (b > r && b > g) {
                status = 'Bluish';
                alerts.push('Check Oxygen');
            }
            // Flushed/Red
            else if (r > 180 && g < 130 && b < 130) {
                status = 'Flushed';
                alerts.push('Possible Fever');
            }

            setSkinColor({ status, rgb: { r: Math.round(r), g: Math.round(g), b: Math.round(b) }, alerts, confidence: 0.5 });
        } catch (e) {
            // Ignore errors
        }
    }, []);

    // ============ 10. LIP COLOR ANALYSIS ============
    const analyzeLipColor = useCallback((landmarks) => {
        if (!hiddenCanvasRef.current || !videoRef.current) return;

        const canvas = hiddenCanvasRef.current;
        const ctx = canvas.getContext('2d');

        const lips = landmarks.getMouth();
        const lipCenterX = (lips[0].x + lips[6].x) / 2;
        const lipCenterY = (lips[2].y + lips[9].y) / 2;

        try {
            const imageData = ctx.getImageData(
                Math.max(0, lipCenterX - 10),
                Math.max(0, lipCenterY - 5),
                20,
                10
            );

            let r = 0, g = 0, b = 0;
            const pixels = imageData.data;
            const pixelCount = pixels.length / 4;

            for (let i = 0; i < pixels.length; i += 4) {
                r += pixels[i];
                g += pixels[i + 1];
                b += pixels[i + 2];
            }

            r /= pixelCount;
            g /= pixelCount;
            b /= pixelCount;

            let status = 'Normal';
            if (b > r * 0.8) {
                status = 'Bluish (Low O2)';
            } else if (r < 100 && g < 100 && b < 100) {
                status = 'Dark';
            } else if (r > 180) {
                status = 'Healthy Pink';
            }

            setLipColor({ status, confidence: 0.5 });
        } catch (e) {
            // Ignore errors
        }
    }, []);

    // ============ 11. EMOTION DETECTION ============
    const analyzeEmotion = useCallback((expressions) => {
        if (!expressions) return;

        const emotionMap = {
            neutral: 'Neutral',
            happy: 'Happy',
            sad: 'Sad',
            angry: 'Angry',
            fearful: 'Fearful',
            disgusted: 'Disgusted',
            surprised: 'Surprised'
        };

        let maxEmotion = 'neutral';
        let maxScore = 0;

        Object.entries(expressions).forEach(([emotion, score]) => {
            if (score > maxScore) {
                maxScore = score;
                maxEmotion = emotion;
            }
        });

        setEmotion({
            primary: emotionMap[maxEmotion] || 'Unknown',
            confidence: (maxScore * 100).toFixed(0),
            all: expressions
        });
    }, []);

    // ============ 12. SPEECH ANALYSIS ============
    const startSpeechRecognition = () => {
        if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window)) return;

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.lang = 'en-US';

        recognition.onresult = (e) => {
            const text = e.results[e.results.length - 1][0].transcript;
            const words = text.trim().split(/\s+/);
            const wordsPerSec = words.length / 3; // Assume 3 second chunks

            let clarity = 'Clear';
            let rate = 'Normal';

            if (words.length < 2) clarity = 'Unclear';
            if (wordsPerSec < 1) rate = 'Slow';
            else if (wordsPerSec > 4) rate = 'Fast';

            setSpeechState({ clarity, rate, lastText: text.slice(-50), confidence: 0.6 });
        };

        recognition.onerror = () => {
            setSpeechState({ clarity: 'Unavailable', rate: '-', confidence: 0 });
        };

        try {
            recognition.start();
        } catch (e) {
            // Speech recognition not available
        }
    };

    // ============ MAIN DETECTION LOOP ============
    const detect = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        try {
            const detections = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({
                    inputSize: 320,
                    scoreThreshold: 0.5,
                }))
                .withFaceLandmarks(true)
                .withFaceExpressions();

            const canvas = canvasRef.current;
            const video = videoRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (detections) {
                const resized = faceapi.resizeResults(detections, {
                    width: video.videoWidth,
                    height: video.videoHeight,
                });

                // Draw face detection box
                faceapi.draw.drawDetections(canvas, resized);

                const landmarks = detections.landmarks;

                // Run all analyses
                estimateHeartRate(landmarks);
                estimateSpO2(landmarks);
                estimateBreathing(landmarks);
                estimateDistress(landmarks);
                analyzeFacialSymmetry(landmarks);
                detectHeadTremor(landmarks);
                analyzeGaze(landmarks);
                detectFatigue(landmarks);
                analyzeSkinColor(landmarks);
                analyzeLipColor(landmarks);
                analyzeEmotion(detections.expressions);
            }
        } catch (error) {
            console.error('Detection error:', error);
        }
    };

    // ============ STYLES ============
    const styles = {
        container: {
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            background: '#fff',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
            maxWidth: '900px',
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid #f0f0f0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        iconContainer: {
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        videoIcon: {
            width: '24px',
            height: '24px',
            color: '#fff',
        },
        title: {
            fontSize: '18px',
            fontWeight: '600',
            color: '#fff',
            margin: 0,
        },
        subtitle: {
            fontSize: '13px',
            color: 'rgba(255,255,255,0.8)',
            margin: 0,
        },
        videoArea: {
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 10',
            background: '#1a1a1a',
        },
        video: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
        },
        canvas: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
        },
        metricsGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1px',
            background: '#e5e5e5',
        },
        metricCard: {
            background: '#fff',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
        },
        metricLabel: {
            fontSize: '10px',
            color: '#888',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: '600',
        },
        metricValue: {
            fontSize: '14px',
            fontWeight: '600',
            color: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
        },
        dot: {
            width: '8px',
            height: '8px',
            borderRadius: '50%',
        },
        loadingOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '16px',
        },
    };

    const getStatusColor = (value, type) => {
        switch (type) {
            case 'heartRate':
                if (!value) return '#888';
                if (value >= 60 && value <= 100) return '#4ade80';
                if (value < 60) return '#60a5fa';
                return '#f87171';
            case 'spo2':
                if (!value) return '#888';
                if (value >= 95) return '#4ade80';
                if (value >= 90) return '#fbbf24';
                return '#f87171';
            case 'symmetry':
                if (!value) return '#888';
                if (value >= 92) return '#4ade80';
                if (value >= 85) return '#fbbf24';
                return '#f87171';
            case 'fatigue':
                if (value === 'Alert') return '#4ade80';
                if (value === 'Mild Fatigue') return '#fbbf24';
                return '#f87171';
            case 'distress':
                if (!value && value !== 0) return '#888';
                if (value < 0.3) return '#4ade80';
                if (value < 0.6) return '#fbbf24';
                return '#f87171';
            default:
                return '#4ade80';
        }
    };

    // ============ RENDER ============
    return (
        <div style={styles.container}>
            {/* Hidden canvas for pixel analysis */}
            <canvas ref={hiddenCanvasRef} style={{ display: 'none' }} />

            {/* Header */}
            <div style={styles.header}>
                <div style={styles.iconContainer}>
                    <svg style={styles.videoIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <h2 style={styles.title}>Health Analysis</h2>
                    <p style={styles.subtitle}>AI-powered vital signs & health detection</p>
                </div>
            </div>

            {/* Video Feed */}
            <div style={styles.videoArea}>
                {isLoading && <div style={styles.loadingOverlay}>Loading AI models...</div>}
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    onLoadedMetadata={() => {
                        intervalRef.current = setInterval(detect, 150);
                    }}
                    style={styles.video}
                />
                <canvas ref={canvasRef} style={styles.canvas} />
            </div>

            {/* Metrics Grid */}
            <div style={styles.metricsGrid}>
                {/* Row 1: Vital Signs */}
                <div style={styles.metricCard}>
                    <span style={styles.metricLabel}>❤️ Heart Rate</span>
                    <span style={styles.metricValue}>
                        <span style={{ ...styles.dot, background: getStatusColor(heartRate?.bpm, 'heartRate') }} />
                        {heartRate ? `${heartRate.bpm} BPM` : 'Measuring...'}
                    </span>
                </div>
                <div style={styles.metricCard}>
                    <span style={styles.metricLabel}>💓 HRV</span>
                    <span style={styles.metricValue}>
                        <span style={{ ...styles.dot, background: hrv?.status === 'Good' ? '#4ade80' : '#fbbf24' }} />
                        {hrv ? `${hrv.rmssd}ms (${hrv.status})` : 'Measuring...'}
                    </span>
                </div>
                <div style={styles.metricCard}>
                    <span style={styles.metricLabel}>🩸 SpO2</span>
                    <span style={styles.metricValue}>
                        <span style={{ ...styles.dot, background: getStatusColor(spo2?.value, 'spo2') }} />
                        {spo2 ? `${spo2.value}%` : 'Measuring...'}
                    </span>
                </div>
                <div style={styles.metricCard}>
                    <span style={styles.metricLabel}>🫁 Breathing</span>
                    <span style={styles.metricValue}>
                        <span style={{ ...styles.dot, background: breathing?.rate === 'Normal' ? '#4ade80' : '#fbbf24' }} />
                        {breathing ? `${breathing.bpm}/min (${breathing.rate})` : 'Measuring...'}
                    </span>
                </div>

                {/* Row 2: Neurological */}
                <div style={styles.metricCard}>
                    <span style={styles.metricLabel}>🧠 Symmetry</span>
                    <span style={styles.metricValue}>
                        <span style={{ ...styles.dot, background: getStatusColor(facialSymmetry?.score, 'symmetry') }} />
                        {facialSymmetry ? `${facialSymmetry.score}% (${facialSymmetry.status})` : 'Analyzing...'}
                    </span>
                </div>
                <div style={styles.metricCard}>
                    <span style={styles.metricLabel}>🤝 Head Tremor</span>
                    <span style={styles.metricValue}>
                        <span style={{ ...styles.dot, background: headTremor?.status === 'Stable' ? '#4ade80' : '#fbbf24' }} />
                        {headTremor?.status || 'Analyzing...'}
                    </span>
                </div>
                <div style={styles.metricCard}>
                    <span style={styles.metricLabel}>👁️ Gaze</span>
                    <span style={styles.metricValue}>
                        <span style={{ ...styles.dot, background: '#60a5fa' }} />
                        {gazeDirection?.direction || 'Tracking...'}
                    </span>
                </div>
                <div style={styles.metricCard}>
                    <span style={styles.metricLabel}>😴 Fatigue</span>
                    <span style={styles.metricValue}>
                        <span style={{ ...styles.dot, background: getStatusColor(fatigue?.level, 'fatigue') }} />
                        {fatigue ? `${fatigue.level}` : 'Monitoring...'}
                    </span>
                </div>

                {/* Row 3: Physical & Mental */}
                <div style={styles.metricCard}>
                    <span style={styles.metricLabel}>😟 Distress</span>
                    <span style={styles.metricValue}>
                        <span style={{ ...styles.dot, background: getStatusColor(distress?.score, 'distress') }} />
                        {distress ? `${(distress.score * 100).toFixed(0)}%` : 'Measuring...'}
                    </span>
                </div>
                <div style={styles.metricCard}>
                    <span style={styles.metricLabel}>😊 Emotion</span>
                    <span style={styles.metricValue}>
                        <span style={{ ...styles.dot, background: '#a78bfa' }} />
                        {emotion ? `${emotion.primary}` : 'Detecting...'}
                    </span>
                </div>
                <div style={styles.metricCard}>
                    <span style={styles.metricLabel}>🎨 Skin</span>
                    <span style={styles.metricValue}>
                        <span style={{ ...styles.dot, background: skinColor?.status === 'Normal' ? '#4ade80' : '#fbbf24' }} />
                        {skinColor?.status || 'Analyzing...'}
                    </span>
                </div>
                <div style={styles.metricCard}>
                    <span style={styles.metricLabel}>💋 Lips</span>
                    <span style={styles.metricValue}>
                        <span style={{ ...styles.dot, background: lipColor?.status?.includes('Healthy') ? '#4ade80' : '#fbbf24' }} />
                        {lipColor?.status || 'Analyzing...'}
                    </span>
                </div>
            </div>
        </div>
    );
}
