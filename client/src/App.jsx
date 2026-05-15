import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import ToastContainer from './components/ToastContainer';
import BackgroundSelector from './components/BackgroundSelector';
import Login from './pages/Login';
import AuthSuccess from './pages/AuthSuccess';
import Dashboard from './pages/Dashboard';
import NotePage from './pages/NotePage';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import AuroraBackground from './components/AuroraBackground';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ThemeProvider>
          <AuroraBackground />
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/auth/success" element={<AuthSuccess />} />
              <Route
                element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/note/:id" element={<NotePage />} />
              </Route>
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </Router>
          <ToastContainer />
          <BackgroundSelector />
        </ThemeProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;