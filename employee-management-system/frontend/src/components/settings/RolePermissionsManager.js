import React, { useState, useEffect, useCallback } from 'react';
import { Save, ToggleLeft, ToggleRight, ShieldCheck } from 'lucide-react';
import { permissionAPI } from '../../services/api';
import { MANAGED_ROLES, ACTIONS, ACTION_LABELS } from '../../config/modules';
import { useAuth } from '../../context/AuthContext';
import SkeletonLoader from '../shared/SkeletonLoader';
import toast from 'react-hot-toast';

/* ── Single ON/OFF switch (matches the existing Settings toggle visual) ──── */
const Switch = ({ checked, onChange, disabled }) => (
  <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: disabled ? 0.5 : 1 }}>
    <input type="checkbox" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
    <span style={{ position: 'absolute', inset: 0, borderRadius: 12, background: checked ? 'var(--primary)' : 'var(--border)', transition: 'background 0.2s' }}>
      <span style={{ position: 'absolute', left: checked ? 22 : 2, top: 2, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </span>
  </label>
);

const emptyActions = () => ({ view: false, add: false, edit: false, delete: false, manage: false });

const RolePermissionsManager = () => {
  const { isSuperAdmin, refreshMe } = useAuth();

  const [modules, setModules] = useState([]);
  const [rolesData, setRolesData] = useState({});   // { HR: { permissions, actions }, ... }
  const [activeRole, setActiveRole] = useState(MANAGED_ROLES[0]);
  const [permDraft, setPermDraft] = useState({});    // { key: bool }
  const [actionDraft, setActionDraft] = useState({}); // { moduleKey: { view, add, edit, delete, manage } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canManage = isSuperAdmin();

  const loadRoleIntoDraft = (roleData) => {
    setPermDraft({ ...((roleData && roleData.permissions) || {}) });
    setActionDraft({ ...((roleData && roleData.actions) || {}) });
  };

  // ── Load module registry + all role maps ─────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await permissionAPI.getAll();
      if (data.success) {
        setModules(data.modules);
        setRolesData(data.roles);
        loadRoleIntoDraft(data.roles[activeRole]);
      } else {
        throw new Error(data.message || 'Failed to load permissions');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectRole = (role) => {
    setActiveRole(role);
    loadRoleIntoDraft(rolesData[role]);
  };

  const getActions = (key) => actionDraft[key] || emptyActions();

  // Set a single action on a module. Turning `view` off cascades everything off;
  // turning a non-view action on implies `view` on.
  const setAction = (modKey, action, value) => {
    setActionDraft(d => {
      const cur = d[modKey] || emptyActions();
      let next = { ...cur, [action]: value };
      if (action === 'view' && !value) {
        next = emptyActions();
      } else if (action !== 'view' && value) {
        next.view = true;
      }
      return { ...d, [modKey]: next };
    });
    // Keep the module/submodule visibility map in sync with `view`.
    if (action === 'view') {
      setPermDraft(d => {
        const next = { ...d, [modKey]: value };
        const mod = modules.find(m => m.key === modKey);
        if (mod) for (const s of mod.submodules) next[s.key] = value;
        return next;
      });
    }
  };

  // Submodule visibility toggle (independent of parent, but requires parent view).
  const setSubmodule = (subKey, value) => setPermDraft(d => ({ ...d, [subKey]: value }));

  const enableAll = () => {
    const nextPerm = {};
    const nextActions = {};
    for (const m of modules) {
      nextPerm[m.key] = true;
      for (const s of m.submodules) nextPerm[s.key] = true;
      nextActions[m.key] = { view: true, add: true, edit: true, delete: true, manage: true };
    }
    setPermDraft(nextPerm);
    setActionDraft(nextActions);
  };

  const disableAll = () => {
    const nextPerm = {};
    const nextActions = {};
    for (const m of modules) {
      nextPerm[m.key] = false;
      for (const s of m.submodules) nextPerm[s.key] = false;
      nextActions[m.key] = emptyActions();
    }
    setPermDraft(nextPerm);
    setActionDraft(nextActions);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await permissionAPI.update(activeRole, {
        permissions: permDraft,
        actions: actionDraft,
      });
      if (data.success) {
        const updated = { permissions: data.permissions, actions: data.actions };
        setRolesData(prev => ({ ...prev, [activeRole]: updated }));
        loadRoleIntoDraft(updated);
        toast.success(`${activeRole} permissions saved`);
        refreshMe?.();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SkeletonLoader />;

  if (!canManage) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
        <ShieldCheck size={28} style={{ marginBottom: 8, color: 'var(--text-muted)' }} />
        <p style={{ fontSize: '0.9rem' }}>Only an Administrator can manage role permissions.</p>
      </div>
    );
  }

  return (
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 16 }}>
        Configure what each role can access and do. Toggle module visibility and
        the actions (View, Add, Edit, Delete, Manage) allowed for each module.
        Changes apply to all users of that role automatically — no re-login required.
      </p>

      {error && (
        <div className="card" style={{ marginBottom: 16, padding: '12px 16px', borderLeft: '3px solid var(--danger)', fontSize: '0.85rem', color: 'var(--danger)' }}>
          {error} <button className="btn btn-outline btn-sm" style={{ marginLeft: 10 }} onClick={load}>Retry</button>
        </div>
      )}

      {/* Role selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {MANAGED_ROLES.map(role => (
          <button
            key={role}
            className={`btn btn-sm ${activeRole === role ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => selectRole(role)}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Enable All / Disable All */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
          Permissions for <span style={{ color: 'var(--primary)' }}>{activeRole}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={enableAll}><ToggleRight size={14} /> Enable All</button>
          <button className="btn btn-outline btn-sm" onClick={disableAll}><ToggleLeft size={14} /> Disable All</button>
        </div>
      </div>

      {/* Module list with action checkboxes */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {modules.map(mod => {
          const acts = getActions(mod.key);
          const moduleOn = acts.view === true;
          return (
            <div key={mod.key} style={{ borderBottom: '1px solid var(--border)' }}>
              {/* Parent module row: visibility switch + action checkboxes */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '14px 18px', background: 'var(--bg)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 160 }}>
                  <Switch checked={moduleOn} onChange={(v) => setAction(mod.key, 'view', v)} />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{mod.label}</span>
                </div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  {ACTIONS.map(action => (
                    <label key={action} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: action === 'view' ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: action === 'view' ? 'default' : 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={acts[action] === true}
                        disabled={action !== 'view' && !moduleOn}
                        onChange={e => setAction(mod.key, action, e.target.checked)}
                        style={{ accentColor: 'var(--primary)', width: 15, height: 15 }}
                      />
                      {ACTION_LABELS[action]}
                    </label>
                  ))}
                </div>
              </div>
              {/* Submodule visibility rows */}
              {mod.submodules.length > 0 && (
                <div style={{ padding: '4px 18px 10px 34px' }}>
                  {mod.submodules.map(sub => (
                    <div key={sub.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{sub.label}</div>
                      <Switch
                        checked={permDraft[sub.key] === true}
                        disabled={!moduleOn}
                        onChange={(v) => setSubmodule(sub.key, v)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={14} /> {saving ? 'Saving…' : 'Save Permissions'}
        </button>
      </div>
    </div>
  );
};

export default RolePermissionsManager;
