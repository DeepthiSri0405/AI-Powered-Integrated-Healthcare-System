import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/core.css';
import VirtualConsultation from '../common/VirtualConsultation';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeCall, setActiveCall] = useState(false);
  const [resources, setResources] = useState({
    beds: { total: 100, occupied: 75 },
    icu: { total: 20, occupied: 18 },
    oxygen: { current: 450, threshold: 200 },
    medicineStockStatus: "Stable",
    staffOnDuty: 14
  });

  const [pendingAppointments, setPendingAppointments] = useState([
    { id: "APP-5021", patientName: "Alice Walker", type: "In-Person", reason: "Chronic Back Pain" },
    { id: "APP-5022", patientName: "Bob Martin", type: "Virtual", reason: "Fever & Chills" }
  ]);

  const [stats, setStats] = useState({
    totalUsers: 1250,
    activeAlerts: 4,
    totalPrescriptions: 890
  });

  const handleApprove = (id) => {
    alert(`Appointment ${id} approved! Notification sent to Citizen.`);
    setPendingAppointments(pendingAppointments.filter(app => app.id !== id));
  };

  const getStatusColor = (current, total, isInverse = false) => {
    const ratio = current / total;
    if (isInverse) {
        if (ratio < 0.3) return '#ef4444'; // Red for low oxygen
        if (ratio < 0.6) return '#f59e0b'; // Amber
        return '#10b981'; // Green
    }
    if (ratio > 0.85) return '#ef4444'; // Red for high occupancy
    if (ratio > 0.6) return '#f59e0b'; // Amber
    return '#10b981'; // Green
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--primary)', margin: '0' }}>Admin Operations Center</h1>
        <p style={{ color: 'var(--text-muted)' }}>Real-time Health System Throughput & Hospital Metrics</p>
      </header>

      {/* Top Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {[
          { label: 'Registered Citizens', value: stats.totalUsers, icon: '👥' },
          { label: 'Active IoT Alerts', value: stats.activeAlerts, icon: '⚠️', color: '#ef4444' },
          { label: 'Total Prescriptions', value: stats.totalPrescriptions, icon: '📄' }
        ].map((stat, i) => (
          <div key={i} className="glass-container" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontSize: '2.5rem' }}>{stat.icon}</div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{stat.label}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: stat.color || '#fff' }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        
        {/* Main Monitoring Panel */}
        <div style={{ flex: 2, minWidth: '600px' }}>
          <h3 style={{ color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📡 Live Resource Monitor 
            <span style={{ fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 8px', borderRadius: '12px' }}>Live Connection Stable</span>
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            
            {/* Bed Occupancy Card */}
            <div className="glass-container" style={{ borderLeft: `6px solid ${getStatusColor(resources.beds.occupied, resources.beds.total)}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontWeight: 'bold' }}>Bed Occupancy</span>
                <span style={{ color: getStatusColor(resources.beds.occupied, resources.beds.total) }}>{Math.round((resources.beds.occupied/resources.beds.total)*100)}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ width: `${(resources.beds.occupied/resources.beds.total)*100}%`, height: '100%', background: getStatusColor(resources.beds.occupied, resources.beds.total) }}></div>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{resources.beds.occupied} of {resources.beds.total} beds filled.</div>
            </div>

            {/* ICU Availability Card */}
            <div className="glass-container" style={{ borderLeft: `6px solid ${getStatusColor(resources.icu.occupied, resources.icu.total)}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontWeight: 'bold' }}>ICU Capacity</span>
                <span style={{ color: getStatusColor(resources.icu.occupied, resources.icu.total) }}>{resources.icu.total - resources.icu.occupied} Free</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ width: `${(resources.icu.occupied/resources.icu.total)*100}%`, height: '100%', background: getStatusColor(resources.icu.occupied, resources.icu.total) }}></div>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Critical Care Units: {resources.icu.occupied}/{resources.icu.total}</div>
            </div>

            {/* Oxygen Levels Card */}
            <div className="glass-container" style={{ borderLeft: `6px solid ${getStatusColor(resources.oxygen.current, 1000, true)}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontWeight: 'bold' }}>Oxygen Supply</span>
                    <span style={{ color: getStatusColor(resources.oxygen.current, 1000, true) }}>{resources.oxygen.current} L</span>
                </div>
                {resources.oxygen.current <= resources.oxygen.threshold && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '8px', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '12px' }}>
                        ⚠️ THRESHOLD CROSSED: Request refill immediately!
                    </div>
                )}
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Reserve: {resources.oxygen.current} Liters (Alert @ {resources.oxygen.threshold}L)</div>
            </div>

            {/* Staff & Stock Card */}
            <div className="glass-container">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Medicine Stock</div>
                        <div style={{ color: '#10b981', fontWeight: 'bold' }}>{resources.medicineStockStatus}</div>
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Staff Duty</div>
                        <div style={{ color: '#fff', fontWeight: 'bold' }}>{resources.staffOnDuty} Active</div>
                    </div>
                </div>
            </div>

          </div>
        </div>

        {/* Action Sidebar */}
        <div style={{ flex: 1, minWidth: '350px' }}>
          <div className="glass-container" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#fff' }}>⚡ Action Center</h3>
            
            <div style={{ marginBottom: '32px' }}>
                <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginBottom: '16px', color: 'var(--primary)' }}>
                    Pending Approvals ({pendingAppointments.length})
                </div>
                {pendingAppointments.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>All appointment requests have been processed.</p>
                ) : (
                    pendingAppointments.map(app => (
                        <div key={app.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                             <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{app.patientName}</div>
                             <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{app.type} • {app.reason}</div>
                             <button 
                                className="btn-primary" 
                                style={{ marginTop: '10px', width: '100%', padding: '6px', fontSize: '0.8rem' }}
                                onClick={() => handleApprove(app.id)}
                            >
                                Approve Appointment
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid var(--primary)' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--primary)' }}>Resource Management</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                   System thresholds detected. You may need to request additional oxygen or beds.
                </p>
                <button className="btn-secondary" style={{ width: '100%', marginTop: '12px' }} onClick={() => navigate('/admin/resources')}>
                    Open Request Panel
                </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
