import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PlayerRegistration } from './pages/PlayerRegistration';
import { EventLogger } from './pages/EventLogger';
import { StatsDashboard } from './pages/StatsDashboard';
import { FieldSelection } from './pages/FieldSelection';
import { AdminPage } from './pages/AdminPage';
import { useStore } from './store/useStore';

const ProtectedRoute = () => {
  const { currentField } = useStore();
  if (!currentField) return <Navigate to="/" replace />;
  return <Layout />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FieldSelection />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/players" element={<PlayerRegistration />} />
          <Route path="/logger" element={<EventLogger />} />
          <Route path="/stats" element={<StatsDashboard />} />
        </Route>
        <Route path="/admin_page" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
