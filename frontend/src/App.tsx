import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { MapPage } from './pages/MapPage';
import { DashboardPage } from './pages/DashboardPage';
import { AssetsPage } from './pages/AssetsPage';
import { AssetTypesPage } from './pages/AssetTypesPage';
import { IncidentsPage } from './pages/IncidentsPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<MapPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="asset-types" element={<AssetTypesPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
