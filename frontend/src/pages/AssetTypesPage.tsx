import { useState } from 'react';
import { useAssetTypes } from '../hooks/useAssetTypes';
import { useDeleteAssetType } from '../hooks/useAssetTypeMutations';
import { AssetTypeForm } from '../components/admin/AssetTypeForm';
import { ConfirmDialog } from '../components/map/ConfirmDialog';
import { AssetType } from '../api/client';

const GEOMETRY_BADGE: Record<string, string> = {
  point: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  line: 'bg-green-500/15 text-green-400 border border-green-500/30',
  polygon: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
};

export function AssetTypesPage() {
  const { data: assetTypes = [], isLoading } = useAssetTypes();
  const deleteMutation = useDeleteAssetType();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AssetType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssetType | null>(null);

  function handleDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-950 px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Asset Type Admin</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Define component types and their custom field schemas
          </p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setFormOpen(true); }}
          className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          + New Asset Type
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>Color</span>
          <span>Label / Key</span>
          <span>Geometry</span>
          <span>Fields</span>
          <span>Created</span>
          <span>Actions</span>
        </div>

        {isLoading && (
          <div className="divide-y divide-gray-800">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-4 py-3 flex gap-4 items-center">
                <div className="w-4 h-4 rounded-full bg-gray-800 animate-pulse" />
                <div className="flex-1 h-4 bg-gray-800 rounded animate-pulse" />
                <div className="w-16 h-5 bg-gray-800 rounded animate-pulse" />
                <div className="w-8 h-4 bg-gray-800 rounded animate-pulse" />
                <div className="w-20 h-4 bg-gray-800 rounded animate-pulse" />
                <div className="w-24 h-7 bg-gray-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && assetTypes.length === 0 && (
          <div className="px-4 py-10 text-center text-gray-500 text-sm">No asset types found.</div>
        )}

        {!isLoading && (
          <div className="divide-y divide-gray-800">
            {assetTypes.map((type) => (
              <div
                key={type.id}
                className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-3 items-center hover:bg-gray-800/40 transition-colors"
              >
                {/* Color swatch */}
                <div className="w-4 h-4 rounded-full shrink-0" style={{ background: type.color }} />

                {/* Label + key + icon */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{type.icon}</span>
                    <span className="text-sm font-medium text-white truncate">{type.label}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">{type.key}</span>
                </div>

                {/* Geometry badge */}
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${GEOMETRY_BADGE[type.geometryKind] ?? 'bg-gray-700 text-gray-400'}`}>
                  {type.geometryKind}
                </span>

                {/* Field count */}
                <span className="text-sm text-gray-400 text-center tabular-nums">
                  {type.fieldSchema.length}
                  <span className="text-xs text-gray-600 ml-1">fields</span>
                </span>

                {/* Created date */}
                <span className="text-xs text-gray-600 whitespace-nowrap">
                  {new Date(type.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => { setEditTarget(type); setFormOpen(true); }}
                    className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md border border-gray-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(type)}
                    className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-red-900/40 text-gray-400 hover:text-red-400 rounded-md border border-gray-700 hover:border-red-800 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit form */}
      {formOpen && (
        <AssetTypeForm
          mode={editTarget ? 'edit' : 'create'}
          initialValues={editTarget ?? undefined}
          onClose={() => { setFormOpen(false); setEditTarget(null); }}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          message={`Delete asset type "${deleteTarget.label}"? This will also delete all assets of this type.`}
          confirmLabel="Delete Type"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
