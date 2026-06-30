import { Popup } from 'react-map-gl/maplibre';
import { AssetType } from '../../api/client';
import { GeoProperties } from '../../hooks/useAssetGeoJSON';

interface Props {
  feature: {
    properties: GeoProperties;
    longitude: number;
    latitude: number;
  };
  assetTypes: AssetType[];
}

const STATUS_STYLES: Record<string, string> = {
  operational: 'bg-green-500/20 text-green-400',
  degraded: 'bg-yellow-500/20 text-yellow-400',
  down: 'bg-red-500/20 text-red-400',
  under_maintenance: 'bg-gray-500/20 text-gray-400',
};

const STATUS_LABELS: Record<string, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
  under_maintenance: 'Under Maintenance',
};

export function HoverPopup({ feature, assetTypes }: Props) {
  const { properties, longitude, latitude } = feature;
  const assetType = assetTypes.find((t) => t.key === properties.assetTypeKey);
  const attrs = properties.attributes ?? {};

  // Show the first 3 field schema entries that have a value
  const topAttrs = (assetType?.fieldSchema ?? [])
    .filter((f) => attrs[f.key] !== undefined && attrs[f.key] !== null && attrs[f.key] !== '')
    .slice(0, 3);

  const statusStyle = STATUS_STYLES[properties.status] ?? 'bg-gray-500/20 text-gray-400';
  const statusLabel = STATUS_LABELS[properties.status] ?? properties.status;

  return (
    <Popup
      longitude={longitude}
      latitude={latitude}
      closeButton={false}
      anchor="bottom"
      offset={12}
      className="osp-popup"
    >
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl min-w-[180px] max-w-[240px]">
        <div className="font-semibold text-white text-sm truncate">{properties.name}</div>
        <div className="flex items-center gap-1.5 mt-1">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: properties.color }}
          />
          <span className="text-xs text-gray-400">{properties.assetTypeLabel}</span>
        </div>
        <div className="mt-1.5">
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusStyle}`}>
            {statusLabel}
          </span>
        </div>
        {topAttrs.length > 0 && (
          <div className="mt-2 border-t border-gray-700 pt-2 space-y-1">
            {topAttrs.map((f) => (
              <div key={f.key} className="flex justify-between gap-2 text-xs">
                <span className="text-gray-500 shrink-0">{f.label}</span>
                <span className="text-gray-300 truncate text-right">
                  {String(attrs[f.key])}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Popup>
  );
}
