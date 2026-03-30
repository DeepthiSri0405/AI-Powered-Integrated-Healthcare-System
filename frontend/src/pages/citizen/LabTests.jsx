import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  MapPin, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import '../../styles/core.css';
import axios from 'axios';
import authService from '../../services/authService';

const LabTests = () => {
  const [activePrescriptions, setActivePrescriptions] = useState([]);
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState('');
  const [loading, setLoading] = useState(true);
  const [requestStatus, setRequestStatus] = useState({}); // Tracking by prescriptionId

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchNearby = async (lng, lat) => {
            try {
              const response = await axios.get(`/api/lab/nearby?lng=${lng}&lat=${lat}`, {
                headers: { Authorization: `Bearer ${authService.getToken()}` }
              });
              // Pin Demo Lab
              const demoLab = { id: 'DEMO-LAB', name: '⭐ Demo Healthcare Diagnostics (Pinned)', distance_km: '0.1' };
              setLabs([demoLab, ...(response.data.laboratories || [])]);
            } catch (err) {
              setLabs([{ id: 'DEMO-LAB', name: '⭐ Demo Healthcare Diagnostics (Pinned)', distance_km: '0.1' }]);
            }
        };

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (p) => fetchNearby(p.coords.longitude, p.coords.latitude),
            () => fetchNearby(78.39, 17.54)
          );
        } else {
          fetchNearby(78.39, 17.54);
        }

        const user = authService.getCurrentUser();
        if (user) {
            const response = await axios.get('/api/lab/citizen/pending', {
                headers: { Authorization: `Bearer ${authService.getToken()}` }
            });
            setActivePrescriptions(response.data.requests || []);
        }
      } catch (err) {
        console.error("Failed to fetch lab data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSendRequest = async (e, requestId) => {
    e.preventDefault();
    if (!selectedLab) return;
    
    try {
        await axios.post('/api/lab/citizen/update-lab', {
            prescriptionId: requestId, // We use requestId as the identifier here
            hospitalId: selectedLab
        }, {
            headers: { Authorization: `Bearer ${authService.getToken()}` }
        });
        
        setRequestStatus(prev => ({ ...prev, [requestId]: 'Awaiting Lab Acceptance' }));
        alert(`Request sent to ${labs.find(l => l.id === selectedLab)?.name || 'the selected laboratory'}`);
    } catch (e) {
        alert("Lab request failed. Please check your connectivity.");
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '3rem', color: 'var(--accent)', marginBottom: '16px', fontWeight: '800' }}>Diagnostic Center Locator</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Connect your digital prescriptions directly to over 500+ certified laboratories for seamless testing.
        </p>
      </header>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px' }}>
            <FlaskConical className="spinning" size={60} color="var(--primary)" />
            <p style={{ color: 'var(--text-muted)', marginTop: '24px', fontSize: '1.1rem' }}>Scanning for nearby diagnostic facilities...</p>
        </div>
      ) : activePrescriptions.length > 0 ? (
        <div style={{ display: 'grid', gap: '32px' }}>
          {activePrescriptions.map(presc => (
            <div key={presc.id} className="glass-container" style={{ padding: '0', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
              <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FlaskConical size={18} color="var(--primary)" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Prescribed Diagnostics</span>
                  </div>
                  <h4 style={{ margin: '8px 0 0', fontSize: '1.3rem' }}>Ref ID: {presc.id.substring(0, 12).toUpperCase()}</h4>
                </div>
                <div>
                  <span style={{ 
                    background: requestStatus[presc.id] ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                    color: requestStatus[presc.id] ? '#10b981' : 'var(--primary)',
                    padding: '8px 16px', 
                    borderRadius: '30px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    border: `1px solid ${requestStatus[presc.id] ? '#10b981' : 'var(--primary)'}`
                  }}>
                    {requestStatus[presc.id] || 'Ready to Transmit'}
                  </span>
                </div>
              </div>

              <div style={{ padding: '32px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                     Required Clinical Tests:
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {presc.testsRequested?.map((test, i) => (
                      <div key={i} style={{ 
                        padding: '10px 18px', 
                        background: 'rgba(59, 130, 246, 0.1)', 
                        borderRadius: '10px', 
                        fontSize: '0.95rem', 
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        color: '#fff',
                        fontWeight: '500'
                      }}>
                        {test}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '24px', marginTop: '24px' }}>
                   <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Select a laboratory to transmit requirements:</p>
                   <form onSubmit={(e) => handleSendRequest(e, presc.id)} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                    <div style={{ position: 'relative' }}>
                      <MapPin size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-muted)' }} />
                      <select 
                        className="input-modern"
                        style={{ paddingLeft: '48px', height: '52px', marginTop: 0 }}
                        value={selectedLab}
                        onChange={(e) => setSelectedLab(e.target.value)}
                        disabled={!!requestStatus[presc.id]}
                        required
                      >
                        <option value="" disabled>Browse Certified Labs Nearby...</option>
                        {labs.map(l => (
                          <option key={l.id} value={l.id}>
                            {l.name} {l.distance_km ? `(${l.distance_km} km)` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      style={{ height: '52px', marginTop: 0, fontWeight: 'bold', fontSize: '1rem' }}
                      disabled={!!requestStatus[presc.id] || !selectedLab}
                    >
                      {requestStatus[presc.id] ? 'Transmission Locked' : 'Send Lab Request'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-container" style={{ textAlign: 'center', padding: '100px 40px', border: '2px dashed var(--glass-border)', background: 'transparent' }}>
            <AlertCircle size={60} style={{ opacity: 0.1, margin: '0 auto 24px' }} />
            <h3 style={{ color: 'var(--text-muted)', fontSize: '1.5rem', marginBottom: '12px' }}>No Pending Lab Requirements</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '400px', margin: '0 auto' }}>
              When a doctor prescribes a lab test, it will appear here instantly for your selection.
            </p>
        </div>
      )}

      <div style={{ marginTop: '60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="glass-container" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '24px' }}>
             <Clock size={32} color="var(--primary)" />
             <div>
                <h5 style={{ margin: 0, fontSize: '1.1rem' }}>Instant Sync</h5>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Real-time updates between labs and your profile.</p>
             </div>
          </div>
          <div className="glass-container" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '24px' }}>
             <Search size={32} color="var(--accent)" />
             <div>
                <h5 style={{ margin: 0, fontSize: '1.1rem' }}>Smart Locator</h5>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Powered by OpenStreetMap for accurate local discovery.</p>
             </div>
          </div>
      </div>
    </div>
  );
};

export default LabTests;
