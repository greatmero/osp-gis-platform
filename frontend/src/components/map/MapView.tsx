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
import { AssetType } from '../../api/client';
import { HoverPopup } from './HoverPopup';

const STYLES = {
  dark: 'https://tiles.openfreemap.org/styles/dark',
  light: 'https://tiles.openfreemap.org/styles/positron',
};

// Point types that get clustering due to high density
const CLUSTERED_TYPES = new Set(['manhole', 'handhole', 'pole', 'splice_closure']);

interface HoveredFeature {
  properties: GeoProperties;
  longitude: number;
  latitude: number;
}

interface AssetLayerProps {
  assetType: AssetType;
  visible: boolean;
  onHover: (f: HoveredFeature | null) => void;
  onClickFeature: (id: number) => void;
  onClickCluster: (longitude: number, latitude: number, zoom: number) => void;
}

function AssetLayer({ assetType, visible, onHover, onClickFeature, onClickCluster }: AssetLayerProps) {
  const { data } = useAssetGeoJSON(assetType.key, visible);
  const empty: GeoFeatureCollection = { type: 'FeatureCollection', features: [] };
  const geojson = data ?? empty;
  const isClustered = CLUSTERED_TYPES.has(assetType.key) && assetType.geometryKind === 'point';
  const visibility = visible ? 'visible' : 'none';
  const layerId = `layer-${assetType.key}`;
  const clusterLayerId = `cluster-${assetType.key}`;
  const clusterCountId = `cluster-count-${assetType.key}`;

  // Attach event handlers via map events (handled in parent MapView)
  // We expose layer IDs so the parent knows which layers to query
  void onHover;
  void onClickFeature;
  void onClickCluster;

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
        {/* Cluster circles */}
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
        {/* Cluster count label */}
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
        {/* Individual points */}
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

  // polygon
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

export function MapView() {
  const mapRef = useRef<MapRef>(null);
  const [basemap, setBasemap] = useState<'dark' | 'light'>('dark');
  const [hoveredFeature, setHoveredFeature] = useState<HoveredFeature | null>(null);

  const { activeLayers, setSelectedAssetId, setFlyToAsset } = useUIStore();
  const { data: assetTypes = [] } = useAssetTypes();

  // Register flyToAsset callback in Zustand so search can use it
  useEffect(() => {
    setFlyToAsset((id: number) => {
      // Find coordinates from any loaded GeoJSON source (best-effort)
      // The search component calls this with the asset id; we fly to it
      // by asking the map to query the source features
      const map = mapRef.current?.getMap();
      if (!map) return;
      // Query all rendered features to find the one with matching id
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

  // Build set of all interactive layer IDs (non-cluster point layers + line layers)
  const interactiveLayerIds = assetTypes.map((t) => `layer-${t.key}`);
  const clusterLayerIds = assetTypes
    .filter((t) => CLUSTERED_TYPES.has(t.key))
    .map((t) => `cluster-${t.key}`);

  const handleMouseMove = useCallback(
    (e: MapLayerMouseEvent) => {
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
    },
    []
  );

  const handleMouseLeave = useCallback(() => setHoveredFeature(null), []);

  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      const map = mapRef.current?.getMap();
      if (!map) return;

      // Check cluster first
      const clusterFeatures = map.queryRenderedFeatures(e.point, {
        layers: clusterLayerIds,
      });
      if (clusterFeatures.length > 0) {
        const zoom = map.getZoom();
        map.easeTo({ center: e.lngLat, zoom: zoom + 2, duration: 500 });
        return;
      }

      // Check regular feature
      const features = map.queryRenderedFeatures(e.point, {
        layers: interactiveLayerIds,
      });
      if (features.length > 0) {
        const props = features[0].properties as { id?: number };
        if (props?.id) {
          setSelectedAssetId(props.id);
        }
      } else {
        // Click on empty space closes the panel
        setSelectedAssetId(null);
      }
    },
    [clusterLayerIds, interactiveLayerIds, setSelectedAssetId]
  );

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 30.9876,
          latitude: 29.9387,
          zoom: 11,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={STYLES[basemap]}
        interactiveLayerIds={[...interactiveLayerIds, ...clusterLayerIds]}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        cursor={hoveredFeature ? 'pointer' : 'grab'}
      >
        {assetTypes.map((type) => (
          <AssetLayer
            key={type.key}
            assetType={type}
            visible={activeLayers[type.key] !== false}
            onHover={setHoveredFeature}
            onClickFeature={setSelectedAssetId}
            onClickCluster={() => {}}
          />
        ))}

        {hoveredFeature && (
          <HoverPopup
            feature={hoveredFeature}
            assetTypes={assetTypes}
          />
        )}
      </Map>

      {/* Basemap switcher — bottom right */}
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
