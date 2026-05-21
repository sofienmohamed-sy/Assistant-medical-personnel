import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/use-auth';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { queryClient } from '@/lib/query-client';
import LandingPage from '@/pages/landing';
import LoginPage from '@/pages/login';
import SignupPage from '@/pages/signup';
import ForgotPasswordPage from '@/pages/forgot-password';
import OnboardingPage from '@/pages/onboarding';
import PathologiesPage from '@/pages/pathologies';
import GlycemiaListPage from '@/pages/glycemia-list';
import GlycemiaNewPage from '@/pages/glycemia-new';
import HbA1cListPage from '@/pages/hba1c-list';
import HbA1cNewPage from '@/pages/hba1c-new';
import DiabetePlanUrgencePage from '@/pages/diabete-plan-urgence';
import SymptomsNewPage from '@/pages/symptoms-new';
import EquilibriumPage from '@/pages/equilibrium';
import RapportDiabetePage from '@/pages/rapport-diabete';
import AppHome from '@/pages/app';
import './styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element "#root" not found in index.html.');
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pathologies"
              element={
                <ProtectedRoute>
                  <PathologiesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/measurements/glycemia"
              element={
                <ProtectedRoute>
                  <GlycemiaListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/measurements/glycemia/new"
              element={
                <ProtectedRoute>
                  <GlycemiaNewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/measurements/hba1c"
              element={
                <ProtectedRoute>
                  <HbA1cListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/measurements/hba1c/new"
              element={
                <ProtectedRoute>
                  <HbA1cNewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/diabete/plan-urgence"
              element={
                <ProtectedRoute>
                  <DiabetePlanUrgencePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/symptoms/new"
              element={
                <ProtectedRoute>
                  <SymptomsNewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/diabete/equilibrium"
              element={
                <ProtectedRoute>
                  <EquilibriumPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/diabete/rapport"
              element={
                <ProtectedRoute>
                  <RapportDiabetePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppHome />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
