import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { FieldSelection } from './pages/FieldSelection';
import { PlayerRegistration } from './pages/PlayerRegistration';
import { EventLogger } from './pages/EventLogger';
import { StatsDashboard } from './pages/StatsDashboard';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { useStore } from './store/useStore';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useStore();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminPage />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/field-selection" replace />} />
            <Route
              path="/field-selection"
              element={
                <ProtectedRoute>
                  <FieldSelection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/players"
              element={
                <ProtectedRoute>
                  <PlayerRegistration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logger"
              element={
                <ProtectedRoute>
                  <EventLogger />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stats"
              element={
                <ProtectedRoute>
                  <StatsDashboard />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
