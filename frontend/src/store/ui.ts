import { create } from 'zustand';

interface UIState {
  activeLayers: Record<string, boolean>;
  selectedAssetId: number | null;
  mapCenter: [number, number];
  mapZoom: number;
  setLayerVisible: (key: string, visible: boolean) => void;
  setSelectedAssetId: (id: number | null) => void;
  setMapView: (center: [number, number], zoom: number) => void;
  flyToAsset: ((id: number) => void) | null;
  setFlyToAsset: (fn: ((id: number) => void) | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeLayers: {},
  selectedAssetId: null,
  // Default center: 6th of October City, Cairo area
  mapCenter: [30.9876, 29.9387],
  mapZoom: 11,
  setLayerVisible: (key, visible) =>
    set((s) => ({ activeLayers: { ...s.activeLayers, [key]: visible } })),
  setSelectedAssetId: (id) => set({ selectedAssetId: id }),
  setMapView: (center, zoom) => set({ mapCenter: center, mapZoom: zoom }),
  flyToAsset: null,
  setFlyToAsset: (fn) => set({ flyToAsset: fn }),
}));
