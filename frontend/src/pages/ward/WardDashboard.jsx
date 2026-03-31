import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/core.css';
import wardService from '../../services/wardService';
import authService from '../../services/authService';
import { AlertCircle, Bed, FileText, CheckCircle, Activity, Heart, Thermometer, Droplets, Bell, ChevronRight, ChevronLeft, ShieldAlert, UserMinus, MessageSquare } from 'lucide-react';

const WardDashboard = () => {
  const [currentUser] = useState(authService.getCurrentUser());
  const [dashboard, setDashboard] = useState(null);
  const [medRemarks, setMedRemarks] = useState({});
  const [remarkSeverity, setRemarkSeverity] = useState({});
  const [loading, setLoading] = useState(true);
  const [patientLogs, setPatientLogs] = useState({});
  const [generalRemarks, setGeneralRemarks] = useState({});

  const fetchDashboard = async () => {
    try {
      const res = await wardService.getDashboard();
      setDashboard(res.dashboard);
      
      if (res.dashboard && res.dashboard.patientAgendas) {
          const logsObj = {};
          for (let p of res.dashboard.patientAgendas) {
              try {
                  const logRes = await wardService.getPatientLogs(p.medicalId);
                  logsObj[p.medicalId] = logRes.logs || [];
              } catch (e) {}
          }
          setPatientLogs(logsObj);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load Ward Dashboard. You may not be assigned to a Ward Room.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchDashboard();
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !dashboard) return;
    
    // Connect to WebSockets for live alerts targeting this ward
    const ws = new WebSocket(`ws://localhost:8000/api/realtime/ws/${currentUser.identifier}`);
    
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === "NEW_ALERT" && data.alert) {
                // If the alert belongs to that ward or is global
                if (data.alert.wardId === dashboard.wardId || data.alert.wardId === "ALL") {
                    if (data.alert.alertType === "EmergencyVital") return; // filter demo 
                    setDashboard(prev => ({
                        ...prev,
                        activeAlerts: [data.alert, ...(prev.activeAlerts || [])]
                    }));
                }
            } else if (data.type === "PATIENT_DISCHARGED") {
                if (data.wardId === dashboard.wardId) {
                    fetchDashboard();
                }
            } else if (data.type === "NEW_REMARK") {
                if (data.log) {
                    setPatientLogs(prev => {
                        const existing = prev[data.log.patient_id] || [];
                        return { ...prev, [data.log.patient_id]: [data.log, ...existing] };
                    });
                }
            }
        } catch (e) {
            console.log(e);
        }
    };
    
    return () => {
        if (ws.readyState === 1) ws.close();
    };
  }, [currentUser, dashboard?.wardId]);

  const activeAlertsFiltered = dashboard?.activeAlerts?.filter(a => a.alertType !== "EmergencyVital") || [];

  const handleRemarkChange = (patientId, medName, value) => {
    setMedRemarks(prev => ({ ...prev, [`${patientId}-${medName}`]: value }));
  };

  const handleSeverityChange = (patientId, medName, value) => {
    setRemarkSeverity(prev => ({ ...prev, [`${patientId}-${medName}`]: value }));
  };

  const handleSaveRemark = async (patientId, prescId, medName) => {
    const text = medRemarks[`${patientId}-${medName}`];
    const sev = remarkSeverity[`${patientId}-${medName}`] || 'Normal';
    
    if (!text) {
        alert("Please enter a remark.");
        return;
    }

    try {
        await wardService.submitRemark({
            patientId,
            prescriptionId: prescId,
            medicineName: medName,
            remark: text,
            severity: sev
        });
        alert(`Remark saved! ${sev === 'Serious' ? 'A live alert has been dispatched to all active doctors.' : ''}`);
        
        // Clear input
        setMedRemarks(prev => ({ ...prev, [`${patientId}-${medName}`]: '' }));
    } catch (err) {
        alert("Failed to save remark. " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDismissAlert = (alertId) => {
    setDashboard(prev => ({
        ...prev,
        activeAlerts: prev.activeAlerts.filter(a => a.id !== alertId)
    }));
  };

  const handleTriggerDemo = async (patientId) => {
    try {
        await wardService.triggerIotAlert({
            wardId: dashboard.wardId,
            patientId: patientId,
            metric: "Blood Oxygen (SpO2)",
            value: 85,
            threshold: 90
        });
        alert(`Demo IoT alarm sent for Patient ${patientId}`);
    } catch (e) {
        console.error(e);
        alert("Failed to trigger demo alert.");
    }
  };

  const handleDischarge = async (patientId) => {
      if (!window.confirm("Are you sure you want to discharge this patient? This will free up the bed immediately.")) return;
      try {
          await wardService.dischargePatient(patientId);
          fetchDashboard();
      } catch (err) {
          alert("Failed to discharge patient: " + err.message);
      }
  };

  const handleSaveGeneralRemark = async (patientId) => {
      const txt = generalRemarks[patientId];
      if (!txt) return;
      try {
          await axios.post(`/api/ward/patients/${patientId}/logs`, { remark: txt }, {
              headers: { Authorization: `Bearer ${authService.getToken()}` }
          });
          setGeneralRemarks(prev => ({ ...prev, [patientId]: '' }));
      } catch (e) {
          alert("Failed to save patient log");
      }
  };

  if (loading) return <div style={{ padding: '40px', color: '#fff' }}>Loading Ward Room Dashboard...</div>;
  if (!dashboard) return <div style={{ padding: '40px', color: '#fff' }}>Ward Room configuration missing for this profile.</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
        
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
            <h2 style={{ fontSize: '2.5rem', color: 'var(--primary)', margin: '0 0 16px' }}>{dashboard.wardName} ({dashboard.wardId})</h2>
            <p style={{ color: 'var(--text-muted)' }}>
                Welcome {currentUser?.name}. You are assigned to this Ward Room as {currentUser?.role}. Focus on continuous care and realtime symptom logging.
            </p>
        </div>
        <div className="glass-container" style={{ padding: '16px 24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Bed size={32} color="var(--primary)" />
            <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bed Capacity</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{dashboard.patientAgendas?.length || 0} / {dashboard.capacity || 3}</div>
            </div>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        
        {/* Main Tracking Column */}
        <div style={{ flex: 3, minWidth: '600px' }}>
          <h3 style={{ color: '#fff', fontSize: '1.4rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', marginBottom: '24px' }}>
              Assigned Patients & Medication Agendas
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {dashboard.patientAgendas?.length === 0 && (
                <div className="glass-container" style={{ textAlign: 'center', padding: '40px' }}>
                    <Bed size={48} color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: '16px' }} />
                    <h4 style={{ color: 'var(--text-muted)' }}>All Beds are Currently Empty</h4>
                </div>
            )}
            {dashboard.patientAgendas?.map((patient, index) => (
              <div key={`${patient.medicalId}-${patient.bedId}-${index}`} className="glass-container" style={{ borderLeft: '4px solid var(--primary)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--primary)', color: '#fff', padding: '8px 24px', borderBottomLeftRadius: '16px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {patient.bedId}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Active Patient</div>
                    <strong style={{ color: '#fff', fontSize: '1.5rem' }}>{patient.name}</strong>
                    <span style={{ color: 'var(--primary)', display: 'block', fontWeight: 'bold' }}>ID: {patient.medicalId}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                          className="btn-secondary" 
                          style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.5)', fontSize: '0.85rem' }}
                          onClick={() => handleDischarge(patient.medicalId)}
                      >
                          <UserMinus size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                          Discharge
                      </button>
                      <button 
                          className="btn-secondary" 
                          style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.5)', fontSize: '0.85rem' }}
                          onClick={() => handleTriggerDemo(patient.medicalId)}
                      >
                          <Activity size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                          Trigger Demo Alert
                      </button>
                  </div>
                </div>
                
                {patient.activePrescription ? (
                   <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={16}/> PRESCRIBED MEDICATIONS
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 100px 150px 100px', gap: '16px', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 'bold', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <div>Medicine</div>
                            <div>Dosage</div>
                            <div>Timing Schedule</div>
                            <div>Duration</div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                            {patient.activePrescription.medicines.map((med, idx) => (
                                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 100px 150px 100px', gap: '16px', alignItems: 'center', color: '#fff', marginBottom: '16px' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{med.name}</div>
                                        <div>{med.dosage}</div>
                                        <div>{med.timing}</div>
                                        <div style={{ color: 'var(--test-muted)' }}>{med.duration}</div>
                                    </div>
                                    
                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Severity</label>
                                            <select 
                                                className="input-modern" 
                                                style={{ width: '120px', fontSize: '0.85rem', padding: '8px' }}
                                                value={remarkSeverity[`${patient.medicalId}-${med.name}`] || 'Normal'}
                                                onChange={(e) => handleSeverityChange(patient.medicalId, med.name, e.target.value)}
                                            >
                                                <option value="Normal">🟢 Normal</option>
                                                <option value="Minor">🟠 Minor Effect</option>
                                                <option value="Serious">🔴 Serious Alert</option>
                                            </select>
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Clinical Observation / Remark</label>
                                                <input 
                                                    type="text"
                                                    className="input-modern"
                                                    style={{ width: '100%' }}
                                                    placeholder="Log behavioral or medical effects (e.g., patient feeling dizzy after taking dose)"
                                                    value={medRemarks[`${patient.medicalId}-${med.name}`] || ''}
                                                    onChange={(e) => handleRemarkChange(patient.medicalId, med.name, e.target.value)}
                                                />
                                            </div>
                                            <button 
                                                className={remarkSeverity[`${patient.medicalId}-${med.name}`] === 'Serious' ? "btn-secondary" : "btn-primary"} 
                                                style={{ padding: '12px 24px', height: 'fit-content', background: remarkSeverity[`${patient.medicalId}-${med.name}`] === 'Serious' ? '#ef4444' : 'var(--primary)', color: '#fff', border: 'none' }}
                                                onClick={() => handleSaveRemark(patient.medicalId, patient.activePrescription.id, med.name)}
                                            >
                                                Submit Remark
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                   </div>
                ) : (
                  <div style={{ color: '#9ca3af', fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>Patient has no active prescriptions assigned to this ward bed.</div>
                )}
                
                <div style={{ marginTop: '24px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MessageSquare size={16}/> PATIENT PROGRESS & REMARKS LOG
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                        <textarea 
                            className="input-modern"
                            style={{ width: '100%', minHeight: '80px', padding: '16px', resize: 'vertical', fontSize: '1rem' }}
                            placeholder="Add a new observation, symptom update, or general remark about patient progress..."
                            value={generalRemarks[patient.medicalId] || ''}
                            onChange={(e) => setGeneralRemarks(prev => ({...prev, [patient.medicalId]: e.target.value}))}
                        />
                        <button 
                            className="btn-primary"
                            style={{ padding: '14px 40px', alignSelf: 'flex-end', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                            onClick={() => handleSaveGeneralRemark(patient.medicalId)}
                        >
                            Save Log
                        </button>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', paddingRight: '8px' }}>
                        {(patientLogs[patient.medicalId] || []).map(log => (
                            <div key={log.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>By: {log.ward_staff_id}</span>
                                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                                </div>
                                <div style={{ color: '#fff', lineHeight: '1.4' }}>{log.remark}</div>
                            </div>
                        ))}
                        {!(patientLogs[patient.medicalId] || []).length && (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No remarks logged for this patient yet.</div>
                        )}
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Hardware / Event Sidebar */}
        <div style={{ flex: 1, minWidth: '350px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '40px' }}>
                <div style={{ 
                    // Dynamic coloring based on alert existence
                    background: (activeAlertsFiltered.length > 0) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                    border: (activeAlertsFiltered.length > 0) ? '1px solid #ef4444' : '1px solid #10b981',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: (activeAlertsFiltered.length > 0) ? '0 0 20px rgba(239, 68, 68, 0.2)' : 'none',
                    transition: 'all 0.3s ease'
                }}>
                    <h3 style={{ 
                        color: (activeAlertsFiltered.length > 0) ? '#ef4444' : '#10b981', 
                        margin: '0 0 24px',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        fontSize: '1.2rem'
                    }}>
                        {(activeAlertsFiltered.length > 0) ? <AlertCircle className="pulse-animation" /> : <CheckCircle />}
                        {(activeAlertsFiltered.length > 0) ? 'ACTIVE WARD ALERTS' : 'WARD STATUS: SECURE'}
                    </h3>
                    
                    {activeAlertsFiltered.length === 0 ? (
                        <p style={{ color: '#6ee7b7', margin: 0, lineHeight: '1.5' }}>
                            All connected IoT wearables report normal operational vitals. No emergency events recorded.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {activeAlertsFiltered.map(alert => (
                            <div key={alert.id} style={{ background: 'rgba(0,0,0,0.6)', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #ef4444' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <div style={{ color: '#fca5a5', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                                        <Activity size={14}/> {alert.alertType.toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(alert.created_at).toLocaleTimeString()}</div>
                                </div>
                                
                                <div style={{ color: '#fff', margin: '12px 0 16px', fontSize: '1.05rem', lineHeight: '1.4' }}>
                                {alert.message}
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Patient ID: {alert.patientId}</div>
                                    <button 
                                        style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                                        onClick={() => handleDismissAlert(alert.id)}
                                    >
                                        Acknowledge
                                    </button>
                                </div>
                            </div>
                        ))}
                        </div>
                    )}
                </div>


            </div>
        </div>

      </div>
    </div>
  );
};

export default WardDashboard;
