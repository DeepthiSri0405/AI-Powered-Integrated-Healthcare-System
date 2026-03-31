import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Clock, AlertCircle, History, User, Microscope, X, ShieldCheck } from 'lucide-react';
import VirtualConsultation from '../common/VirtualConsultation';
import '../../styles/core.css';
import doctorService from '../../services/doctorService';
import authService from '../../services/authService';
import labService from '../../services/labService';

const Prescription = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const patientId = location.state?.patientId || "DEMO777";
  const appointmentId = location.state?.appointmentId;
  const appointmentType = location.state?.appointmentType || "In-Person";
  const roomName = location.state?.roomName;
  const doctorName = location.state?.doctorName;
  const patientName = `Patient ${patientId}`;
  const currentUser = authService.getCurrentUser();
  const isVirtual = appointmentType === 'Virtual';

  const editPrescription = location.state?.editPrescription;
  const isEditing = !!editPrescription;

  const [diagnosis, setDiagnosis] = useState(editPrescription?.diagnosis || '');
  const [medicines, setMedicines] = useState(editPrescription?.medicines || []);
  const [labTests, setLabTests] = useState(editPrescription?.labTests ? editPrescription.labTests.join(', ') : '');
  const [followUpDays, setFollowUpDays] = useState(editPrescription?.followUpDays || 0);
  const [admissionRequired, setAdmissionRequired] = useState(editPrescription?.admission_required || false);
  const [totalBill, setTotalBill] = useState(editPrescription?.total_bill || '');
  const [history, setHistory] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedPastPrescription, setSelectedPastPrescription] = useState(null);

  // New Medicine Details State
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medTiming, setMedTiming] = useState('Morning, Night');
  const [medDuration, setMedDuration] = useState('');
  const [medBrief, setMedBrief] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [res, labRes] = await Promise.all([
            doctorService.getPatientPrescriptions(patientId),
            labService.getPatientReports(patientId)
        ]);
        setHistory(res.prescriptions || []);
        setLabReports(labRes.reports || []);
      } catch (err) {
        console.error("History load failed", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [patientId]);

  // Auto-calculate bill directly based on medicines and lab tests added
  useEffect(() => {
     let baseConsultation = 200.0;
     let labCost = labTests.split(',').map(t => t.trim()).filter(Boolean).length * 150.0;
     let medCost = medicines.reduce((acc, med) => acc + (50.0 * (med.quantity || 1)), 0);
     setTotalBill((baseConsultation + labCost + medCost).toFixed(2));
  }, [medicines, labTests]);


  const handleAddMedicine = () => {
    if (!medName || !medDosage || !medDuration) return;
    
    setMedicines([...medicines, { 
      name: medName, 
      dosage: medDosage, 
      timing: medTiming, 
      duration: medDuration,
      shortBrief: medBrief,
      quantity: 1 // Default for demo
    }]);

    setMedName(''); setMedDosage(''); setMedDuration(''); setMedBrief('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        patientId,
        doctorId: currentUser.identifier,
        appointmentId, // Including appointment reference
        hospitalId: "HOSP001", // Assume default for demo or fetch from doctor profile
        diagnosis,
        medicines,
        labTests: labTests.split(',').map(t => t.trim()).filter(Boolean),
        followUpDays: parseInt(followUpDays) || 0,
        admission_required: admissionRequired,
        total_bill: parseFloat(totalBill) || 0,
        notes: `Consultation for ${diagnosis}`,
        date: new Date().toISOString().split('T')[0], // Simplified date for historical matching
        created_at: new Date().toISOString()
      };

      if (isEditing) {
        await doctorService.updatePrescription(editPrescription.id, payload);
        alert("Prescription Updated Successfully!");
      } else {
        await doctorService.addPrescription(payload);
        alert("Prescription Saved & Inventory Updated! Alert sent to Admin if stock is low.");
      }
      navigate('/doctor/dashboard');
    } catch (err) {
      console.error("Submission failed", err);
      alert("Error saving prescription.");
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
           <h2 style={{ fontSize: '2.5rem', color: 'var(--accent)', margin: 0 }}>Consultation Portal</h2>
           <p style={{ color: 'var(--text-muted)' }}>{isEditing ? 'Editing' : 'Writing'} e-Prescription for Patient <b>{patientId}</b></p>
        </div>
        <div className="glass-container" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <User size={24} color="var(--accent)" />
            <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Patient ID</div>
                <div style={{ fontWeight: 'bold' }}>{patientId}</div>
            </div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: isVirtual ? '1fr 1fr' : '2fr 1fr', gap: '32px', alignItems: 'flex-start' }}>
        
        {/* Left: Virtual Call (If applicable) */}
        {isVirtual && (
            <div style={{ height: 'calc(100vh - 150px)', overflow: 'hidden' }}>
                <div style={{ border: '2px solid var(--primary)', borderRadius: '16px', overflow: 'hidden', height: '100%', boxShadow: '0 0 20px rgba(59, 130, 246, 0.15)' }}>
                    <VirtualConsultation 
                        roomName={roomName}
                        doctorName={doctorName}
                        patientName={patientName}
                        embedded={true}
                    />
                </div>
            </div>
        )}

        {/* Center/Right: Form */}
        <div style={{ height: isVirtual ? 'calc(100vh - 150px)' : 'auto', overflowY: isVirtual ? 'auto' : 'visible', paddingRight: isVirtual ? '12px' : '0' }}>
          <div className="glass-container" style={{ padding: '32px' }}>
            <form onSubmit={handleSubmit}>
              
              <div style={{ marginBottom: '32px' }}>
                <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}>Clinical Diagnosis & Observation</label>
                <textarea 
                  className="input-modern"
                  rows="3"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Summarize the patient symptoms and your diagnosis..."
                  style={{ fontSize: '1rem' }}
                />
              </div>

              <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '16px', marginBottom: '32px' }}>
                <h4 style={{ margin: '0 0 20px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} /> Dispense Medications
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <input type="text" placeholder="Medicine Name (e.g. Paracetamol)" className="input-modern" value={medName} onChange={(e) => setMedName(e.target.value)} />
                  <input type="text" placeholder="Dosage (500mg)" className="input-modern" value={medDosage} onChange={(e) => setMedDosage(e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <select className="input-modern" value={medTiming} onChange={(e) => setMedTiming(e.target.value)}>
                    <option>Morning</option>
                    <option>Morning, Night</option>
                    <option>Morning, Afternoon, Night</option>
                    <option>Night</option>
                  </select>
                  <input type="text" placeholder="Duration (5 Days)" className="input-modern" value={medDuration} onChange={(e) => setMedDuration(e.target.value)} />
                </div>

                <input 
                  type="text" 
                  placeholder="Instruction (e.g. For pain relief, take after eating)" 
                  className="input-modern" 
                  value={medBrief} 
                  onChange={(e) => setMedBrief(e.target.value)} 
                  style={{ marginBottom: '16px' }}
                />
                
                <button type="button" onClick={handleAddMedicine} className="btn-secondary" style={{ width: '100%', fontWeight: '600' }}>+ Add to Prescription</button>
              </div>

              {medicines.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Medication List</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {medicines.map((m, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(59, 130, 246, 0.05)', padding: '16px 20px', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{m.name} <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.9rem' }}>({m.dosage})</span></div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>{m.timing} • {m.duration}</div>
                          {m.shortBrief && <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} /> {m.shortBrief}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div>
                  <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}>Recommended Lab Tests (Comma separated)</label>
                  <input 
                    className="input-modern"
                    type="text"
                    value={labTests}
                    onChange={(e) => setLabTests(e.target.value)}
                    placeholder="e.g. CBC, Lipid Profile, X-Ray"
                  />
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}>Follow-up (Days)</label>
                  <input 
                    className="input-modern"
                    type="number"
                    min="0"
                    value={followUpDays}
                    onChange={(e) => setFollowUpDays(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}>Total Bill (Estimated) ($)</label>
                  <input 
                    className="input-modern"
                    type="number"
                    value={totalBill}
                    readOnly
                    placeholder="0.00"
                    style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--accent)', fontWeight: 'bold', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              {/* Admission Settings */}
              <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <input 
                      type="checkbox" 
                      id="admissionToggle" 
                      checked={admissionRequired} 
                      onChange={(e) => setAdmissionRequired(e.target.checked)}
                      style={{ width: '20px', height: '20px', accentColor: '#ef4444' }}
                  />
                  <div>
                      <label htmlFor="admissionToggle" style={{ display: 'block', fontWeight: 'bold', color: '#fca5a5', cursor: 'pointer' }}>Require Hospital Admission</label>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>If checked, this will immediately send a Ward Admission Request to the patient.</span>
                  </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 2, padding: '16px' }}>{isVirtual ? (isEditing ? "Update & End Call" : "Finalize & End Call") : (isEditing ? "Update Prescription" : "Finalize Prescription")}</button>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => navigate(-1)}>Cancel</button>
              </div>
            </form>
          </div>

          {/* Render History sequentially underneath if Virtual so we don't need a third column */}
          {isVirtual && (
              <div className="glass-container" style={{ marginTop: '24px', padding: '24px' }}>
                  <h4 style={{ margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                    <History size={20} color="var(--accent)" /> Detailed Medical History
                  </h4>
                  {loadingHistory ? <p>Loading timeline...</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px'}}>
                        {history.length > 0 && history.map((h, i) => (
                            <div key={`hist-${i}`} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 'bold', marginBottom: '8px' }}>{new Date(h.created_at).toLocaleDateString()}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontStyle: 'italic' }}>Cause</div>
                                <div style={{ fontWeight: '600', marginBottom: '8px' }}>{h.diagnosis}</div>
                                
                                {h.medicines?.length > 0 && (
                                    <>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontStyle: 'italic' }}>Medications</div>
                                        <div style={{ fontSize: '0.85rem', marginBottom: '12px' }}>{h.medicines.map(m => m.name).join(', ')}</div>
                                    </>
                                )}
                                
                                <button 
                                    type="button" 
                                    className="btn-secondary" 
                                    style={{ padding: '6px 16px', fontSize: '0.75rem' }}
                                    onClick={() => setSelectedPastPrescription(h)}
                                >
                                    View Full Record
                                </button>
                            </div>
                        ))}
                        {labReports.length > 0 && labReports.map((lr, i) => (
                            <div key={`lab-${i}`} style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '12px', borderLeft: '4px solid #f59e0b', borderRight: '1px solid var(--glass-border)', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Microscope size={12}/> Lab Report • {new Date(lr.created_at).toLocaleDateString()}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {lr.structuredResults?.map((r, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                            <span>{r.name}</span>
                                            <span style={{ color: r.status !== 'Normal' ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{r.observedValue} ({r.generalValue})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {history.length === 0 && labReports.length === 0 && (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}><p>No previous history.</p></div>
                        )}
                    </div>
                  )}
              </div>
          )}
        </div>

        {/* Right: History Timeline (Only show side-by-side if NOT virtual) */}
        {!isVirtual && (
            <div style={{ flex: 1, minWidth: '400px' }}>
              <div className="glass-container" style={{ padding: '24px', position: 'sticky', top: '40px' }}>
                <h4 style={{ margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                  <History size={20} color="var(--accent)" /> Medical History
                </h4>
                
                {loadingHistory ? <p>Loading timeline...</p> : history.length > 0 || labReports.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px' }}>
                    {history.map((h, i) => (
                      <div key={`hright-${i}`} style={{ borderLeft: '2px solid var(--glass-border)', paddingLeft: '20px', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-7px', top: '0', width: '12px', height: '12px', background: 'var(--accent)', borderRadius: '50%' }}></div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 'bold', marginBottom: '4px' }}>{new Date(h.created_at).toLocaleDateString()}</div>
                        
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '12px', marginTop: '8px' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontStyle: 'italic' }}>Cause / Diagnosis</div>
                            <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>{h.diagnosis}</div>
                            
                            {h.medicines?.length > 0 && (
                                <>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontStyle: 'italic' }}>Medication Taken</div>
                                    <div style={{ fontSize: '0.85rem', color: '#fff', lineHeight: '1.4' }}>
                                        {h.medicines.map(m => m.name).join(', ')}
                                    </div>
                                </>
                            )}
                            
                            <button 
                                type="button" 
                                className="btn-secondary" 
                                style={{ padding: '4px 12px', fontSize: '0.75rem', marginTop: '12px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                                onClick={() => setSelectedPastPrescription(h)}
                            >
                                <FileText size={12}/> View Full Record
                            </button>
                        </div>
                      </div>
                    ))}
                    {labReports.map((lr, i) => (
                      <div key={`lright-${i}`} style={{ borderLeft: '2px solid #f59e0b', paddingLeft: '20px', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-7px', top: '0', width: '12px', height: '12px', background: '#f59e0b', borderRadius: '50%' }}></div>
                        <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Microscope size={12} /> {new Date(lr.created_at).toLocaleDateString()}
                        </div>
                        <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>Quantitative Lab Results</div>
                        <div style={{ display: 'table', width: '100%', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', padding: '8px' }}>
                            {lr.structuredResults?.map((r, idx) => (
                                <div key={idx} style={{ display: 'table-row', color: 'var(--text-muted)' }}>
                                    <span style={{ display: 'table-cell', padding: '4px' }}>{r.name}</span>
                                    <span style={{ display: 'table-cell', padding: '4px', textAlign: 'right', color: r.status !== 'Normal' ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{r.observedValue}</span>
                                </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <Clock size={32} style={{ opacity: 0.2, marginBottom: '12px' }} />
                    <p>No previous historical records found for this patient.</p>
                  </div>
                )}
              </div>
            </div>
        )}

      </div>

      {/* Full Record Modal fetched from Citizen Med ID History */}
      {selectedPastPrescription && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}>
            <div className="glass-container" style={{ maxWidth: '600px', width: '100%', padding: '40px', position: 'relative', border: '1px solid var(--accent)', maxHeight: '90vh', overflowY: 'auto' }}>
                <button type="button" style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setSelectedPastPrescription(null)}>
                    <X size={24} color="#fff" />
                </button>
                <h2 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ShieldCheck size={28} color="var(--accent)"/> Clinical Report
                </h2>
                <div style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.85rem' }}>
                    Patient Medical ID: <b>{selectedPastPrescription.patientId || patientId}</b> | Issued: {selectedPastPrescription.created_at ? new Date(selectedPastPrescription.created_at).toLocaleDateString() : 'N/A'}
                </div>
                
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>CLINICAL DIAGNOSIS</div>
                    <p style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 'bold', borderLeft: '4px solid var(--accent)', paddingLeft: '16px' }}>{selectedPastPrescription.diagnosis}</p>
                </div>

                <h4 style={{ color: 'var(--accent)', marginBottom: '16px' }}>Prescribed Medication</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                    {selectedPastPrescription.medicines?.length > 0 ? selectedPastPrescription.medicines.map((m, i) => (
                        <div key={i} style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem' }}>{m.name}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>{m.dosage} • {m.timing}</div>
                            </div>
                            <div style={{ fontSize: '0.8rem', background: 'var(--accent-muted)', color: 'var(--accent)', padding: '6px 14px', borderRadius: '10px', fontWeight: 'bold' }}>{m.duration}</div>
                        </div>
                    )) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No specific medications listed for this visit.</p>
                    )}
                </div>

                {selectedPastPrescription.notes && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>PHYSICIAN NOTES</div>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: '1.5' }}>"{selectedPastPrescription.notes}"</p>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default Prescription;
