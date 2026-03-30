import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Activity, 
  FileText, 
  TrendingUp,
  Heart,
  Pill,
  Bell,
  Video,
  Play,
  Zap,
  Coffee,
  Sun,
  Moon,
  AlertCircle
} from 'lucide-react';
import '../../styles/core.css';
import citizenService from '../../services/citizenService';
import authService from '../../services/authService';
import doctorService from '../../services/doctorService';

const CitizenDashboard = () => {
  const navigate = useNavigate();
  const [user] = useState(authService.getCurrentUser());
  const [medSchedule, setMedSchedule] = useState({ Morning: [], Afternoon: [], Night: [] });
  const [appointments, setAppointments] = useState([]);
  const [queueStatus, setQueueStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const ticker = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(ticker);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const medsRes = await citizenService.getMedications();
        const apptsRes = await doctorService.getPatientAppointments(user.identifier);
        
        setMedSchedule(medsRes.medications || { Morning: [], Afternoon: [], Night: [] });
        setAppointments(apptsRes.appointments || []);
        
        // Find nearest In-Person appointment for queue tracking
        const todayStr = new Date().toISOString().split('T')[0];
        const todayOffline = (apptsRes.appointments || []).find(a => a.date === todayStr && a.appointmentType === 'In-Person');
        
        if (todayOffline) {
            const qs = await citizenService.getQueueStatus(todayOffline.doctorId, todayOffline.tokenNumber, todayStr);
            setQueueStatus({ ...qs, myToken: todayOffline.tokenNumber, hospital: todayOffline.hospitalName });
        } else {
            setQueueStatus(null);
        }
      } catch (err) {
        if (err.response?.status === 401) {
            authService.logout();
            navigate('/login');
            return;
        }
        console.error("Dashboard sync error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
        fetchData();
        // Poll queue status every 30 seconds for live updates
        const poller = setInterval(fetchData, 30000);
        return () => clearInterval(poller);
    }
  }, [user, navigate]);

  const isMeetingActive = (slotRange, apptDate) => {
    if (!slotRange || !apptDate) return { active: false, label: 'Not Scheduled' };
    
    // Parse slot start
    const [start] = slotRange.split(' - ');
    const [startH, startM] = start.split(':').map(Number);
    
    const slotStart = new Date(apptDate);
    slotStart.setHours(startH, startM, 0, 0);
    
    const diffMs = slotStart - currentTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins > 30) {
        // More than 30 mins away
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return { active: false, label: hrs > 0 ? `Starts in ${hrs}h ${mins}m` : `Starts in ${mins}m` };
    } else if (diffMins <= 30 && diffMins >= -60) {
        // Active window (30 mins before to 60 mins after start)
        return { active: true, label: 'Join Session' };
    } else {
        return { active: false, label: 'Session Ended' };
    }
  };

  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(a.date + ' ' + a.timeSlot.split(' - ')[0]);
    const dateB = new Date(b.date + ' ' + b.timeSlot.split(' - ')[0]);
    return dateA - dateB; // Chronological order
  });

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
            <h2 style={{ fontSize: '2.5rem', margin: '0 0 8px 0' }}>Welcome, {user?.name}</h2>
            <p style={{ color: 'var(--text-muted)' }}>Medical ID: {user?.identifier} | Status: Healthy 🟢</p>
        </div>
        <div className="glass-container" style={{ padding: '12px 24px', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Time</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{currentTime.toLocaleTimeString()}</div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '32px' }}>
        
        {/* Left Column: Queue & Medications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* 1. Real-Time Queue Tracker */}
            {queueStatus ? (
                <div className="glass-container" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)', border: '1px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><Zap size={24} color="var(--primary)" /> Live Clinic Queue</h3>
                        <span style={{ background: 'var(--primary)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>AT {queueStatus.hospital}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                        <div style={{ textAlign: 'center', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Now Serving</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary)' }}>{queueStatus.activeToken}</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Your Token</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{queueStatus.myToken}</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Est. Wait Time</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#f59e0b' }}>{queueStatus.estimatedWait}m</div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="glass-container" style={{ opacity: 0.6 }}>
                    <p style={{ margin: 0, color: 'var(--text-muted)', textAlign: 'center' }}>No active clinic queue for today. Book an in-person visit to track status.</p>
                </div>
            )}

            {/* 2. Structured Medication Hub */}
            <div>
                <h4 style={{ color: '#fff', marginBottom: '20px' }}>Daily Medication Schedule</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                    {[
                        { label: 'Morning', icon: <Coffee size={20} color="#f59e0b" />, meds: medSchedule.Morning },
                        { label: 'Afternoon', icon: <Sun size={20} color="#3b82f6" />, meds: medSchedule.Afternoon },
                        { label: 'Night', icon: <Moon size={20} color="#8b5cf6" />, meds: medSchedule.Night }
                    ].map((slot, i) => (
                        <div key={i} className="glass-container" style={{ minHeight: '150px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                                {slot.icon}
                                <span style={{ fontWeight: 'bold' }}>{slot.label}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {slot.meds.length > 0 ? slot.meds.map((m, j) => (
                                    <div key={j} style={{ fontSize: '0.85rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%' }}></div> {m}
                                    </div>
                                )) : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No med prescribed</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Quick Navigation */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                {[
                    { name: 'New Appointment', path: '/citizen/appointments', icon: <Calendar color="#3b82f6" />, desc: 'Book with specialist.' },
                    { name: 'History & Records', path: '/citizen/appointments', icon: <FileText color="#10b981" />, desc: 'View past prescriptions.' },
                    { name: 'IoT Vitals', path: '/citizen/iot-monitor', icon: <Activity color="#8b5cf6" />, desc: 'Real-time health spikes.' }
                ].map((action, i) => (
                    <div key={i} className="glass-container" style={{ cursor: 'pointer' }} onClick={() => navigate(action.path)}>
                        <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>{action.icon}</div>
                        <h5 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#fff' }}>{action.name}</h5>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{action.desc}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Right Column: Appointments & Reminders */}
        <div className="glass-container" style={{ borderLeft: '4px solid var(--primary)' }}>
            <h4 style={{ margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Bell size={18} color="var(--primary)" /> Smart Schedule</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {sortedAppointments.slice(0, 3).map((appt, i) => {
                    const status = appt.appointmentType === 'Virtual' ? isMeetingActive(appt.timeSlot, appt.date) : { active: false, label: 'In-Person' };
                    return (
                        <div key={i} style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: status.active ? '1px solid var(--primary)' : '1px solid transparent' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '4px' }}>{appt.appointmentType.toUpperCase()}</div>
                            <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.9rem' }}>{appt.doctorName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{appt.hospitalName}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12}/> {appt.timeSlot}
                            </div>
                            {appt.appointmentType === 'Virtual' ? (
                                <button 
                                    className={status.active ? "btn-primary" : "btn-secondary"} 
                                    disabled={!status.active}
                                    style={{ width: '100%', padding: '6px', fontSize: '0.75rem', marginTop: '12px', opacity: status.active ? 1 : 0.6 }} 
                                    onClick={() => window.open(appt.meetingLink, '_blank')}
                                >
                                    {status.label}
                                </button>
                            ) : (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center', padding: '6px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                    Visit Clinic at {appt.timeSlot.split(' - ')[0]}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
