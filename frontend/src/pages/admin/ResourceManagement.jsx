import React, { useState } from 'react';
import '../../styles/core.css';

const ResourceManagement = () => {
  const [request, setRequest] = useState({
    resourceType: 'Oxygen',
    quantity: '',
    urgency: 'Standard',
    note: ''
  });

  const [history, setHistory] = useState([
    { id: "REQ-01", type: "Liquid Oxygen", quantity: "200L", urgency: "Critical", status: "Fulfilled", date: "2026-03-25" },
    { id: "REQ-02", type: "PPE Kits", quantity: "500 Units", urgency: "Standard", status: "Pending", date: "2026-03-27" }
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newRequest = {
        id: `REQ-0${history.length + 1}`,
        type: request.resourceType,
        quantity: request.quantity,
        urgency: request.urgency,
        status: "Pending",
        date: new Date().toISOString().split('T')[0]
    };
    setHistory([newRequest, ...history]);
    alert("Resource request submitted! Health Officer alerted via flowchart automation.");
    setRequest({ resourceType: 'Oxygen', quantity: '', urgency: 'Standard', note: '' });
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '2rem', color: '#fff', marginBottom: '8px' }}>Resource Management</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Request additional assets or medical supplies from the Smart Health Central Panel.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>
        
        {/* Request Form */}
        <div>
          <div className="glass-container">
            <h4 style={{ margin: '0 0 20px 0', color: 'var(--primary)' }}>New Resource Request</h4>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Resource Type</label>
                <select 
                    className="input-modern"
                    value={request.resourceType}
                    onChange={(e) => setRequest({...request, resourceType: e.target.value})}
                >
                    <option>Oxygen (Liters)</option>
                    <option>Beds / Mattresses</option>
                    <option>Medicine Stock (Bulk)</option>
                    <option>Medical Equipment</option>
                    <option>Staff Support</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Quantity / Units</label>
                <input 
                    className="input-modern"
                    placeholder="e.g. 500L or 10 Units"
                    value={request.quantity}
                    onChange={(e) => setRequest({...request, quantity: e.target.value})}
                    required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Urgency Level</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    {['Standard', 'High', 'Critical'].map(level => (
                        <button 
                            key={level}
                            type="button"
                            className={`type-btn ${request.urgency === level ? 'active' : ''}`}
                            onClick={() => setRequest({...request, urgency: level})}
                            style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
                        >
                            {level}
                        </button>
                    ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Reason / Note</label>
                <textarea 
                    className="input-modern"
                    rows="3"
                    placeholder="Why is this resource needed?"
                    value={request.note}
                    onChange={(e) => setRequest({...request, note: e.target.value})}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px' }}>
                Submit Request to Panel
              </button>
            </form>
          </div>
        </div>

        {/* History Table */}
        <div>
           <div className="glass-container">
             <h4 style={{ margin: '0 0 20px 0', color: '#fff' }}>Request History</h4>
             <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--primary)' }}>
                        <th style={{ paddingBottom: '12px' }}>Type</th>
                        <th style={{ paddingBottom: '12px' }}>Qty</th>
                        <th style={{ paddingBottom: '12px' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {history.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '12px 0' }}>
                                <div style={{ color: '#fff' }}>{item.type}</div>
                                <div style={{ fontSize: '0.75rem' }}>{item.date} • {item.id}</div>
                            </td>
                            <td>{item.quantity}</td>
                            <td>
                                <span style={{ 
                                    padding: '4px 8px', 
                                    borderRadius: '12px', 
                                    fontSize: '0.75rem',
                                    background: item.status === 'Fulfilled' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                    color: item.status === 'Fulfilled' ? '#10b981' : '#f59e0b'
                                }}>
                                    {item.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
           </div>
        </div>

      </div>
    </div>
  );
};

export default ResourceManagement;
