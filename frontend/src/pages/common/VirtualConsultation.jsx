import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../../styles/core.css';

const VirtualConsultation = ({ roomName: propsRoom, patientName: propsPatient, doctorName: propsDoctor, embedded = false }) => {
  const [isJoined, setIsJoined] = useState(false);
  const location = useLocation();
  const state = location.state || {};
  
  const roomName = propsRoom || state.roomName || "SHS-Consult-Demo-Room";
  const patientName = propsPatient || state.patientName || "John Doe";
  const doctorName = propsDoctor || state.doctorName || "Dr. Sarah";

  const jitsiUrl = `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&userInfo.displayName="${encodeURIComponent(patientName)}"`;

  return (
    <div style={{ padding: embedded ? '0px' : '40px', maxWidth: embedded ? 'none' : '1200px', margin: '0 auto', height: embedded ? '100%' : '100vh', display: 'flex', flexDirection: 'column' }}>
      {!embedded && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '2rem', color: 'var(--primary)', margin: '0 0 8px 0' }}>Virtual Consultation Workspace</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Secure, encrypted telemedicine link between you and {doctorName}.</p>
          </div>
          {!isJoined ? (
            <button className="btn-primary" onClick={() => setIsJoined(true)} style={{ padding: '12px 32px', fontSize: '1.2rem', animation: 'pulse 2s infinite' }}>
              📹 Join Call Now
            </button>
          ) : (
            <button className="btn-secondary" style={{ background: '#ef4444' }} onClick={() => setIsJoined(false)}>
              End Consultation
            </button>
          )}
        </div>
      )}

      {embedded && (
        <div style={{ padding: '12px', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 'bold' }}>🔴 LIVE: {roomName}</div>
            <button className={isJoined ? "btn-secondary" : "btn-primary"} onClick={() => setIsJoined(!isJoined)} style={{ padding: '6px 12px', fontSize: '0.8rem', background: isJoined ? '#ef4444' : 'var(--primary)', color: isJoined ? '#fff' : '#000' }}>
               {isJoined ? 'End Call' : 'Join Call'}
            </button>
        </div>
      )}

      <div className="glass-container" style={{ flex: 1, padding: '0', overflow: 'hidden', display: 'flex', background: '#000', borderRadius: embedded ? '0 0 16px 16px' : '16px', border: embedded ? 'none' : '1px solid var(--glass-border)' }}>
        {!isJoined ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔒</div>
            <h3>Call is idle</h3>
            <p>Click "Join Call" to connect to the secure room.</p>
          </div>
        ) : (
          <iframe 
            src={jitsiUrl}
            allow="camera; microphone; fullscreen; display-capture"
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: 'inherit' }}
            title="Telemedicine Virtual Consultation"
          />
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      `}</style>
    </div>
  );
};

export default VirtualConsultation;
