import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../../services/authService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import '../../styles/core.css';

const AdminAnalytics = () => {
    const [metrics, setMetrics] = useState({
        patients_today: 0,
        bed_occupancy_rate: 0,
        attendance_rate: 0,
        revenue: 0,
        pending_claims: 0,
        occupied_beds: 0,
        total_beds: 0,
        present_staff: 0,
        total_staff: 0,
        system_users: 0,
        system_prescriptions: 0,
        system_alerts: 0,
        monthly_visits_trend: []
    });
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 15000);
        return () => clearInterval(interval);
    }, []);

    const ProgressRing = ({ radius, stroke, progress, color }) => {
        const normalizedRadius = radius - stroke * 2;
        const circumference = normalizedRadius * 2 * Math.PI;
        const strokeDashoffset = circumference - progress / 100 * circumference;

        return (
            <svg height={radius * 2} width={radius * 2}>
                <circle stroke="rgba(255,255,255,0.1)" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
                <circle stroke={color} fill="transparent" strokeWidth={stroke} strokeDasharray={strokeDashoffset + ' ' + circumference} style={{ strokeDashoffset: 0, transition: 'stroke-dashoffset 0.5s ease 0s' }} r={normalizedRadius} cx={radius} cy={radius} strokeLinecap="round" transform={`rotate(-90 ${radius} ${radius})`} />
                <text x="50%" y="50%" fill="#fff" fontSize="1.5rem" fontWeight="bold" textAnchor="middle" dy=".3em">{Math.round(progress)}%</text>
            </svg>
        );
    };

    const pieData = [
        { name: 'Active Users', value: metrics.system_users - (metrics.total_staff || 0) },
        { name: 'Clinical Staff', value: metrics.total_staff || 0 },
        { name: 'Pending Admin Claims', value: metrics.pending_claims }
    ];
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

    return (
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2.5rem', color: 'var(--primary)', margin: 0 }}>Enterprise Analytics Hub</h1>
            <p style={{ color: 'var(--text-muted)' }}>Continuous performance and demographic observation.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '30px', marginBottom: '30px' }}>
                
                {/* Daily Appointments */}
                <div className="glass-container" style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-muted)' }}>Daily Footfall</h3>
                    <div style={{ fontSize: '4rem', fontWeight: 'bold', color: '#3b82f6' }}>{loading ? '--' : metrics.patients_today}</div>
                    <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>Patients Processed Today</span>
                </div>

                {/* Bed Occupancy */}
                <div className="glass-container" style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-muted)' }}>Bed Occupancy</h3>
                    <ProgressRing radius={70} stroke={10} progress={loading ? 0 : metrics.bed_occupancy_rate} color={metrics.bed_occupancy_rate > 80 ? '#ef4444' : '#10b981'} />
                    <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginTop: '16px' }}>{metrics.occupied_beds} / {metrics.total_beds} Rooms Filled</span>
                </div>

                {/* Staff Attendance */}
                <div className="glass-container" style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-muted)' }}>Shift Adherence</h3>
                    <ProgressRing radius={70} stroke={10} progress={loading ? 0 : metrics.attendance_rate} color={metrics.attendance_rate < 50 ? '#ef4444' : '#6366f1'} />
                    <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginTop: '16px' }}>{metrics.present_staff} / {metrics.total_staff} Staff Active</span>
                </div>

                {/* Insurance & Revenue */}
                <div className="glass-container" style={{ padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-muted)' }}>Financial Velocity</h3>
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)' }}>Total Settled Revenue (Claims)</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>₹{loading ? '--' : metrics.revenue.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 2fr) minmax(300px, 1fr)', gap: '24px' }}>
                <div className="glass-container" style={{ padding: '30px' }}>
                    <h3 style={{ margin: '0 0 24px 0', color: '#fff' }}>Monthly Patient Visits Tracker</h3>
                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.monthly_visits_trend}>
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                                <YAxis stroke="rgba(255,255,255,0.5)" />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }} />
                                <Bar dataKey="visits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-container" style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3 style={{ margin: '0 0 24px 0', color: '#fff', alignSelf: 'flex-start' }}>Ecosystem Distribution</h3>
                    <div style={{ width: '100%', height: '240px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none' }} itemStyle={{ color: '#fff' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', marginTop: '16px' }}>
                        {pieData.map((entry, index) => (
                            <div key={`legend-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <div style={{ width: '12px', height: '12px', background: COLORS[index % COLORS.length], borderRadius: '50%' }}></div>
                                {entry.name}: {entry.value}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AdminAnalytics;
