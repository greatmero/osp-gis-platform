import { create } from 'zustand';

export interface DrawMode {
  assetTypeId: number;
  assetTypeKey: string;
  geometryKind: 'point' | 'line' | 'polygon';
  label: string;
  color: string;
}

interface UIState {
  // Map layers
  activeLayers: Record<string, boolean>;
  setLayerVisible: (key: string, visible: boolean) => void;

  // Selected asset (detail panel)
  selectedAssetId: number | null;
  setSelectedAssetId: (id: number | null) => void;

  // Map view
  mapCenter: [number, number];
  mapZoom: number;
  setMapView: (center: [number, number], zoom: number) => void;

  // Fly-to callback registered by MapView
  flyToAsset: ((id: number) => void) | null;
  setFlyToAsset: (fn: ((id: number) => void) | null) => void;

  // Drawing mode
  drawMode: DrawMode | null;
  drawCoords: [number, number][];
  setDrawMode: (m: DrawMode | null) => void;
  addDrawCoord: (c: [number, number]) => void;
  clearDraw: () => void;

  // Connection drawing
  connectionMode: boolean;
  connectionAssetIds: number[];
  setConnectionMode: (on: boolean) => void;
  addConnectionAsset: (id: number) => void;
  clearConnection: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeLayers: {},
  setLayerVisible: (key, visible) =>
    set((s) => ({ activeLayers: { ...s.activeLayers, [key]: visible } })),

  selectedAssetId: null,
  setSelectedAssetId: (id) => set({ selectedAssetId: id }),

  mapCenter: [30.9876, 29.9387],
  mapZoom: 11,
  setMapView: (center, zoom) => set({ mapCenter: center, mapZoom: zoom }),

  flyToAsset: null,
  setFlyToAsset: (fn) => set({ flyToAsset: fn }),

  drawMode: null,
  drawCoords: [],
  setDrawMode: (m) => set({ drawMode: m, drawCoords: [] }),
  addDrawCoord: (c) => set((s) => ({ drawCoords: [...s.drawCoords, c] })),
  clearDraw: () => set({ drawMode: null, drawCoords: [] }),

  connectionMode: false,
  connectionAssetIds: [],
  setConnectionMode: (on) => set({ connectionMode: on, connectionAssetIds: [] }),
  addConnectionAsset: (id) =>
    set((s) => ({ connectionAssetIds: [...s.connectionAssetIds, id] })),
  clearConnection: () => set({ connectionMode: false, connectionAssetIds: [] }),
}));
