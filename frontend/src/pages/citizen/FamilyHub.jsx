import React, { useState, useEffect } from 'react';
import { Users, Shield, ShieldAlert, LogOut, CheckCircle, Upload, ShieldCheck, Microscope, UserPlus, AlertTriangle, Fingerprint } from 'lucide-react';
import axios from 'axios';
import familyService from '../../services/familyService';
import authService from '../../services/authService';

const FamilyHub = () => {
    const [familyData, setFamilyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUser] = useState(authService.getCurrentUser());
    const [autonomyMessage, setAutonomyMessage] = useState("");

    // Add Dependent State
    const [depName, setDepName] = useState('');
    const [depDoB, setDepDoB] = useState('');
    const [depRel, setDepRel] = useState('Child');
    const [verificationFile, setVerificationFile] = useState(null);
    const [verificationResult, setVerificationResult] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        fetchFamilyData();
    }, []);

    const fetchFamilyData = async () => {
        try {
            const res = await familyService.getFamilyDetails();
            setFamilyData(res.family);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveFamily = async () => {
        if (!window.confirm("Are you sure you want to trigger Independence Mode? You will lose family-shared features.")) return;
        try {
            const res = await familyService.leaveFamily();
            setAutonomyMessage(res.message);
            fetchFamilyData();
        } catch (e) {
            alert(e.response?.data?.detail || "Action failed");
        }
    };

    const handleRestrictAccess = async () => {
        if (!window.confirm("Activate Soft Exit? This restricts parents to View-Only access.")) return;
        try {
            const res = await familyService.restrictFamilyAccess();
            setAutonomyMessage(res.message);
            fetchFamilyData();
        } catch (e) {
            alert(e.response?.data?.detail || "Action failed");
        }
    };

    const handleAddDependent = async (e) => {
        e.preventDefault();
        if (!verificationFile || !depName || !depDoB || !depRel) return alert("All fields and Document are required");
        setIsVerifying(true);
        setVerificationResult(null);

        const formData = new FormData();
        formData.append("name", depName);
        formData.append("dob", depDoB);
        formData.append("relationship", depRel);
        formData.append("file", verificationFile);

        try {
            const res = await familyService.addDependent(formData);
            setVerificationResult({ ...res.analysis, successMsg: res.message });
            fetchFamilyData();
            setDepName(''); setDepDoB(''); setDepRel('Child'); setVerificationFile(null);
        } catch (error) {
            setVerificationResult({ status: "Error", message: error.response?.data?.detail || "Failed to process dependent." });
        } finally {
            setIsVerifying(false);
        }
    };

    if (loading) return <div style={{ padding: '40px', color: '#fff' }}>Syncing Family Network...</div>;

    // Detect if current logged-in user warrants autonomy prompt (Age >= 18 & autonomy_enabled: false)
    const myProfile = familyData?.members?.find(m => m.user_id === currentUser.identifier);
    const showAutonomyPrompt = myProfile && myProfile.age >= 18 && !myProfile.autonomy_enabled;

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '2.5rem', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Users color="var(--primary)" size={32}/> Hybrid Family Hub
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>Securely manage your dependents and personal data autonomy.</p>
            </header>

            {myProfile?.autonomy_enabled && autonomyMessage && (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '16px', borderRadius: '12px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', color: '#10b981' }}>
                    <ShieldCheck size={24}/>
                    <div>
                        <strong>Autonomy Activated:</strong> {autonomyMessage}
                    </div>
                </div>
            )}

            {showAutonomyPrompt && (
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', borderLeft: '4px solid #f59e0b', padding: '24px', borderRadius: '12px', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                        <ShieldAlert size={32} color="#f59e0b" style={{ flexShrink: 0 }} />
                        <div>
                            <h3 style={{ color: '#f59e0b', margin: '0 0 8px 0' }}>Age of Majority Reached: Account Independence Available</h3>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', marginBottom: '20px' }}>
                                Our records indicate you are now 18 or older. Under the Hybrid Health Identity System, you have the right to take full control of your medical records.
                            </p>
                            
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <button className="btn-primary" onClick={handleRestrictAccess} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#3b82f6' }}>
                                    <Shield size={18}/> Soft Exit (Restrict to View-Only)
                                </button>
                                <button className="btn-secondary" onClick={handleLeaveFamily} style={{ display: 'flex', alignItems: 'center', gap: '8px', borderColor: '#ef4444', color: '#ef4444' }}>
                                    <LogOut size={18}/> Leave Family (Full Independence)
                                </button>
                                <button className="btn-secondary" onClick={() => setAutonomyMessage("You have opted to stay managed. You can change this anytime.")} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    Stay Managed
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
                
                {/* Family Roster */}
                <div>
                    <div className="glass-container" style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: 0, color: '#fff' }}>{familyData?.name || "Your Network"}</h3>
                            <button className="btn-secondary" style={{ padding: '6px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.5, cursor: 'not-allowed' }}>
                                <UserPlus size={14}/> Network Lock Enabled
                            </button>
                        </div>

                        {familyData ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {familyData.members.map((m, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>{m.name || m.user_id}</span>
                                                {m.user_id === currentUser.identifier && <span style={{ background: 'var(--primary)', color: '#fff', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px' }}>YOU</span>}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                {m.relationship} • Age: {m.age}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: m.status === 'restricted' ? '#f59e0b' : '#10b981', marginTop: '4px', textTransform: 'capitalize' }}>
                                                Status: {m.status}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Role</div>
                                            <div style={{ fontWeight: 'bold', color: m.role === 'Admin' ? 'var(--primary)' : '#fff' }}>{m.role}</div>
                                            {m.autonomy_enabled && <div style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><CheckCircle size={10}/> Independent</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)' }}>You are not part of any family network.</p>
                        )}
                    </div>
                </div>

                {/* Document Verifier */}
                <div>
                   <div className="glass-container" style={{ padding: '32px', background: 'linear-gradient(180deg, rgba(20, 20, 20, 0) 0%, rgba(59, 130, 246, 0.05) 100%)' }}>
                        <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                            <Fingerprint size={20} color="var(--primary)"/> Dependent Proof Verifier
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
                            Upload a Birth Certificate or ID to link a dependent. The system uses <b>OpenCV Error Level Analysis</b> to detect digitally morphed or tampered documents instantly.
                        </p>

                        <form onSubmit={handleAddDependent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <input 
                                type="text" 
                                placeholder="Legal Full Name" 
                                className="input-modern"
                                value={depName}
                                onChange={e => setDepName(e.target.value)}
                                required
                            />
                            
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <input 
                                    type="date" 
                                    className="input-modern" 
                                    value={depDoB}
                                    onChange={e => setDepDoB(e.target.value)}
                                    style={{ flex: 1 }}
                                    required
                                />
                                <select 
                                    className="input-modern" 
                                    value={depRel} 
                                    onChange={e => setDepRel(e.target.value)}
                                    style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                >
                                    <option value="Child">Child</option>
                                    <option value="Spouse">Spouse</option>
                                    <option value="Elderly Parent">Elderly Parent</option>
                                </select>
                            </div>

                            <div style={{ border: '2px dashed var(--glass-border)', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                                <Upload size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }}/>
                                <input 
                                    type="file" 
                                    accept="image/png, image/jpeg"
                                    onChange={(e) => setVerificationFile(e.target.files[0])}
                                    style={{ color: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-primary" disabled={isVerifying} style={{ padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                {isVerifying ? <span>Scanning Identity Document...</span> : <><Microscope size={16}/> Verify & Register Dependent</>}
                            </button>
                        </form>

                        {/* Analysis Output */}
                        {verificationResult && (
                            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: verificationResult.status === 'Verified' ? '1px solid #10b981' : '1px solid #ef4444' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <div style={{ fontWeight: 'bold', color: verificationResult.status === 'Verified' ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {verificationResult.status === 'Verified' ? <ShieldCheck size={18}/> : <AlertTriangle size={18}/>}
                                        {verificationResult.status.toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>{verificationResult.trustScore}%</div>
                                </div>
                                {verificationResult.successMsg && (
                                     <div style={{ marginBottom: '12px', fontSize: '0.85rem', color: '#10b981' }}>{verificationResult.successMsg}</div>
                                )}

                                {verificationResult.metrics && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <div>Compression Morph:</div><div style={{ textAlign: 'right' }}>{verificationResult.metrics.elaMeanDiff.toFixed(2)}</div>
                                        <div>Laplacian Noise:</div><div style={{ textAlign: 'right' }}>{verificationResult.metrics.laplacianVariance.toFixed(0)}</div>
                                    </div>
                                )}

                                {verificationResult.status !== 'Verified' && (
                                    <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '12px', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
                                        {verificationResult.message || "WARNING: Digital manipulation likely. The compression frequency analysis contradicts natural optical noise patterns."}
                                    </div>
                                )}
                            </div>
                        )}
                   </div>
                </div>

            </div>
        </div>
    );
};

export default FamilyHub;
