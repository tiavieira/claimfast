import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { LoginPage } from './pages/Auth/LoginPage';
import { AppLayout } from './pages/Layout/AppLayout';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { NewClaimPage } from './pages/Claim/NewClaimPage';
import { ClaimDetailPage } from './pages/Claim/ClaimDetailPage';
import { InsurerDashboardPage } from './pages/Insurer/InsurerDashboardPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const { isAuthenticated, loadProfile } = useAuthStore();
  useEffect(() => { if (isAuthenticated) loadProfile(); }, [isAuthenticated]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="claim/new" element={<NewClaimPage />} />
        <Route path="claim/:id" element={<ClaimDetailPage />} />
      </Route>
      <Route path="/insurer" element={<InsurerDashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
