import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  User, 
  Calendar, 
  FileText, 
  Stethoscope, 
  Microscope, 
  LayoutDashboard, 
  Terminal, 
  Settings,
  ChevronRight,
  Monitor,
  LogOut,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import authService from '../../services/authService';

const MainLayout = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const location = useLocation();
  const navigate = useNavigate();
  const isLanding = location.pathname === '/' || location.pathname === '/login';

  React.useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    if (!user && !isLanding) {
      navigate('/login');
    }
  }, [location.pathname, isLanding, navigate]);

  if (isLanding) return <>{children}</>;

  if (!currentUser) return null;

  const role = currentUser.role === 'WardRoom' ? 'Ward' : currentUser.role;

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const menus = {
    Citizen: [
      { name: 'Dashboard', path: '/citizen', icon: <LayoutDashboard size={20} /> },
      { name: 'Appointments', path: '/citizen/appointments', icon: <Calendar size={20} /> },
      { name: 'Family Network', path: '/citizen/family', icon: <Users size={20} /> },
      { name: 'Records', path: '/citizen/records', icon: <FileText size={20} /> },
      { name: 'IoT Monitor', path: '/citizen/iot-monitor', icon: <Activity size={20} /> },
      { name: 'Lab Tests', path: '/citizen/lab-tests', icon: <Microscope size={20} /> },
    ],
    Doctor: [
      { name: 'Dashboard', path: '/doctor', icon: <Stethoscope size={20} /> },
      { name: 'Patient List', path: '/doctor/patients', icon: <User size={20} /> },
      { name: 'Appointments History', path: '/doctor/history', icon: <FileText size={20} /> },
    ],
    Ward: [
      { name: 'Ward Terminal', path: '/ward', icon: <Terminal size={20} /> },
    ],
    Admin: [
      { name: 'Admin Hub', path: '/admin', icon: <LayoutDashboard size={20} /> },
      { name: 'Resources', path: '/admin/resources', icon: <Settings size={20} /> },
    ],
    LabOperator: [
      { name: 'Lab Queue', path: '/lab', icon: <Microscope size={20} /> },
    ]
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        style={{ 
          width: '260px', 
          background: 'rgba(30, 41, 59, 0.4)', 
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity color="white" />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 'bold', letterSpacing: '-0.5px' }}>SmartHealth</span>
        </div>

        <div style={{ marginBottom: '32px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Active User</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff' }}>{currentUser.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '2px' }}>{currentUser.role}</div>
        </div>

        <nav style={{ flex: 1 }}>
          {menus[role].map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                marginBottom: '8px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive ? '#fff' : 'var(--text-muted)',
                background: isActive ? 'var(--primary)' : 'transparent',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              })}
            >
              {item.icon}
              <span style={{ fontSize: '0.95rem' }}>{item.name}</span>
              <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
            </NavLink>
          ))}
        </nav>

        <button 
            onClick={handleLogout}
            style={{ 
                marginTop: 'auto', 
                padding: '12px', 
                background: 'rgba(239, 68, 68, 0.1)', 
                borderRadius: '12px', 
                border: '1px solid #ef4444', 
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                cursor: 'pointer',
                fontSize: '0.9rem'
            }}
        >
            <LogOut size={18} />
            <span>Sign Out</span>
        </button>
      </motion.aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ paddingBottom: '80px' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MainLayout;
