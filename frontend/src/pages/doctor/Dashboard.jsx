import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  PlusCircle, 
  Activity, 
  AlertCircle, 
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  Video
} from 'lucide-react';
import '../../styles/core.css';
import authService from '../../services/authService';
import doctorService from '../../services/doctorService';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser] = useState(authService.getCurrentUser());
  const [appointments, setAppointments] = useState({ pending: [], active: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (location.pathname === '/doctor' || location.pathname === '/doctor/dashboard') {
        setActiveTab('pending');
    }
  }, [location.pathname]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthCounts, setMonthCounts] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchDashboard = async (date) => {
    setLoading(true);
    try {
      const res = await doctorService.getDoctorDashboard(currentUser.identifier, date);
      setAppointments(res);
    } catch (err) {
      console.error("Dashboard load failed", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async (monthDate) => {
    try {
      const monthYear = monthDate.toISOString().slice(0, 7); // YYYY-MM
      const res = await doctorService.getAppointmentCounts(monthYear);
      setMonthCounts(res.counts || {});
    } catch (err) {
      console.error("Counts load failed", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchDashboard(selectedDate);
      fetchCounts(currentMonth);
    }
  }, [currentUser, selectedDate, currentMonth]);

  const stats = [
    { label: 'Waiting Room', value: `${appointments.pending?.length || 0} Pending`, icon: <Users color="#3b82f6" /> },
    { label: 'Active Consultation', value: `${appointments.active?.length || 0} In-Progress`, icon: <Activity color="#f59e0b" /> },
    { label: 'Completed Today', value: `${appointments.completed?.length || 0} Tokens`, icon: <CheckCircle color="#10b981" /> }
  ];

  const currentList = appointments[activeTab] || [];


  // Calendar Logic
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const days = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    const monthName = currentMonth.toLocaleString('default', { month: 'long' });

    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} style={{ padding: '12px', opacity: 0 }}></div>);
    }

    for (let d = 1; d <= days; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const count = monthCounts[dateStr] || 0;
      const isSelected = selectedDate === dateStr;
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      calendarDays.push(
        <div 
          key={d} 
          onClick={() => setSelectedDate(dateStr)}
          className="calendar-day"
          style={{ 
            padding: '12px', 
            textAlign: 'center', 
            cursor: 'pointer',
            borderRadius: '12px',
            position: 'relative',
            background: isSelected ? 'var(--accent)' : (isToday ? 'rgba(255,255,255,0.05)' : 'transparent'),
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            border: isToday ? '1px solid var(--accent)' : '1px solid transparent'
          }}
        >
          <span style={{ fontWeight: isSelected ? 'bold' : 'normal', color: isSelected ? '#000' : '#fff' }}>{d}</span>
          {count > 0 && !isSelected && (
            <div 
              style={{ 
                position: 'absolute', 
                top: '4px', 
                right: '4px', 
                width: '18px', 
                height: '18px', 
                background: 'var(--primary)', 
                borderRadius: '50%', 
                fontSize: '0.65rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
              title={`${count} appointments`}
            >
              {count}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="glass-container" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h4 style={{ margin: 0 }}>{monthName} {year}</h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>&lt;</button>
            <button className="btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>&gt;</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '8px' }}>
          <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {calendarDays}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2.5rem', margin: '0 0 8px 0', color: 'var(--accent)' }}>Physician Portal</h2>
        <p style={{ color: 'var(--text-muted)' }}>Welcome Dr. {currentUser?.name}. Manage your real-time clinic queue and virtual consultations.</p>
      </header>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {stats.map((stat, i) => (
          <div key={i} className="glass-container" style={{ borderLeft: '4px solid var(--accent)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {stat.icon}
                <div>
                   <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{stat.label}</div>
                   <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{stat.value}</div>
                </div>
             </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        {/* Left: Table */}
        <div style={{ flex: 2, minWidth: '600px' }}>
            <div className="glass-container" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)' }}>
                    <button 
                        className={activeTab === 'pending' ? 'nav-tab active-tab' : 'nav-tab'} 
                        onClick={() => setActiveTab('pending')}
                        style={{ padding: '12px 24px', background: 'none', border: 'none', color: activeTab === 'pending' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'pending' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Waiting Room ({appointments.pending?.length || 0})
                    </button>
                    <button 
                        className={activeTab === 'active' ? 'nav-tab active-tab' : 'nav-tab'} 
                        onClick={() => setActiveTab('active')}
                        style={{ padding: '12px 24px', background: 'none', border: 'none', color: activeTab === 'active' ? '#f59e0b' : 'var(--text-muted)', borderBottom: activeTab === 'active' ? '2px solid #f59e0b' : 'none', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Active Patient ({appointments.active?.length || 0})
                    </button>
                </div>
                
                {loading ? <p>Syncing with Atlas database...</p> : currentList.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                <th style={{ padding: '12px' }}>Time</th>
                                <th style={{ padding: '12px' }}>Patient / ID</th>
                                <th style={{ padding: '12px' }}>Type / Token</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentList.map((appt, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '16px 12px', color: 'var(--accent)', fontWeight: 'bold' }}>{appt.timeSlot}</td>
                                    <td style={{ padding: '16px 12px' }}>
                                        <div style={{ fontWeight: '600' }}>Patient {appt.patientId}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Symptoms: {appt.symptoms || 'General Checkup'}</div>
                                    </td>
                                    <td style={{ padding: '16px 12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                            {appt.appointmentType} {appt.tokenNumber && <span style={{ color: 'var(--primary)' }}>({appt.tokenNumber})</span>}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                        {activeTab === 'pending' && (
                                            <button 
                                                className="btn-primary" 
                                                style={{ width: 'auto', padding: '8px 16px', fontSize: '0.8rem' }}
                                                onClick={async () => {
                                                    try {
                                                        await doctorService.initiateAppointment(appt.id);
                                                        fetchDashboard(selectedDate);
                                                        setActiveTab('active');
                                                    } catch (err) {
                                                        alert(err.response?.data?.detail || "Could not initiate appointment.");
                                                    }
                                                }}
                                            >
                                                Initiate
                                            </button>
                                        )}
                                        {activeTab === 'active' && (
                                            <button 
                                                className="btn-primary" 
                                                style={{ width: 'auto', padding: '8px 16px', fontSize: '0.8rem', background: '#f59e0b', color: '#000' }}
                                                onClick={() => {
                                                    navigate('/doctor/prescription', { state: { 
                                                        patientId: appt.patientId, 
                                                        appointmentId: appt.id,
                                                        appointmentType: appt.appointmentType,
                                                        roomName: appt.id,
                                                        doctorName: currentUser.name || "Doctor"
                                                    } });
                                                }}
                                            >
                                                Open Record & Prescribe
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <AlertCircle size={40} style={{ opacity: 0.2, marginBottom: '16px' }} />
                        <p>No appointments found in the {activeTab} list for {selectedDate}.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Right: Toolkit & Calendar */}
        <div style={{ flex: 1, minWidth: '350px' }}>
            <div style={{ marginBottom: '24px' }}>
                {renderCalendar()}
            </div>

            <div className="glass-container">
                <h4 style={{ margin: '0 0 16px 0', color: '#fff' }}>Quick Toolkit</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => navigate('/doctor/patients')}>
                        <Users size={18} /> Manage Patients
                    </button>
                    <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => navigate('/doctor/prescription')}>
                        <PlusCircle size={18} /> Digital Prescription
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
