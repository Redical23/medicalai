'use client';

import React from 'react';

export default function AccuracyPage() {
    const metrics = [
        // High Accuracy
        {
            name: 'Emotion Detection',
            emoji: '😊',
            accuracy: 80,
            category: 'high',
            method: 'Deep Learning CNN',
            clinicalStatus: 'proven',
            description: 'Uses face-api.js trained on FER2013 dataset with millions of labeled facial expressions.',
            research: 'Extensive academic research and commercial applications (affective computing).',
            tips: 'Works best with frontal face view and good lighting.'
        },
        {
            name: 'Facial Symmetry',
            emoji: '🧠',
            accuracy: 80,
            category: 'high',
            method: 'Geometric Analysis',
            clinicalStatus: 'proven',
            description: 'Compares left/right facial landmark distances from nose midline.',
            research: 'Used in stroke detection apps (FAST protocol). Published in medical journals.',
            tips: 'Keep face straight to camera. Alerts at <85% symmetry.'
        },
        {
            name: 'Fatigue Detection',
            emoji: '😴',
            accuracy: 78,
            category: 'high',
            method: 'PERCLOS Algorithm',
            clinicalStatus: 'proven',
            description: 'Percentage of Eye Closure (PERCLOS) - measures time eyes are 80%+ closed.',
            research: 'Standard in driver fatigue monitoring systems. NHTSA validated.',
            tips: 'Avoid wearing dark glasses. Good lighting improves accuracy.'
        },
        {
            name: 'Gaze Direction',
            emoji: '👁️',
            accuracy: 70,
            category: 'high',
            method: 'Eye Landmark Tracking',
            clinicalStatus: 'proven',
            description: 'Tracks pupil position relative to eye corners.',
            research: 'Used in attention detection and neurological assessments.',
            tips: 'Look directly at camera for calibration. Avoid extreme head angles.'
        },
        {
            name: 'Head Tremor',
            emoji: '🤝',
            accuracy: 72,
            category: 'high',
            method: 'Motion Variance Analysis',
            clinicalStatus: 'experimental',
            description: 'Measures involuntary head micro-movements over time.',
            research: 'Research shows promise for Parkinson\'s screening but not clinically validated.',
            tips: 'Keep camera stable. Sit still for best results.'
        },
        // Moderate Accuracy
        {
            name: 'Breathing Rate',
            emoji: '🫁',
            accuracy: 60,
            category: 'moderate',
            method: 'Nose Movement Tracking',
            clinicalStatus: 'experimental',
            description: 'Tracks vertical nose movement as a proxy for chest expansion.',
            research: 'Some research supports this method but accuracy varies.',
            tips: 'Sit still, face camera directly. Better with subtle breathing movements.'
        },
        {
            name: 'Distress Score',
            emoji: '😟',
            accuracy: 62,
            category: 'moderate',
            method: 'Blink Rate Analysis',
            clinicalStatus: 'experimental',
            description: 'High blink rates (>25/min) correlate with stress and anxiety.',
            research: 'Psychology research links blink rate to cognitive load and stress.',
            tips: 'Avoid rubbing eyes or looking away frequently.'
        },
        {
            name: 'Heart Rate (rPPG)',
            emoji: '❤️',
            accuracy: 58,
            category: 'moderate',
            method: 'Remote Photoplethysmography',
            clinicalStatus: 'proven',
            description: 'Detects blood volume changes in facial skin via green channel analysis.',
            research: 'Published research shows ±5 BPM accuracy in controlled conditions.',
            tips: 'CRITICAL: Needs bright, stable lighting. Stay very still. No face touching.'
        },
        {
            name: 'HRV (Heart Rate Variability)',
            emoji: '💓',
            accuracy: 55,
            category: 'moderate',
            method: 'RMSSD from rPPG',
            clinicalStatus: 'experimental',
            description: 'Calculates beat-to-beat variation from estimated heart rate.',
            research: 'Derived metric - accuracy depends on base heart rate measurement.',
            tips: 'Measure for at least 2 minutes for meaningful HRV data.'
        },
        // Low Accuracy
        {
            name: 'SpO2 (Oxygen Saturation)',
            emoji: '🩸',
            accuracy: 35,
            category: 'low',
            method: 'Red/Blue Ratio Analysis',
            clinicalStatus: 'not-proven',
            description: 'Estimates oxygen levels from lip color. Highly experimental.',
            research: 'Real SpO2 requires infrared sensors. Webcam version is NOT reliable.',
            tips: 'FOR AWARENESS ONLY. Use a pulse oximeter for accurate readings.'
        },
        {
            name: 'Skin Color Analysis',
            emoji: '🎨',
            accuracy: 42,
            category: 'low',
            method: 'RGB Color Analysis',
            clinicalStatus: 'experimental',
            description: 'Detects color changes that may indicate jaundice, cyanosis, or pallor.',
            research: 'Some research exists but heavily affected by lighting and skin tone.',
            tips: 'Use neutral white lighting. Results vary significantly by skin tone.'
        },
        {
            name: 'Lip Color',
            emoji: '💋',
            accuracy: 38,
            category: 'low',
            method: 'Color Saturation Analysis',
            clinicalStatus: 'not-proven',
            description: 'Blue/purple lips may indicate low oxygen. Very approximate.',
            research: 'Visual lip color assessment is subjective even for doctors.',
            tips: 'Remove lipstick/makeup. Use good lighting.'
        }
    ];

    const getCategoryColor = (category) => {
        switch (category) {
            case 'high': return { bg: '#dcfce7', border: '#22c55e', text: '#166534' };
            case 'moderate': return { bg: '#fef9c3', border: '#eab308', text: '#854d0e' };
            case 'low': return { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' };
            default: return { bg: '#f3f4f6', border: '#9ca3af', text: '#374151' };
        }
    };

    const getClinicalBadge = (status) => {
        switch (status) {
            case 'proven':
                return { label: '✓ Clinically Proven', bg: '#dcfce7', color: '#166534' };
            case 'experimental':
                return { label: '⚗️ Experimental', bg: '#fef3c7', color: '#92400e' };
            case 'not-proven':
                return { label: '⚠️ Not Proven', bg: '#fee2e2', color: '#991b1b' };
            default:
                return { label: 'Unknown', bg: '#f3f4f6', color: '#6b7280' };
        }
    };

    const styles = {
        container: {
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            maxWidth: '1000px',
            margin: '0 auto',
            padding: '40px 20px',
            background: '#f8fafc',
            minHeight: '100vh',
        },
        header: {
            textAlign: 'center',
            marginBottom: '40px',
        },
        title: {
            fontSize: '32px',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 12px 0',
        },
        subtitle: {
            fontSize: '16px',
            color: '#64748b',
            margin: 0,
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
        },
        legend: {
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            marginBottom: '32px',
            flexWrap: 'wrap',
        },
        legendItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
        },
        legendDot: {
            width: '12px',
            height: '12px',
            borderRadius: '50%',
        },
        section: {
            marginBottom: '32px',
        },
        sectionTitle: {
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
        },
        card: {
            background: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '2px solid',
        },
        cardHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '12px',
        },
        cardTitle: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px',
            fontWeight: '600',
            color: '#1e293b',
        },
        emoji: {
            fontSize: '20px',
        },
        accuracyBadge: {
            fontSize: '14px',
            fontWeight: '700',
            padding: '4px 10px',
            borderRadius: '20px',
        },
        clinicalBadge: {
            fontSize: '11px',
            fontWeight: '600',
            padding: '4px 8px',
            borderRadius: '6px',
            display: 'inline-block',
            marginBottom: '8px',
        },
        method: {
            fontSize: '12px',
            color: '#64748b',
            marginBottom: '8px',
        },
        description: {
            fontSize: '13px',
            color: '#475569',
            lineHeight: '1.5',
            marginBottom: '12px',
        },
        research: {
            fontSize: '12px',
            color: '#059669',
            background: '#ecfdf5',
            padding: '8px 12px',
            borderRadius: '8px',
            marginBottom: '8px',
        },
        tips: {
            fontSize: '12px',
            color: '#0369a1',
            background: '#e0f2fe',
            padding: '8px 12px',
            borderRadius: '8px',
        },
        disclaimer: {
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '40px',
            textAlign: 'center',
        },
        disclaimerTitle: {
            fontSize: '16px',
            fontWeight: '600',
            color: '#92400e',
            marginBottom: '8px',
        },
        disclaimerText: {
            fontSize: '14px',
            color: '#78350f',
            lineHeight: '1.6',
        },
        backLink: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#6366f1',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '20px',
        },
    };

    const highAccuracy = metrics.filter(m => m.category === 'high');
    const moderateAccuracy = metrics.filter(m => m.category === 'moderate');
    const lowAccuracy = metrics.filter(m => m.category === 'low');

    const renderCard = (metric) => {
        const colors = getCategoryColor(metric.category);
        const badge = getClinicalBadge(metric.clinicalStatus);

        return (
            <div key={metric.name} style={{ ...styles.card, borderColor: colors.border }}>
                <div style={styles.cardHeader}>
                    <div style={styles.cardTitle}>
                        <span style={styles.emoji}>{metric.emoji}</span>
                        {metric.name}
                    </div>
                    <span style={{
                        ...styles.accuracyBadge,
                        background: colors.bg,
                        color: colors.text
                    }}>
                        ~{metric.accuracy}%
                    </span>
                </div>

                <span style={{
                    ...styles.clinicalBadge,
                    background: badge.bg,
                    color: badge.color
                }}>
                    {badge.label}
                </span>

                <div style={styles.method}>
                    <strong>Method:</strong> {metric.method}
                </div>

                <p style={styles.description}>{metric.description}</p>

                <div style={styles.research}>
                    📚 <strong>Research:</strong> {metric.research}
                </div>

                <div style={styles.tips}>
                    💡 <strong>Tips:</strong> {metric.tips}
                </div>
            </div>
        );
    };

    return (
        <div style={styles.container}>
            <a href="/face-detect" style={styles.backLink}>
                ← Back to Health Analysis
            </a>

            <div style={styles.header}>
                <h1 style={styles.title}>📊 Accuracy & Reliability Guide</h1>
                <p style={styles.subtitle}>
                    Understand the accuracy, methodology, and clinical validation status of each health metric
                </p>
            </div>

            <div style={styles.legend}>
                <div style={styles.legendItem}>
                    <span style={{ ...styles.legendDot, background: '#22c55e' }}></span>
                    <span>High Accuracy (70-85%)</span>
                </div>
                <div style={styles.legendItem}>
                    <span style={{ ...styles.legendDot, background: '#eab308' }}></span>
                    <span>Moderate Accuracy (50-70%)</span>
                </div>
                <div style={styles.legendItem}>
                    <span style={{ ...styles.legendDot, background: '#ef4444' }}></span>
                    <span>Low Accuracy (30-50%)</span>
                </div>
            </div>

            <div style={styles.legend}>
                <div style={styles.legendItem}>
                    <span style={{ background: '#dcfce7', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>✓ Clinically Proven</span>
                </div>
                <div style={styles.legendItem}>
                    <span style={{ background: '#fef3c7', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>⚗️ Experimental</span>
                </div>
                <div style={styles.legendItem}>
                    <span style={{ background: '#fee2e2', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>⚠️ Not Proven</span>
                </div>
            </div>

            {/* High Accuracy Section */}
            <div style={styles.section}>
                <h2 style={{ ...styles.sectionTitle, color: '#166534' }}>
                    🟢 High Accuracy Metrics
                </h2>
                <div style={styles.grid}>
                    {highAccuracy.map(renderCard)}
                </div>
            </div>

            {/* Moderate Accuracy Section */}
            <div style={styles.section}>
                <h2 style={{ ...styles.sectionTitle, color: '#854d0e' }}>
                    🟡 Moderate Accuracy Metrics
                </h2>
                <div style={styles.grid}>
                    {moderateAccuracy.map(renderCard)}
                </div>
            </div>

            {/* Low Accuracy Section */}
            <div style={styles.section}>
                <h2 style={{ ...styles.sectionTitle, color: '#991b1b' }}>
                    🔴 Low Accuracy Metrics
                </h2>
                <div style={styles.grid}>
                    {lowAccuracy.map(renderCard)}
                </div>
            </div>

            {/* Disclaimer */}
            <div style={styles.disclaimer}>
                <div style={styles.disclaimerTitle}>⚠️ Important Medical Disclaimer</div>
                <p style={styles.disclaimerText}>
                    This tool is for <strong>educational and awareness purposes only</strong>.
                    These measurements are NOT substitutes for professional medical diagnosis.
                    Always consult a healthcare provider for medical concerns.
                    Accuracy depends heavily on lighting, camera quality, and user positioning.
                </p>
            </div>
        </div>
    );
}
