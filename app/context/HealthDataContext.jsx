'use client';

import { createContext, useContext, useState, useCallback } from 'react';

// Create the context
const HealthDataContext = createContext(null);

// Provider component
export function HealthDataProvider({ children }) {
    // Session data
    const [sessionId] = useState(() => `session_${Date.now()}`);
    const [sessionStart] = useState(() => new Date().toISOString());

    // Face camera metrics
    const [faceMetrics, setFaceMetrics] = useState({
        // Vital Signs
        heart_rate: null,
        heart_rate_confidence: null,
        hrv: null,
        spo2: null,
        breathing_rate: null,
        breathing_status: null,

        // Neurological
        facial_symmetry: null,
        symmetry_status: null,
        head_tremor: null,
        tremor_status: null,
        gaze_direction: null,
        fatigue_level: null,
        fatigue_perclos: null,

        // Emotional
        distress_score: null,
        primary_emotion: null,
        emotion_confidence: null,

        // Physical Appearance
        skin_status: null,
        skin_rgb: { r: null, g: null, b: null },
        lip_status: null,

        // Timestamps
        last_updated: null,
    });

    // Chat symptoms
    const [symptoms, setSymptoms] = useState({
        // Physical symptoms (visible/easy to detect)
        physical: {
            rash: false,
            swelling: false,
            skin_discoloration: false,
            visible_injury: false,
            bruising: false,
        },

        // Internal symptoms (hard to detect - needs ML)
        internal: {
            fever: false,
            headache: false,
            nausea: false,
            vomiting: false,
            chest_pain: false,
            abdominal_pain: false,
            fatigue: false,
            dizziness: false,
            breathing_difficulty: false,
            cough: false,
            sore_throat: false,
            body_ache: false,
        },

        // Metadata
        raw_text: '',
        severity_level: 0, // 1-5 scale
        duration_hours: null,
        symptom_count: 0,
        last_updated: null,
    });

    // Uploaded documents
    const [documents, setDocuments] = useState({
        files: [],
        has_lab_report: false,
        has_prescription: false,
        has_imaging: false,
        has_medical_history: false,
        total_count: 0,
        last_upload: null,
    });

    // Data collection history
    const [dataHistory, setDataHistory] = useState([]);

    // Update face metrics
    const updateFaceMetrics = useCallback((newMetrics) => {
        setFaceMetrics(prev => ({
            ...prev,
            ...newMetrics,
            last_updated: new Date().toISOString(),
        }));
    }, []);

    // Update symptoms from chat
    const updateSymptoms = useCallback((text) => {
        const lowerText = text.toLowerCase();

        // Symptom keyword detection
        const symptomKeywords = {
            // Physical
            rash: ['rash', 'skin rash', 'hives'],
            swelling: ['swelling', 'swollen', 'puffiness'],
            skin_discoloration: ['discoloration', 'yellowing', 'pale'],
            visible_injury: ['injury', 'wound', 'cut', 'bruise'],

            // Internal
            fever: ['fever', 'temperature', 'hot', 'chills'],
            headache: ['headache', 'head pain', 'migraine'],
            nausea: ['nausea', 'nauseous', 'queasy'],
            vomiting: ['vomiting', 'vomit', 'throwing up'],
            chest_pain: ['chest pain', 'chest hurt', 'heart pain'],
            abdominal_pain: ['stomach pain', 'abdominal', 'belly pain'],
            fatigue: ['tired', 'fatigue', 'exhausted', 'weakness'],
            dizziness: ['dizzy', 'lightheaded', 'vertigo'],
            breathing_difficulty: ['breathing', 'breath', 'shortness', 'asthma'],
            cough: ['cough', 'coughing'],
            sore_throat: ['sore throat', 'throat pain'],
            body_ache: ['body ache', 'muscle pain', 'aching'],
        };

        const detectedSymptoms = {
            physical: {},
            internal: {},
        };

        let symptomCount = 0;

        // Check physical symptoms
        Object.entries(symptomKeywords).slice(0, 4).forEach(([symptom, keywords]) => {
            const found = keywords.some(kw => lowerText.includes(kw));
            detectedSymptoms.physical[symptom] = found;
            if (found) symptomCount++;
        });

        // Check internal symptoms
        Object.entries(symptomKeywords).slice(4).forEach(([symptom, keywords]) => {
            const found = keywords.some(kw => lowerText.includes(kw));
            detectedSymptoms.internal[symptom] = found;
            if (found) symptomCount++;
        });

        setSymptoms(prev => ({
            ...prev,
            physical: { ...prev.physical, ...detectedSymptoms.physical },
            internal: { ...prev.internal, ...detectedSymptoms.internal },
            raw_text: prev.raw_text + ' ' + text,
            symptom_count: symptomCount,
            last_updated: new Date().toISOString(),
        }));

        return detectedSymptoms;
    }, []);

    // Add document
    const addDocument = useCallback((file, type) => {
        const docEntry = {
            id: `doc_${Date.now()}`,
            filename: file.name,
            type: type, // 'lab_report', 'prescription', 'imaging', 'medical_history'
            size: file.size,
            uploadedAt: new Date().toISOString(),
        };

        setDocuments(prev => ({
            ...prev,
            files: [...prev.files, docEntry],
            has_lab_report: type === 'lab_report' || prev.has_lab_report,
            has_prescription: type === 'prescription' || prev.has_prescription,
            has_imaging: type === 'imaging' || prev.has_imaging,
            has_medical_history: type === 'medical_history' || prev.has_medical_history,
            total_count: prev.total_count + 1,
            last_upload: new Date().toISOString(),
        }));

        return docEntry;
    }, []);

    // Snapshot current data for history
    const takeSnapshot = useCallback(() => {
        const snapshot = {
            timestamp: new Date().toISOString(),
            faceMetrics: { ...faceMetrics },
            symptoms: { ...symptoms },
            documents: { ...documents },
        };
        setDataHistory(prev => [...prev, snapshot]);
        return snapshot;
    }, [faceMetrics, symptoms, documents]);

    // Export all data as JSON
    const exportAsJSON = useCallback(() => {
        const exportData = {
            session: {
                id: sessionId,
                start: sessionStart,
                export_time: new Date().toISOString(),
            },
            face_metrics: faceMetrics,
            symptoms: symptoms,
            documents: documents,
            history: dataHistory,
            disease_difficulty: {
                easy_to_detect: ['rash', 'swelling', 'skin_discoloration', 'visible_injury'],
                moderate: ['fatigue', 'emotion', 'distress', 'gaze'],
                hard_to_detect: ['heart_rate', 'hrv', 'spo2', 'facial_symmetry', 'internal_symptoms'],
            },
        };

        return JSON.stringify(exportData, null, 2);
    }, [sessionId, sessionStart, faceMetrics, symptoms, documents, dataHistory]);

    // Export as CSV-ready format
    const exportAsCSV = useCallback(() => {
        const row = {
            session_id: sessionId,
            timestamp: new Date().toISOString(),
            // Vitals
            heart_rate: faceMetrics.heart_rate,
            hrv: faceMetrics.hrv,
            spo2: faceMetrics.spo2,
            breathing_rate: faceMetrics.breathing_rate,
            // Neurological
            facial_symmetry: faceMetrics.facial_symmetry,
            head_tremor: faceMetrics.head_tremor,
            fatigue_perclos: faceMetrics.fatigue_perclos,
            // Emotional
            distress_score: faceMetrics.distress_score,
            primary_emotion: faceMetrics.primary_emotion,
            // Physical
            skin_status: faceMetrics.skin_status,
            lip_status: faceMetrics.lip_status,
            // Symptoms (flatten)
            ...Object.fromEntries(
                Object.entries(symptoms.physical).map(([k, v]) => [`symptom_${k}`, v ? 1 : 0])
            ),
            ...Object.fromEntries(
                Object.entries(symptoms.internal).map(([k, v]) => [`symptom_${k}`, v ? 1 : 0])
            ),
            symptom_count: symptoms.symptom_count,
            // Documents
            doc_count: documents.total_count,
            has_lab_report: documents.has_lab_report ? 1 : 0,
        };

        return row;
    }, [sessionId, faceMetrics, symptoms, documents]);

    const value = {
        // Data
        sessionId,
        faceMetrics,
        symptoms,
        documents,
        dataHistory,

        // Actions
        updateFaceMetrics,
        updateSymptoms,
        addDocument,
        takeSnapshot,
        exportAsJSON,
        exportAsCSV,
    };

    return (
        <HealthDataContext.Provider value={value}>
            {children}
        </HealthDataContext.Provider>
    );
}

// Hook to use the context
export function useHealthData() {
    const context = useContext(HealthDataContext);
    if (!context) {
        throw new Error('useHealthData must be used within a HealthDataProvider');
    }
    return context;
}

export default HealthDataContext;
