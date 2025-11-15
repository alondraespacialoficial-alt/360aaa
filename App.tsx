import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AIStatusProvider } from './context/AIStatusContext';

// Public pages
import HomePanel from './pages/public/HomePanel';
import LegalNotice from './pages/public/LegalNotice';
import Blog from './pages/public/Blog';
import CategoryList from './pages/public/CategoryList';
import SupplierDetail from './pages/public/SupplierDetail';
import FavoritesPage from './pages/public/FavoritesPage';
import PlanesProveedor from './src/pages/proveedores/planes';
import RegistroProveedor from './src/pages/proveedores/registro';

// Admin pages and layout
import AdminLogin from './pages/admin/AdminLogin';
import AdminPanel from './pages/admin/AdminPanel';
import BlogAdmin from './pages/admin/BlogAdmin';
import BlogPostsAdmin from './pages/admin/BlogPostsAdmin';
import DiagnosticPage from './pages/admin/DiagnosticPage';
import TestFiltersPage from './pages/admin/TestFiltersPage';
import SearchTestPage from './pages/admin/SearchTestPage';
import DebugPage from './pages/DebugPage';
import AdminLayout from './components/layouts/AdminLayout';
import ErrorBoundary from './components/ErrorBoundary';
import AIFloatingChat from './components/AIFloatingChat';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AIStatusProvider>
            <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/embed" element={<Navigate to="/" replace />} />
            <Route path="/categoria/:slug" element={<CategoryList />} />
            <Route path="/proveedor/:id" element={<SupplierDetail />} />
            <Route path="/favoritos" element={<FavoritesPage />} />
            <Route path="/proveedores/planes" element={<PlanesProveedor />} />
            <Route path="/registro-proveedor" element={<RegistroProveedor />} />
            <Route path="/proveedores/registro" element={<RegistroProveedor />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/legal" element={<LegalNotice />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/diagnostico" element={<DiagnosticPage />} />
            <Route path="/admin/test-filtros" element={<TestFiltersPage />} />
            <Route path="/admin/test-busqueda" element={<SearchTestPage />} />
            <Route path="/debug" element={<DebugPage />} />
            <Route element={<AdminLayout />}>
              <Route path="/admin/panel" element={<AdminPanel />} />
              <Route path="/admin/blog" element={<BlogAdmin />} />
              <Route path="/admin/blog-posts" element={<BlogPostsAdmin />} />
            </Route>

            {/* Default route */}
            <Route path="/" element={<HomePanel />} />
          </Routes>
          
          {/* Asistente Virtual flotante disponible en toda la app */}
          <AIFloatingChat />
          
            </BrowserRouter>
          </AIStatusProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
