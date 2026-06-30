import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DemoBanner } from './components/DemoBanner';
import { MapPage } from './pages/MapPage';
import { DashboardPage } from './pages/DashboardPage';
import { AssetsPage } from './pages/AssetsPage';
import { AssetTypesPage } from './pages/AssetTypesPage';
import { IncidentsPage } from './pages/IncidentsPage';

export function App() {
  return (
    <BrowserRouter>
      <DemoBanner />
      <ErrorBoundary>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<MapPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="assets" element={<AssetsPage />} />
            <Route path="asset-types" element={<AssetTypesPage />} />
            <Route path="incidents" element={<IncidentsPage />} />
          </Route>
        </Routes>
      </ErrorBoundary>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1F2937',
            color: '#F9FAFB',
            border: '1px solid #374151',
            fontSize: '13px',
          },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          success: { iconTheme: { primary: '#22C55E', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  );
}
