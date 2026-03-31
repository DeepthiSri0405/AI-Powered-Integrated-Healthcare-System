import React from 'react'
import { Routes, Route } from 'react-router-dom'

// Citizen Pages
import CitizenDashboard from '../pages/citizen/Dashboard'
import Appointments from '../pages/citizen/Appointments'
import Records from '../pages/citizen/Records'
import LabTests from '../pages/citizen/LabTests'
import WearableMonitor from '../pages/citizen/WearableMonitor'
import FamilyHub from '../pages/citizen/FamilyHub'
import CitizenInsurance from '../pages/citizen/Insurance'

// Doctor Pages
import DoctorDashboard from '../pages/doctor/Dashboard'
import Patients from '../pages/doctor/Patients'
import Prescription from '../pages/doctor/Prescription'
import DoctorHistory from '../pages/doctor/History'

// Lab Pages
import LabDashboard from '../pages/lab/Dashboard'

// Ward Pages
import WardDashboard from '../pages/ward/WardDashboard'
import AdminNotificationsPanel from '../pages/ward/AdminNotificationsPanel'

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard'
import ResourceManagement from '../pages/admin/ResourceManagement'
import IotSimulator from '../pages/admin/IotSimulator'
import AdminAttendance from '../pages/admin/Attendance'
import AdminInsurance from '../pages/admin/InsuranceClaims'
import AdminAnalytics from '../pages/admin/Analytics'
import AdminAnnouncements from '../pages/admin/Announcements'

// PHO Pages
import PHODashboard from '../pages/pho/Dashboard'
import HospitalAnalytics from '../pages/pho/HospitalAnalytics'
import DiseaseSurveillance from '../pages/pho/DiseaseSurveillance'
import GlobalAnnouncements from '../pages/pho/GlobalAnnouncements'
import InsuranceOversight from '../pages/pho/InsuranceOversight'

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
      <Route path="/citizen/insurance" element={<CitizenInsurance />} />
      
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
      <Route path="/ward/notifications" element={<AdminNotificationsPanel />} />
      
      {/* Admin Flow */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/resources" element={<ResourceManagement />} />
      <Route path="/admin/iot-simulator" element={<IotSimulator />} />
      <Route path="/admin/attendance" element={<AdminAttendance />} />
      <Route path="/admin/insurance" element={<AdminInsurance />} />
      <Route path="/admin/analytics" element={<AdminAnalytics />} />
      <Route path="/admin/announcements" element={<AdminAnnouncements />} />
      
      {/* PHO Flow */}
      <Route path="/pho" element={<PHODashboard />} />
      <Route path="/pho/analytics" element={<HospitalAnalytics />} />
      <Route path="/pho/surveillance" element={<DiseaseSurveillance />} />
      <Route path="/pho/announcements" element={<GlobalAnnouncements />} />
      <Route path="/pho/insurance" element={<InsuranceOversight />} />
      
      {/* Consultation */}
      <Route path="/consultation" element={<VirtualConsultation />} />
    </Routes>
  )
}

export default AppRoutes
