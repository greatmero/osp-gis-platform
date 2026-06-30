import { useRef, useEffect, useState, useCallback } from 'react';
import Map, {
  Source,
  Layer,
  MapRef,
  MapMouseEvent,
  MapLayerMouseEvent,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useUIStore } from '../../store/ui';
import { useAssetTypes } from '../../hooks/useAssetTypes';
import { useAssetGeoJSON, GeoFeatureCollection, GeoProperties } from '../../hooks/useAssetGeoJSON';
import { useConnectionsGeoJSON } from '../../hooks/useConnections';
import { AssetType } from '../../api/client';
import { HoverPopup } from './HoverPopup';

const STYLES = {
  dark: 'https://tiles.openfreemap.org/styles/dark',
  light: 'https://tiles.openfreemap.org/styles/positron',
};

const CLUSTERED_TYPES = new Set(['manhole', 'handhole', 'pole', 'splice_closure']);

interface HoveredFeature {
  properties: GeoProperties;
  longitude: number;
  latitude: number;
}

interface AssetLayerProps {
  assetType: AssetType;
  visible: boolean;
}

function AssetLayer({ assetType, visible }: AssetLayerProps) {
  const { data } = useAssetGeoJSON(assetType.key, visible);
  const empty: GeoFeatureCollection = { type: 'FeatureCollection', features: [] };
  const geojson = data ?? empty;
  const isClustered = CLUSTERED_TYPES.has(assetType.key) && assetType.geometryKind === 'point';
  const visibility = visible ? 'visible' : 'none';
  const layerId = `layer-${assetType.key}`;
  const clusterLayerId = `cluster-${assetType.key}`;
  const clusterCountId = `cluster-count-${assetType.key}`;

  if (assetType.geometryKind === 'point') {
    return (
      <Source
        id={assetType.key}
        type="geojson"
        data={geojson}
        cluster={isClustered}
        clusterMaxZoom={14}
        clusterRadius={50}
      >
        {isClustered && (
          <Layer
            id={clusterLayerId}
            type="circle"
            filter={['has', 'point_count']}
            paint={{
              'circle-color': assetType.color,
              'circle-radius': ['step', ['get', 'point_count'], 16, 5, 22, 20, 28],
              'circle-opacity': 0.85,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff',
            }}
            layout={{ visibility }}
          />
        )}
        {isClustered && (
          <Layer
            id={clusterCountId}
            type="symbol"
            filter={['has', 'point_count']}
            layout={{
              'text-field': '{point_count_abbreviated}',
              'text-size': 12,
              'text-font': ['Noto Sans Regular'],
              visibility,
            }}
            paint={{ 'text-color': '#fff' }}
          />
        )}
        <Layer
          id={layerId}
          type="circle"
          filter={isClustered ? ['!', ['has', 'point_count']] : ['all']}
          paint={{
            'circle-color': assetType.color,
            'circle-radius': 6,
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.9,
          }}
          layout={{ visibility }}
        />
      </Source>
    );
  }

  if (assetType.geometryKind === 'line') {
    return (
      <Source id={assetType.key} type="geojson" data={geojson}>
        <Layer
          id={layerId}
          type="line"
          paint={{
            'line-color': assetType.color,
            'line-width': 2.5,
            'line-opacity': 0.85,
          }}
          layout={{ 'line-cap': 'round', 'line-join': 'round', visibility }}
        />
      </Source>
    );
  }

  return (
    <Source id={assetType.key} type="geojson" data={geojson}>
      <Layer
        id={layerId}
        type="fill"
        paint={{ 'fill-color': assetType.color, 'fill-opacity': 0.4 }}
        layout={{ visibility }}
      />
      <Layer
        id={`${layerId}-outline`}
        type="line"
        paint={{ 'line-color': assetType.color, 'line-width': 1.5 }}
        layout={{ visibility }}
      />
    </Source>
  );
}

interface MapViewProps {
  onGeometryReady: (
    geometry: Record<string, unknown>,
    assetTypeId: number,
    assetTypeKey: string
  ) => void;
}

export function MapView({ onGeometryReady }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [basemap, setBasemap] = useState<'dark' | 'light'>('dark');
  const [hoveredFeature, setHoveredFeature] = useState<HoveredFeature | null>(null);

  const {
    activeLayers,
    setSelectedAssetId,
    setFlyToAsset,
    drawMode,
    drawCoords,
    addDrawCoord,
    clearDraw,
    connectionMode,
    connectionAssetIds,
    addConnectionAsset,
  } = useUIStore();

  const { data: assetTypes = [] } = useAssetTypes();
  const connectionsGeoJSON = useConnectionsGeoJSON();

  // Disable map double-click zoom while drawing so dblclick can finish line/polygon
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (drawMode) {
      map.doubleClickZoom.disable();
    } else {
      map.doubleClickZoom.enable();
    }
  }, [drawMode]);

  // Register flyToAsset callback in Zustand
  useEffect(() => {
    setFlyToAsset((id: number) => {
      const map = mapRef.current?.getMap();
      if (!map) return;
      const features = map.queryRenderedFeatures(undefined, {
        filter: ['==', ['get', 'id'], id],
      });
      if (features.length > 0) {
        const geom = features[0].geometry;
        if (geom.type === 'Point') {
          map.flyTo({ center: geom.coordinates as [number, number], zoom: 15, duration: 1200 });
        } else if (geom.type === 'LineString') {
          const coords = geom.coordinates as [number, number][];
          const mid = coords[Math.floor(coords.length / 2)];
          map.flyTo({ center: mid, zoom: 13, duration: 1200 });
        }
      }
    });
    return () => setFlyToAsset(null);
  }, [setFlyToAsset]);

  const interactiveLayerIds = assetTypes.map((t) => `layer-${t.key}`);
  const clusterLayerIds = assetTypes
    .filter((t) => CLUSTERED_TYPES.has(t.key))
    .map((t) => `cluster-${t.key}`);

  const handleMouseMove = useCallback((e: MapLayerMouseEvent) => {
    if (drawMode || connectionMode) { setHoveredFeature(null); return; }
    if (e.features && e.features.length > 0) {
      const f = e.features[0];
      const props = f.properties as GeoProperties;
      if (props?.id) {
        setHoveredFeature({
          properties: {
            ...props,
            attributes:
              typeof props.attributes === 'string'
                ? JSON.parse(props.attributes)
                : (props.attributes ?? {}),
          },
          longitude: e.lngLat.lng,
          latitude: e.lngLat.lat,
        });
        return;
      }
    }
    setHoveredFeature(null);
  }, [drawMode, connectionMode]);

  const handleMouseLeave = useCallback(() => setHoveredFeature(null), []);

  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      // Drawing mode
      if (drawMode) {
        const { lng, lat } = e.lngLat;
        if (drawMode.geometryKind === 'point') {
          onGeometryReady(
            { type: 'Point', coordinates: [lng, lat] },
            drawMode.assetTypeId,
            drawMode.assetTypeKey
          );
          clearDraw();
        } else {
          addDrawCoord([lng, lat]);
        }
        return;
      }

      // Connection mode — pick asset by click
      if (connectionMode) {
        const features = map.queryRenderedFeatures(e.point, { layers: interactiveLayerIds });
        if (features.length > 0) {
          const props = features[0].properties as { id?: number };
          if (props?.id && !connectionAssetIds.includes(props.id)) {
            addConnectionAsset(props.id);
          }
        }
        return;
      }

      // Normal: cluster zoom or feature select
      const clusterFeatures = map.queryRenderedFeatures(e.point, { layers: clusterLayerIds });
      if (clusterFeatures.length > 0) {
        const zoom = map.getZoom();
        map.easeTo({ center: e.lngLat, zoom: zoom + 2, duration: 500 });
        return;
      }

      const features = map.queryRenderedFeatures(e.point, { layers: interactiveLayerIds });
      if (features.length > 0) {
        const props = features[0].properties as { id?: number };
        if (props?.id) setSelectedAssetId(props.id);
      } else {
        setSelectedAssetId(null);
      }
    },
    [
      drawMode, connectionMode, connectionAssetIds,
      addDrawCoord, addConnectionAsset, clearDraw, onGeometryReady,
      clusterLayerIds, interactiveLayerIds, setSelectedAssetId,
    ]
  );

  // Finish line/polygon on double-click
  const handleDblClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (!drawMode) return;
      e.preventDefault();
      // The second single-click of the dblclick already added a duplicate coord; exclude it
      const finalCoords = drawCoords.slice(0, -1);
      if (drawMode.geometryKind === 'line' && finalCoords.length >= 2) {
        onGeometryReady(
          { type: 'LineString', coordinates: finalCoords },
          drawMode.assetTypeId,
          drawMode.assetTypeKey
        );
        clearDraw();
      } else if (drawMode.geometryKind === 'polygon' && finalCoords.length >= 3) {
        onGeometryReady(
          { type: 'Polygon', coordinates: [[...finalCoords, finalCoords[0]]] },
          drawMode.assetTypeId,
          drawMode.assetTypeKey
        );
        clearDraw();
      }
    },
    [drawMode, drawCoords, onGeometryReady, clearDraw]
  );

  // Build draw preview GeoJSON (loose typing — Source accepts generic GeoJSON)
  const previewLineGeoJSON = {
    type: 'FeatureCollection' as const,
    features:
      drawCoords.length >= 2
        ? [{ type: 'Feature' as const, geometry: { type: 'LineString' as const, coordinates: drawCoords }, properties: null }]
        : [],
  };
  const previewPointsGeoJSON = {
    type: 'FeatureCollection' as const,
    features: drawCoords.map((c) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: c },
      properties: null,
    })),
  };

  const cursor = drawMode || connectionMode ? 'crosshair' : hoveredFeature ? 'pointer' : 'grab';

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 30.9876, latitude: 29.9387, zoom: 11 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={STYLES[basemap]}
        interactiveLayerIds={[...interactiveLayerIds, ...clusterLayerIds]}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onDblClick={handleDblClick}
        cursor={cursor}
      >
        {/* Asset layers */}
        {assetTypes.map((type) => (
          <AssetLayer
            key={type.key}
            assetType={type}
            visible={activeLayers[type.key] !== false}
          />
        ))}

        {/* Connection lines */}
        <Source id="connections" type="geojson" data={connectionsGeoJSON}>
          <Layer
            id="connections-layer"
            type="line"
            paint={{
              'line-color': '#6B7280',
              'line-width': 1.5,
              'line-opacity': 0.6,
              'line-dasharray': [3, 2],
            }}
          />
        </Source>

        {/* Draw preview */}
        {drawCoords.length > 0 && (
          <>
            <Source id="draw-preview-line" type="geojson" data={previewLineGeoJSON}>
              <Layer
                id="draw-preview-line-layer"
                type="line"
                paint={{
                  'line-color': '#60A5FA',
                  'line-width': 2,
                  'line-dasharray': [2, 2],
                }}
              />
            </Source>
            <Source id="draw-preview-points" type="geojson" data={previewPointsGeoJSON}>
              <Layer
                id="draw-preview-points-layer"
                type="circle"
                paint={{
                  'circle-color': '#60A5FA',
                  'circle-radius': 5,
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#fff',
                }}
              />
            </Source>
          </>
        )}

        {hoveredFeature && !drawMode && !connectionMode && (
          <HoverPopup feature={hoveredFeature} assetTypes={assetTypes} />
        )}
      </Map>

      {/* Basemap switcher */}
      <div className="absolute bottom-8 right-4 flex gap-1 z-10">
        <button
          onClick={() => setBasemap('dark')}
          className={`px-3 py-1.5 text-xs rounded-l-md border font-medium transition-colors ${
            basemap === 'dark'
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white'
          }`}
        >
          Dark
        </button>
        <button
          onClick={() => setBasemap('light')}
          className={`px-3 py-1.5 text-xs rounded-r-md border font-medium transition-colors ${
            basemap === 'light'
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white'
          }`}
        >
          Light
        </button>
      </div>
    </div>
  );
}
