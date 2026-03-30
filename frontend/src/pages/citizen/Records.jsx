import React, { useState, useEffect } from 'react';
import { FileText, Clock, AlertCircle, Microscope } from 'lucide-react';
import '../../styles/core.css';
import authService from '../../services/authService';
import doctorService from '../../services/doctorService';
import labService from '../../services/labService';

const Records = () => {
  const [currentUser] = useState(authService.getCurrentUser());
  const [records, setRecords] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('prescriptions');

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const [res, labRes] = await Promise.all([
            doctorService.getPatientAppointments(currentUser.identifier),
            labService.getPatientReports(currentUser.identifier)
        ]);
        
        // Filter out appointments that don't have a linked prescription
        const completeRecords = (res.appointments || []).filter(a => a.prescription);
        setRecords(completeRecords);
        setLabReports(labRes.reports || []);
      } catch (err) {
        console.error("Failed to fetch records:", err);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) {
      fetchRecords();
    }
  }, [currentUser]);

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2.5rem', color: 'var(--accent)', margin: '0 0 8px 0' }}>Clinical Dossier</h2>
        <p style={{ color: 'var(--text-muted)' }}>Complete historical transcript of your digital consultations, diagnoses, and lab requisitions.</p>
      </header>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--glass-border)' }}>
          <button 
              className={activeTab === 'prescriptions' ? 'nav-tab active-tab' : 'nav-tab'} 
              onClick={() => setActiveTab('prescriptions')}
              style={{ padding: '12px 24px', background: 'none', border: 'none', color: activeTab === 'prescriptions' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'prescriptions' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
              Clinical Prescriptions
          </button>
          <button 
              className={activeTab === 'labs' ? 'nav-tab active-tab' : 'nav-tab'} 
              onClick={() => setActiveTab('labs')}
              style={{ padding: '12px 24px', background: 'none', border: 'none', color: activeTab === 'labs' ? '#f59e0b' : 'var(--text-muted)', borderBottom: activeTab === 'labs' ? '2px solid #f59e0b' : 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
              Lab Results
          </button>
      </div>

      {loading ? (
        <p>Retrieving secure health records...</p>
      ) : (
        <>
        {activeTab === 'prescriptions' && (
            records.length > 0 ? (
            records.map((record) => (
          <div key={record.id} className="glass-container" style={{ marginBottom: '32px', borderLeft: '4px solid var(--primary)' }}>
            
            {/* Header: Doctor & Date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px', marginBottom: '24px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} color="var(--primary)" /> 
                  Consultation on {new Date(record.date).toLocaleDateString()}
                </h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <strong>Attending Physician:</strong> {record.doctorId || 'Specialist'} | <strong>Ref ID:</strong> {record.prescription.id}
                  </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px 16px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  Digitally Signed
                </span>
              </div>
            </div>

            {/* Diagnosis Notes */}
            <div style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px' }}>
              <strong style={{ color: 'var(--accent)', display: 'block', marginBottom: '8px' }}>Clinical Diagnosis & Observations:</strong>
              <div style={{ fontSize: '1.05rem', lineHeight: '1.5', color: '#e2e8f0' }}>
                {record.prescription.diagnosis || "No specific diagnosis provided."}
              </div>
              {record.prescription.notes && (
                <div style={{ marginTop: '12px', fontSize: '0.95rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Doctor's Notes: "{record.prescription.notes}"
                </div>
              )}
            </div>

            {/* Prescribed Medications */}
            {record.prescription.medicines && record.prescription.medicines.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <strong style={{ color: '#fff', fontSize: '1.1rem', display: 'block', marginBottom: '16px' }}>Dispensed Medications</strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {record.prescription.medicines.map((med, idx) => (
                    <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="pill-container">
                        <h4 style={{ margin: '0 0 8px', color: 'var(--primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          💊 {med.name}
                          {med.shortBrief && <span style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem' }}>Info</span>}
                        </h4>
                        
                        {med.shortBrief && (
                          <div className="popup-tooltip">
                            <strong style={{ display: 'block', marginBottom: '4px', color: '#fff' }}>Medicine Notes</strong>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                              {med.shortBrief}
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                        <div><strong>Dosage:</strong><br/>{med.dosage}</div>
                        <div><strong>Timing:</strong><br/>{med.timing}</div>
                        <div style={{ gridColumn: '1 / -1' }}><strong>Duration:</strong> {med.duration}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Required Lab Tests */}
            {record.prescription.labTests && record.prescription.labTests.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <strong style={{ color: '#fff', fontSize: '1.1rem', display: 'block', marginBottom: '12px' }}>Requested Laboratory Diagnostics</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {record.prescription.labTests.map((test, index) => (
                    <div key={index} style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd', padding: '12px 20px', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.3)', fontWeight: '500' }}>
                      🔬 {test}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                   <AlertCircle size={14} /> Please visit the "Lab Tests" portal to designate a diagnostic center for these requisitions.
                </div>
              </div>
            )}

            {/* Follow up */}
            {record.prescription.followUpDays > 0 && (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent)', padding: '16px', borderRadius: '8px', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Clock size={20} />
                <div>
                   <strong style={{ display: 'block' }}>Mandatory Follow-Up Requirement</strong>
                   Your physician requests a follow-up assessment in {record.prescription.followUpDays} days. A booking reminder will be dispatched automatically.
                </div>
              </div>
            )}

          </div>
        ))
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', opacity: 0.5, border: '2px dashed var(--glass-border)', borderRadius: '16px' }}>
           <FileText size={48} style={{ margin: '0 auto 16px' }} />
           <h3>No Certified Records Found</h3>
           <p>Your finalized diagnostic records and e-prescriptions will index here post-consultation.</p>
        </div>
        )
        )}
        
        {activeTab === 'labs' && (
            labReports.length > 0 ? (
                labReports.map((report) => (
               <div key={report.id} className="glass-container" style={{ marginBottom: '32px', borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px', marginBottom: '24px' }}>
                        <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Microscope size={20} color="#f59e0b" />
                                Quantitative Lab Requisition
                            </h3>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                <strong>Date Published:</strong> {new Date(report.created_at).toLocaleString()} | <strong>Operator ID:</strong> {report.labOperatorId}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '6px 16px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                Verified by Digital Lab
                            </span>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', marginBottom: '24px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    <th style={{ padding: '12px' }}>Test Component</th>
                                    <th style={{ padding: '12px' }}>General Reference Range</th>
                                    <th style={{ padding: '12px' }}>Observed Result</th>
                                    <th style={{ padding: '12px' }}>Clinical Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.structuredResults?.map((r, idx) => {
                                    const cColor = r.status === 'Normal' ? '#10b981' : (r.status === 'High' ? '#ef4444' : '#f59e0b');
                                    return (
                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '16px 12px', fontWeight: 'bold' }}>{r.name}</td>
                                            <td style={{ padding: '16px 12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{r.generalValue}</td>
                                            <td style={{ padding: '16px 12px', fontWeight: 'bold', fontSize: '1.05rem', color: cColor }}>{r.observedValue}</td>
                                            <td style={{ padding: '16px 12px' }}>
                                                <span style={{ 
                                                    background: r.status === 'Normal' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                                                    color: cColor, 
                                                    padding: '4px 12px', 
                                                    borderRadius: '12px', 
                                                    fontSize: '0.8rem', 
                                                    fontWeight: 'bold' 
                                                }}>
                                                    {r.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {report.operatorNotes && (
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>LABORATORY NOTES</div>
                            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: '1.5' }}>"{report.operatorNotes}"</p>
                        </div>
                    )}
               </div>
            ))
        ) : (
            <div style={{ textAlign: 'center', padding: '60px', opacity: 0.5, border: '2px dashed var(--glass-border)', borderRadius: '16px' }}>
               <Microscope size={48} style={{ margin: '0 auto 16px' }} />
               <h3>No Lab Reports Available</h3>
               <p>Your diagnostic laboratory entries will sync to your record as they are verified.</p>
            </div>
        )
        )}
        </>
      )}
    </div>
  );
};

export default Records;
