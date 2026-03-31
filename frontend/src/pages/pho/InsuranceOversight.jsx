import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../../services/authService';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle, XCircle, DollarSign, Activity } from 'lucide-react';
import '../../styles/core.css';

const InsuranceOversight = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsuranceData = async () => {
            try {
                const res = await axios.get('/api/pho/insurance', {
                    headers: { Authorization: `Bearer ${authService.getToken()}` }
                });
                setData(res.data);
            } catch (err) {
                console.error("Failed to load insurance oversight data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInsuranceData();
    }, []);

    if (loading || !data) {
        return <div style={{ padding: '60px', textAlign: 'center', color: '#f59e0b' }}>Running AI Fraud Detection Models...</div>;
    }

    const { metrics, suspicious_hospitals, recent_audits } = data;

    // Calculate percentage widths for the stacked bar
    const approvedPct = (metrics.approved / metrics.total_claims) * 100;
    const rejectedPct = (metrics.rejected / metrics.total_claims) * 100;
    const pendingPct = (metrics.pending / metrics.total_claims) * 100;

    return (
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '12px', borderRadius: '12px' }}>
                    <ShieldCheck size={32} color="#f59e0b" />
                </div>
                <div>
                    <h1 style={{ fontSize: '2.5rem', color: '#fff', margin: 0 }}>Federal Insurance Oversight</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '4px' }}>Monitor claim disbursement, track rejection velocities, and flag algorithmic fraud anomalies.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
                <div className="glass-container" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <FileText size={20} color="#3b82f6" /> Total Handled
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>{metrics.total_claims.toLocaleString()}</div>
                </div>
                <div className="glass-container" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <CheckCircle size={20} color="#10b981" /> Approved
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{metrics.approved.toLocaleString()}</div>
                </div>
                <div className="glass-container" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <XCircle size={20} color="#ef4444" /> Rejected
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>{metrics.rejected.toLocaleString()}</div>
                </div>
                <div className="glass-container" style={{ padding: '24px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <DollarSign size={20} color="#3b82f6" /> Value Disbursed
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{metrics.total_value}</div>
                </div>
            </div>

            {/* Claim Disbursement Stacked Chart */}
            <div className="glass-container" style={{ padding: '32px', marginBottom: '40px' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '1.4rem' }}>Network Verification Flow</h3>
                
                <div style={{ display: 'flex', height: '30px', borderRadius: '15px', overflow: 'hidden', marginBottom: '16px' }}>
                    <div style={{ width: `${approvedPct}%`, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem' }}>{approvedPct.toFixed(1)}%</div>
                    <div style={{ width: `${rejectedPct}%`, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem' }}>{rejectedPct.toFixed(1)}%</div>
                    <div style={{ width: `${pendingPct}%`, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem' }}>{pendingPct.toFixed(1)}%</div>
                </div>
                
                <div style={{ display: 'flex', gap: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '4px' }} /> Approved Assets</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '4px' }} /> Rejected / Fraud</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '4px' }} /> Under AI Review</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {/* Algorithmic Suspicious Flags */}
                <div>
                    <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <AlertTriangle size={24} color="#ef4444" /> Algorithmic Suspicious Flags
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {suspicious_hospitals.map((h, i) => (
                            <div key={i} className="glass-container" style={{ padding: '24px', borderLeft: `5px solid ${h.risk_level === 'Critical' ? '#ef4444' : '#f59e0b'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h4 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: '#fff' }}>{h.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>({h.id})</span></h4>
                                    <span style={{ background: h.risk_level === 'Critical' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: h.risk_level === 'Critical' ? '#fca5a5' : '#fcd34d', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                        {h.risk_level.toUpperCase()} RISK
                                    </span>
                                </div>
                                
                                <p style={{ margin: '12px 0', color: '#cbd5e1', lineHeight: '1.5' }}>
                                    <strong>AI Flag Trigger:</strong> {h.flag_reason}
                                </p>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Activity size={16} /> Tracked Volume: {h.claim_volume} Claims Evaluated
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Audit Ledger */}
                <div>
                    <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText size={24} color="#3b82f6" /> Recent Integrity Audits
                    </h3>
                    
                    <div className="glass-container" style={{ overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                                    <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Audit ID</th>
                                    <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Target Facility</th>
                                    <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Status</th>
                                    <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 'normal', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recent_audits.map((a, i) => (
                                    <tr key={i} style={{ borderBottom: i !== recent_audits.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                        <td style={{ padding: '16px', color: '#fff', fontFamily: 'monospace' }}>{a.id}</td>
                                        <td style={{ padding: '16px', color: '#fff' }}>{a.target}</td>
                                        <td style={{ padding: '16px', color: a.status.includes('Failed') ? '#ef4444' : '#10b981' }}>{a.status}</td>
                                        <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{a.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InsuranceOversight;
