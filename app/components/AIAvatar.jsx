'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import gsap from 'gsap';

export default function AIAvatar({ state = 'idle', message = '' }) {
  const containerRef = useRef(null);
  const messageRef = useRef(null);

  const getStatusText = () => {
    switch (state) {
      case 'listening': return 'Listening...';
      case 'speaking': return 'Speaking...';
      case 'thinking': return 'Analyzing...';
      default: return 'Ready to help';
    }
  };

  const getStatusColor = () => {
    switch (state) {
      case 'listening': return '#3b82f6';
      case 'speaking': return '#8b5cf6';
      case 'thinking': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.5)' }
      );
    }
  }, []);

  useEffect(() => {
    if (messageRef.current && message) {
      gsap.fromTo(
        messageRef.current,
        { opacity: 0, y: 15, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out' }
      );
    }
  }, [message]);

  const styles = {
    container: {
      background: '#fff',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    glowBg: {
      position: 'absolute',
      inset: 0,
      transition: 'opacity 0.5s',
      opacity: state === 'speaking' || state === 'listening' ? 1 : 0,
      pointerEvents: 'none',
    },
    glowCircle1: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '128px',
      height: '128px',
      background: 'rgba(139, 92, 246, 0.15)',
      borderRadius: '50%',
      filter: 'blur(48px)',
    },
    glowCircle2: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: '96px',
      height: '96px',
      background: 'rgba(16, 185, 129, 0.1)',
      borderRadius: '50%',
      filter: 'blur(32px)',
    },
    content: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      position: 'relative',
      zIndex: 10,
    },
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: '80px',
      height: '80px',
      borderRadius: '16px',
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: state === 'speaking' ? '0 0 30px rgba(139, 92, 246, 0.4)' : '0 4px 12px rgba(0,0,0,0.1)',
      transition: 'box-shadow 0.5s',
    },
    avatarIcon: {
      fontSize: '40px',
    },
    statusDot: {
      position: 'absolute',
      bottom: '-4px',
      right: '-4px',
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      background: getStatusColor(),
      border: '3px solid #fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    },
    infoSection: {
      flex: 1,
      minWidth: 0,
    },
    nameRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '4px',
    },
    name: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#1a1a1a',
      margin: 0,
    },
    statusBadge: {
      fontSize: '11px',
      padding: '4px 12px',
      borderRadius: '20px',
      fontWeight: '600',
      background: state === 'idle' ? '#f3f4f6' :
        state === 'listening' ? '#dbeafe' :
          state === 'speaking' ? '#ede9fe' : '#fef3c7',
      color: state === 'idle' ? '#6b7280' :
        state === 'listening' ? '#1d4ed8' :
          state === 'speaking' ? '#7c3aed' : '#d97706',
    },
    specialty: {
      fontSize: '13px',
      color: '#6b7280',
      margin: 0,
    },
    messageBubble: {
      marginTop: '20px',
      padding: '16px',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%)',
      borderRadius: '12px',
      position: 'relative',
      border: '1px solid rgba(139, 92, 246, 0.1)',
    },
    bubbleArrow: {
      position: 'absolute',
      top: '-8px',
      left: '32px',
      width: '16px',
      height: '16px',
      background: '#f8f9fa',
      transform: 'rotate(45deg)',
      borderLeft: '1px solid rgba(139, 92, 246, 0.1)',
      borderTop: '1px solid rgba(139, 92, 246, 0.1)',
    },
    messageText: {
      fontSize: '14px',
      color: '#374151',
      margin: 0,
      lineHeight: '1.6',
    },
  };

  return (
    <div ref={containerRef} style={styles.container}>
      {/* Animated background glow */}
      <div style={styles.glowBg}>
        <div style={styles.glowCircle1} />
        <div style={styles.glowCircle2} />
      </div>

      <div style={styles.content}>
        {/* Avatar */}
        <div style={styles.avatarContainer}>
          <div style={styles.avatar}>
            <span style={styles.avatarIcon}>🩺</span>
          </div>
          {/* Status Indicator */}
          <div style={styles.statusDot}>
            {state === 'speaking' && <Volume2 size={14} color="#fff" />}
            {state === 'listening' && (
              <motion.div
                style={{ width: 10, height: 10, background: '#fff', borderRadius: '50%' }}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            )}
            {state === 'thinking' && (
              <motion.div
                style={{
                  width: 14,
                  height: 14,
                  border: '2px solid #fff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%'
                }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              />
            )}
          </div>
        </div>

        {/* Info */}
        <div style={styles.infoSection}>
          <div style={styles.nameRow}>
            <h3 style={styles.name}>Dr. AI Assistant</h3>
            <span style={styles.statusBadge}>{getStatusText()}</span>
          </div>
          <p style={styles.specialty}>Emergency Medicine Specialist</p>
        </div>
      </div>

      {/* Speech Bubble */}
      {message && (
        <div ref={messageRef} style={styles.messageBubble}>
          <div style={styles.bubbleArrow} />
          <p style={styles.messageText}>{message}</p>
        </div>
      )}
    </div>
  );
}
