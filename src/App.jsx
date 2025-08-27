import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SubjectProvider } from './context/SubjectContext';
import { SyllabusProvider } from './context/SyllabusContext';
import { AuditLogProvider } from './context/AuditLogContext';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './components/Login';
import ProtectedRoute from './components/ProtectecRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect } from 'react';
import { initializeAuth } from './store/auth/authThunks';
import './App.css'; // Make sure this import exists

function App() {
  // Initialize auth state on app load
  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <SubjectProvider>
      <SyllabusProvider>
        <AuditLogProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              } />
            </Routes>
            <ToastContainer position="top-right" autoClose={3000} />
          </Router>
        </AuditLogProvider>
      </SyllabusProvider>
    </SubjectProvider>
  );
}

export default App;