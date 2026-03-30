import React, { useState, useEffect } from 'react';
import { 
  History, 
  FileText, 
  ShieldCheck, 
  X,
  Search
} from 'lucide-react';
import '../../styles/core.css';
import doctorService from '../../services/doctorService';
import labService from '../../services/labService';

const DoctorHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeLabReports, setActiveLabReports] = useState([]);
    
    // Edit specific states
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ diagnosis: '', notes: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await doctorService.getDoctorHistory();
                setHistory(res.history || []);
            } catch (err) {
                console.error("Failed to fetch history:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    useEffect(() => {
        const fetchReports = async () => {
            if (selectedPrescription) {
                try {
                    const res = await labService.getPatientReports(selectedPrescription.patientId);
                    const matching = res.reports.filter(r => r.prescriptionId === selectedPrescription.id);
                    setActiveLabReports(matching);
                } catch (err) {
                    console.error("Failed to load attached lab reports");
                }
            } else {
                setActiveLabReports([]);
            }
        };
        fetchReports();
        setIsEditing(false); // Reset edit state when changing selection
    }, [selectedPrescription]);

    const handleSaveEdit = async () => {
        setIsSaving(true);
        try {
            await doctorService.updatePrescription(selectedPrescription.id, {
                diagnosis: editForm.diagnosis,
                notes: editForm.notes
            });
            // Update local state to reflect changes instantly
            setSelectedPrescription(prev => ({...prev, diagnosis: editForm.diagnosis, notes: editForm.notes}));
            setHistory(prev => prev.map(h => h.id === selectedPrescription.id ? {...h, diagnosis: editForm.diagnosis, notes: editForm.notes} : h));
            setIsEditing(false);
            alert("Prescription updated successfully!");
        } catch (err) {
            alert("Failed to update prescription");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredHistory = history.filter(h => 
        (h.patientId || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (h.diagnosis || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', margin: '0 0 8px 0', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <History size={32} /> Clinical History
                    </h2>
                    <p style={{ color: 'var(--text-muted)' }}>Historical log of all finalized prescriptions and consultations.</p>
                </div>
                <div style={{ position: 'relative' }}>
                    <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                    <input 
                        type="text" 
                        placeholder="Search Medical ID..." 
                        className="input-modern"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '40px', width: '250px', margin: 0 }}
                    />
                </div>
            </header>

            <div className="glass-container" style={{ padding: '32px' }}>
                {loading ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading historical records...</p>
                ) : filteredHistory.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                <th style={{ padding: '12px' }}>Date</th>
                                <th style={{ padding: '12px' }}>Patient Medical ID</th>
                                <th style={{ padding: '12px' }}>Primary Diagnosis</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.map((appt, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '16px 12px', color: 'var(--accent)', fontWeight: 'bold' }}>
                                        {appt.created_at ? new Date(appt.created_at).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td style={{ padding: '16px 12px' }}>
                                        <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <ShieldCheck size={14} color="var(--primary)" /> {appt.patientId || 'Unknown'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        {appt.diagnosis ? (appt.diagnosis.length > 50 ? appt.diagnosis.substring(0, 50) + "..." : appt.diagnosis) : 'No specific diagnosis'}
                                    </td>
                                    <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                        <button 
                                            className="btn-secondary" 
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', padding: '6px 12px' }}
                                            onClick={() => setSelectedPrescription(appt)}
                                        >
                                            <FileText size={16}/> View Complete Record
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <p>No historical records matching the criteria.</p>
                    </div>
                )}
            </div>

            {/* Clinical Record Modal */}
            {selectedPrescription && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}>
                    <div className="glass-container" style={{ maxWidth: '600px', width: '100%', padding: '40px', position: 'relative', border: '1px solid var(--accent)' }}>
                        <button style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setSelectedPrescription(null)}>
                            <X size={24} color="#fff" />
                        </button>
                        <h2 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <ShieldCheck size={28} color="var(--accent)"/> Clinical Report
                        </h2>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Patient Medical ID: <b>{selectedPrescription.patientId || 'Unknown'}</b> | Issued: {selectedPrescription.created_at ? new Date(selectedPrescription.created_at).toLocaleDateString() : 'N/A'}
                            </div>
                            {!isEditing && (
                                <button className="btn-secondary" style={{ padding: '6px 16px', fontSize: '0.8rem' }} onClick={() => { setIsEditing(true); setEditForm({ diagnosis: selectedPrescription.diagnosis || '', notes: selectedPrescription.notes || '' }); }}>
                                    Edit Record
                                </button>
                            )}
                        </div>
                        
                        {isEditing ? (
                            <div style={{ marginBottom: '32px', background: 'rgba(59, 130, 246, 0.05)', padding: '24px', borderRadius: '16px', border: '1px solid var(--primary)' }}>
                                <h4 style={{ color: 'var(--primary)', marginBottom: '16px' }}>Edit Clinical Record</h4>
                                <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.85rem' }}>Update Diagnosis / Analysis from Lab Results</label>
                                <textarea className="input-modern" rows="3" value={editForm.diagnosis} onChange={e => setEditForm({...editForm, diagnosis: e.target.value})} style={{ marginBottom: '16px' }} />
                                
                                <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.85rem' }}>Update Physician Notes</label>
                                <textarea className="input-modern" rows="2" value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} style={{ marginBottom: '24px' }} />
                                
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button className="btn-primary" onClick={handleSaveEdit} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Updates'}</button>
                                    <button className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>CLINICAL DIAGNOSIS</div>
                                <p style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 'bold', borderLeft: '4px solid var(--accent)', paddingLeft: '16px' }}>{selectedPrescription.diagnosis}</p>
                            </div>
                        )}

                        <h4 style={{ color: 'var(--accent)', marginBottom: '16px' }}>Prescribed Medication</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                            {selectedPrescription.medicines?.length > 0 ? selectedPrescription.medicines.map((m, i) => (
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

                        {selectedPrescription.labTests?.length > 0 && (
                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>RECOMMENDED LAB TESTS</div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {selectedPrescription.labTests.map((test, index) => (
                                        <span key={index} style={{ padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', borderRadius: '6px', fontSize: '0.85rem' }}>
                                            {test}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeLabReports.length > 0 && (
                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', marginTop: '16px' }}>VERIFIED LABORATORY RESULTS</div>
                                {activeLabReports.map((report, ridx) => (
                                    <div key={ridx} style={{ marginBottom: '16px', border: '1px solid var(--glass-border)', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
                                            <thead>
                                                <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    <th style={{ padding: '12px' }}>Test Name</th>
                                                    <th style={{ padding: '12px' }}>Reference</th>
                                                    <th style={{ padding: '12px' }}>Result</th>
                                                    <th style={{ padding: '12px' }}>Status</th>
                                                    <th style={{ padding: '12px', textAlign: 'center' }}>Media</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {report.structuredResults?.map((r, i) => {
                                                    const cColor = r.status === 'Normal' ? '#10b981' : (r.status === 'High' ? '#ef4444' : '#f59e0b');
                                                    return (
                                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{r.name}</td>
                                                        <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{r.generalValue}</td>
                                                        <td style={{ padding: '12px', fontWeight: 'bold', color: cColor }}>{r.observedValue}</td>
                                                        <td style={{ padding: '12px', color: cColor, fontWeight: 'bold', fontSize: '0.85rem' }}>{r.status}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                            {r.attachedFile ? (
                                                                <a href={r.attachedFile} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                                                                    <img src={r.attachedFile} alt="scan" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--primary)', cursor: 'pointer' }} title={r.fileName} />
                                                                </a>
                                                            ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>None</span>}
                                                        </td>
                                                    </tr>
                                                )})}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedPrescription.notes && !isEditing && (
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>PHYSICIAN NOTES</div>
                                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: '1.5' }}>"{selectedPrescription.notes}"</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorHistory;
