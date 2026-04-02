# AI-Powered Integrated Healthcare System (Smart Health System)

> **A comprehensive, role-based, real-time smart healthcare ecosystem.**

The Smart Health System (SHS) is an integrated unified health platform that connects Citizens, Doctors, Hospital Wards, Administrators, and Public Health Officers (PHO). The software leverages real-time data flow, automated workflows, and AI integrations to completely manage a patient's lifecycle from admission and alerts to insurance claims to doctor's discharge.

## 🚀 Features

### 👤 Citizen Portal
- **Family Hub Integration:** Securely manage family relationships (parent-child hierarchy) with Aadhaar-based document verification.
- **Insurance Claims Management:** End-to-end insurance claim tracking with real-time push notifications upon admin approval.
- **Profile & History Overview:** Centralized place to track personal medical history, active prescriptions, and appointments.

### 👩‍⚕️ Doctor Dashboard
- **Smart Calendar Management:** Filter and view only pending appointments securely.
- **Prescription Workflow:** Live-edit prescriptions dynamically in response to warning triggers issued by ward members.
- **Priority Alerts System:** Immediate routing of critical alerts to designated doctors for rapid intervention.
- **Automated Discharge System:** Real-time doctor-triggered discharge workflows that automatically clear hospital ward bed configurations.

### 🏥 Hospital Ward Operations
- **Admitted Patient Monitoring:** Seamless ward notifications natively sent and received by admins and doctors.
- **Emergency Demo Sandbox:** Dedicated "Demo Start" alarm system capability built for hackathon/presentation jury demonstrations.

### 🛡️ Admin & Public Health Officer (PHO) Hub
- **Insurance Workflows:** Integrated clearance network from Citizen request -> Admin Dashboard -> PHO Analytics.
- **Data Analytics:** Deep insights into prevalent health issues, resource availability, and demographics for public health surveillance. 

## 💻 Tech Stack

### Frontend
- **Framework:** React 18 with Vite
- **Routing:** React Router v6
- **Animations:** Framer Motion
- **Data Visualization:** Recharts
- **Icons:** Lucide React

### Backend
- **Framework:** FastAPI
- **Database:** MongoDB (via Motor & PyMongo)
- **AI / OCR & Data Processing:** Scikit-Learn, Pandas, PyTesseract, PyMuPDF, OpenCV
- **Authentication:** JWT (python-jose), PassLib (Bcrypt)

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+)
- Python (3.10+)
- MongoDB connection string

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure `.env`:
   Add necessary MongoDB credentials, JWT secret keys, and API tokens.
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## 👥 Roles & Access

| Role | Responsibilities |
| :--- | :--- |
| **Citizen** | Manage family, access health records, request claims, book appointments. |
| **Doctor** | Manage prescriptions, handle emergency alerts, consult patients, execute discharges. |
| **Ward Staff** | Oversee specific floor and bed operations, triage warnings to doctors. |
| **Admin** | Verify & process claims, system-wide management duties. |
| **P.H.O.** | Macro-level public health analytics and claims surveillance. |

## 💡 Note for Demonstrations
This project contains simulated endpoints and UI tools (e.g. Ward "Demo Start" button, lab injections tools) designed specifically for frictionless hackathon and jury presentations.

---
*Built for the future of connected healthcare.*