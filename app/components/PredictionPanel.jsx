'use client';

import { useState } from 'react';
import { useHealthData } from '../context/HealthDataContext';

const API_URL = '/api/predict'; // Use Next.js API route proxy

export default function PredictionPanel() {
    const { faceMetrics, symptoms, documents } = useHealthData();
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const runPrediction = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    face_metrics: faceMetrics,
                    symptoms: symptoms,
                    documents: documents,
                }),
            });

            if (!response.ok) {
                throw new Error('Prediction failed');
            }

            const result = await response.json();
            setPrediction(result);
        } catch (err) {
            setError('Could not connect to ML server. Make sure backend is running.');
            console.error(err);
        } finally {
            setLoading(false);
        }
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
            background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
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
        button: {
            width: '100%',
            padding: '12px 20px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
        },
        buttonDisabled: {
            opacity: 0.6,
            cursor: 'not-allowed',
        },
        error: {
            background: '#fee2e2',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            marginTop: '12px',
        },
        result: {
            marginTop: '16px',
        },
        riskBadge: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
        },
        section: {
            marginTop: '16px',
        },
        sectionTitle: {
            fontSize: '12px',
            fontWeight: '600',
            color: '#6b7280',
            textTransform: 'uppercase',
            marginBottom: '8px',
        },
        categoryCard: {
            background: '#f9fafb',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '8px',
        },
        categoryName: {
            fontSize: '13px',
            fontWeight: '600',
            color: '#374151',
            textTransform: 'capitalize',
            marginBottom: '4px',
        },
        diseaseTag: {
            display: 'inline-block',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '500',
            background: '#fef3c7',
            color: '#92400e',
            marginRight: '4px',
            marginBottom: '4px',
        },
        recommendation: {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '10px 12px',
            background: '#f0fdf4',
            borderRadius: '8px',
            marginBottom: '8px',
        },
        recIcon: {
            fontSize: '18px',
        },
        recText: {
            fontSize: '13px',
            color: '#374151',
            flex: 1,
        },
        modelGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            marginTop: '8px',
        },
        modelCard: {
            background: '#f9fafb',
            borderRadius: '6px',
            padding: '8px',
            textAlign: 'center',
        },
        modelName: {
            fontSize: '10px',
            color: '#6b7280',
            marginBottom: '2px',
        },
        modelProb: {
            fontSize: '14px',
            fontWeight: '600',
        },
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3 style={styles.title}>🤖 ML Prediction</h3>
                <p style={styles.subtitle}>AI-powered health analysis</p>
            </div>

            <div style={styles.content}>
                <button
                    style={{
                        ...styles.button,
                        ...(loading ? styles.buttonDisabled : {}),
                    }}
                    onClick={runPrediction}
                    disabled={loading}
                >
                    {loading ? (
                        <>⏳ Analyzing...</>
                    ) : (
                        <>🔬 Run AI Analysis</>
                    )}
                </button>

                {error && <div style={styles.error}>❌ {error}</div>}

                {prediction && prediction.success && (
                    <div style={styles.result}>
                        {/* Risk Level */}
                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                            <div
                                style={{
                                    ...styles.riskBadge,
                                    background: prediction.ensemble.risk.color + '20',
                                    color: prediction.ensemble.risk.color,
                                }}
                            >
                                {prediction.ensemble.risk.level === 'Low' ? '✅' :
                                    prediction.ensemble.risk.level === 'Moderate' ? '⚠️' : '🚨'}
                                {prediction.ensemble.risk.level} Risk
                            </div>
                            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                                {prediction.ensemble.risk.description}
                            </p>
                            <p style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a', margin: '8px 0 0' }}>
                                {(prediction.ensemble.probability * 100).toFixed(1)}%
                            </p>
                            <p style={{ fontSize: '11px', color: '#9ca3af' }}>Confidence Score</p>
                        </div>

                        {/* Category Analysis */}
                        {Object.keys(prediction.category_analysis).length > 0 && (
                            <div style={styles.section}>
                                <div style={styles.sectionTitle}>Detected Categories</div>
                                {Object.entries(prediction.category_analysis).map(([cat, data]) => (
                                    <div key={cat} style={styles.categoryCard}>
                                        <div style={{
                                            ...styles.categoryName,
                                            display: 'flex',
                                            justifyContent: 'space-between'
                                        }}>
                                            <span>
                                                {cat === 'respiratory' ? '🫁' :
                                                    cat === 'cardiac' ? '❤️' :
                                                        cat === 'neurological' ? '🧠' :
                                                            cat === 'gastrointestinal' ? '🍽️' :
                                                                cat === 'dermatological' ? '🎨' :
                                                                    cat === 'oncology' ? '🎗️' :
                                                                        cat === 'thyroid' ? '🦋' :
                                                                            cat === 'infectious' ? '🦠' :
                                                                                cat === 'lymphatic' ? '🛡️' : '🧘'} {cat}
                                            </span>
                                            {data.urgency && (
                                                <span style={{
                                                    fontSize: '10px',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    background: data.urgency === 'high' ? '#fee2e2' : '#fef3c7',
                                                    color: data.urgency === 'high' ? '#dc2626' : '#d97706',
                                                }}>
                                                    {data.urgency.toUpperCase()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Matched Keywords/Symptoms */}
                                        <div style={{ marginBottom: '8px', fontSize: '11px', color: '#6b7280' }}>
                                            Found: {[...(data.matched_keywords || []), ...(data.matched_symptoms || [])].join(', ')}
                                        </div>

                                        <div>
                                            {data.possible_diseases.map((d, i) => (
                                                <span key={i} style={styles.diseaseTag}>{d}</span>
                                            ))}
                                        </div>

                                        {/* Specific Recommendation */}
                                        {data.recommendation && (
                                            <div style={{
                                                marginTop: '8px',
                                                fontSize: '11px',
                                                color: '#4b5563',
                                                background: '#fff',
                                                padding: '6px',
                                                borderRadius: '4px',
                                                border: '1px solid #e5e7eb'
                                            }}>
                                                💡 {data.recommendation}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Recommendations */}
                        <div style={styles.section}>
                            <div style={styles.sectionTitle}>Recommendations</div>
                            {prediction.recommendations.map((rec, i) => (
                                <div key={i} style={styles.recommendation}>
                                    <span style={styles.recIcon}>{rec.icon}</span>
                                    <span style={styles.recText}>{rec.text}</span>
                                </div>
                            ))}
                        </div>

                        {/* Model Breakdown */}
                        <div style={styles.section}>
                            <div style={styles.sectionTitle}>Model Scores</div>
                            <div style={styles.modelGrid}>
                                {Object.entries(prediction.individual_models).map(([name, data]) => (
                                    <div key={name} style={styles.modelCard}>
                                        <div style={styles.modelName}>{name}</div>
                                        <div style={{
                                            ...styles.modelProb,
                                            color: data.probability > 0.6 ? '#ef4444' :
                                                data.probability > 0.3 ? '#f59e0b' : '#22c55e'
                                        }}>
                                            {(data.probability * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
