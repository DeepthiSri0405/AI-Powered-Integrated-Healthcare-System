import React from 'react'
import { Routes, Route } from 'react-router-dom'

// Citizen Pages
import CitizenDashboard from '../pages/citizen/Dashboard'
import Appointments from '../pages/citizen/Appointments'
import Records from '../pages/citizen/Records'
import LabTests from '../pages/citizen/LabTests'
import WearableMonitor from '../pages/citizen/WearableMonitor'
import FamilyHub from '../pages/citizen/FamilyHub'

// Doctor Pages
import DoctorDashboard from '../pages/doctor/Dashboard'
import Patients from '../pages/doctor/Patients'
import Prescription from '../pages/doctor/Prescription'
import DoctorHistory from '../pages/doctor/History'

// Lab Pages
import LabDashboard from '../pages/lab/Dashboard'

// Ward Pages
import WardDashboard from '../pages/ward/WardDashboard'

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard'
import ResourceManagement from '../pages/admin/ResourceManagement'

// Common Pages
import LandingPage from '../pages/common/LandingPage'
import LoginPage from '../pages/common/LoginPage'
import VirtualConsultation from '../pages/common/VirtualConsultation'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Citizen Flow */}
      <Route path="/citizen" element={<CitizenDashboard />} />
      <Route path="/citizen/appointments" element={<Appointments />} />
      <Route path="/citizen/records" element={<Records />} />
      <Route path="/citizen/lab-tests" element={<LabTests />} />
      <Route path="/citizen/iot-monitor" element={<WearableMonitor />} />
      <Route path="/citizen/family" element={<FamilyHub />} />
      
      {/* Doctor Flow */}
      <Route path="/doctor" element={<DoctorDashboard />} />
      <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
      <Route path="/doctor/history" element={<DoctorHistory />} />
      <Route path="/doctor/patients" element={<Patients />} />
      <Route path="/doctor/prescription" element={<Prescription />} />
      
      {/* Lab Flow */}
      <Route path="/lab" element={<LabDashboard />} />
      
      {/* Ward Flow */}
      <Route path="/ward" element={<WardDashboard />} />
      
      {/* Admin Flow */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/resources" element={<ResourceManagement />} />
      
      {/* Consultation */}
      <Route path="/consultation" element={<VirtualConsultation />} />
    </Routes>
  )
}

export default AppRoutes
