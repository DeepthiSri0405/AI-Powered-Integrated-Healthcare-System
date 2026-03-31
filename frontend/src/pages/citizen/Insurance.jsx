import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../../services/authService';
import { ShieldAlert, FileDigit, Activity, RefreshCcw, ShieldCheck, CheckCircle, Clock } from 'lucide-react';
import '../../styles/core.css';

const CitizenInsurance = () => {
    const [claims, setClaims] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [selectedPrescriptionId, setSelectedPrescriptionId] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const user = authService.getCurrentUser() || { identifier: 'CITIZEN_GUEST' };
            const [claimsRes, prescRes] = await Promise.all([
                axios.get('/api/insurance/claims', { headers: { Authorization: `Bearer ${authService.getToken()}` } }),
                axios.get(`/api/doctor/patients/${user.identifier}/prescriptions`, { headers: { Authorization: `Bearer ${authService.getToken()}` } }).catch(() => ({ data: { prescriptions: [] } }))
            ]);
            setClaims(claimsRes.data || []);
            setPrescriptions(prescRes.data?.prescriptions || []);
        } catch (err) {
            console.error("Failed to fetch data:", err);
            if (err.response && err.response.status === 404) {
                setClaims([]);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleNativeSubmit = async (prescriptionId) => {
        try {
            await axios.post('/api/insurance/claims/native', { prescription_id: prescriptionId }, {
                headers: { Authorization: `Bearer ${authService.getToken()}` }
            });
            alert("Native Claim submitted successfully! Sent to Admin Board.");
            fetchData();
        } catch (err) {
            alert('Failed to submit native claim: ' + (err.response?.data?.detail || err.message));
        }
    };

    const handleFileChange = (e) => {
        setSelectedFiles(Array.from(e.target.files));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (selectedFiles.length === 0) {
            return alert("Please attach at least one document containing your Policy ID details.");
        }
        if (!selectedPrescriptionId) {
            return alert("Please select a historical prescription to claim against.");
        }
        
        setSubmitting(true);
        const formData = new FormData();
        const user = authService.getCurrentUser() || { identifier: 'CITIZEN_GUEST' };
        
        formData.append('patient_id', user.identifier);
        formData.append('prescription_id', selectedPrescriptionId);
        
        const providerName = document.getElementById('insuranceProviderInput')?.value || "HealthCare Plus";
        formData.append('insurance_provider', providerName);
        
        selectedFiles.forEach(f => {
            formData.append('documents', f);
        });

        try {
            await axios.post('/api/insurance/claims', formData, {
                headers: { 
                    Authorization: `Bearer ${authService.getToken()}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert("Claim submitted successfully! It is now pending AI verification.");
            setSelectedFiles([]);
            fetchData();
        } catch (err) {
            alert('Failed to submit document claim: ' + (err.response?.data?.detail || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBlock = (status) => {
        switch (status) {
            case 'approved': return <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={16}/> Approved</div>;
            case 'rejected': return <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldAlert size={16}/> Rejected</div>;
            case 'under_review': return <div style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}><Activity size={16}/> Under Review</div>;
            default: return <div style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={16}/> Pending Queue</div>;
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2.5rem', color: '#fff', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldCheck size={36} color="var(--primary)" />
                Policy Insurance 
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '40px' }}>
                Submit your medical bills and hospital discharge documents for AI-verified reimbursement.
            </p>

            {/* Unified Submission Form */}
            <div className="glass-container" style={{ padding: '32px', marginBottom: '40px', borderTop: '4px solid var(--primary)' }}>
                <h3 style={{ margin: '0 0 24px 0', color: '#fff', fontSize: '1.4rem' }}>Submit Unified Insurance Claim</h3>
                
                <form onSubmit={handleSubmit}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--glass-border)', borderRadius: '12px', padding: '24px', textAlign: 'center', marginBottom: '32px' }}>
                        <FileDigit size={32} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '12px' }} />
                        <h4 style={{ margin: '0 0 8px', color: '#fff', fontSize: '1.1rem' }}>Smart Document Linking</h4>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Upload your Policy ID document and select the precise digital prescription. Our AI OCR agent will handle extraction and verification automatically. 
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>1. Insurance Provider Name</label>
                            <input 
                                type="text" 
                                id="insuranceProviderInput"
                                className="input-modern" 
                                style={{ padding: '16px', width: '100%' }}
                                placeholder="e.g. LifeGuard Mutual"
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>2. Attach Policy Document</label>
                            <input 
                                type="file" 
                                className="input-modern" 
                                style={{ padding: '16px', width: '100%' }}
                                onChange={handleFileChange}
                                accept="image/*, application/pdf"
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>2. Select Digital Prescription</label>
                            <select 
                                className="input-modern" 
                                style={{ padding: '16px', color: '#fff' }}
                                value={selectedPrescriptionId}
                                onChange={(e) => setSelectedPrescriptionId(e.target.value)}
                                required
                            >
                                <option value="" disabled>-- View Available Prescriptions --</option>
                                {prescriptions.length === 0 ? (
                                    <option value="" disabled>No historical prescriptions found.</option>
                                ) : (
                                    prescriptions.map(p => {
                                        const isClaimed = claims.some(c => c.prescription_id === p.id);
                                        return (
                                            <option key={p.id} value={p.id} disabled={isClaimed}>
                                                {new Date(p.created_at).toLocaleDateString()} | Dr. {p.doctorId} | Total: ${Number(p.total_bill || 0).toFixed(2)} {isClaimed ? '(Already Claimed)' : ''}
                                            </option>
                                        );
                                    })
                                )}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn-primary" disabled={submitting} style={{ padding: '16px 40px', fontSize: '1.1rem', borderRadius: '8px', cursor: 'pointer' }}>
                            {submitting ? 'Authenticating & Uploading...' : 'Upload & Submit Claim'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Tracking Table */}
            <h3 style={{ margin: '0 0 24px 0', color: '#fff', fontSize: '1.4rem' }}>My Claims History</h3>
            
            {loading ? (
                <div style={{ padding: '20px', color: 'var(--text-muted)' }}>Fetching your records...</div>
            ) : claims.length === 0 ? (
                <div className="glass-container" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No insurance claims submitted yet.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {claims.map(claim => (
                        <div key={claim.id} className="glass-container" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr', alignItems: 'center', gap: '16px' }}>
                            
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#fff' }}>{claim.insurance_provider}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Policy: {claim.policy_number}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '4px' }}>Submitted: {new Date(claim.created_at).toLocaleDateString()}</div>
                            </div>

                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Claimed Amount</div>
                                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#fff' }}>${Number(claim.claim_amount).toFixed(2)}</div>
                                
                                {claim.status === 'approved' && (
                                    <div style={{ color: '#10b981', fontSize: '0.9rem', marginTop: '4px', fontWeight: 'bold' }}>
                                        Approved: ${Number(claim.approved_amount).toFixed(2)}
                                    </div>
                                )}
                            </div>

                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Status</div>
                                {getStatusBlock(claim.status)}
                            </div>
                            
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>System Remarks</div>
                                <div style={{ color: '#fff', fontSize: '0.85rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginLeft: 'auto' }} title={claim.remarks || 'Pending Review'}>
                                    {claim.remarks || 'Pending Review'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default CitizenInsurance;
