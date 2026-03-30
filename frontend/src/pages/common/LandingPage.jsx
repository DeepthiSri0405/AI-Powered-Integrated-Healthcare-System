import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Shield, Cpu, BarChart3, ChevronRight } from 'lucide-react';
import authService from '../../services/authService';
import '../../styles/core.css';

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      const roleRedirects = {
        'Admin': '/admin',
        'Doctor': '/doctor',
        'Citizen': '/citizen',
        'Ward': '/ward',
        'WardRoom': '/ward',
      };
      navigate(roleRedirects[user.role] || '/');
    }
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', overflow: 'hidden' }}>
      
      {/* Background Glows */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '400px', height: '400px', background: 'rgba(59, 130, 246, 0.15)', filter: 'blur(100px)', borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '300px', height: '300px', background: 'rgba(16, 185, 129, 0.1)', filter: 'blur(100px)', borderRadius: '50%' }}></div>

      {/* Header */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 80px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity color="var(--primary)" size={32} />
          <span style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>SmartHealth</span>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/login')} style={{ width: 'auto', padding: '10px 24px' }}>
          System Login
        </button>
      </nav>

      {/* Hero Section */}
      <section style={{ padding: '100px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
        >
          <h1 style={{ fontSize: '4.5rem', fontWeight: '900', letterSpacing: '-2px', marginBottom: '24px', background: 'linear-gradient(to right, #fff, var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            The Future of Public Health <br /> Management.
          </h1>
          <p style={{ fontSize: '1.4rem', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto 40px', lineHeight: '1.6' }}>
            A unified, role-based ecosystem integrating IoT wearables, AI-driven diagnostics, and real-time hospital resource coordination for a safer community.
          </p>
          
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <button className="btn-primary" onClick={() => navigate('/login')} style={{ width: 'auto', padding: '16px 40px', fontSize: '1.1rem' }}>
              Launch Citizen Portal
            </button>
            <button className="btn-secondary" onClick={() => navigate('/login')} style={{ width: 'auto', padding: '16px 40px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
               System Access <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>

        {/* Floating Feature Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginTop: '100px', width: '100%', maxWidth: '1200px' }}>
          {[
            { icon: <Activity color="#3b82f6" />, title: 'IoT Monitoring', desc: 'Real-time vital tracking from wearable devices.' },
            { icon: <Shield color="#10b981" />, title: 'Secure OCR', desc: 'Auto-verification of official health documents.' },
            { icon: <Cpu color="#a78bfa" />, title: 'AI Triage', desc: 'Instant clinical diagnostics and doctor matching.' },
            { icon: <BarChart3 color="#f59e0b" />, title: 'Resource Hub', desc: 'Live monitoring of bed availability and oxygen.' }
          ].map((feature, i) => (
            <motion.div 
               key={i}
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.5, delay: 0.5 + (i * 0.1) }}
               className="glass-container" 
               style={{ textAlign: 'left', padding: '32px' }}
            >
              <div style={{ width: '40px', height: '40px', marginBottom: '20px' }}>{feature.icon}</div>
              <h4 style={{ color: '#fff', marginBottom: '12px' }}>{feature.title}</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer / Decorative */}
      <footer style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>
        Built with Antigravity AI Engine • Smart Public Health Management System • 2026
      </footer>
    </div>
  );
};

export default LandingPage;
