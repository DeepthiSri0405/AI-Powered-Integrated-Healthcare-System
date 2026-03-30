import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, FileText, ChevronRight, Activity, AlertCircle } from 'lucide-react';
import '../../styles/core.css';
import doctorService from '../../services/doctorService';

const Patients = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await doctorService.getDoctorPatients();
        setPatients(res.patients || []);
      } catch (err) {
        console.error("Failed to fetch real-time patient data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRiskColor = (risk) => {
    if (risk === "Critical") return "#ef4444";
    if (risk === "Elevated") return "#f59e0b";
    return "#10b981";
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2rem', margin: '0 0 12px 0' }}>Patient Database (Real-Time)</h2>
        <p style={{ color: 'var(--text-muted)' }}>Secure clinical records synchronized with MongoDB Atlas.</p>
      </header>

      {/* Search and Filters */}
      <div className="glass-container" style={{ marginBottom: '32px', padding: '16px' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Search size={20} color="var(--text-muted)" />
            <input 
                className="input-modern"
                style={{ margin: 0, background: 'transparent', border: 'none', borderBottom: '1px solid var(--glass-border)', padding: '8px 0', borderRadius: 0, outline: 'none', width: '100%' }}
                placeholder="Search by Name or Medical ID (e.g. CIT555)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      {loading ? <p>Loading synchronized patient records...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {filteredPatients.length > 0 ? filteredPatients.map(patient => (
             <div key={patient.id} className="glass-container" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '4px', height: '100%', background: getRiskColor(patient.risk) }}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                   <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User color="var(--primary)" size={24} />
                   </div>
                   <div>
                      <h4 style={{ margin: 0, color: '#fff' }}>{patient.name}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {patient.id}</span>
                   </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                   <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Age / Gender</div>
                      <div style={{ fontSize: '0.9rem' }}>{patient.age} / {patient.gender}</div>
                   </div>
                   <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Last Consult</div>
                      <div style={{ fontSize: '0.9rem' }}>{patient.lastVisit}</div>
                   </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn-secondary" 
                    style={{ flex: 1, padding: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => navigate('/doctor/prescription')}
                  >
                    <FileText size={16} /> History
                  </button>
                  <button 
                    className="btn-primary" 
                    style={{ flex: 1, padding: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => navigate('/doctor')}
                  >
                    <Activity size={16} /> Initiate
                  </button>
                </div>
             </div>
          )) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', border: '2px dashed var(--glass-border)', borderRadius: '16px', opacity: 0.5 }}>
                <AlertCircle size={48} style={{ margin: '0 auto 16px' }} />
                <h5>No Registered Patients Found</h5>
                <p>Patients will appear here once they book their first appointment via the Citizen portal.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Patients;
