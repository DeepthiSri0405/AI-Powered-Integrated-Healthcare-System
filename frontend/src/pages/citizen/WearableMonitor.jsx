import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Heart, Thermometer, ShieldCheck, AlertTriangle } from 'lucide-react';
import '../../styles/core.css';

const WearableMonitor = () => {
  const [pulse, setPulse] = useState(72);
  const [spo2, setSpo2] = useState(98);
  const [temp, setTemp] = useState(36.6);
  const [status, setStatus] = useState('Stable');

  // Simulate Real-time IoT Stream
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => p + (Math.random() > 0.5 ? 1 : -1));
      if (Math.random() > 0.8) setSpo2(s => Math.min(100, Math.max(90, s + (Math.random() > 0.5 ? 1 : -1))));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (pulse > 100 || pulse < 50 || spo2 < 94) return '#ef4444';
    return '#10b981';
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <h2 style={{ fontSize: '2.5rem', margin: '0 0 8px 0' }}>IoT Live Stream</h2>
           <p style={{ color: 'var(--text-muted)' }}>Real-time telemetry from your synced wearable device.</p>
        </div>
        <div style={{ padding: '12px 24px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
           <ShieldCheck size={20} /> Secure Device Link
        </div>
      </header>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', marginBottom: '40px' }}>
        
        {/* Heart Rate Visualization */}
        <div className="glass-container" style={{ textAlign: 'center', padding: '48px 24px' }}>
           <motion.div 
             animate={{ scale: [1, 1.1, 1] }} 
             transition={{ repeat: Infinity, duration: 60 / pulse }}
             style={{ display: 'inline-flex', width: '80px', height: '80px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}
           >
              <Heart size={40} color="#ef4444" fill="#ef4444" />
           </motion.div>
           <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>PULSE RATE</h4>
           <div style={{ fontSize: '3.5rem', fontWeight: '800', color: '#fff' }}>{pulse} <span style={{ fontSize: '1rem', fontWeight: '400', color: 'var(--text-muted)' }}>BPM</span></div>
        </div>

        {/* SpO2 Visualization */}
        <div className="glass-container" style={{ textAlign: 'center', padding: '48px 24px' }}>
           <div style={{ display: 'inline-flex', width: '80px', height: '80px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Activity size={40} color="#3b82f6" />
           </div>
           <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>BLOOD OXYGEN (SpO2)</h4>
           <div style={{ fontSize: '3.5rem', fontWeight: '800', color: '#fff' }}>{spo2}<span style={{ fontSize: '1.5rem' }}>%</span></div>
           <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '16px' }}>
              <div style={{ width: `${spo2}%`, height: '100%', background: '#3b82f6', borderRadius: '2px' }}></div>
           </div>
        </div>

        {/* Temperature Visualization */}
        <div className="glass-container" style={{ textAlign: 'center', padding: '48px 24px' }}>
           <div style={{ display: 'inline-flex', width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Thermometer size={40} color="#10b981" />
           </div>
           <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>BODY TEMP</h4>
           <div style={{ fontSize: '3.5rem', fontWeight: '800', color: '#fff' }}>{temp}<span style={{ fontSize: '1.5rem' }}>°C</span></div>
        </div>

      </div>

      <div className="glass-container" style={{ borderLeft: `6px solid ${getStatusColor()}`, display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {getStatusColor() === '#10b981' ? <ShieldCheck color="#10b981" size={32} /> : <AlertTriangle color="#ef4444" size={32} />}
        </div>
        <div>
          <h4 style={{ margin: '0 0 4px 0' }}>Baseline Status: {getStatusColor() === '#10b981' ? 'Healthy' : 'Anomaly Detected'}</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
             {getStatusColor() === '#10b981' ? 'All vitals are within normal range. No immediate action required.' : 'Elevated heartbeat detected. System has primed an automated alert for your guardian.'}
          </p>
        </div>
        <button className="btn-secondary" style={{ marginLeft: 'auto', width: 'auto', padding: '12px 24px' }}>Export Detailed Log</button>
      </div>

    </div>
  );
};

export default WearableMonitor;
