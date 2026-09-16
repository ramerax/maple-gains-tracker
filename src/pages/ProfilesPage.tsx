import { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { addProfile, updateProfile, deleteProfile, generateId } from '@/utils/storage';
import type { Profile } from '@/types';

const PROFILE_COLORS = ['#2DD4BF', '#4ADE80', '#FBBF24', '#818CF8', '#60A5FA', '#F87171'];

interface FormState {
  name: string;
  gameClass: string;
  server: string;
  color: string;
}

const EMPTY_FORM: FormState = { name: '', gameClass: '', server: '', color: PROFILE_COLORS[0] };

function Avatar({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  const letter = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl border-2"
      style={{ width: size, height: size, backgroundColor: color + '30', borderColor: color, color, fontSize: size * 0.4 }}
    >
      <span className="font-black">{letter}</span>
    </div>
  );
}

export default function ProfilesPage() {
  const { profiles, activeProfileId, setActiveProfile, refreshProfiles } = useProfile();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setError(null); setModalOpen(true); };
  const openEdit = (p: Profile) => {
    setEditing(p);
    setForm({ name: p.name, gameClass: p.gameClass ?? '', server: p.server ?? '', color: p.color });
    setError(null);
    setModalOpen(true);
  };

  const handleSave = useCallback(async () => {
    const trimmed = form.name.trim();
    if (!trimmed) { setError('El nombre del personaje es obligatorio.'); return; }

    setSaving(true);
    const result = editing
      ? await updateProfile({ ...editing, name: trimmed, gameClass: form.gameClass.trim() || undefined, server: form.server.trim() || undefined, color: form.color })
      : await addProfile({ id: generateId(), name: trimmed, gameClass: form.gameClass.trim() || undefined, server: form.server.trim() || undefined, color: form.color, createdAt: Date.now() });
    setSaving(false);

    if (result.error) { setError('No se pudo guardar el perfil. Intenta de nuevo.'); return; }
    await refreshProfiles();
    setModalOpen(false);
  }, [form, editing, refreshProfiles]);

  const handleDelete = async (p: Profile) => {
    if (profiles.length <= 1) { alert('Debes tener al menos un perfil.'); return; }
    if (!window.confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return;

    const { error } = await deleteProfile(p.id);
    if (error) { alert('No se pudo eliminar el perfil. Intenta de nuevo.'); return; }
    if (p.id === activeProfileId) {
      const remaining = profiles.filter((x) => x.id !== p.id);
      if (remaining.length > 0) await setActiveProfile(remaining[0].id);
    }
    await refreshProfiles();
  };

  return (
    <div className="mx-auto max-w-[700px] p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-text">{profiles.length} perfil{profiles.length !== 1 ? 'es' : ''}</h1>
        <button onClick={openCreate} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-bg-deep shadow-glow">
          <Plus size={14} /> Nuevo Perfil
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {profiles.map((p) => {
          const isActive = p.id === activeProfileId;
          return (
            <div key={p.id} className={`flex items-center gap-3 rounded-xl border p-3 ${isActive ? 'border-primary-border bg-primary-dim' : 'border-border bg-panel'}`}>
              <Avatar name={p.name} color={p.color} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-text">{p.name}</p>
                  {isActive && (
                    <span className="flex items-center gap-0.5 rounded-full border border-primary-border bg-primary-dim px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      <Check size={10} /> Activo
                    </span>
                  )}
                </div>
                {(p.gameClass || p.server) && (
                  <p className="truncate text-xs text-text-dim">{[p.gameClass, p.server].filter(Boolean).join(' · ')}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {!isActive && (
                  <button onClick={() => setActiveProfile(p.id)} className="rounded-lg border border-primary-border bg-primary-dim px-2.5 py-1.5 text-xs font-bold text-primary">
                    Activar
                  </button>
                )}
                <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-text-dim hover:bg-white/[0.06]"><Pencil size={15} /></button>
                <button onClick={() => handleDelete(p)} className="rounded-lg p-2 text-danger hover:bg-white/[0.06]"><Trash2 size={15} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/edit sheet — in-page modal, not a route (small sub-flow) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg-deep/80 backdrop-blur-sm md:items-center">
          <div className="w-full max-w-md rounded-t-2xl border-t border-border-strong bg-bg-deep p-5 md:rounded-2xl md:border">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-text">{editing ? 'Editar Perfil' : 'Nuevo Perfil'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-text-muted hover:text-text-dim"><X size={18} /></button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text-dim">Nombre del personaje *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: MiKain2024"
                  maxLength={30}
                  className="w-full rounded-lg border border-border bg-white/[0.06] px-3.5 py-2.5 text-base text-text placeholder:text-text-faint focus:border-primary-border focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text-dim">Clase (opcional)</label>
                <input
                  value={form.gameClass}
                  onChange={(e) => setForm((f) => ({ ...f, gameClass: e.target.value }))}
                  placeholder="Ej: Kain, Adele, Bowmaster..."
                  maxLength={30}
                  className="w-full rounded-lg border border-border bg-white/[0.06] px-3.5 py-2.5 text-base text-text placeholder:text-text-faint focus:border-primary-border focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text-dim">Servidor (opcional)</label>
                <input
                  value={form.server}
                  onChange={(e) => setForm((f) => ({ ...f, server: e.target.value }))}
                  placeholder="Ej: Reboot, Bera, Scania..."
                  maxLength={30}
                  className="w-full rounded-lg border border-border bg-white/[0.06] px-3.5 py-2.5 text-base text-text placeholder:text-text-faint focus:border-primary-border focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text-dim">Color del avatar</label>
                <div className="flex gap-2">
                  {PROFILE_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: c, boxShadow: form.color === c ? '0 0 0 3px white' : undefined }}
                    >
                      {form.color === c && <Check size={16} color="#000" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border bg-panel p-3">
                <Avatar name={form.name || '?'} color={form.color} size={48} />
                <div className="min-w-0">
                  <p className="truncate text-base font-bold" style={{ color: form.color }}>{form.name.trim() || 'Nombre del personaje'}</p>
                  {(form.gameClass || form.server) && (
                    <p className="truncate text-xs text-text-dim">{[form.gameClass, form.server].filter(Boolean).join(' · ')}</p>
                  )}
                </div>
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}

              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-1 flex min-h-[48px] items-center justify-center rounded-xl bg-primary text-sm font-extrabold text-bg-deep shadow-glow disabled:opacity-60"
              >
                {saving ? 'Guardando…' : editing ? 'Guardar Cambios' : 'Crear Perfil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
