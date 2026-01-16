"""
MediVue ML Prediction Backend
Flask API for health data prediction using multiple ML models
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import AdaBoostClassifier, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import os
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Store trained models
models = {}
scaler = StandardScaler()

# Disease categories based on symptoms and metrics
DISEASE_CATEGORIES = {
    'respiratory': {
        'symptoms': ['cough', 'breathing_difficulty', 'sore_throat'],
        'metrics': ['breathing_rate', 'spo2'],
        'diseases': ['Common Cold', 'Flu', 'Asthma', 'Bronchitis', 'COVID-19']
    },
    'cardiac': {
        'symptoms': ['chest_pain', 'fatigue', 'dizziness'],
        'metrics': ['heart_rate', 'hrv'],
        'diseases': ['Hypertension', 'Arrhythmia', 'Heart Disease']
    },
    'neurological': {
        'symptoms': ['headache', 'dizziness', 'fatigue'],
        'metrics': ['facial_symmetry', 'head_tremor', 'fatigue_perclos'],
        'diseases': ['Migraine', 'Stroke Risk', 'Parkinson Risk', 'Fatigue Syndrome']
    },
    'gastrointestinal': {
        'symptoms': ['nausea', 'vomiting', 'abdominal_pain'],
        'metrics': [],
        'diseases': ['Gastritis', 'Food Poisoning', 'IBS']
    },
    'dermatological': {
        'symptoms': ['rash', 'skin_discoloration', 'swelling'],
        'metrics': ['skin_status'],
        'diseases': ['Allergic Reaction', 'Eczema', 'Dermatitis', 'Jaundice']
    },
    'mental_health': {
        'symptoms': ['fatigue', 'headache'],
        'metrics': ['distress_score', 'primary_emotion', 'fatigue_perclos'],
        'diseases': ['Stress', 'Anxiety', 'Depression', 'Burnout']
    }
}


def initialize_models():
    """Train base models with sample data for demonstration"""
    global models, scaler
    
    # Create sample training data (in production, use real medical data)
    np.random.seed(42)
    n_samples = 500
    
    # Features: [heart_rate, spo2, breathing_rate, symmetry, distress, fatigue, symptom_count]
    X = np.random.randn(n_samples, 7)
    
    # Binary labels (0 = healthy, 1 = needs attention)
    y = (X[:, 0] > 0.5) | (X[:, 1] < -0.5) | (X[:, 4] > 0.7)
    y = y.astype(int)
    
    # Scale features
    X_scaled = scaler.fit_transform(X)
    
    # Train multiple models
    models['logistic'] = LogisticRegression(max_iter=1000)
    models['decision_tree'] = DecisionTreeClassifier(max_depth=5)
    models['knn'] = KNeighborsClassifier(n_neighbors=5)
    models['naive_bayes'] = GaussianNB()
    models['adaboost'] = AdaBoostClassifier(n_estimators=50)
    models['random_forest'] = RandomForestClassifier(n_estimators=100)
    
    for name, model in models.items():
        model.fit(X_scaled, y)
        print(f"✓ Trained {name} model")
    
    print("All models initialized!")


def prepare_features(data):
    """Convert health data to feature vector"""
    face_metrics = data.get('face_metrics', {})
    symptoms = data.get('symptoms', {})
    
    # Count active symptoms
    symptom_count = 0
    physical = symptoms.get('physical', {})
    internal = symptoms.get('internal', {})
    
    for v in physical.values():
        if v: symptom_count += 1
    for v in internal.values():
        if v: symptom_count += 1
    
    # Build feature vector
    features = [
        face_metrics.get('heart_rate') or 72,  # Default normal values
        face_metrics.get('spo2') or 98,
        face_metrics.get('breathing_rate') or 16,
        face_metrics.get('facial_symmetry') or 95,
        face_metrics.get('distress_score') or 0.1,
        face_metrics.get('fatigue_perclos') or 10,
        symptom_count
    ]
    
    return np.array(features).reshape(1, -1)


def analyze_symptoms(symptoms):
    """Determine disease categories based on symptoms"""
    physical = symptoms.get('physical', {})
    internal = symptoms.get('internal', {})
    all_symptoms = {**physical, **internal}
    
    category_scores = {}
    
    for category, info in DISEASE_CATEGORIES.items():
        score = 0
        matched = []
        for symptom in info['symptoms']:
            if all_symptoms.get(symptom):
                score += 1
                matched.append(symptom)
        if score > 0:
            category_scores[category] = {
                'score': score,
                'matched_symptoms': matched,
                'possible_diseases': info['diseases'][:min(score + 1, len(info['diseases']))]
            }
    
    return category_scores


def get_risk_level(probability):
    """Convert probability to risk level"""
    if probability < 0.3:
        return {'level': 'Low', 'color': '#22c55e', 'description': 'No immediate concerns'}
    elif probability < 0.6:
        return {'level': 'Moderate', 'color': '#f59e0b', 'description': 'Monitor symptoms'}
    else:
        return {'level': 'High', 'color': '#ef4444', 'description': 'Consult a doctor'}


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'models_loaded': len(models),
        'version': '1.0.0'
    })


@app.route('/predict', methods=['POST'])
def predict():
    """Main prediction endpoint"""
    try:
        data = request.json
        print(f"📥 Received data: {data is not None}")
        
        if not data:
            return jsonify({'error': 'No data provided', 'success': False}), 400
        
        # Prepare features
        print("🔧 Preparing features...")
        features = prepare_features(data)
        print(f"   Features: {features}")
        features_scaled = scaler.transform(features)
        
        # Get predictions from all models
        print("🤖 Running predictions...")
        predictions = {}
        probabilities = []
        
        for name, model in models.items():
            try:
                pred = model.predict(features_scaled)[0]
                if hasattr(model, 'predict_proba'):
                    prob = model.predict_proba(features_scaled)[0][1]
                else:
                    prob = float(pred)
                predictions[name] = {
                    'prediction': int(pred),
                    'probability': float(prob)
                }
                probabilities.append(prob)
                print(f"   ✓ {name}: {prob:.3f}")
            except Exception as model_error:
                print(f"   ✗ {name} error: {model_error}")
                predictions[name] = {'prediction': 0, 'probability': 0.5}
                probabilities.append(0.5)
        
        # Ensemble prediction (average probability)
        avg_probability = float(np.mean(probabilities))
        print(f"📊 Ensemble probability: {avg_probability:.3f}")
        
        # Analyze symptoms
        symptoms = data.get('symptoms', {})
        category_analysis = analyze_symptoms(symptoms)
        
        # Get risk level
        risk = get_risk_level(avg_probability)
        
        # Build response
        response = {
            'success': True,
            'ensemble': {
                'probability': avg_probability,
                'needs_attention': avg_probability > 0.5,
                'risk': risk
            },
            'individual_models': predictions,
            'category_analysis': category_analysis,
            'recommendations': get_recommendations(category_analysis, risk['level']),
            'timestamp': pd.Timestamp.now().isoformat()
        }
        
        print("✅ Prediction successful!")
        return jsonify(response)
    
    except Exception as e:
        import traceback
        print(f"❌ Error: {e}")
        traceback.print_exc()
        return jsonify({'error': str(e), 'success': False}), 500


def get_recommendations(categories, risk_level):
    """Generate recommendations based on analysis"""
    recommendations = []
    
    if risk_level == 'High':
        recommendations.append({
            'priority': 'urgent',
            'text': 'Consider consulting a healthcare professional soon',
            'icon': '🏥'
        })
    
    if 'respiratory' in categories:
        recommendations.append({
            'priority': 'moderate',
            'text': 'Monitor breathing and oxygen levels. Stay hydrated.',
            'icon': '🫁'
        })
    
    if 'cardiac' in categories:
        recommendations.append({
            'priority': 'high',
            'text': 'Track heart rate patterns. Avoid strenuous activity.',
            'icon': '❤️'
        })
    
    if 'neurological' in categories:
        recommendations.append({
            'priority': 'moderate',
            'text': 'Get adequate rest. Monitor for recurring symptoms.',
            'icon': '🧠'
        })
    
    if 'mental_health' in categories:
        recommendations.append({
            'priority': 'moderate',
            'text': 'Practice relaxation techniques. Consider talking to someone.',
            'icon': '🧘'
        })
    
    if not recommendations:
        recommendations.append({
            'priority': 'low',
            'text': 'No specific concerns detected. Maintain healthy habits.',
            'icon': '✅'
        })
    
    return recommendations


@app.route('/models', methods=['GET'])
def list_models():
    """List available models"""
    return jsonify({
        'models': list(models.keys()),
        'disease_categories': list(DISEASE_CATEGORIES.keys())
    })


if __name__ == '__main__':
    print("🏥 MediVue ML Backend Starting...")
    initialize_models()
    print("🚀 Server running on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
