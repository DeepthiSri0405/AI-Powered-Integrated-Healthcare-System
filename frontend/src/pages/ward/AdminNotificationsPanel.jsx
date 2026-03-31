import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../../services/authService';
import wardService from '../../services/wardService';
import { ShieldAlert, Clock } from 'lucide-react';

const AdminNotificationsPanel = () => {
    const [currentUser] = useState(authService.getCurrentUser());
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [wardId, setWardId] = useState(null);

    useEffect(() => {
        const init = async () => {
            if (!currentUser) return;
            try {
                // We need to know the ward ID first
                const dash = await wardService.getDashboard();
                if (dash && dash.wardId) {
                    setWardId(dash.wardId);
                    
                    const res = await axios.get(`/api/admin/notifications?ward_id=${dash.wardId}`, {
                        headers: { Authorization: `Bearer ${authService.getToken()}` }
                    });
                    setNotifications(res.data || []);
                }
            } catch (err) {
                console.error("Failed to load admin notifications", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser || !wardId) return;

        const ws = new WebSocket(`ws://localhost:8000/api/realtime/ws/${currentUser.identifier}-admin-notif`);
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "NEW_NOTIFICATION" && data.notification) {
                    const isTargeted = data.notification.ward_id === "ALL" || data.notification.ward_id === wardId;
                    if (isTargeted) {
                        setNotifications(prev => [data.notification, ...prev]);
                    }
                }
            } catch (e) {
                // ignore
            }
        };

        return () => {
            if (ws.readyState === 1) ws.close();
        };
    }, [currentUser, wardId]);

    if (loading) return <div style={{ padding: '40px', color: '#fff' }}>Loading Admin Directives...</div>;

    return (
        <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--primary)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <ShieldAlert size={40} />
                Admin Notifications
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>
                Central Directives and high-priority announcements targeted for your Ward.
            </p>

            {notifications.length === 0 ? (
                <div className="glass-container" style={{ textAlign: 'center', padding: '60px' }}>
                    <ShieldAlert size={48} color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: '16px' }} />
                    <h4 style={{ color: 'var(--text-muted)' }}>No Active Directives</h4>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {notifications.map(notif => {
                        const isHighPriority = notif.priority === 'High';
                        return (
                            <div key={notif.id} className="glass-container" style={{ 
                                borderLeft: `6px solid ${isHighPriority ? '#ef4444' : 'var(--primary)'}`,
                                position: 'relative', overflow: 'hidden'
                            }}>
                                {isHighPriority && (
                                    <div style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: '#fff', padding: '6px 16px', borderBottomLeftRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                        HIGH PRIORITY
                                    </div>
                                )}
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <h3 style={{ margin: 0, color: isHighPriority ? '#fca5a5' : '#fff', fontSize: '1.4rem' }}>
                                        {notif.title}
                                    </h3>
                                    
                                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Clock size={14} /> Issued: {new Date(notif.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    
                                    <p style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '1.05rem', marginTop: '8px' }}>
                                        {notif.message}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminNotificationsPanel;
