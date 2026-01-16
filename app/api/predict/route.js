import { NextResponse } from 'next/server';

// Use environment variable in production, localhost in development
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export async function POST(request) {
    try {
        const body = await request.json();

        const response = await fetch(`${BACKEND_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Backend request failed', success: false },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Prediction API error:', error);
        return NextResponse.json(
            {
                error: 'Could not connect to ML backend. Make sure Python server is running.',
                success: false
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const response = await fetch(`${BACKEND_URL}/health`);
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { status: 'error', message: 'Backend not available' },
            { status: 500 }
        );
    }
}
