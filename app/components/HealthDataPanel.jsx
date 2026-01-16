'use client';

import { useState } from 'react';
import { useHealthData } from '../context/HealthDataContext';

export default function HealthDataPanel() {
    const {
        sessionId,
        faceMetrics,
        symptoms,
        documents,
        exportAsJSON,
        exportAsCSV,
        takeSnapshot,
    } = useHealthData();

    const [showExport, setShowExport] = useState(false);
    const [exportData, setExportData] = useState('');

    const handleExportJSON = () => {
        const data = exportAsJSON();
        setExportData(data);
        setShowExport(true);
    };

    const handleDownloadJSON = () => {
        const data = exportAsJSON();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `health_data_${sessionId}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadCSV = () => {
        const row = exportAsCSV();
        const headers = Object.keys(row).join(',');
        const values = Object.values(row).map(v =>
            typeof v === 'string' ? `"${v}"` : v
        ).join(',');
        const csv = `${headers}\n${values}`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `health_data_${sessionId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const styles = {
        container: {
            fontFamily: "'Inter', -apple-system, sans-serif",
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            maxWidth: '400px',
        },
        header: {
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            padding: '16px 20px',
            color: '#fff',
        },
        title: {
            fontSize: '16px',
            fontWeight: '600',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        },
        subtitle: {
            fontSize: '12px',
            opacity: 0.8,
            margin: '4px 0 0 0',
        },
        content: {
            padding: '16px 20px',
        },
        section: {
            marginBottom: '16px',
        },
        sectionTitle: {
            fontSize: '12px',
            fontWeight: '600',
            color: '#6b7280',
            textTransform: 'uppercase',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
        },
        metric: {
            background: '#f9fafb',
            borderRadius: '8px',
            padding: '10px 12px',
        },
        metricLabel: {
            fontSize: '11px',
            color: '#6b7280',
            marginBottom: '2px',
        },
        metricValue: {
            fontSize: '14px',
            fontWeight: '600',
            color: '#1a1a1a',
        },
        symptomTag: {
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '500',
            margin: '2px',
        },
        symptomActive: {
            background: '#fecaca',
            color: '#dc2626',
        },
        symptomInactive: {
            background: '#f3f4f6',
            color: '#9ca3af',
        },
        buttonGroup: {
            display: 'flex',
            gap: '8px',
            marginTop: '16px',
        },
        button: {
            flex: 1,
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
        },
        primaryButton: {
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            color: '#fff',
        },
        secondaryButton: {
            background: '#f3f4f6',
            color: '#374151',
        },
        difficultyBadge: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '10px',
            fontWeight: '600',
        },
        easy: { background: '#dcfce7', color: '#166534' },
        moderate: { background: '#fef3c7', color: '#92400e' },
        hard: { background: '#fee2e2', color: '#991b1b' },
        exportModal: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
        },
        exportContent: {
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
        },
        codeBlock: {
            background: '#1a1a1a',
            color: '#4ade80',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '11px',
            fontFamily: 'monospace',
            overflow: 'auto',
            maxHeight: '300px',
        },
    };

    const getActiveSymptoms = () => {
        const active = [];
        Object.entries(symptoms.physical).forEach(([key, value]) => {
            if (value) active.push({ name: key, type: 'physical' });
        });
        Object.entries(symptoms.internal).forEach(([key, value]) => {
            if (value) active.push({ name: key, type: 'internal' });
        });
        return active;
    };

    const activeSymptoms = getActiveSymptoms();

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3 style={styles.title}>
                    📊 Health Data Collection
                </h3>
                <p style={styles.subtitle}>Session: {sessionId?.slice(-8)}</p>
            </div>

            <div style={styles.content}>
                {/* Face Metrics Summary */}
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>
                        📹 Camera Metrics
                        <span style={{ ...styles.difficultyBadge, ...styles.moderate }}>Moderate</span>
                    </div>
                    <div style={styles.grid}>
                        <div style={styles.metric}>
                            <div style={styles.metricLabel}>Heart Rate</div>
                            <div style={styles.metricValue}>
                                {faceMetrics.heart_rate ? `${faceMetrics.heart_rate} BPM` : '—'}
                            </div>
                        </div>
                        <div style={styles.metric}>
                            <div style={styles.metricLabel}>SpO2</div>
                            <div style={styles.metricValue}>
                                {faceMetrics.spo2 ? `${faceMetrics.spo2}%` : '—'}
                            </div>
                        </div>
                        <div style={styles.metric}>
                            <div style={styles.metricLabel}>Symmetry</div>
                            <div style={styles.metricValue}>
                                {faceMetrics.facial_symmetry ? `${faceMetrics.facial_symmetry}%` : '—'}
                            </div>
                        </div>
                        <div style={styles.metric}>
                            <div style={styles.metricLabel}>Emotion</div>
                            <div style={styles.metricValue}>
                                {faceMetrics.primary_emotion || '—'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Symptoms */}
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>
                        💬 Reported Symptoms
                        <span style={{ ...styles.difficultyBadge, ...styles.hard }}>User Input</span>
                    </div>
                    {activeSymptoms.length > 0 ? (
                        <div>
                            {activeSymptoms.map((s, i) => (
                                <span
                                    key={i}
                                    style={{
                                        ...styles.symptomTag,
                                        ...styles.symptomActive
                                    }}
                                >
                                    {s.name.replace(/_/g, ' ')}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
                            No symptoms reported yet
                        </p>
                    )}
                </div>

                {/* Documents */}
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>
                        📄 Documents
                        <span style={{ ...styles.difficultyBadge, ...styles.easy }}>High Value</span>
                    </div>
                    <div style={styles.grid}>
                        <div style={styles.metric}>
                            <div style={styles.metricLabel}>Uploaded</div>
                            <div style={styles.metricValue}>{documents.total_count}</div>
                        </div>
                        <div style={styles.metric}>
                            <div style={styles.metricLabel}>Lab Reports</div>
                            <div style={styles.metricValue}>
                                {documents.has_lab_report ? '✅' : '—'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Export Buttons */}
                <div style={styles.buttonGroup}>
                    <button
                        style={{ ...styles.button, ...styles.primaryButton }}
                        onClick={handleDownloadJSON}
                    >
                        📥 Export JSON
                    </button>
                    <button
                        style={{ ...styles.button, ...styles.secondaryButton }}
                        onClick={handleDownloadCSV}
                    >
                        📊 Export CSV
                    </button>
                </div>
            </div>
        </div>
    );
}
