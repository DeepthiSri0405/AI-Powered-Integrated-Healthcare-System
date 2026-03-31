import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import authService from '../../services/authService';
import { ShieldCheck, Activity, Map, Megaphone, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import '../../styles/core.css';

const PHODashboard = () => {
  const navigate = useNavigate();
  const [currentUser] = useState(authService.getCurrentUser());
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // In a real scenario, could fetch high level stats. For now just mock loading.
    setTimeout(() => setLoading(false), 500);
  }, []);

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        <header style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'var(--primary)', padding: '16px', borderRadius: '16px' }}>
                    <ShieldCheck size={40} color="white" />
                </div>
                <div>
                    <h1 style={{ fontSize: '2.5rem', color: 'var(--primary)', margin: '0' }}>Public Health Command Center</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', margin: '4px 0 0 0' }}>
                        Welcome, Officer {currentUser?.name}. Centralized oversight active.
                    </p>
                </div>
            </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            
            <div className="glass-container" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer', transition: 'all 0.3s' }}
                 onClick={() => navigate('/pho/surveillance')}
                 onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                 onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Map size={36} color="#3b82f6" />
                    <span style={{ padding: '4px 12px', background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>LIVE</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>Disease Surveillance</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: '1.5' }}>Geographical heatmap visualization and real-time viral outbreak clustering algorithms.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.9rem', marginTop: 'auto', paddingTop: '16px' }}>
                    <Activity size={16} /> Active Outbreak Detected
                </div>
            </div>

            <div className="glass-container" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer', transition: 'all 0.3s' }}
                 onClick={() => navigate('/pho/analytics')}
                 onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                 onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TrendingUp size={36} color="#10b981" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>Hospital Performance</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: '1.5' }}>Evaluate recovery rates, mortality indexing, and staff efficiency across the network.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '0.9rem', marginTop: 'auto', paddingTop: '16px' }}>
                    <Users size={16} /> 5 Active Hospitals Evaluated
                </div>
            </div>

            <div className="glass-container" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer', transition: 'all 0.3s' }}
                 onClick={() => navigate('/pho/insurance')}
                 onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                 onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <ShieldCheck size={36} color="#f59e0b" />
                    <span style={{ padding: '4px 12px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>AUDITS</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>Insurance Oversight</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: '1.5' }}>Fraud detection modeling and claim velocity tracking for all integrated hospitals.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '0.9rem', marginTop: 'auto', paddingTop: '16px' }}>
                    <AlertTriangle size={16} /> 2 Suspicious Flags Raised
                </div>
            </div>

            <div className="glass-container" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer', transition: 'all 0.3s' }}
                 onClick={() => navigate('/pho/announcements')}
                 onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                 onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Megaphone size={36} color="#a855f7" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>Global Directives</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: '1.5' }}>Instantly broadcast pandemic protocols, lockdowns, or health advisories globally.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a855f7', fontSize: '0.9rem', marginTop: 'auto', paddingTop: '16px' }}>
                    <Megaphone size={16} /> Network-wide Reach
                </div>
            </div>

        </div>
    </div>
  );
};
export default PHODashboard;
