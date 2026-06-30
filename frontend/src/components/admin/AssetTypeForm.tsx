import { useState, FormEvent } from 'react';
import { AssetType, FieldSchema } from '../../api/client';
import { useCreateAssetType, useUpdateAssetType } from '../../hooks/useAssetTypeMutations';

interface Props {
  mode: 'create' | 'edit';
  initialValues?: AssetType;
  onClose: () => void;
}

const GEOMETRY_OPTIONS = [
  { value: 'point', label: 'Point' },
  { value: 'line', label: 'Line' },
  { value: 'polygon', label: 'Polygon' },
];

const FIELD_TYPES = ['text', 'number', 'select', 'date', 'boolean'] as const;

function emptyField(): FieldSchema {
  return { key: '', label: '', type: 'text', required: false };
}

const inputClass =
  'bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors';

export function AssetTypeForm({ mode, initialValues, onClose }: Props) {
  const [key, setKey] = useState(initialValues?.key ?? '');
  const [label, setLabel] = useState(initialValues?.label ?? '');
  const [geometryKind, setGeometryKind] = useState<'point' | 'line' | 'polygon'>(
    initialValues?.geometryKind ?? 'point'
  );
  const [icon, setIcon] = useState(initialValues?.icon ?? '');
  const [color, setColor] = useState(initialValues?.color ?? '#3B82F6');
  const [fields, setFields] = useState<FieldSchema[]>(
    initialValues?.fieldSchema ? [...initialValues.fieldSchema] : []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateAssetType();
  const updateMutation = useUpdateAssetType();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const serverError =
    (createMutation.error as Error)?.message ?? (updateMutation.error as Error)?.message;

  function validate() {
    const errs: Record<string, string> = {};
    if (!key.trim()) errs.key = 'Key is required';
    if (!/^[a-z0-9_]+$/.test(key.trim())) errs.key = 'Key must be lowercase letters, digits, or underscores';
    if (!label.trim()) errs.label = 'Label is required';
    if (!icon.trim()) errs.icon = 'Icon is required';
    fields.forEach((f, i) => {
      if (!f.key.trim()) errs[`field_key_${i}`] = 'Field key required';
      if (!f.label.trim()) errs[`field_label_${i}`] = 'Field label required';
    });
    // Duplicate field keys
    const keys = fields.map((f) => f.key.trim()).filter(Boolean);
    const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
    dupes.forEach((dk) => {
      fields.forEach((f, i) => {
        if (f.key.trim() === dk) errs[`field_key_${i}`] = 'Duplicate key';
      });
    });
    return errs;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const payload = { key: key.trim(), label: label.trim(), geometryKind, icon: icon.trim(), color, fieldSchema: fields };

    if (mode === 'create') {
      createMutation.mutate(payload, { onSuccess: onClose });
    } else {
      updateMutation.mutate({ id: initialValues!.id, ...payload }, { onSuccess: onClose });
    }
  }

  function updateField(index: number, patch: Partial<FieldSchema>) {
    setFields((fs) => fs.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function removeField(index: number) {
    setFields((fs) => fs.filter((_, i) => i !== index));
  }

  function moveField(index: number, dir: -1 | 1) {
    setFields((fs) => {
      const next = [...fs];
      const target = index + dir;
      if (target < 0 || target >= next.length) return next;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-700 shrink-0">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
          <h2 className="font-semibold text-white flex-1">
            {mode === 'create' ? 'New Asset Type' : `Edit: ${initialValues?.label}`}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Core fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Key *</label>
                <input
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  readOnly={mode === 'edit'}
                  placeholder="e.g. splice_closure"
                  className={`${inputClass} w-full ${mode === 'edit' ? 'opacity-50 cursor-not-allowed' : ''} ${errors.key ? 'border-red-500' : ''}`}
                />
                {errors.key && <p className="text-xs text-red-400 mt-1">{errors.key}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Label *</label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Splice Closure"
                  className={`${inputClass} w-full ${errors.label ? 'border-red-500' : ''}`}
                />
                {errors.label && <p className="text-xs text-red-400 mt-1">{errors.label}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Geometry Kind</label>
                <select
                  value={geometryKind}
                  onChange={(e) => setGeometryKind(e.target.value as 'point' | 'line' | 'polygon')}
                  className={`${inputClass} w-full`}
                >
                  {GEOMETRY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Icon *</label>
                <input
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="e.g. 🔌 or tower"
                  className={`${inputClass} w-full ${errors.icon ? 'border-red-500' : ''}`}
                />
                {errors.icon && <p className="text-xs text-red-400 mt-1">{errors.icon}</p>}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-9 h-9 rounded cursor-pointer bg-transparent border-0 p-0"
                />
                <input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#3B82F6"
                  className={`${inputClass} flex-1`}
                />
                <div className="w-8 h-8 rounded-md border border-gray-700 shrink-0" style={{ background: color }} />
              </div>
            </div>

            {/* Field Schema Editor */}
            <div className="border-t border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Custom Fields ({fields.length})
                </p>
                <button
                  type="button"
                  onClick={() => setFields((fs) => [...fs, emptyField()])}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-blue-400 hover:text-blue-300 px-2.5 py-1 rounded-md border border-gray-700 transition-colors"
                >
                  + Add Field
                </button>
              </div>

              {fields.length === 0 && (
                <p className="text-xs text-gray-600 italic">No custom fields — add some above.</p>
              )}

              <div className="space-y-3">
                {fields.map((field, i) => (
                  <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 space-y-2">
                    {/* Row 1: key, label, type, required, remove */}
                    <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-2 items-start">
                      <div>
                        <input
                          value={field.key}
                          onChange={(e) => updateField(i, { key: e.target.value })}
                          placeholder="key"
                          className={`${inputClass} w-full text-xs ${errors[`field_key_${i}`] ? 'border-red-500' : ''}`}
                        />
                        {errors[`field_key_${i}`] && (
                          <p className="text-xs text-red-400 mt-0.5">{errors[`field_key_${i}`]}</p>
                        )}
                      </div>
                      <div>
                        <input
                          value={field.label}
                          onChange={(e) => updateField(i, { label: e.target.value })}
                          placeholder="Label"
                          className={`${inputClass} w-full text-xs ${errors[`field_label_${i}`] ? 'border-red-500' : ''}`}
                        />
                        {errors[`field_label_${i}`] && (
                          <p className="text-xs text-red-400 mt-0.5">{errors[`field_label_${i}`]}</p>
                        )}
                      </div>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(i, { type: e.target.value as FieldSchema['type'], options: undefined })}
                        className={`${inputClass} text-xs`}
                      >
                        {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer pt-1.5 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(i, { required: e.target.checked })}
                          className="w-3.5 h-3.5"
                        />
                        Req
                      </label>
                      <div className="flex gap-1 pt-0.5">
                        <button
                          type="button"
                          onClick={() => moveField(i, -1)}
                          disabled={i === 0}
                          className="text-gray-500 hover:text-gray-300 disabled:opacity-30 text-xs px-1"
                          title="Move up"
                        >↑</button>
                        <button
                          type="button"
                          onClick={() => moveField(i, 1)}
                          disabled={i === fields.length - 1}
                          className="text-gray-500 hover:text-gray-300 disabled:opacity-30 text-xs px-1"
                          title="Move down"
                        >↓</button>
                        <button
                          type="button"
                          onClick={() => removeField(i)}
                          className="text-gray-600 hover:text-red-400 text-sm px-1 transition-colors"
                          title="Remove field"
                        >✕</button>
                      </div>
                    </div>

                    {/* Options row — only when type === 'select' */}
                    {field.type === 'select' && (
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Options (comma-separated)</label>
                        <input
                          value={field.options?.join(', ') ?? ''}
                          onChange={(e) =>
                            updateField(i, {
                              options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                            })
                          }
                          placeholder="Option A, Option B, Option C"
                          className={`${inputClass} w-full text-xs`}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {serverError && (
              <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded p-2">
                {serverError}
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
              {isPending ? 'Saving…' : mode === 'create' ? 'Create Type' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
