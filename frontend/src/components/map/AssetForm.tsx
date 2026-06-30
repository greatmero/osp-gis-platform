import { useState, FormEvent } from 'react';
import { AssetType, Asset, FieldSchema } from '../../api/client';
import { useCreateAsset, useUpdateAsset } from '../../hooks/useAssetMutations';

interface Props {
  mode: 'create' | 'edit';
  assetType: AssetType;
  geometry?: Record<string, unknown>;
  initialValues?: Partial<Asset>;
  onClose: () => void;
}

const STATUS_OPTIONS = [
  { value: 'operational', label: 'Operational' },
  { value: 'degraded', label: 'Degraded' },
  { value: 'down', label: 'Down' },
  { value: 'under_maintenance', label: 'Under Maintenance' },
];

function FieldInput({
  field,
  value,
  onChange,
  error,
}: {
  field: FieldSchema;
  value: unknown;
  onChange: (v: unknown) => void;
  error?: string;
}) {
  const baseClass =
    'w-full bg-gray-800 border rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors ' +
    (error ? 'border-red-500' : 'border-gray-700');

  if (field.type === 'boolean') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-300">{field.label}</span>
      </label>
    );
  }

  if (field.type === 'select') {
    return (
      <select
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className={baseClass}
      >
        <option value="">— Select —</option>
        {field.options?.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
      value={String(value ?? '')}
      onChange={(e) =>
        onChange(field.type === 'number' ? (e.target.value ? Number(e.target.value) : '') : e.target.value)
      }
      placeholder={field.label}
      className={baseClass}
    />
  );
}

export function AssetForm({ mode, assetType, geometry, initialValues, onClose }: Props) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [code, setCode] = useState(initialValues?.code ?? '');
  const [status, setStatus] = useState<string>(initialValues?.status ?? 'operational');
  const [attrs, setAttrs] = useState<Record<string, unknown>>(
    (initialValues?.attributes as Record<string, unknown>) ?? {}
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();
  const isPending = createMutation.isPending || updateMutation.isPending;

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!code.trim()) errs.code = 'Code is required';
    assetType.fieldSchema.forEach((f) => {
      if (f.required && (attrs[f.key] === undefined || attrs[f.key] === '' || attrs[f.key] === null)) {
        errs[f.key] = `${f.label} is required`;
      }
    });
    return errs;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (mode === 'create') {
      createMutation.mutate(
        { assetTypeId: assetType.id, name, code, status, geometry: geometry!, attributes: attrs },
        { onSuccess: onClose }
      );
    } else {
      updateMutation.mutate(
        { id: initialValues!.id!, name, code, status, attributes: attrs },
        { onSuccess: onClose }
      );
    }
  }

  const inputClass = (field: string) =>
    'w-full bg-gray-800 border rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors ' +
    (errors[field] ? 'border-red-500' : 'border-gray-700');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-700 shrink-0">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: assetType.color }} />
          <h2 className="font-semibold text-white flex-1">
            {mode === 'create' ? `New ${assetType.label}` : `Edit ${assetType.label}`}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">×</button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {/* Fixed fields */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Asset name"
                className={inputClass('name')}
              />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Code *</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Unique code e.g. MH-031"
                className={inputClass('code')}
              />
              {errors.code && <p className="text-xs text-red-400 mt-1">{errors.code}</p>}
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputClass('status')}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Dynamic fields from fieldSchema */}
            {assetType.fieldSchema.length > 0 && (
              <div className="border-t border-gray-700 pt-3 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {assetType.label} Fields
                </p>
                {assetType.fieldSchema.map((field) => (
                  <div key={field.key}>
                    {field.type !== 'boolean' && (
                      <label className="text-xs text-gray-400 mb-1 block">
                        {field.label} {field.required && '*'}
                      </label>
                    )}
                    <FieldInput
                      field={field}
                      value={attrs[field.key]}
                      onChange={(v) => setAttrs((a) => ({ ...a, [field.key]: v }))}
                      error={errors[field.key]}
                    />
                    {errors[field.key] && (
                      <p className="text-xs text-red-400 mt-1">{errors[field.key]}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Server error */}
            {(createMutation.error || updateMutation.error) && (
              <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded p-2">
                {(createMutation.error as Error)?.message ??
                  (updateMutation.error as Error)?.message ??
                  'An error occurred'}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-5 py-4 border-t border-gray-700 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg py-2 font-medium transition-colors border border-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2 font-medium transition-colors"
            >
              {isPending ? 'Saving…' : mode === 'create' ? 'Create Asset' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
