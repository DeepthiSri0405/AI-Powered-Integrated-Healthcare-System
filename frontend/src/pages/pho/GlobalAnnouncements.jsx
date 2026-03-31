import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../../services/authService';
import { Megaphone, Send, Crosshair, Users, ShieldAlert, Clock } from 'lucide-react';
import '../../styles/core.css';

const GlobalAnnouncements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetRole, setTargetRole] = useState('ALL');
    const [priority, setPriority] = useState('High');

    const fetchAnnouncements = async () => {
        try {
            const res = await axios.get('/api/announcement', {
                headers: { Authorization: `Bearer ${authService.getToken()}` }
            });
            setAnnouncements(res.data || []);
        } catch (err) {
            console.error('Failed to fetch announcements', err);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { title, message, target_role: targetRole, hospital_id: 'SYSTEM', priority };
            const res = await axios.post('/api/announcement', payload, {
                headers: { Authorization: `Bearer ${authService.getToken()}` }
            });
            alert('Emergency Protocol Dispatched Globally!');
            setAnnouncements([res.data.data, ...announcements]);
            setTitle('');
            setMessage('');
        } catch (err) {
            alert('Failed to send announcement');
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                <div style={{ background: 'rgba(168, 85, 247, 0.2)', padding: '12px', borderRadius: '12px' }}>
                    <Megaphone size={32} color="#a855f7" />
                </div>
                <div>
                    <h1 style={{ fontSize: '2.5rem', color: '#fff', margin: 0 }}>Global Dispatch Center</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '4px' }}>Issue emergency protocols, network-wide mandates, and lockdown directives.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 2fr', gap: '40px', marginTop: '40px' }}>
                {/* Compose Form */}
                <div className="glass-container" style={{ padding: '32px', height: 'fit-content', borderTop: '4px solid #a855f7' }}>
                    <h3 style={{ margin: '0 0 24px 0', color: '#fff', fontSize: '1.4rem' }}>
                        Draft PHO Directive
                    </h3>
                    
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label className="input-label" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Alert Headline</label>
                            <input 
                                type="text" 
                                className="input-modern" 
                                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                required 
                                placeholder="e.g. COVID Alert: Masks Mandatory" 
                            />
                        </div>
                        
                        <div>
                            <label className="input-label" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Official Transcript</label>
                            <textarea 
                                className="input-modern" 
                                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', color: '#fff', minHeight: '120px' }}
                                value={message} 
                                onChange={e => setMessage(e.target.value)} 
                                required 
                                placeholder="Enter public health mandate..."
                            ></textarea>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label className="input-label" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Target Sphere</label>
                                <select 
                                    className="input-modern" 
                                    style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                                    value={targetRole} 
                                    onChange={e => setTargetRole(e.target.value)}
                                >
                                    <option value="ALL">Entire Network (Citizens & Staff)</option>
                                    <option value="HospitalAdmin">Hospital Admins Only</option>
                                    <option value="WardStaff">Critical Ward Teams</option>
                                    <option value="Citizen">Direct to Citizens</option>
                                </select>
                            </div>
                            <div>
                                <label className="input-label" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Emergency Level</label>
                                <select 
                                    className="input-modern" 
                                    style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                                    value={priority} 
                                    onChange={e => setPriority(e.target.value)}
                                >
                                    <option value="Emergency">🔴 PANDEMIC PROTOCOL</option>
                                    <option value="High">🟠 High Risk Alert</option>
                                    <option value="Normal">🟢 Standard Advisory</option>
                                </select>
                            </div>
                        </div>
                        
                        <button type="submit" className="btn-primary" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', fontSize: '1.1rem', background: '#a855f7' }}>
                            <Crosshair size={20} /> Execute Global Broadcast
                        </button>
                    </form>
                </div>

                {/* Tracking History */}
                <div>
                    <h3 style={{ margin: '0 0 24px 0', color: '#fff', fontSize: '1.4rem' }}>Live Transmission Log</h3>
                    
                    {announcements.length === 0 ? (
                        <div className="glass-container" style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                            <p>No active public health directives deployed.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {announcements.map((a, i) => (
                                <div key={i} className="glass-container" style={{ 
                                    padding: '24px', 
                                    borderLeft: `6px solid ${a.priority === 'Emergency' ? '#ef4444' : (a.priority === 'High' ? '#f59e0b' : '#10b981')}`
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <h4 style={{ margin: 0, fontSize: '1.3rem', color: '#fff' }}>{a.title}</h4>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <span style={{ fontSize: '0.85rem', background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: '8px', color: '#a855f7', fontWeight: 'bold' }}>
                                                TARGET: {a.target_role}
                                            </span>
                                            <span style={{ fontSize: '0.85rem', background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: '8px', color: a.priority === 'Emergency' ? '#ef4444' : '#fff' }}>
                                                PRIORITY: {a.priority}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <p style={{ margin: '0 0 16px 0', color: '#cbd5e1', lineHeight: '1.6', fontSize: '1.05rem' }}>{a.message}</p>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                                            <ShieldAlert size={14} /> Source: PHO Central
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                                            <Clock size={14} /> Deployed: {new Date(a.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GlobalAnnouncements;
