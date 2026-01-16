'use client';

import { useState, useRef, useEffect } from 'react';
import { useHealthData } from '../context/HealthDataContext';

export default function Aichat() {
    const [activeTab, setActiveTab] = useState('chat');
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'ai',
            text: "Hello! I'm your AI health assistant. Before we begin, I'd like to ask for your consent to analyze your video feed for better assessment. Would you like to enable video analysis? This is optional but helps provide more accurate results.",
            time: formatTime(new Date())
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Get health data context
    let healthContext = null;
    try {
        healthContext = useHealthData();
    } catch (e) {
        // Context not available
    }

    function formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!inputValue.trim()) return;

        // Push symptoms to context
        if (healthContext) {
            const detected = healthContext.updateSymptoms(inputValue);
            console.log('Detected symptoms:', detected);
        }

        const newMessage = {
            id: messages.length + 1,
            type: 'user',
            text: inputValue,
            time: formatTime(new Date())
        };

        setMessages([...messages, newMessage]);
        setInputValue('');

        // Simulate AI response
        setTimeout(() => {
            const aiResponse = {
                id: messages.length + 2,
                type: 'ai',
                text: "Thank you for sharing. Based on what you've described, I'd recommend monitoring these symptoms. Can you tell me more about when they started?",
                time: formatTime(new Date())
            };
            setMessages(prev => [...prev, aiResponse]);
        }, 1500);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const styles = {
        container: {
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            background: '#fff',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            height: '500px',
            maxWidth: '500px',
        },
        // Tabs
        tabsContainer: {
            display: 'flex',
            borderBottom: '1px solid #f0f0f0',
            background: '#fafafa',
        },
        tab: {
            flex: 1,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: '#6b7280',
            background: 'transparent',
            border: 'none',
            borderBottom: '2px solid transparent',
            transition: 'all 0.2s',
        },
        tabActive: {
            color: '#f97316',
            borderBottomColor: '#f97316',
            background: '#fff',
        },
        tabIcon: {
            fontSize: '16px',
        },
        // Messages
        messagesContainer: {
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: 'linear-gradient(180deg, #faf5ff 0%, #fff7ed 50%, #fff 100%)',
        },
        messageBubble: {
            maxWidth: '85%',
            padding: '16px',
            borderRadius: '16px',
            fontSize: '14px',
            lineHeight: '1.6',
            position: 'relative',
        },
        aiMessage: {
            background: '#fff',
            color: '#374151',
            alignSelf: 'flex-start',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            borderTopLeftRadius: '4px',
        },
        userMessage: {
            background: 'linear-gradient(135deg, #f97316 0%, #a855f7 100%)',
            color: '#fff',
            alignSelf: 'flex-end',
            borderTopRightRadius: '4px',
        },
        messageTime: {
            fontSize: '12px',
            color: '#9ca3af',
            marginTop: '8px',
        },
        userMessageTime: {
            color: 'rgba(255,255,255,0.8)',
        },
        // Input area
        inputContainer: {
            padding: '16px 20px',
            borderTop: '1px solid #f0f0f0',
            background: '#fff',
        },
        inputWrapper: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#f9fafb',
            borderRadius: '12px',
            padding: '4px 4px 4px 16px',
            border: '1px solid #e5e7eb',
        },
        input: {
            flex: 1,
            border: 'none',
            background: 'transparent',
            fontSize: '14px',
            color: '#374151',
            outline: 'none',
            padding: '8px 0',
        },
        sendButton: {
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #f97316 0%, #a855f7 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s, opacity 0.2s',
        },
        sendIcon: {
            width: '20px',
            height: '20px',
            color: '#fff',
        },
        // Voice tab
        voiceContainer: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            padding: '40px',
        },
        micButton: {
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: isRecording
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #f97316 0%, #a855f7 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isRecording
                ? '0 0 30px rgba(239, 68, 68, 0.4)'
                : '0 4px 20px rgba(249, 115, 22, 0.3)',
            transition: 'all 0.3s',
        },
        micIcon: {
            fontSize: '32px',
            color: '#fff',
        },
        voiceText: {
            fontSize: '14px',
            color: '#6b7280',
            textAlign: 'center',
        },
        // Docs tab
        docsContainer: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '40px',
        },
        uploadArea: {
            width: '100%',
            maxWidth: '300px',
            padding: '40px',
            border: '2px dashed #e5e7eb',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
        },
        uploadIcon: {
            fontSize: '40px',
        },
        uploadText: {
            fontSize: '14px',
            color: '#6b7280',
            textAlign: 'center',
        },
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'voice':
                return (
                    <div style={styles.voiceContainer}>
                        <button
                            style={styles.micButton}
                            onClick={() => setIsRecording(!isRecording)}
                        >
                            <span style={styles.micIcon}>{isRecording ? '⏹️' : '🎤'}</span>
                        </button>
                        <p style={styles.voiceText}>
                            {isRecording
                                ? 'Recording... Tap to stop'
                                : 'Tap to start voice input'}
                        </p>
                    </div>
                );
            case 'docs':
                return (
                    <div style={styles.docsContainer}>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && healthContext) {
                                    const docType = file.name.toLowerCase().includes('lab') ? 'lab_report' :
                                        file.name.toLowerCase().includes('prescription') ? 'prescription' :
                                            file.type.includes('image') ? 'imaging' : 'medical_history';
                                    healthContext.addDocument(file, docType);
                                    setUploadedFiles(prev => [...prev, { name: file.name, type: docType }]);
                                }
                            }}
                        />
                        <div
                            style={styles.uploadArea}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <span style={styles.uploadIcon}>📄</span>
                            <p style={styles.uploadText}>
                                Drop medical documents here<br />
                                <span style={{ color: '#f97316' }}>or click to browse</span>
                            </p>
                        </div>
                        {uploadedFiles.length > 0 && (
                            <div style={{ width: '100%', maxWidth: '300px' }}>
                                <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                                    Uploaded ({uploadedFiles.length}):
                                </p>
                                {uploadedFiles.map((f, i) => (
                                    <div key={i} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 12px',
                                        background: '#f0fdf4',
                                        borderRadius: '8px',
                                        marginBottom: '4px',
                                        fontSize: '12px',
                                    }}>
                                        <span>✅</span>
                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
                                        <span style={{
                                            background: '#dcfce7',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '10px',
                                            color: '#166534'
                                        }}>{f.type}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            default:
                return (
                    <>
                        <div style={styles.messagesContainer}>
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    style={{
                                        ...styles.messageBubble,
                                        ...(msg.type === 'ai' ? styles.aiMessage : styles.userMessage)
                                    }}
                                >
                                    {msg.text}
                                    <div style={{
                                        ...styles.messageTime,
                                        ...(msg.type === 'user' ? styles.userMessageTime : {})
                                    }}>
                                        {msg.time}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div style={styles.inputContainer}>
                            <div style={styles.inputWrapper}>
                                <input
                                    type="text"
                                    placeholder="Describe your symptoms..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    style={styles.input}
                                />
                                <button
                                    style={styles.sendButton}
                                    onClick={handleSend}
                                >
                                    <svg
                                        style={styles.sendIcon}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </>
                );
        }
    };

    return (
        <div style={styles.container}>
            {/* Tabs */}
            <div style={styles.tabsContainer}>
                <button
                    style={{
                        ...styles.tab,
                        ...(activeTab === 'chat' ? styles.tabActive : {})
                    }}
                    onClick={() => setActiveTab('chat')}
                >
                    <span style={styles.tabIcon}>💬</span>
                    Chat
                </button>
                <button
                    style={{
                        ...styles.tab,
                        ...(activeTab === 'voice' ? styles.tabActive : {})
                    }}
                    onClick={() => setActiveTab('voice')}
                >
                    <span style={styles.tabIcon}>🎤</span>
                    Voice
                </button>
                <button
                    style={{
                        ...styles.tab,
                        ...(activeTab === 'docs' ? styles.tabActive : {})
                    }}
                    onClick={() => setActiveTab('docs')}
                >
                    <span style={styles.tabIcon}>📄</span>
                    Docs
                </button>
            </div>

            {/* Content */}
            {renderContent()}
        </div>
    );
}
