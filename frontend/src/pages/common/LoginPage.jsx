import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, User, AlertCircle, Eye, EyeOff, Calendar as CalendarIcon, Hash, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import authService from '../../services/authService';
import '../../styles/core.css';

const LoginPage = () => {
  const [view, setView] = useState('login'); // 'login', 'register_step1', 'register_step2'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  // Registration states
  const [regName, setRegName] = useState('');
  const [regAadhaar, setRegAadhaar] = useState('');
  const [regDoB, setRegDoB] = useState('');
  const [regGeneratedId, setRegGeneratedId] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const cleanId = identifier.trim();
      const cleanPass = password.trim();
      const user = await authService.login(cleanId, cleanPass);
      // Redirect based on role
      const roleRedirects = {
        'Admin': '/admin',
        'Doctor': '/doctor',
        'Citizen': '/citizen',
        'WardStaff': '/ward',
        'WardRoom': '/ward',
        'LabOperator': '/lab',
      };
      const target = roleRedirects[user.role] || '/';
      navigate(target);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterStep1 = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (regAadhaar.length !== 12) throw new Error("Aadhaar ID must be 12 digits.");
      if (!regName.trim() || !regDoB) throw new Error("All fields are required.");
      
      const res = await authService.registerOnboard(regAadhaar, regName, regDoB);
      setRegGeneratedId(res.data.medicalId);
      setView('register_step2');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Onboarding failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterStep2 = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (!password || password.length < 6) throw new Error("Password must be at least 6 characters.");
      
      await authService.registerSetPassword(regGeneratedId, regAadhaar, password);
      setSuccessMsg(`Success! Check the default mail for your generated Medical ID. You can now log in.`);
      setIdentifier('');
      setPassword('');
      setView('login');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Setup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleView = () => {
      setError('');
      setSuccessMsg('');
      setView(view === 'login' ? 'register_step1' : 'login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', position: 'relative', overflow: 'hidden' }}>
      
      {/* Animated Background Gradients */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: '300px', height: '300px', background: 'rgba(59, 130, 246, 0.1)', filter: 'blur(100px)', borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', background: 'rgba(16, 185, 129, 0.08)', filter: 'blur(100px)', borderRadius: '50%' }}></div>

      <motion.div 
        key={view}
        initial={{ opacity: 0, x: view === 'login' ? -20 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-container" 
        style={{ width: '100%', maxWidth: '420px', padding: '40px', position: 'relative', zIndex: 10 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '56px', height: '56px', background: 'var(--primary)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Activity color="white" size={32} />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
              {view === 'login' ? 'SmartHealth Access' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>
              {view === 'login' ? 'Enter credentials to manage your health.' : (view === 'register_step1' ? 'Register your core identity details' : 'Secure your new Medical ID')}
          </p>
        </div>

        {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.4' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                {error}
            </div>
        )}
        
        {successMsg && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '8px', color: '#10b981', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.4' }}>
                <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                {successMsg}
            </div>
        )}

        {/* LOGIN FORM */}
        {view === 'login' && (
            <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Medical ID or Identifier</label>
                <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                <input 
                    type="text"
                    className="input-modern"
                    placeholder="CIT..."
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    style={{ paddingLeft: '44px' }}
                    required
                />
                </div>
            </div>

            <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                <input 
                    type={showPass ? "text" : "password"}
                    className="input-modern"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: '44px', paddingRight: '44px' }}
                    required
                />
                <button 
                    type="button" 
                    onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: '14px', top: '14px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary" style={{ width: '100%', padding: '14px' }}>
                {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>First time patient? </span>
                <button type="button" onClick={toggleView} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>Create Account</button>
            </div>
            </form>
        )}

        {/* REGISTER STEP 1 */}
        {view === 'register_step1' && (
            <form onSubmit={handleRegisterStep1}>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Full Legal Name</label>
                    <div style={{ position: 'relative' }}>
                        <User size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                        <input type="text" className="input-modern" placeholder="John Doe" value={regName} onChange={(e) => setRegName(e.target.value)} style={{ paddingLeft: '44px' }} required />
                    </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Aadhaar ID (12 Digits)</label>
                    <div style={{ position: 'relative' }}>
                        <Hash size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                        <input type="text" className="input-modern" placeholder="123412341234" value={regAadhaar} onChange={(e) => setRegAadhaar(e.target.value)} style={{ paddingLeft: '44px' }} required maxLength="12" minLength="12" />
                    </div>
                </div>

                <div style={{ marginBottom: '28px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Date of Birth</label>
                    <div style={{ position: 'relative' }}>
                        <CalendarIcon size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                        <input type="date" className="input-modern" value={regDoB} onChange={(e) => setRegDoB(e.target.value)} style={{ paddingLeft: '44px', color: '#fff' }} required />
                    </div>
                </div>

                <button type="submit" disabled={isLoading} className="btn-primary" style={{ width: '100%', padding: '14px' }}>
                    {isLoading ? 'Verifying...' : 'Next Step'}
                </button>
                
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Already registered? </span>
                    <button type="button" onClick={toggleView} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }}>Sign In</button>
                </div>
            </form>
        )}

        {/* REGISTER STEP 2 */}
        {view === 'register_step2' && (
            <form onSubmit={handleRegisterStep2}>
                <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.3)', marginBottom: '24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Secure Medical ID Delivery</div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary)', letterSpacing: '1px', marginTop: '4px' }}>🔒 Delivered to Default Email</div>
                </div>

                <div style={{ marginBottom: '28px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Set Secure Password</label>
                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                        <input 
                            type={showPass ? "text" : "password"}
                            className="input-modern"
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ paddingLeft: '44px', paddingRight: '44px' }}
                            required
                            minLength="6"
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '14px', top: '14px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <button type="submit" disabled={isLoading} className="btn-primary" style={{ width: '100%', padding: '14px' }}>
                    {isLoading ? 'Securing Profile...' : 'Complete Setup'}
                </button>
            </form>
        )}

      </motion.div>
    </div>
  );
};

export default LoginPage;
