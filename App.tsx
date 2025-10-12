import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Public pages
import HomePanel from './pages/public/HomePanel';
import LegalNotice from './pages/public/LegalNotice';
import Blog from './pages/public/Blog';
import CategoryList from './pages/public/CategoryList';
import SupplierDetail from './pages/public/SupplierDetail';
import PlanesProveedor from './src/pages/proveedores/planes';

// Admin pages and layout
import AdminLogin from './pages/admin/AdminLogin';
import AdminPanel from './pages/admin/AdminPanel';
import BlogAdmin from './pages/admin/BlogAdmin';
import BlogPostsAdmin from './pages/admin/BlogPostsAdmin';
import AdminLayout from './components/layouts/AdminLayout';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/embed" element={<HomePanel />} />
            <Route path="/categoria/:slug" element={<CategoryList />} />
            <Route path="/proveedor/:id" element={<SupplierDetail />} />
            <Route path="/proveedores/planes" element={<PlanesProveedor />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/legal" element={<LegalNotice />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route element={<AdminLayout />}>
              <Route path="/admin/panel" element={<AdminPanel />} />
              <Route path="/admin/blog" element={<BlogAdmin />} />
              <Route path="/admin/blog-posts" element={<BlogPostsAdmin />} />
            </Route>

            {/* Default route */}
            <Route path="/" element={<HomePanel />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
