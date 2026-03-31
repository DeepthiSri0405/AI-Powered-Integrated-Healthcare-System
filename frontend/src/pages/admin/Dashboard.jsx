import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import authService from '../../services/authService';
import '../../styles/core.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
      total_beds: 100, occupied_beds: 0,
      system_users: 0, system_prescriptions: 0, system_alerts: 0,
      bed_occupancy_rate: 0, present_staff: 0, total_staff: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
        try {
            const res = await axios.get('/api/admin/analytics', {
                headers: { Authorization: `Bearer ${authService.getToken()}` }
            });
            setMetrics(res.data.metrics || metrics);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 15000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (current, total) => {
    const ratio = total > 0 ? current / total : 0;
    if (ratio >= 0.9) return '#ef4444'; // Red for critical occupancy
    if (ratio >= 0.7) return '#f59e0b'; // Amber
    return '#10b981'; // Green
  };

  const isBedsFull = metrics.total_beds > 0 && metrics.occupied_beds >= metrics.total_beds;
  const isBedsCritical = metrics.total_beds > 0 && (metrics.occupied_beds / metrics.total_beds) >= 0.9;

  return (
    <div style={{ padding: '40px', maxWidth: '1500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Dynamic Alerts */}
      {(isBedsFull || isBedsCritical) && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '12px', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '2rem' }}>🚨</span>
                <div>
                    <h3 style={{ margin: 0, color: '#ef4444', fontSize: '1.2rem' }}>CRITICAL WARD CAPACITY</h3>
                    <p style={{ margin: '4px 0 0 0', color: '#fca5a5', fontSize: '0.9rem' }}>
                        {isBedsFull ? 'All admission wards are completely occupied. Extend beds immediately or divert patients.' : 'Admissions are nearing maximum hospital capacity.'}
                    </p>
                </div>
            </div>
            <button className="btn-primary" style={{ background: '#ef4444' }} onClick={() => navigate('/admin/resources')}>Manage Resources</button>
        </div>
      )}

      <header>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--primary)', margin: '0' }}>Admin Operations Center</h1>
        <p style={{ color: 'var(--text-muted)' }}>Real-time Health System Throughput & Hospital Metrics</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 3fr', gap: '32px' }}>
        
        {/* Left Sidebar: Enterprise Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-container" style={{ padding: '24px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <h3 style={{ margin: '0 0 20px 0', color: 'var(--primary)' }}>Enterprise Controls</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                        { label: 'Live Analytics Hub', icon: '📊', path: '/admin/analytics' },
                        { label: 'AI Insurance Claims', icon: '🛡️', path: '/admin/insurance' },
                        { label: 'Broadcast Alerts', icon: '📢', path: '/admin/announcements' },
                        { label: 'Staff Attendance', icon: '🧑‍⚕️', path: '/admin/attendance' },
                        { label: 'Resource Requests', icon: '💊', path: '/admin/resources' }
                    ].map((item, idx) => (
                        <button 
                            key={idx}
                            className="btn-secondary" 
                            style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', fontSize: '1rem', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.1)' }}
                            onClick={() => navigate(item.path)}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                        >
                            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span> 
                            <span style={{ flex: 1 }}>{item.label}</span>
                            <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="glass-container" style={{ padding: '24px' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#fff' }}>Quick Connection Status</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }}></div>
                    WebSocket Relays Active
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }}></div>
                    Database Node Synced
                </div>
            </div>
        </div>

        {/* Main Interface */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Top Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                {[
                { label: 'Registered Citizens', value: loading ? '--' : metrics.system_users, icon: '👥' },
                { label: 'Active IoT Alerts', value: loading ? '--' : metrics.system_alerts, icon: '⚠️', color: metrics.system_alerts > 0 ? '#ef4444' : '#10b981' },
                { label: 'Total Prescriptions', value: loading ? '--' : metrics.system_prescriptions, icon: '📄' }
                ].map((stat, i) => (
                <div key={i} className="glass-container" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '2.5rem' }}>{stat.icon}</div>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{stat.label}</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: stat.color || '#fff' }}>{stat.value}</div>
                    </div>
                </div>
                ))}
            </div>

            {/* Live Resource Monitor */}
            <div className="glass-container" style={{ padding: '30px' }}>
                <h3 style={{ margin: '0 0 24px 0', color: '#fff', fontSize: '1.4rem' }}>📡 Live Resource Matrix</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
                    
                    {/* Bed Occupancy Tracker */}
                    <div style={{ borderLeft: `6px solid ${getStatusColor(metrics.occupied_beds, metrics.total_beds)}`, paddingLeft: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>General Bed Capacity</span>
                            <span style={{ fontWeight: 'bold', color: getStatusColor(metrics.occupied_beds, metrics.total_beds) }}>
                                {metrics.total_beds > 0 ? Math.round((metrics.occupied_beds/metrics.total_beds)*100) : 0}%
                            </span>
                        </div>
                        <div style={{ height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden', marginBottom: '12px' }}>
                            <div style={{ width: `${metrics.total_beds > 0 ? (metrics.occupied_beds/metrics.total_beds)*100 : 0}%`, height: '100%', background: getStatusColor(metrics.occupied_beds, metrics.total_beds), transition: 'width 0.5s ease' }}></div>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            {metrics.occupied_beds} out of {metrics.total_beds} beds currently occupied.
                        </div>
                    </div>

                    {/* Staff Tracker */}
                    <div style={{ borderLeft: `6px solid #3b82f6`, paddingLeft: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Active Medical Staff</span>
                            <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{metrics.present_staff} Online</span>
                        </div>
                        <div style={{ height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden', marginBottom: '12px' }}>
                            <div style={{ width: `${metrics.total_staff > 0 ? (metrics.present_staff/metrics.total_staff)*100 : 0}%`, height: '100%', background: '#3b82f6', transition: 'width 0.5s ease' }}></div>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            {metrics.total_staff} total personnel across all departments.
                        </div>
                    </div>

                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
