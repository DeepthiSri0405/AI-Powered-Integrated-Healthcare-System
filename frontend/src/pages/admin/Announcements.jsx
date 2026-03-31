import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../../services/authService';
import { Send, Radio, Megaphone, AlertTriangle, Users, Clock, AlignLeft } from 'lucide-react';
import '../../styles/core.css';

const AdminAnnouncements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetRole, setTargetRole] = useState('ALL');
    const [priority, setPriority] = useState('Normal');

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
            alert('Announcement blasted across ecosystem!');
            setAnnouncements([res.data.data, ...announcements]);
            setTitle('');
            setMessage('');
        } catch (err) {
            alert('Failed to send announcement');
        }
    };

    const getPriorityColor = (p) => {
        if (p === 'Emergency') return '#ef4444'; // Red
        if (p === 'High') return '#f59e0b'; // Orange
        return 'var(--primary)'; // Blue
    };

    const getPriorityBg = (p) => {
        if (p === 'Emergency') return 'rgba(239, 68, 68, 0.1)';
        if (p === 'High') return 'rgba(245, 158, 11, 0.1)';
        return 'rgba(59, 130, 246, 0.1)';
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '12px' }}>
                    <Radio size={32} color="var(--primary)" />
                </div>
                <div>
                    <h1 style={{ fontSize: '2.5rem', color: '#fff', margin: 0 }}>System Broadcasts</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '4px' }}>Publish critical updates across all interconnected profiles instantly.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 2fr', gap: '40px', marginTop: '40px' }}>
                
                {/* Compose Form */}
                <div className="glass-container" style={{ padding: '32px', height: 'fit-content', borderTop: '4px solid var(--primary)' }}>
                    <h3 style={{ margin: '0 0 24px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem' }}>
                        <Megaphone size={24} color="var(--primary)" />
                        Compose Broadcast
                    </h3>
                    
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                                <AlignLeft size={16} /> Title
                            </label>
                            <input 
                                type="text" 
                                className="input-modern" 
                                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)' }}
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                required 
                                placeholder="e.g. Server Maintenance" 
                            />
                        </div>
                        
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                                <AlignLeft size={16} /> Message
                            </label>
                            <textarea 
                                className="input-modern" 
                                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', minHeight: '120px' }}
                                value={message} 
                                onChange={e => setMessage(e.target.value)} 
                                required 
                                placeholder="Enter detailed announcement description..."
                            ></textarea>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                                    <Users size={16} /> Target Audience
                                </label>
                                <select 
                                    className="input-modern" 
                                    style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)' }}
                                    value={targetRole} 
                                    onChange={e => setTargetRole(e.target.value)}
                                >
                                    <option value="ALL">Everyone</option>
                                    <option value="Citizen">Patients (Citizens)</option>
                                    <option value="Doctor">Doctors</option>
                                    <option value="WardStaff">Ward Staff</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                                    <AlertTriangle size={16} /> Priority Level
                                </label>
                                <select 
                                    className="input-modern" 
                                    style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)' }}
                                    value={priority} 
                                    onChange={e => setPriority(e.target.value)}
                                >
                                    <option value="Normal">🟢 Normal</option>
                                    <option value="High">🟠 High (Warning)</option>
                                    <option value="Emergency">🔴 Emergency (Alert)</option>
                                </select>
                            </div>
                        </div>
                        
                        <button type="submit" className="btn-primary" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', fontSize: '1.1rem' }}>
                            <Send size={20} /> Blast Notification
                        </button>
                    </form>
                </div>

                {/* History */}
                <div>
                    <h3 style={{ margin: '0 0 24px 0', color: '#fff', fontSize: '1.4rem' }}>Transmission History</h3>
                    
                    {announcements.length === 0 ? (
                        <div className="glass-container" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                            <Megaphone size={40} style={{ opacity: 0.5, marginBottom: '16px' }} />
                            <p>No active broadcasts have been sent yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {announcements.map((a, i) => (
                                <div key={i} className="glass-container" style={{ 
                                    padding: '24px', 
                                    borderLeft: `6px solid ${getPriorityColor(a.priority)}`,
                                    background: getPriorityBg(a.priority)
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <h4 style={{ margin: 0, fontSize: '1.3rem', color: '#fff' }}>{a.title}</h4>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <span style={{ fontSize: '0.85rem', background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: '8px', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                Target: <strong style={{ color: '#fff' }}>{a.target_role}</strong>
                                            </span>
                                            <span style={{ fontSize: '0.85rem', background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: '8px', color: 'var(--text-muted)', border: `1px solid ${getPriorityColor(a.priority)}` }}>
                                                Priority: <strong style={{ color: getPriorityColor(a.priority) }}>{a.priority}</strong>
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <p style={{ margin: '0 0 16px 0', color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '1.05rem' }}>{a.message}</p>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                                            <Users size={14} /> Author: {a.author}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                                            <Clock size={14} /> {new Date(a.created_at).toLocaleString()}
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

export default AdminAnnouncements;
