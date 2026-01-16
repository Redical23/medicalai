'use client';

import React from 'react'
import { HealthDataProvider } from '../context/HealthDataContext'
import FaceAI from '../components/facecamera'
import Aichat from "../components/Aichat"
import AIAvatar from "../components/AIAvatar"
import Header from '../components/Header'
import HealthDataPanel from '../components/HealthDataPanel'
import PredictionPanel from '../components/PredictionPanel'

const Page = () => {
    const styles = {
        page: {
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #faf5ff 0%, #fff7ed 50%, #f0fdf4 100%)',
        },
        container: {
            maxWidth: '1600px',
            margin: '0 auto',
            padding: '20px',
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: '1fr 400px 400px',
            gap: '20px',
            marginTop: '20px',
        },
        leftColumn: {
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
        },
        middleColumn: {
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
        },
        rightColumn: {
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
        },
    };

    return (
        <HealthDataProvider>
            <div style={styles.page}>
                <Header />
                <div style={styles.container}>
                    <div style={styles.grid}>
                        {/* Left Column - Video & Avatar */}
                        <div style={styles.leftColumn}>
                            <FaceAI />
                            <AIAvatar state="idle" message="I'm analyzing your health data. Feel free to describe any symptoms you're experiencing." />
                        </div>

                        {/* Middle Column - Chat */}
                        <div style={styles.middleColumn}>
                            <Aichat />
                        </div>

                        {/* Right Column - Data & Prediction */}
                        <div style={styles.rightColumn}>
                            <PredictionPanel />
                            <HealthDataPanel />
                        </div>
                    </div>
                </div>
            </div>
        </HealthDataProvider>
    )
}

export default Page

