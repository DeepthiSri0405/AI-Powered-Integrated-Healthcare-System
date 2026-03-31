import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  User, 
  Clock, 
  Calendar,
  CheckCircle2,
  FileText,
  History,
  X,
  Activity,
  Zap,
  Star,
  Navigation,
  Heart,
  Stethoscope,
  Info,
  ShieldCheck,
  BrainCircuit
} from 'lucide-react';
import '../../styles/core.css';
import axios from 'axios';
import doctorService from '../../services/doctorService';
import authService from '../../services/authService';
import locationService from '../../services/locationService';

const Appointments = () => {
    const navigate = useNavigate();
    const [currentUser] = useState(authService.getCurrentUser());
    const [view, setView] = useState('new'); 
    
    // Booking States
    const [hospitals, setHospitals] = useState([]);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [specialists, setSpecialists] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [apptType, setApptType] = useState('In-Person'); 
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [symptoms, setSymptoms] = useState('');
    
    // AI Assistant States
    const [isScanning, setIsScanning] = useState(false);
    const [aiRecommendation, setAiRecommendation] = useState(null);
    
    // Notifications States
    const [hospitalAnnouncements, setHospitalAnnouncements] = useState([]);

    const [isBooking, setIsBooking] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [isLoadingHospitals, setIsLoadingHospitals] = useState(true);
    
    // History States
    const [history, setHistory] = useState([]);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [feedbackRating, setFeedbackRating] = useState(5);
    const [feedbackComment, setFeedbackComment] = useState("");
    
    // Doctor Reviews View State
    const [selectedDoctorReviews, setSelectedDoctorReviews] = useState(null);
    const [loadingReviews, setLoadingReviews] = useState(false);
    
    const today = new Date().toISOString().split('T')[0];

    const fetchHistory = async () => {
        try {
            const res = await doctorService.getPatientAppointments(currentUser.identifier);
            setHistory(res.appointments || []);
        } catch (err) {
            console.error("History fetch error:", err);
        }
    };

    useEffect(() => {
        const initFetch = async () => {
            setIsLoadingHospitals(true);
            try {
                const config = { headers: { Authorization: `Bearer ${authService.getToken()}` } };
                const demoRes = await axios.get('/api/doctor/demo-facility', config);
                const dbDemo = demoRes.data.hospital;
                
                if (dbDemo) {
                    dbDemo.isDemo = true;
                    dbDemo.distance = 0;
                }

                const osmHospitals = await locationService.getNearbyHospitals();
                const merged = dbDemo ? [dbDemo, ...osmHospitals] : osmHospitals;
                setHospitals(merged);

                await fetchHistory();
            } catch (err) {
                if (err.response?.status === 401) {
                    authService.logout();
                    navigate('/login');
                    return;
                }
                console.error("Hub Sync Init Error:", err);
            } finally {
                setIsLoadingHospitals(false);
            }
        };
        initFetch();
    }, [currentUser]);

    // AI SMART DIAGNOSIS ENGINE
    useEffect(() => {
        if (symptoms.length < 5) {
            setAiRecommendation(null);
            return;
        }

        setIsScanning(true);
        const timer = setTimeout(() => {
            const s = symptoms.toLowerCase();
            let matchedDomain = null;
            let reason = "";

            if (s.includes('heart') || s.includes('chest') || s.includes('bp') || s.includes('cardiac')) {
                matchedDomain = 'Cardiology';
                reason = "Your symptoms relate to cardiovascular health. We suggest a specialist with deep experience in hypertension and cardiac intervention.";
            } else if (s.includes('child') || s.includes('baby') || s.includes('pedia') || s.includes('infant')) {
                matchedDomain = 'Pediatrics';
                reason = "Based on the mention of pediatric care, we suggest a specialist focused on neonatal and childhood infectious diseases.";
            } else if (s.includes('fever') || s.includes('cough') || s.includes('cold') || s.includes('body pain') || s.includes('flu')) {
                matchedDomain = 'General Medicine';
                reason = "Your symptoms are common for seasonal illness or chronic wellness. A General Physician is best for a primary diagnosis.";
            }

            if (matchedDomain) {
                const doc = specialists.find(d => d.specialty === matchedDomain);
                if (doc) {
                    setAiRecommendation({
                        doctorId: doc.employeeId,
                        domain: matchedDomain,
                        reason: reason,
                        docName: doc.name,
                        experience: doc.experience || "Senior"
                    });
                }
            } else {
                setAiRecommendation(null);
            }
            setIsScanning(false);
        }, 800);

        return () => clearTimeout(timer);
    }, [symptoms, specialists]);

    // Handle Doctor & Announcements Fetch when Hospital changes
    useEffect(() => {
        if (selectedHospital) {
            const fetchDoctors = async () => {
                if (selectedHospital.isDemo) {
                    const res = await doctorService.searchDoctors(selectedHospital.id);
                    setSpecialists(res.doctors || []);
                } else {
                    setSpecialists([]); 
                }
            };
            
            const fetchAnnouncements = async () => {
                try {
                    const res = await axios.get(`/api/announcement?hospital_id=${selectedHospital.id}&target_role=Citizen`, {
                        headers: { Authorization: `Bearer ${authService.getToken()}` }
                    });
                    setHospitalAnnouncements(res.data || []);
                } catch (err) {
                     console.error("Failed fetching announcements", err);
                }
            };
            
            fetchDoctors();
            fetchAnnouncements();
        } else {
            setHospitalAnnouncements([]);
        }
    }, [selectedHospital]);

    // Handle Slot Fetch when Doctor OR Date OR Type changes
    useEffect(() => {
        if (selectedDoctor) {
            const fetchSlots = async () => {
                const res = await doctorService.getDoctorSlots(selectedDoctor.employeeId, selectedDate);
                const slotsArray = res.availableSlots || [];

                // DEMO MODE: Show ALL slots — no shift filter, no time filter
                setAvailableSlots(slotsArray);
            };
            fetchSlots();
        }
    }, [selectedDoctor, apptType, selectedDate]);

    const handleHospitalSelect = (h) => {
        setSelectedHospital(h);
        setSelectedDoctor(null); 
        setAvailableSlots([]);
    };

    const [bookedResult, setBookedResult] = useState(null);

    const handleBook = async () => {
        if (!selectedDoctor || !selectedSlot) return;
        setIsBooking(true);
        try {
            const res = await axios.post('/api/appointment/book', {
                patientId: currentUser.identifier,
                doctorId: selectedDoctor.employeeId,
                hospitalId: selectedHospital.id,
                hospitalName: selectedHospital.name,
                date: selectedDate,
                timeSlot: selectedSlot,
                appointmentType: apptType,
                symptoms: symptoms || "Routine Checkup"
            }, { 
                headers: { Authorization: `Bearer ${authService.getToken()}` } 
            });
            setBookedResult(res.data.appointment);
            setBookingSuccess(true);
            setTimeout(() => navigate('/citizen'), 5000); // 5 sec to see token
        } catch (err) {
            alert("Booking failed. Please check balance.");
        } finally {
            setIsBooking(false);
        }
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/citizen/feedback', {
                doctorId: selectedFeedback.doctorId,
                appointmentId: selectedFeedback.id,
                rating: feedbackRating,
                comment: feedbackComment
            }, { headers: { Authorization: `Bearer ${authService.getToken()}` } });
            alert("Feedback submitted successfully!");
            setSelectedFeedback(null);
            fetchHistory();
        } catch(err) {
            alert(err.response?.data?.detail || "Error submitting feedback");
        }
    };

    const fetchDoctorFeedbacks = async (doctor) => {
        setLoadingReviews(true);
        setSelectedDoctorReviews({ ...doctor, feedbacks: [] });
        try {
            const res = await doctorService.getDoctorFeedbacks(doctor.employeeId);
            setSelectedDoctorReviews({ ...doctor, feedbacks: res.feedbacks || [] });
        } catch (err) {
            console.error("Failed to fetch feedbacks", err);
        } finally {
            setLoadingReviews(false);
        }
    };

    if (bookingSuccess) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                <CheckCircle2 size={80} color="#10b981" style={{ marginBottom: '24px' }} />
                <h2 style={{ fontSize: '2.5rem' }}>Appointment Confirmed!</h2>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '24px 48px', borderRadius: '24px', textAlign: 'center', marginTop: '32px', border: '2px dashed var(--primary)' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Your Queue Token</div>
                    <div style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--primary)' }}>{bookedResult?.tokenNumber || "N/A"}</div>
                </div>
                <p style={{ color: 'var(--text-muted)', marginTop: '24px' }}>Redirecting to dashboard in 5 seconds...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            
            <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        Autonomous Booking Hub <BrainCircuit color="var(--primary)" size={32}/>
                    </h2>
                    <p style={{ color: 'var(--text-muted)' }}>Proactive medical routing & specialist intelligence.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className={view === 'new' ? "btn-primary" : "btn-secondary"} onClick={() => setView('new')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={18}/> New Visit
                    </button>
                    <button className={view === 'history' ? "btn-primary" : "btn-secondary"} onClick={() => { setView('history'); fetchHistory(); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <History size={18}/> Clinical History
                    </button>
                </div>
            </header>

            {view === 'new' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.2fr', gap: '32px' }}>
                    {/* Step 1: Hospital Search */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto', paddingRight: '12px' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}><Navigation size={20} color="var(--primary)" /> Smart Locales</h4>
                        {isLoadingHospitals ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', py: '40px' }}>Loading real-time maps...</p> : hospitals.map(h => (
                            <div 
                                key={h.id} 
                                className={`glass-container ${selectedHospital?.id === h.id ? 'active-border' : ''}`}
                                onClick={() => handleHospitalSelect(h)}
                                style={{ cursor: 'pointer', border: selectedHospital?.id === h.id ? '2px solid var(--primary)' : '1px solid var(--glass-border)', padding: '16px' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {h.name}
                                        {h.isDemo && <ShieldCheck size={14} color="var(--primary)" />}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: h.isDemo ? 'var(--primary)' : 'var(--text-muted)' }}>
                                        {h.id.startsWith('OSM') ? `${(h.distance * 111).toFixed(1)} km` : "Demo Center"}
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}><MapPin size={12}/> {typeof h.location === 'string' ? h.location : h.address || "Medical District"}</div>
                            </div>
                        ))}
                    </div>

                    {/* Step 2: Date, Specialist & AI Flow */}
                    {selectedHospital ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            
                            {/* HOSPITAL ANNOUNCEMENTS */}
                            {hospitalAnnouncements.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '8px' }}>
                                    {hospitalAnnouncements.map((ann, i) => (
                                        <div key={i} style={{ 
                                            background: ann.priority === 'Emergency' ? 'rgba(239, 68, 68, 0.1)' : (ann.priority === 'High' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)'), 
                                            border: `1px solid ${ann.priority === 'Emergency' ? '#ef4444' : (ann.priority === 'High' ? '#f59e0b' : '#3b82f6')}`,
                                            padding: '16px', borderRadius: '12px', color: '#fff',
                                            display: 'flex', gap: '12px', alignItems: 'flex-start'
                                        }}>
                                            <Info size={24} color={ann.priority === 'Emergency' ? '#ef4444' : (ann.priority === 'High' ? '#f59e0b' : '#3b82f6')} />
                                            <div>
                                                <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: ann.priority === 'Emergency' ? '#ef4444' : (ann.priority === 'High' ? '#f59e0b' : '#3b82f6') }}>{ann.title}</h4>
                                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{ann.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* AI SYMPTOM ANALYSIS */}
                            <div className="glass-container" style={{ borderLeft: '4px solid var(--primary)', background: 'rgba(59, 130, 246, 0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', color: '#fff' }}>
                                        <Stethoscope size={18} color="var(--primary)" /> Smart Diagnosis Assistant
                                    </label>
                                    {isScanning && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}><div className="shimmer" style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }} /> AI Analyzing...</span>}
                                </div>
                                <textarea 
                                    className="input-modern"
                                    placeholder="Briefly describe your symptoms (e.g. child has fever, chest tightness)..."
                                    style={{ width: '100%', height: '80px', margin: 0, fontSize: '0.95rem' }}
                                    value={symptoms}
                                    onChange={(e) => setSymptoms(e.target.value)}
                                />
                                
                                {aiRecommendation && (
                                    <div style={{ marginTop: '20px', padding: '16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px' }}>
                                            <ShieldCheck size={16}/> MEDICAL RECOMMENDATION
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                                            {aiRecommendation.reason}
                                        </p>
                                        <div style={{ fontSize: '0.8rem', color: '#fff' }}>
                                            Suggested Expert: <strong style={{ color: '#10b981' }}>{aiRecommendation.docName}</strong> ({aiRecommendation.experience} Experience)
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="glass-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Calendar size={20} color="var(--primary)" />
                                    <span style={{ fontWeight: 'bold' }}>Schedule Date:</span>
                                </div>
                                <input 
                                    type="date" 
                                    min={today}
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="input-modern"
                                    style={{ margin: 0, padding: '10px', width: '160px' }}
                                />
                            </div>

                            <div>
                                <h4 style={{ color: '#fff', marginBottom: '16px' }}>Specialist Selection</h4>
                                <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
                                    {specialists.length > 0 ? specialists.map(doc => {
                                        const isMatched = aiRecommendation?.doctorId === doc.employeeId;
                                        return (
                                            <div 
                                                key={doc.employeeId} 
                                                className="glass-container"
                                                onClick={() => setSelectedDoctor(doc)}
                                                style={{ 
                                                    minWidth: '240px', 
                                                    cursor: 'pointer', 
                                                    border: selectedDoctor?.employeeId === doc.employeeId ? '2px solid var(--primary)' : (isMatched ? '2px dashed #10b981' : '1px solid var(--glass-border)'),
                                                    padding: '20px',
                                                    position: 'relative',
                                                    background: isMatched ? 'rgba(16, 185, 129, 0.02)' : 'transparent'
                                                }}
                                            >
                                                {isMatched && <div style={{ position: 'absolute', top: '-10px', left: '20px', background: '#10b981', color: '#fff', fontSize: '0.6rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>AI MATCH</div>}
                                                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                                    <div style={{ background: isMatched ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px' }}>
                                                        <User size={28} color={isMatched ? "#10b981" : "var(--primary)"}/>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#fff' }}>{doc.name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.specialty}</div>
                                                        <div 
                                                            style={{ fontSize: '0.8rem', color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', cursor: 'pointer', padding: '4px 8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}
                                                            onClick={(e) => { e.stopPropagation(); fetchDoctorFeedbacks(doc); }}
                                                        >
                                                            <Star size={12} fill="currentColor" /> {doc.averageRating} 
                                                            <span style={{ color: 'var(--text-muted)' }}>({doc.totalReviews} reviews)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }) : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select the primary facility to view specialists.</p>}
                                </div>
                            </div>

                            {selectedDoctor && (
                                <div className="glass-container" style={{ borderLeft: '4px solid var(--primary)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <h4 style={{ margin: 0 }}>Clinical Slots: {selectedDoctor.name}</h4>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className={apptType === 'In-Person' ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: '0.8rem', padding: '8px 16px' }} onClick={() => setApptType('In-Person')}>In-Person</button>
                                            <button className={apptType === 'Virtual' ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: '0.8rem', padding: '8px 16px' }} onClick={() => setApptType('Virtual')}>Virtual</button>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                        {availableSlots.length > 0 ? availableSlots.map(slot => (
                                            <button 
                                                key={slot} 
                                                className={selectedSlot === slot ? "btn-primary" : "btn-secondary"}
                                                style={{ padding: '12px', fontSize: '0.85rem' }}
                                                onClick={() => setSelectedSlot(slot)}
                                            >
                                                {slot.split(' - ')[0]}
                                            </button>
                                        )) : <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>No slots for selected shift.</p>}
                                    </div>

                                    {selectedSlot && (
                                        <button className="btn-primary" onClick={handleBook} disabled={isBooking} style={{ marginTop: '32px', width: '100%', padding: '16px', fontSize: '1.1rem' }}>
                                            {isBooking ? 'Completing Atlas Transaction...' : `Finalize Consultation: ${selectedSlot}`}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="glass-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px', opacity: 0.5 }}>
                            <Building2 size={64} style={{ marginBottom: '24px' }} />
                            <h5>First, Select a Facility to Begin AI Analysis.</h5>
                        </div>
                    )}
                </div>
            ) : (
                /* HISTORY VIEW */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {history.length > 0 ? history.map(appt => (
                        <div key={appt.id} className="glass-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px' }}>
                            <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                                <div style={{ textAlign: 'center', minWidth: '80px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{appt.date.split('-')[2]}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(appt.date).toLocaleString('default', { month: 'short' })}</div>
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>{appt.doctorName}</h4>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                        <Building2 size={14}/> {appt.hospitalName} | <Clock size={14}/> {appt.timeSlot}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--primary)', marginTop: '8px', opacity: 0.8 }}>
                                        Symptoms: {appt.symptoms || "Regular Checkup"}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold' }}>{appt.appointmentType}</div>
                                {appt.appointmentType === 'Virtual' && appt.status === 'active' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                        <button 
                                            className="btn-primary" 
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', animation: 'pulse 2s infinite' }}
                                            onClick={() => navigate('/consultation', { state: { roomName: appt.id, doctorName: appt.doctorName, patientName: currentUser.name } })}
                                        >
                                            <Activity size={16}/> Join Virtual Meet
                                        </button>
                                        <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 'bold' }}>No login required</span>
                                    </div>
                                )}
                                {appt.prescription ? (
                                    <button 
                                        className="btn-secondary" 
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
                                        onClick={() => setSelectedPrescription(appt.prescription)}
                                    >
                                        <FileText size={16}/> Record
                                    </button>
                                ) : (appt.status !== 'active' && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Result Pending</span>)}
                                {appt.status === 'completed' && !appt.hasFeedback && (
                                    <button 
                                        className="btn-secondary" 
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                                        onClick={() => { setSelectedFeedback(appt); setFeedbackRating(5); setFeedbackComment(""); }}
                                    >
                                        <Star size={16} fill="currentColor"/> Feedback
                                    </button>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="glass-container" style={{ textAlign: 'center', padding: '60px', opacity: 0.5 }}>
                            <h5>No clinical history found.</h5>
                        </div>
                    )}
                </div>
            )}

            {/* Clinical Record Modal */}
            {selectedPrescription && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}>
                    <div className="glass-container" style={{ maxWidth: '600px', width: '100%', padding: '40px', position: 'relative', border: '1px solid var(--primary)' }}>
                        <button style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setSelectedPrescription(null)}>
                            <X size={24} color="#fff" />
                        </button>
                        <h2 style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}><ShieldCheck size={28} color="var(--primary)"/> Atlas Health Ledger</h2>
                        
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>CLINICAL DIAGNOSIS</div>
                            <p style={{ margin: 0, fontSize: '1.4rem', color: '#fff', fontWeight: 'bold', borderLeft: '4px solid var(--primary)', paddingLeft: '16px' }}>{selectedPrescription.diagnosis}</p>
                        </div>

                        <h4 style={{ color: 'var(--primary)', marginBottom: '16px' }}>Prescribed Medication</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                            {selectedPrescription.medicines?.length > 0 ? selectedPrescription.medicines.map((m, i) => (
                                <div key={i} style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem' }}>{m.name}</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>{m.dosage} • {m.timing}</div>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--primary)', padding: '6px 14px', borderRadius: '10px', fontWeight: 'bold' }}>{m.duration}</div>
                                </div>
                            )) : (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No specific medications listed for this visit.</p>
                            )}
                        </div>

                        {selectedPrescription.notes && (
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>PHYSICIAN NOTES</div>
                                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: '1.5' }}>"{selectedPrescription.notes}"</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

        {/* Feedback Modal */}
        {selectedFeedback && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}>
                <div className="glass-container" style={{ maxWidth: '500px', width: '100%', padding: '40px', position: 'relative' }}>
                    <button style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setSelectedFeedback(null)}>
                        <X size={24} color="#fff" />
                    </button>
                    <h2 style={{ marginBottom: '8px', color: 'var(--primary)' }}>Rate your Experience</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>How was your consultation with <b>{selectedFeedback.doctorName}</b>?</p>
                    
                    <form onSubmit={handleFeedbackSubmit}>
                        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                    key={star} 
                                    size={36} 
                                    fill={star <= feedbackRating ? "#f59e0b" : "transparent"}
                                    color={star <= feedbackRating ? "#f59e0b" : "var(--glass-border)"}
                                    style={{ cursor: 'pointer', transition: '0.2s' }}
                                    onClick={() => setFeedbackRating(star)}
                                />
                            ))}
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Additional Feedback (Optional)</label>
                            <textarea 
                                className="input-modern"
                                rows="3"
                                placeholder="Share details about your visit..."
                                value={feedbackComment}
                                onChange={(e) => setFeedbackComment(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}>Submit Feedback</button>
                    </form>
                </div>
            </div>
        )}

        {/* Doctor Reviews Modal */}
        {selectedDoctorReviews && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}>
                <div className="glass-container" style={{ maxWidth: '600px', width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '40px', position: 'relative' }}>
                    <button style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setSelectedDoctorReviews(null)}>
                        <X size={24} color="#fff" />
                    </button>
                    <h2 style={{ marginBottom: '8px', color: 'var(--primary)' }}>Patient Reviews</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Here is what patients are saying about <b>{selectedDoctorReviews.name}</b></p>
                    
                    <div style={{ overflowY: 'auto', paddingRight: '12px' }}>
                        {loadingReviews ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Loading reviews...</p>
                        ) : selectedDoctorReviews.feedbacks?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {selectedDoctorReviews.feedbacks.map((f, i) => (
                                    <div key={i} style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.9rem' }}>{f.patientName}</div>
                                            <div style={{ display: 'flex', gap: '2px', color: '#f59e0b' }}>
                                                {[...Array(5)].map((_, idx) => (
                                                    <Star key={idx} size={14} fill={idx < f.rating ? "currentColor" : "transparent"} color={idx < f.rating ? "#f59e0b" : "var(--glass-border)"} />
                                                ))}
                                            </div>
                                        </div>
                                        {f.comment && <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>"{f.comment}"</p>}
                                        <div style={{ fontSize: '0.75rem', color: 'var(--glass-border)', marginTop: '12px' }}>{new Date(f.created_at).toLocaleDateString()}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                <Star size={32} style={{ opacity: 0.2, marginBottom: '12px' }} />
                                <p>No detailed reviews available yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        </div>
    );
};

export default Appointments;
