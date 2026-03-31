import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../../services/authService';
import { TrendingUp, Users, Activity, Clock, ShieldAlert } from 'lucide-react';
import '../../styles/core.css';

const HospitalAnalytics = () => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('/api/pho/hospitals/metrics', {
                    headers: { Authorization: `Bearer ${authService.getToken()}` }
                });
                setMetrics(res.data);
            } catch (err) {
                console.error('Failed to fetch hospital metrics', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading || !metrics) {
        return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Analyzing Global Hospital Metrics...</div>;
    }

    return (
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '12px' }}>
                    <TrendingUp size={32} color="#10b981" />
                </div>
                <div>
                    <h1 style={{ fontSize: '2.5rem', color: '#fff', margin: 0 }}>Network Operational Analytics</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '4px' }}>Evaluate treatment latency, recovery indices, and underperforming institutions.</p>
                </div>
            </div>

            {/* Global Averages Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '40px', marginBottom: '40px' }}>
                <div className="glass-container" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <Clock size={32} color="#3b82f6" />
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '4px' }}>Avg Treatment Time</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#fff' }}>{metrics.global_averages.treatment_time}</div>
                    </div>
                </div>
                <div className="glass-container" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <Users size={32} color="#10b981" />
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '4px' }}>Patient Inflow</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#fff' }}>{metrics.global_averages.inflow_total}</div>
                    </div>
                </div>
                <div className="glass-container" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <Activity size={32} color="#8b5cf6" />
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '4px' }}>Total Recovery Rate</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#fff' }}>{metrics.global_averages.recovery_rate}%</div>
                    </div>
                </div>
                <div className="glass-container" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <ShieldAlert size={32} color="#ef4444" />
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '4px' }}>Est. Mortality Rate</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#fff' }}>{metrics.global_averages.mortality_rate}%</div>
                    </div>
                </div>
            </div>

            <h3 style={{ fontSize: '1.4rem', color: '#fff', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px', marginBottom: '24px' }}>
                Hospital Efficiency Rankings
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {metrics.ranked_hospitals.map((hospital, idx) => {
                    const isUnderperforming = idx >= metrics.ranked_hospitals.length - 2; // Bottom 2 are flagged
                    return (
                        <div key={hospital.id} className="glass-container" style={{ 
                            padding: '24px', display: 'flex', alignItems: 'center', 
                            borderLeft: `5px solid ${isUnderperforming ? '#ef4444' : (idx === 0 ? '#f59e0b' : '#3b82f6')}` 
                        }}>
                            <div style={{ width: '50px', fontSize: '1.8rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                                #{idx + 1}
                            </div>
                            <div style={{ flex: 1, paddingLeft: '20px' }}>
                                <h4 style={{ margin: '0 0 8px', fontSize: '1.3rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {hospital.name}
                                    {isUnderperforming && <span style={{ fontSize: '0.7rem', background: '#ef4444', color: '#fff', padding: '4px 8px', borderRadius: '4px' }}>UNDERPERFORMING</span>}
                                    {idx === 0 && <span style={{ fontSize: '0.7rem', background: '#f59e0b', color: '#fff', padding: '4px 8px', borderRadius: '4px' }}>APEX STANDARDS</span>}
                                </h4>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Region: {hospital.location} | ID: {hospital.id}</div>
                            </div>

                            <div style={{ display: 'flex', gap: '32px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '32px' }}>
                                <div>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#10b981' }}>{hospital.recoveryRate}%</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>Recovery</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: hospital.mortalityRate > 2.0 ? '#ef4444' : '#fff' }}>{hospital.mortalityRate}%</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>Mortality</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: hospital.staffEfficiency < 80 ? '#f59e0b' : '#3b82f6' }}>{hospital.staffEfficiency}%</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>Staff Eff</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#fff' }}>{hospital.avgTreatmentTime}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>Avg Tx Time</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HospitalAnalytics;
