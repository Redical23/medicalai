'use client';

import { useState } from 'react';

export default function Header() {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const styles = {
        header: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, rgba(250, 245, 255, 0.9) 0%, rgba(255, 247, 237, 0.9) 100%)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            backdropFilter: 'blur(10px)',
        },
        // Logo
        logoContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
        },
        logoIcon: {
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '18px',
            fontWeight: '700',
            boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
        },
        logoText: {
            fontSize: '20px',
            fontWeight: '600',
            color: '#1a1a1a',
        },
        logoHighlight: {
            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
        },
        // Center nav
        centerNav: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
        },
        dropdown: {
            position: 'relative',
        },
        dropdownButton: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'transparent',
            border: 'none',
            fontSize: '14px',
            fontWeight: '500',
            color: '#4b5563',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'background 0.2s',
        },
        dropdownMenu: {
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '8px',
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            padding: '8px',
            minWidth: '180px',
            zIndex: 100,
        },
        dropdownItem: {
            display: 'block',
            width: '100%',
            padding: '10px 16px',
            background: 'transparent',
            border: 'none',
            fontSize: '14px',
            color: '#374151',
            textAlign: 'left',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'background 0.2s',
        },
        emergencyButton: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: '#fecaca',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#dc2626',
            cursor: 'pointer',
            transition: 'all 0.2s',
        },
        emergencyIcon: {
            fontSize: '14px',
        },
        // Right section
        rightSection: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            position: 'relative',
        },
        userButton: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 16px',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s',
        },
        userIcon: {
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#fce7f3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ec4899',
            fontSize: '16px',
        },
        userName: {
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
        },
        chevron: {
            fontSize: '12px',
            color: '#9ca3af',
        },
        userMenu: {
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            padding: '8px',
            minWidth: '160px',
            zIndex: 100,
        },
    };

    return (
        <header style={styles.header}>
            {/* Logo */}
            <div style={styles.logoContainer}>
                <div style={styles.logoIcon}>M</div>
                <span style={styles.logoText}>
                    Medi<span style={styles.logoHighlight}>Vue</span>
                </span>
            </div>

            {/* Center Navigation */}
            <div style={styles.centerNav}>
                {/* Specific Analysis Dropdown */}
                <div style={styles.dropdown}>
                    <button
                        style={styles.dropdownButton}
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        Specific Analysis
                        <span style={styles.chevron}>▼</span>
                    </button>
                    {showDropdown && (
                        <div style={styles.dropdownMenu}>
                            <button
                                style={styles.dropdownItem}
                                onClick={() => setShowDropdown(false)}
                            >
                                🫁 Respiratory Analysis
                            </button>
                            <button
                                style={styles.dropdownItem}
                                onClick={() => setShowDropdown(false)}
                            >
                                ❤️ Cardiac Analysis
                            </button>
                            <button
                                style={styles.dropdownItem}
                                onClick={() => setShowDropdown(false)}
                            >
                                🧠 Neurological Analysis
                            </button>
                            <button
                                style={styles.dropdownItem}
                                onClick={() => setShowDropdown(false)}
                            >
                                🩺 General Checkup
                            </button>
                        </div>
                    )}
                </div>

                {/* Emergency Button */}
                <button style={styles.emergencyButton}>
                    <span style={styles.emergencyIcon}>⚠️</span>
                    Emergency
                </button>
            </div>

            {/* Right Section - User Profile */}
            <div style={styles.rightSection}>
                <button
                    style={styles.userButton}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                >
                    <div style={styles.userIcon}>👤</div>
                    <span style={styles.userName}>ljsijdo</span>
                    <span style={styles.chevron}>▼</span>
                </button>
                {showUserMenu && (
                    <div style={styles.userMenu}>
                        <button
                            style={styles.dropdownItem}
                            onClick={() => setShowUserMenu(false)}
                        >
                            👤 Profile
                        </button>
                        <button
                            style={styles.dropdownItem}
                            onClick={() => setShowUserMenu(false)}
                        >
                            ⚙️ Settings
                        </button>
                        <button
                            style={styles.dropdownItem}
                            onClick={() => setShowUserMenu(false)}
                        >
                            📊 Accuracy Guide
                        </button>
                        <button
                            style={{ ...styles.dropdownItem, color: '#dc2626' }}
                            onClick={() => setShowUserMenu(false)}
                        >
                            🚪 Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
