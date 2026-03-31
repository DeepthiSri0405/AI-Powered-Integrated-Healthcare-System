import React, { useState } from 'react';
import '../../styles/core.css';
import wardService from '../../services/wardService';
import { Activity, Radio, AlertTriangle } from 'lucide-react';

const IotSimulator = () => {
    const [wardId, setWardId] = useState('WARD-1');
    const [patientId, setPatientId] = useState('M123456');
    const [metric, setMetric] = useState('Heart Rate');
    const [value, setValue] = useState(160);
    const [threshold, setThreshold] = useState(100);

    const handleTrigger = async () => {
        try {
            await wardService.triggerIotAlert({
                wardId,
                patientId,
                metric,
                value: parseInt(value),
                threshold: parseInt(threshold)
            });
            alert("IoT Webhook Dispatched! All active Dashboard and Doctors should receive the websocket broadcast.");
        } catch (err) {
            alert("Simulated failure. " + err.message);
        }
    };

    return (
        <div style={{ padding: '60px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <div className="glass-container" style={{ padding: '40px', borderTop: '4px solid #f59e0b' }}>
                <Activity size={48} color="#f59e0b" style={{ marginBottom: '20px' }} />
                <h2 style={{ color: '#fff', marginBottom: '8px' }}>Hackathon Demo IoT Simulator</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                    Trigger dummy hardware events directly into the SHS Kafka/Socket stream. This will appear instantly on the Ward Terminal and Doctor's Portal if active.
                </p>

                <div style={{ display: 'grid', gap: '16px', textAlign: 'left', marginBottom: '32px' }}>
                    <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ward Room Target</label>
                        <input type="text" className="input-modern" value={wardId} onChange={e => setWardId(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Patient target ID</label>
                        <input type="text" className="input-modern" value={patientId} onChange={e => setPatientId(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sensor Metric</label>
                        <select className="input-modern" value={metric} onChange={e => setMetric(e.target.value)}>
                            <option>Heart Rate (BPM)</option>
                            <option>SpO2 (Oxygen %)</option>
                            <option>Temprature (°F)</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Spike Value</label>
                            <input type="number" className="input-modern" value={value} onChange={e => setValue(e.target.value)} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Baseline Limit</label>
                            <input type="number" className="input-modern" value={threshold} onChange={e => setThreshold(e.target.value)} />
                        </div>
                    </div>
                </div>

                <button 
                    className="btn-primary" 
                    style={{ width: '100%', padding: '16px', fontSize: '1.2rem', background: '#f59e0b', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    onClick={handleTrigger}
                >
                    <Radio className="pulse-animation" /> TRIGGER CRITICAL EVENT
                </button>
            </div>
        </div>
    );
};

export default IotSimulator;
