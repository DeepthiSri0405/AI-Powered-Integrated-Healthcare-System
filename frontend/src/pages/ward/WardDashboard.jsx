import React, { useState } from 'react';
import '../../styles/core.css';

const WardDashboard = () => {
  // Mock Dashboard State pulled from GET /api/ward/dashboard
  const [dashboard] = useState({
    wardId: "WARD-ICU-1",
    shiftNotes: "System Init: Ward terminal deployed. Patient in Bed 2 needs BP check every 2 hours.",
    patientAgendas: [
      {
        medicalId: "M102030",
        name: "John Smith",
        activePrescription: {
          id: "P847291",
          medicines: [
            { name: "Amoxicillin", dosage: "500mg", timing: "Morning, Night" },
            { name: "Lisinopril", dosage: "10mg", timing: "Morning" }
          ]
        }
      }
    ],
    activeIotAlerts: [
      {
        id: "ALRT-99",
        patientId: "M102030",
        metric: "Pulse Rate",
        value: 125,
        threshold: 100,
        status: "Active"
      }
    ]
  });

  const [medRemarks, setMedRemarks] = useState({});

  const handleRemarkChange = (patientId, medName, value) => {
    setMedRemarks(prev => ({
      ...prev,
      [`${patientId}-${medName}`]: value
    }));
  };

  const handleSaveRemark = (patientId, medName) => {
    alert(`Remarks for ${medName} saved directly to Patient profile!`);
    // POST /api/ward/patient/remarks
  };

  const handleAlertDoctor = (patientId, medicineName) => {
    // POST /api/ward/alert-doctor
    alert(`EMERGENCY: Email Alert dispatched directly to Doctor for Medication: ${medicineName}. Wait for updated prescription!`);
  };

  const handleResolveIot = (alertId) => {
    alert(`Responsive Action Logged. Hardware Alert ${alertId} resolved.`);
    // Would typically send a POST/PUT to backend to mark alert Resolved
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '24px' }}>
      
      {/* Main Ward Tracking Column */}
      <div style={{ flex: 3 }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--primary)', margin: '0 0 16px' }}>Terminal: {dashboard.wardId}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
          Ward Operations Center. Follow the prescribed medication agenda and log behavioral or med-effects directly under each patient's active prescription.
        </p>

        {/* Patient Agendas Component */}
        <h3 style={{ color: '#fff', fontSize: '1.4rem' }}>Assigned Patients & Medication Agenda</h3>
        <div style={{ display: 'grid', gap: '24px', marginTop: '16px' }}>
          {dashboard.patientAgendas.map(patient => (
            <div key={patient.medicalId} className="glass-container">
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px' }}>
                <strong style={{ color: '#fff', fontSize: '1.2rem' }}>{patient.name}</strong>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>ID: {patient.medicalId}</span>
              </div>
              
              {patient.activePrescription ? (
                 <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-muted)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--primary)' }}>
                      <th style={{ padding: '8px' }}>Medicine</th>
                      <th style={{ padding: '8px' }}>Dosage</th>
                      <th style={{ padding: '8px' }}>Timing Schedule</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.activePrescription.medicines.map((med, idx) => (
                      <React.Fragment key={idx}>
                        <tr>
                          <td style={{ padding: '12px 8px 4px 8px', color: '#fff' }}><strong>{med.name}</strong></td>
                          <td style={{ padding: '12px 8px 4px 8px' }}>{med.dosage}</td>
                          <td style={{ padding: '12px 8px 4px 8px' }}>{med.timing}</td>
                          <td style={{ padding: '12px 8px 4px 8px', textAlign: 'right' }}>
                            <button 
                              className="btn-secondary" 
                              style={{ background: '#ef4444', color: '#fff', padding: '6px 12px', fontSize: '0.8rem' }}
                              onClick={() => handleAlertDoctor(patient.medicalId, med.name)}
                            >
                              🚨 Alert Doctor (Reaction)
                            </button>
                          </td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <td colSpan="4" style={{ padding: '0 8px 16px 8px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: '8px' }}>
                              <textarea 
                                className="input-modern"
                                style={{ flex: 1, minHeight: '40px', background: 'rgba(0,0,0,0.2)', padding: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                                placeholder="Add 2-line space or remarks after medication (e.g. Is it fine? Any abnormality?)..."
                                value={medRemarks[`${patient.medicalId}-${med.name}`] || ''}
                                onChange={(e) => handleRemarkChange(patient.medicalId, med.name, e.target.value)}
                              />
                              <button 
                                className="btn-secondary" 
                                style={{ padding: '8px 16px', height: 'fit-content' }}
                                onClick={() => handleSaveRemark(patient.medicalId, med.name)}
                              >
                                Save Remark
                              </button>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                 </table>
              ) : (
                <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>No active prescriptions to administer.</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* IoT Sidebar Column */}
      <div style={{ flex: 1, minWidth: '300px' }}>
        <div style={{ 
          background: dashboard.activeIotAlerts.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
          border: dashboard.activeIotAlerts.length > 0 ? '1px solid #ef4444' : '1px solid #10b981',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <h3 style={{ 
            color: dashboard.activeIotAlerts.length > 0 ? '#ef4444' : '#10b981', 
            margin: '0 0 16px',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            {dashboard.activeIotAlerts.length > 0 ? '⚠️ IoT HARDWARE ALERTS' : '✅ Sensor Stability'}
          </h3>
          
          {dashboard.activeIotAlerts.length === 0 ? (
            <p style={{ color: '#6ee7b7', margin: 0 }}>All connected IoT wearables report normal operational vitals. No active heartbeat spikes.</p>
          ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               {dashboard.activeIotAlerts.map(alert => (
                 <div key={alert.id} style={{ background: 'rgba(0,0,0,0.5)', padding: '16px', borderRadius: '8px', animation: "pulse 1.5s infinite" }}>
                    <div style={{ color: '#fca5a5', fontWeight: 'bold' }}>Patient ID: {alert.patientId}</div>
                    <div style={{ color: '#fff', margin: '8px 0', fontSize: '1.2rem' }}>
                      {alert.metric}: <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{alert.value}</span> (Baseline: {alert.threshold})
                    </div>
                    <button 
                      style={{ background: '#374151', color: '#d1d5db', border: 'none', padding: '8px', width: '100%', borderRadius: '4px', cursor: 'pointer' }}
                      onClick={() => handleResolveIot(alert.id)}
                    >
                      Acknowledge & Treat
                    </button>
                 </div>
               ))}
               <style>{`
                 @keyframes pulse {
                   0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                   70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                   100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                 }
               `}</style>
             </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default WardDashboard;
