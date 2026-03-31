import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../../services/authService';
import { ShieldAlert, FileText, CheckCircle, XCircle, RefreshCcw, Activity, FileDigit } from 'lucide-react';
import '../../styles/core.css';

const AdminInsurance = () => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('under_review');
    const [actionModal, setActionModal] = useState(null); // { type: 'approve'|'reject', claimId }
    const [modalInput, setModalInput] = useState('');

    const fetchClaims = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/insurance/claims?status=${filterStatus}`, {
                headers: { Authorization: `Bearer ${authService.getToken()}` }
            });
            setClaims(res.data || []);
        } catch (err) {
            console.error("Failed to fetch claims:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClaims();
    }, [filterStatus]);

    const handleAction = async (claimId, status) => {
        let payload = { status };
        
        if (status === 'approved') {
            const amt = parseFloat(modalInput);
            if (isNaN(amt) || amt < 0) return alert("Enter valid approved amount");
            payload.approved_amount = amt;
        } else if (status === 'rejected') {
            if (!modalInput.trim()) return alert("Enter rejection remarks");
            payload.remarks = modalInput;
        } else if (status === 'pending') {
            // clarify
            payload.remarks = "Admin requested clarification. Please review provided documents.";
        }

        try {
            await axios.patch(`/api/insurance/claims/${claimId}`, payload, {
                headers: { Authorization: `Bearer ${authService.getToken()}` }
            });
            alert(`Claim ${status} successfully.`);
            setActionModal(null);
            setModalInput('');
            fetchClaims();
        } catch (err) {
            alert('Error updating claim status.');
        }
    };

    const getFraudColor = (score) => {
        if (score > 70) return '#ef4444'; // Red
        if (score > 30) return '#f59e0b'; // Orange
        return '#10b981'; // Green
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ShieldAlert size={36} color="var(--primary)" />
                        Claims Review Board
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '8px' }}>
                        AI-Processed Insurance Pipeline. Review OCR extraction and Fraud heuristics.
                    </p>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        className={filterStatus === 'under_review' ? 'btn-primary' : 'btn-secondary'} 
                        onClick={() => setFilterStatus('under_review')}
                    >
                        Requires Action
                    </button>
                    <button 
                        className={filterStatus === 'pending' ? 'btn-primary' : 'btn-secondary'} 
                        onClick={() => setFilterStatus('pending')}
                    >
                        Queue (Processing/Clarify)
                    </button>
                    <button 
                        className={filterStatus === 'approved' ? 'btn-primary' : 'btn-secondary'} 
                        style={{ background: filterStatus === 'approved' ? '#10b981' : '' }}
                        onClick={() => setFilterStatus('approved')}
                    >
                        Approved History
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', color: '#fff', padding: '40px' }}>Syncing AI Claim Engine...</div>
            ) : claims.length === 0 ? (
                <div className="glass-container" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <CheckCircle size={48} color="#10b981" style={{ marginBottom: '16px', opacity: 0.8 }} />
                    <h2 style={{ color: '#fff' }}>No Active "{filterStatus}" Claims</h2>
                    <p>The system queue is fully synced and processed.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {claims.map(claim => (
                        <div key={claim.id} className="glass-container" style={{ 
                            borderLeft: `6px solid ${getFraudColor(claim.fraud_score)}`,
                            padding: '32px'
                        }}>
                            {/* Header row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px', marginBottom: '24px' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Claim ID: {claim.id}</div>
                                    <h2 style={{ margin: 0, color: '#fff', fontSize: '1.8rem' }}>
                                        {claim.patient_name ? `${claim.patient_name} - ` : ""}{claim.insurance_provider || "Unknown Provider"}
                                    </h2>
                                    <div style={{ color: 'var(--primary)', marginTop: '8px', fontWeight: 'bold' }}>Policy: {claim.policy_number}</div>
                                </div>
                                
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Requested Amount</div>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff' }}>
                                        ${claim.claim_amount?.toFixed(2) || '0.00'}
                                    </div>
                                    {claim.status === 'approved' && (
                                        <div style={{ color: '#10b981', fontWeight: 'bold', marginTop: '8px' }}>
                                            Approved: ${claim.approved_amount}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* 2 Col Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginBottom: '32px' }}>
                                
                                {/* Col 1: Extraction Data */}
                                <div>
                                    <h4 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
                                        <FileDigit size={18} /> Structure Extraction
                                    </h4>
                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', height: '240px', overflowY: 'auto' }}>
                                        {(() => {
                                            let data = claim.extracted_data;
                                            if (typeof data === 'string') {
                                                try { data = JSON.parse(data); } catch(e) { data = { raw_text: data }; }
                                            }
                                            if (!data || Object.keys(data).length === 0) {
                                                return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No structured data extracted.</span>;
                                            }
                                            
                                            // Handle edge case where full_text literally leaked as a key due to frontend JSON stringification
                                            let cleanEntries = Object.entries(data).filter(([k, v]) => k !== 'raw_text' && !k.startsWith('{') && typeof v !== 'object' && !(typeof v === 'string' && v.startsWith('{')));
                                            
                                            if (cleanEntries.length === 0) {
                                                return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No structured data extracted.</span>;
                                            }
                                            
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {cleanEntries.map(([key, val]) => {
                                                        const title = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                                        return (
                                                            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                                                                <div style={{ color: 'var(--primary)', fontSize: '0.85rem', letterSpacing: '0.5px' }}>{title}</div>
                                                                <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 'bold', maxWidth: '60%', textAlign: 'right', wordBreak: 'break-word' }}>
                                                                    {key.toLowerCase().includes('amount') ? `$${Number(val).toFixed(2)}` : String(val)}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                                

                                {/* Col 3: AI Fraud Analysis */}
                                <div>
                                    <h4 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
                                        <Activity size={18} /> AI Validation Engine
                                    </h4>
                                    <div style={{ 
                                        background: getFraudColor(claim.fraud_score) === '#ef4444' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.02)', 
                                        padding: '24px', 
                                        borderRadius: '12px',
                                        border: `1px solid ${getFraudColor(claim.fraud_score)}`,
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Calculated Fraud Risk</div>
                                        <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: getFraudColor(claim.fraud_score), lineHeight: '1' }}>
                                            {claim.fraud_score}%
                                        </div>
                                        <p style={{ marginTop: '16px', fontSize: '0.85rem', color: '#fff', textAlign: 'left', background: 'rgba(0,0,0,0.5)', padding: '12px', borderRadius: '8px' }}>
                                            <strong>System Logs:</strong> {claim.remarks || "No anomalies detected."}
                                        </p>
                                    </div>
                                </div>
                                
                            </div>
                            
                            {/* Action Buttons */}
                            {filterStatus === 'under_review' && (
                                <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
                                    <button className="btn-primary" style={{ flex: 1, background: '#10b981', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1rem', padding: '16px' }} onClick={() => setActionModal({ type: 'approve', claimId: claim.id, amount: claim.claim_amount })}>
                                        <CheckCircle size={20} /> Approve Claim
                                    </button>
                                    <button className="btn-secondary" style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1rem', padding: '16px' }} onClick={() => setActionModal({ type: 'reject', claimId: claim.id })}>
                                        <XCircle size={20} /> Reject as Fraud
                                    </button>
                                    <button className="btn-secondary" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => handleAction(claim.id, 'pending')}>
                                        <RefreshCcw size={20} /> Request Clarification
                                    </button>
                                </div>
                            )}

                        </div>
                    ))}
                </div>
            )}

            {/* Floating Overlay Modal */}
            {actionModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                    <div className="glass-container" style={{ width: '500px', padding: '40px', border: `1px solid ${actionModal.type === 'approve' ? '#10b981' : '#ef4444'}`, boxShadow: `0 0 30px ${actionModal.type === 'approve' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
                        <h2 style={{ color: actionModal.type === 'approve' ? '#10b981' : '#ef4444', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {actionModal.type === 'approve' ? <CheckCircle /> : <XCircle />}
                            {actionModal.type === 'approve' ? 'Approve Insurance Claim' : 'Reject Insurance Claim'}
                        </h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                            {actionModal.type === 'approve' ? 'Carefully enter the final settlement amount to be disbursed.' : 'Provide the official log stating the reason for rejecting this claim as fraudulent.'}
                        </p>
                        
                        <div style={{ marginBottom: '32px' }}>
                            {actionModal.type === 'approve' ? (
                                <div>
                                    <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px' }}>Final Approval Amount ($)</label>
                                    <input 
                                        type="number" 
                                        className="input-modern"
                                        style={{ width: '100%', padding: '16px', fontSize: '1.4rem', fontWeight: 'bold' }}
                                        placeholder={`Total Billed: $${actionModal.amount || 0}`}
                                        value={modalInput}
                                        onChange={e => setModalInput(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px' }}>Fraud/Rejection Remarks</label>
                                    <textarea 
                                        rows="4"
                                        className="input-modern"
                                        style={{ width: '100%' }}
                                        placeholder="Detailed protocol rejection..."
                                        value={modalInput}
                                        onChange={e => setModalInput(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button 
                                className="btn-primary" 
                                style={{ flex: 1, background: actionModal.type === 'approve' ? '#10b981' : '#ef4444', border: 'none', padding: '16px', fontSize: '1.1rem' }}
                                onClick={() => handleAction(actionModal.claimId, actionModal.type === 'approve' ? 'approved' : 'rejected')}
                            >
                                Confirm & Finalize
                            </button>
                            <button className="btn-secondary" style={{ padding: '16px 32px' }} onClick={() => { setActionModal(null); setModalInput(''); }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default AdminInsurance;
