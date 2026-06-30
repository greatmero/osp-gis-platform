import { useState, useCallback } from 'react';
import { MapView } from '../components/map/MapView';
import { LayerControl } from '../components/map/LayerControl';
import { AssetDetailPanel } from '../components/map/AssetDetailPanel';
import { AssetSearch } from '../components/map/AssetSearch';
import { AddAssetToolbar } from '../components/map/AddAssetToolbar';
import { AssetForm } from '../components/map/AssetForm';
import { ConnectionForm } from '../components/map/ConnectionForm';
import { useAssetTypes } from '../hooks/useAssetTypes';
import { AssetType } from '../api/client';

interface PendingDraw {
  geometry: Record<string, unknown>;
  assetTypeId: number;
  assetTypeKey: string;
}

export function MapPage() {
  const [pending, setPending] = useState<PendingDraw | null>(null);
  const { data: assetTypes = [] } = useAssetTypes();

  const handleGeometryReady = useCallback(
    (geometry: Record<string, unknown>, assetTypeId: number, assetTypeKey: string) => {
      setPending({ geometry, assetTypeId, assetTypeKey });
    },
    []
  );

  const pendingAssetType = pending
    ? assetTypes.find((t: AssetType) => t.id === pending.assetTypeId)
    : null;

  return (
    <div className="h-full overflow-hidden relative">
      <MapView onGeometryReady={handleGeometryReady} />

      <AssetSearch />
      <LayerControl />
      <AddAssetToolbar />
      <AssetDetailPanel />
      <ConnectionForm />

      {pending && pendingAssetType && (
        <AssetForm
          mode="create"
          assetType={pendingAssetType}
          geometry={pending.geometry}
          onClose={() => setPending(null)}
        />
      )}
    </div>
  );
}
