import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import HomePage from './pages/HomePage';
import HumanizerPage from './pages/HumanizerPage';
import PricingPage from './pages/PricingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import AuthCallback from './pages/AuthCallback';
import { useAuthStore } from './store/authStore';
import Success from './pages/Success';

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/humanizer" element={<HumanizerPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/success" element={<Success />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </>
  );
}

export default App;