import { useState, useCallback, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X, UserPlus } from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import { addProfile, updateProfile, deleteProfile, getSessionCount, generateId } from '@/utils/storage';
import type { Profile } from '@/types';

// Distinct from the semantic stat-category tokens (exp/frags/nodes/mesos/common/rare)
// and primary/danger, so a profile avatar never accidentally reads as one of those.
const PROFILE_COLORS = ['#F472B6', '#34D399', '#FB923C', '#A3E635', '#22D3EE', '#E879F9'];

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen]);

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

    setDeletingId(p.id);
    const sessionCount = await getSessionCount(p.id);
    setDeletingId(null);

    const warning = sessionCount > 0
      ? `¿Eliminar "${p.name}"? Esto también borra ${sessionCount} sesión${sessionCount !== 1 ? 'es' : ''} guardada${sessionCount !== 1 ? 's' : ''} de este perfil, para siempre. No se puede deshacer.`
      : `¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`;
    if (!window.confirm(warning)) return;

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
        <button onClick={openCreate} className="flex min-h-[44px] items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-bg-deep shadow-glow">
          <Plus size={14} /> Nuevo Perfil
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-border bg-panel px-5 py-12 text-center">
          <UserPlus size={32} className="text-text-faint" />
          <p className="mt-3 font-semibold text-text-dim">Sin perfiles todavía</p>
          <p className="mt-1 text-sm text-text-muted">Creá tu primer personaje para empezar a trackear</p>
          <button onClick={openCreate} className="mt-4 min-h-[44px] rounded-lg bg-primary px-4 py-2 text-sm font-bold text-bg-deep shadow-glow">
            Crear perfil
          </button>
        </div>
      ) : (
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
                    <button onClick={() => setActiveProfile(p.id)} className="min-h-[44px] rounded-lg border border-primary-border bg-primary-dim px-3 py-2 text-xs font-bold text-primary">
                      Activar
                    </button>
                  )}
                  <button onClick={() => openEdit(p)} aria-label={`Editar ${p.name}`} className="flex h-11 w-11 items-center justify-center rounded-lg text-text-dim hover:bg-white/[0.06]">
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(p)}
                    disabled={deletingId === p.id}
                    aria-label={`Eliminar ${p.name}`}
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-danger hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/edit sheet — in-page modal, not a route (small sub-flow) */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-bg-deep/80 backdrop-blur-sm md:items-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border-t border-border-strong bg-bg-deep p-5 md:rounded-2xl md:border"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-text">{editing ? 'Editar Perfil' : 'Nuevo Perfil'}</h2>
              <button onClick={() => setModalOpen(false)} aria-label="Cerrar" className="flex h-11 w-11 items-center justify-center rounded-lg text-text-muted hover:bg-white/[0.06] hover:text-text-dim">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text-dim">Nombre del personaje *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: MiKain2024"
                  maxLength={30}
                  className="w-full rounded-lg border border-border bg-white/[0.06] px-3.5 py-2.5 text-base text-text placeholder:text-text-faint focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text-dim">Clase (opcional)</label>
                <input
                  value={form.gameClass}
                  onChange={(e) => setForm((f) => ({ ...f, gameClass: e.target.value }))}
                  placeholder="Ej: Kain, Adele, Bowmaster..."
                  maxLength={30}
                  className="w-full rounded-lg border border-border bg-white/[0.06] px-3.5 py-2.5 text-base text-text placeholder:text-text-faint focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text-dim">Servidor (opcional)</label>
                <input
                  value={form.server}
                  onChange={(e) => setForm((f) => ({ ...f, server: e.target.value }))}
                  placeholder="Ej: Reboot, Bera, Scania..."
                  maxLength={30}
                  className="w-full rounded-lg border border-border bg-white/[0.06] px-3.5 py-2.5 text-base text-text placeholder:text-text-faint focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text-dim">Color del avatar</label>
                <div className="flex gap-2">
                  {PROFILE_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm((f) => ({ ...f, color: c }))}
                      aria-label={`Color ${c}`}
                      aria-pressed={form.color === c}
                      className="flex h-11 w-11 items-center justify-center rounded-full"
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
