import React, { useState, useEffect } from 'react';
import { 
  Microscope,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Send,
  Loader2,
  Clock,
  ShieldCheck,
  User
} from 'lucide-react';
import '../../styles/core.css';
import labService from '../../services/labService';
import authService from '../../services/authService';

const LabDashboard = () => {
    const [currentUser] = useState(authService.getCurrentUser());
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTask, setActiveTask] = useState(null); // The request being actively processed
    
    // Form State for Structured Report
    const [testsToSubmit, setTestsToSubmit] = useState([]);
    const [generalNotes, setGeneralNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await labService.getPendingRequests();
            setPendingRequests(res.requests || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleAcceptRequest = async (req) => {
        try {
            await labService.acceptRequest(req.id);
            // Prepare structured form rows based on requested tests
            const structuredRows = req.testsRequested.map(testName => ({
                name: testName,
                generalValue: '', // Operator types the standard range
                observedValue: '', // Operator types the actual result
                status: 'Normal' // Default, color coordinated
            }));
            
            setTestsToSubmit(structuredRows);
            setActiveTask(req);
        } catch (err) {
            alert("Failed to accept task.");
        }
    };

    const evaluateSeverity = (generalStr, observedStr) => {
        if (!generalStr || !observedStr) return 'Normal';
        
        const obs = parseFloat(observedStr.replace(/[^0-9.-]+/g, ""));
        if (isNaN(obs)) return 'Normal';

        if (generalStr.includes('<')) {
            const bound = parseFloat(generalStr.replace(/[^0-9.-]+/g, ""));
            if (!isNaN(bound) && obs >= bound) return 'High';
            if (!isNaN(bound) && obs < bound) return 'Normal';
        }
        if (generalStr.includes('>')) {
            const bound = parseFloat(generalStr.replace(/[^0-9.-]+/g, ""));
            if (!isNaN(bound) && obs <= bound) return 'Low';
            if (!isNaN(bound) && obs > bound) return 'Normal';
        }
        
        const rangeMatch = generalStr.match(/([0-9.]+)\s*-\s*([0-9.]+)/);
        if (rangeMatch) {
            const lower = parseFloat(rangeMatch[1]);
            const upper = parseFloat(rangeMatch[2]);
            if (obs < lower) return 'Low';
            if (obs > upper) return 'High';
            return 'Normal';
        }
        return 'Normal';
    };

    const handleUpdateRow = (index, field, value) => {
        const newTests = [...testsToSubmit];
        newTests[index][field] = value;
        
        if (field === 'generalValue' || field === 'observedValue') {
            newTests[index].status = evaluateSeverity(newTests[index].generalValue, newTests[index].observedValue);
        }
        setTestsToSubmit(newTests);
    };

    const handleFileUploadRow = (index, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const newTests = [...testsToSubmit];
            newTests[index].attachedFile = reader.result;
            newTests[index].fileName = file.name;
            setTestsToSubmit(newTests);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmitReport = async () => {
        // Validate
        for (let t of testsToSubmit) {
            if (!t.generalValue || !t.observedValue) {
                alert(`Please enter General and Observed values for ${t.name}`);
                return;
            }
        }
        
        setIsSubmitting(true);
        const payload = {
            requestId: activeTask.id,
            patientId: activeTask.patientId,
            prescriptionId: activeTask.prescriptionId,
            operatorId: currentUser.identifier,
            results: testsToSubmit,
            notes: generalNotes
        };

        try {
            await labService.submitStructuredReport(payload);
            alert("Report successfully published to Clinical Hub & dispatched to Patient.");
            setActiveTask(null);
            fetchPending(); // Refresh queue
        } catch (err) {
            alert("Failed to compile report.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (activeTask) {
        return (
            <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
                <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent)' }}>
                            <Microscope size={28} /> Active Analysis Panel
                        </h2>
                        <p style={{ color: 'var(--text-muted)' }}>Generating clinical ranges for Patient {activeTask.patientId}</p>
                    </div>
                    <button className="btn-secondary" onClick={() => setActiveTask(null)}>Cancel Analysis</button>
                </header>

                <div className="glass-container" style={{ padding: '32px' }}>
                    <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--glass-border)' }}>
                        <h4 style={{ color: '#fff', marginBottom: '16px' }}>Quantitative Test Entries</h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                            <div>Target Component</div>
                            <div>Reference Range</div>
                            <div>Observed Value</div>
                            <div>Flags (Auto)</div>
                            <div>Attachment</div>
                        </div>

                        {testsToSubmit.map((test, idx) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#fff' }}>{test.name}</div>
                                <input 
                                    className="input-modern" 
                                    placeholder="e.g. 70-100 mg/dL" 
                                    style={{ margin: 0, padding: '10px' }}
                                    value={test.generalValue}
                                    onChange={(e) => handleUpdateRow(idx, 'generalValue', e.target.value)}
                                />
                                <input 
                                    className="input-modern" 
                                    placeholder="e.g. 105 mg/dL" 
                                    style={{ margin: 0, padding: '10px', borderColor: test.status !== 'Normal' ? '#ef4444' : 'var(--glass-border)' }}
                                    value={test.observedValue}
                                    onChange={(e) => handleUpdateRow(idx, 'observedValue', e.target.value)}
                                />
                                <div style={{ 
                                    color: test.status === 'Normal' ? '#10b981' : (test.status === 'High' ? '#ef4444' : '#f59e0b'),
                                    fontWeight: 'bold',
                                    padding: '10px',
                                    background: 'rgba(255,255,255,0.02)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--glass-border)',
                                    textAlign: 'center'
                                }}>
                                    {test.status}
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: test.attachedFile ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)', color: test.attachedFile ? '#10b981' : 'var(--text-muted)', padding: '10px', borderRadius: '8px', border: test.attachedFile ? '1px solid #10b981' : '1px dashed var(--glass-border)', overflow: 'hidden' }}>
                                    <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={(e) => handleFileUploadRow(idx, e.target.files[0])} />
                                    {test.attachedFile ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> : <FileCheck size={16} style={{ flexShrink: 0 }} />}
                                    <span style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                                        {test.fileName || 'Attach Scan/PDF'}
                                    </span>
                                </label>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Operator Notes & Synopsis</label>
                        <textarea 
                            className="input-modern"
                            rows="3"
                            placeholder="Add generic lab conditions, sample quality, etc..."
                            value={generalNotes}
                            onChange={(e) => setGeneralNotes(e.target.value)}
                        />
                    </div>

                    <button 
                        className="btn-primary" 
                        onClick={handleSubmitReport} 
                        disabled={isSubmitting}
                        style={{ width: '100%', padding: '16px', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', gap: '8px' }}
                    >
                        {isSubmitting ? <Loader2 className="spinning" size={20} /> : <Send size={20} />}
                        Compile & Dispatch Official Report
                    </button>
                    <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Alerts will be automatically dispatched to Citizen and the Assigned Doctor upon publishing.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '2.5rem', margin: '0 0 8px 0', color: 'var(--accent)' }}>Diagnostic Laboratory Core</h2>
                <p style={{ color: 'var(--text-muted)' }}>Welcome {currentUser?.name}. Process secure incoming test requests below.</p>
            </header>

            <div className="glass-container" style={{ padding: '32px' }}>
                <h4 style={{ margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                    <Clock size={20} color="var(--primary)" /> Local Pending Requests
                </h4>

                {loading ? <p style={{ color: 'var(--text-muted)' }}>Scanning network...</p> : pendingRequests.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                <th style={{ padding: '12px' }}>Origin</th>
                                <th style={{ padding: '12px' }}>Target Patient ID</th>
                                <th style={{ padding: '12px' }}>Requested Profile</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>Workflow</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingRequests.map((req, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '16px 12px', color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                        {new Date(req.created_at).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '16px 12px' }}>
                                        <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <ShieldCheck size={14} color="var(--primary)" /> {req.patientId}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 12px' }}>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {req.testsRequested.map((t, idx) => (
                                                <span key={idx} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem' }}>{t}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                        <button 
                                            className="btn-primary" 
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', padding: '8px 16px' }}
                                            onClick={() => handleAcceptRequest(req)}
                                        >
                                            <CheckCircle2 size={16}/> Accept Task
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <FileCheck size={40} style={{ opacity: 0.2, marginBottom: '16px' }} />
                        <p>No active diagnostic tasks pending your approval.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LabDashboard;
