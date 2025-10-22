import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Category from './pages/Category';
import Categories from './pages/Categories';
import Article from './pages/Article';
import Articles from './pages/Articles';
import AllArticles from './pages/AllArticles';
import Contact from './pages/Contact';
import Newsletter from './pages/Newsletter';
import About from './pages/About';
import Privacy from './pages/Privacy';
import { Toaster } from 'sonner';
import { Admin } from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './hooks/useToast';

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
          <Routes>
            {/* Public routes with Layout */}
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/categoria" element={<Layout><Categories /></Layout>} />
            <Route path="/categoria/:slug" element={<Layout><Category /></Layout>} />
            <Route path="/artigo/:slug" element={<Layout><Article /></Layout>} />
            <Route path="/artigos" element={<Layout><AllArticles /></Layout>} />
            <Route path="/contato" element={<Layout><Contact /></Layout>} />
            <Route path="/newsletter" element={<Layout><Newsletter /></Layout>} />
            <Route path="/sobre" element={<Layout><About /></Layout>} />
            <Route path="/politica-privacidade" element={<Layout><Privacy /></Layout>} />
            
            {/* Admin routes without Layout */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          </Routes>
          </Router>
        </ToastProvider>
        <Toaster 
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1A1A1A',
              color: '#B0B0B0',
              border: '1px solid rgba(106, 13, 173, 0.3)',
            },
          }}
        />
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
