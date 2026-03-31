import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../../services/authService';
import { MapPin, Activity, AlertTriangle, ShieldAlert } from 'lucide-react';
import '../../styles/core.css';

const DiseaseSurveillance = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSurveillance = async () => {
            try {
                const res = await axios.get('/api/pho/surveillance/heatmap', {
                    headers: { Authorization: `Bearer ${authService.getToken()}` }
                });
                setData(res.data);
            } catch (err) {
                console.error("Failed to load surveillance data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSurveillance();
    }, []);

    if (loading || !data) {
        return <div style={{ padding: '60px', textAlign: 'center', color: '#3b82f6' }}>Initializing Bio-surveillance Radars...</div>;
    }

    // Render an abstract heatmap grid based on hotspot data
    // In a real application, this would be a react-leaflet or mapbox instance.
    const renderHeatmap = () => {
        return (
            <div className="glass-container" style={{ position: 'relative', height: '500px', background: '#0f172a', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                {/* Abstract grid lines */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                
                {/* Simulated Radar Scanner */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', width: '100%', height: '100%', background: 'conic-gradient(from 0deg, transparent 70%, rgba(59, 130, 246, 0.2) 100%)', transformOrigin: '0 0', animation: 'spin 4s linear infinite', pointerEvents: 'none' }} />
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                
                {/* Simulated Heatmap Points based on lat/lng */}
                {data.heatmap_points.map((pt, i) => {
                    // Normalizing mock lat/lng to percentages
                    const top = ((pt.lat - 17.38) / 0.12) * 100;
                    const left = ((pt.lng - 78.34) / 0.22) * 100;
                    
                    // Cap bounds between 10% and 90%
                    const boundedTop = Math.max(10, Math.min(top, 90));
                    const boundedLeft = Math.max(10, Math.min(left, 90));

                    // Weight color 
                    const color = pt.weight > 0.8 ? 'rgba(239, 68, 68, 0.7)' : (pt.weight > 0.5 ? 'rgba(245, 158, 11, 0.6)' : 'rgba(16, 185, 129, 0.5)');
                    const blurSize = pt.weight > 0.8 ? '40px' : '20px';

                    return (
                        <div key={i} style={{
                            position: 'absolute',
                            top: `${boundedTop}%`,
                            left: `${boundedLeft}%`,
                            width: pt.weight > 0.8 ? '30px' : '15px',
                            height: pt.weight > 0.8 ? '30px' : '15px',
                            background: color,
                            borderRadius: '50%',
                            boxShadow: `0 0 ${blurSize} ${color}`,
                            filter: 'blur(8px)'
                        }} />
                    );
                })}

                {/* Overlays */}
                <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(0,0,0,0.6)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '0.9rem' }}>Legend</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>
                        <div style={{ width: '12px', height: '12px', background: 'rgba(239, 68, 68, 0.7)', borderRadius: '50%' }} /> High Density Cluster
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        <div style={{ width: '12px', height: '12px', background: 'rgba(245, 158, 11, 0.7)', borderRadius: '50%' }} /> Moderate Spread
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '12px' }}>
                    <Activity size={32} color="#3b82f6" />
                </div>
                <div>
                    <h1 style={{ fontSize: '2.5rem', color: '#fff', margin: 0 }}>Disease Surveillance</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '4px' }}>Real-time epidemiological heatmaps and area-wise pathogen tracking.</p>
                </div>
            </div>

            {data.active_outbreaks && data.active_outbreaks.length > 0 && (
                <div style={{ marginBottom: '32px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '16px 24px', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <ShieldAlert size={32} color="#ef4444" style={{ marginTop: '4px' }} />
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 8px 0', color: '#ef4444', fontSize: '1.2rem', textTransform: 'uppercase' }}>Active Outbreak Alerts ({data.active_outbreaks.length})</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {data.active_outbreaks.map((ob, idx) => (
                                <div key={idx} style={{ color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertTriangle size={14} /> <strong>{ob.alert}</strong> cases surging in {ob.area}. Current count: {ob.cases} active. Trend: {ob.trend.toUpperCase()}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Interactive Heatmap */}
            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '1.4rem' }}>Live Topographic Radar</h3>
                {renderHeatmap()}
            </div>

            {/* Regional Breakdown Grid */}
            <h3 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '1.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>Regional Spread Vectors</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {data.hotspots.map((h, i) => (
                    <div key={i} className="glass-container" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                        {h.trend === 'critical' && <div style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: '#fff', fontSize: '0.7rem', padding: '4px 8px', borderBottomLeftRadius: '8px', fontWeight: 'bold' }}>CRITICAL ZONE</div>}
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>
                            <MapPin size={16} color="var(--primary)" /> {h.area}
                        </div>
                        
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
                            {h.cases} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>active cases</span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '0.85rem', color: h.trend === 'falling' ? '#10b981' : (h.trend === 'stable' ? '#f59e0b' : '#ef4444'), textTransform: 'uppercase', fontWeight: 'bold' }}>
                                TREND: {h.trend}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '12px' }}>
                                {h.alert}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default DiseaseSurveillance;
