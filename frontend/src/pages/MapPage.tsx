import { MapView } from '../components/map/MapView';
import { LayerControl } from '../components/map/LayerControl';
import { AssetDetailPanel } from '../components/map/AssetDetailPanel';
import { AssetSearch } from '../components/map/AssetSearch';

export function MapPage() {
  return (
    <div className="h-full overflow-hidden relative">
      {/* Full-height map */}
      <MapView />

      {/* Overlays */}
      <AssetSearch />
      <LayerControl />
      <AssetDetailPanel />
    </div>
  );
}
