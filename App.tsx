import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Billing from './pages/Billing';
import StaffPage from './pages/Staff';
import Customers from './pages/Customers';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import ServicesPage from './pages/Services';
import AIConsult from './pages/AIConsult';
import Legal from './pages/Legal';
import AdminDashboard from './pages/AdminDashboard';
import Pricing from './pages/Pricing';
import { LanguageProvider } from './services/i18n';
import { ToastProvider } from './components/Toast';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <ToastProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/staff" element={<StaffPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/ai-consult" element={<AIConsult />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/legal/:page" element={<Legal />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Router>
      </ToastProvider>
    </LanguageProvider>
  );
};

export default App;