import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../../services/authService';
import '../../styles/core.css';

const AdminAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
      try {
          const res = await axios.get('/api/admin/attendance', {
              headers: { Authorization: `Bearer ${authService.getToken()}` }
          });
          setAttendance(res.data.attendance || []);
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--primary)', margin: 0 }}>Staff Attendance Register</h1>
        <p style={{ color: 'var(--text-muted)' }}>Real-time login and logout tracking for operational capacity.</p>
        
        <div className="glass-container" style={{ padding: '24px', marginTop: '30px' }}>
            {loading ? (
                <p>Loading attendance data...</p>
            ) : attendance.length === 0 ? (
                <p>No staff members have logged in yet today.</p>
            ) : (
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: '#fff' }}>
                    <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--primary)' }}>
                        <tr>
                            <th style={{ padding: '12px' }}>Worker ID</th>
                            <th style={{ padding: '12px' }}>Role</th>
                            <th style={{ padding: '12px' }}>Login Time</th>
                            <th style={{ padding: '12px' }}>Logout / Status</th>
                            <th style={{ padding: '12px' }}>Hours</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendance.map((att) => (
                            <tr key={att.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '12px', fontWeight: 'bold' }}>{att.user_id}</td>
                                <td style={{ padding: '12px' }}>{att.role}</td>
                                <td style={{ padding: '12px' }}>{new Date(att.login_time).toLocaleTimeString()}</td>
                                <td style={{ padding: '12px' }}>
                                    {att.logout_time ? (
                                        <span style={{ color: 'var(--text-muted)' }}>Logged Out at {new Date(att.logout_time).toLocaleTimeString()}</span>
                                    ) : (
                                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                                            Active
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: '12px' }}>{att.total_hours > 0 ? att.total_hours : 'In Progress'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    </div>
  );
};
export default AdminAttendance;
