import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../../services/authService';
import '../../styles/core.css';

const ResourceManagement = () => {
  const [request, setRequest] = useState({
    resourceType: 'Oxygen',
    quantity: '',
    urgency: 'Standard',
    note: ''
  });

  const [medicineStocks, setMedicineStocks] = useState([]);
  const [loadingStock, setLoadingStock] = useState(true);

  useEffect(() => {
    const fetchStock = async () => {
        try {
            const res = await axios.get('/api/medicine/stock', {
                headers: { Authorization: `Bearer ${authService.getToken()}` }
            });
            setMedicineStocks(res.data.stock || []);
        } catch(err) {
            console.error("Failed to fetch stock", err);
        } finally {
            setLoadingStock(false);
        }
    };
    fetchStock();
    
    const ws = new WebSocket(`ws://${window.location.hostname}:8000/api/realtime/ws/ADMIN_RESOURCE`);
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if(data.type === "STOCK_UPDATE") {
                 setMedicineStocks(prev => prev.map(s => 
                     s.name === data.medicineName ? { ...s, currentCount: data.currentCount } : s
                 ));
            }
        } catch(e) {}
    };
    return () => {
        if (ws.readyState === 1) {
            ws.close();
        }
    };
  }, []);

  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
        const res = await axios.get('/api/admin/resources/requests', {
            headers: { Authorization: `Bearer ${authService.getToken()}` }
        });
        setHistory(res.data.requests || []);
    } catch(err) {
        console.error("Failed to load resource requests", err);
    }
  };

  useEffect(() => {
    fetchHistory();
    // ...existing code will be in another block or we can just append it:
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newRequest = {
        resourceType: request.resourceType,
        quantity: request.quantity,
        urgency: request.urgency,
        note: request.note,
        hospitalId: authService.getCurrentUser()?.hospitalId || 'HOSP-01'
    };
    try {
        await axios.post('/api/admin/resources/request', newRequest, {
            headers: { Authorization: `Bearer ${authService.getToken()}` }
        });
        alert("Resource request submitted! Health Officer alerted via flowchart automation.");
        setRequest({ resourceType: 'Oxygen', quantity: '', urgency: 'Standard', note: '' });
        fetchHistory();
    } catch (err) {
        alert("Failed to submit request.");
    }
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

         {/* Medicine Stocks Table */}
         <div>
            <div className="glass-container">
              <h4 style={{ margin: '0 0 20px 0', color: '#fff' }}>Real-time Pharmacy & General Stock</h4>
              {loadingStock ? <p style={{ color: 'var(--text-muted)' }}>Loading live stock feeds...</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                 <thead>
                     <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--primary)' }}>
                         <th style={{ paddingBottom: '12px' }}>Resource Name</th>
                         <th style={{ paddingBottom: '12px' }}>Live Count</th>
                     </tr>
                 </thead>
                 <tbody>
                     {medicineStocks.map((stock, idx) => {
                         const isLow = stock.currentCount <= (stock.reorderLevel || 10);
                         return (
                         <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                             <td style={{ padding: '12px 0', color: '#fff' }}>{stock.name}</td>
                             <td>
                                 <span style={{ 
                                     padding: '4px 8px', 
                                     borderRadius: '12px', 
                                     fontSize: '0.75rem',
                                     background: isLow ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                     color: isLow ? '#ef4444' : '#10b981',
                                     fontWeight: 'bold',
                                     animation: isLow ? 'pulse 2s infinite' : 'none'
                                 }}>
                                     {stock.currentCount} {isLow ? '⚠️ LOW' : ''}
                                 </span>
                             </td>
                         </tr>
                     )})}
                 </tbody>
              </table>
              )}
            </div>
         </div>

      </div>
    </div>
  );
};

export default ResourceManagement;
