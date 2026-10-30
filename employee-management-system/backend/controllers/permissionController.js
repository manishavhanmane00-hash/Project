const RolePermission = require('../models/RolePermission');
const {
  MODULES,
  MANAGED_ROLES,
  ACTIONS,
  MODULE_KEYS,
  ALL_PERMISSION_KEYS,
  defaultMapForRole,
  actionsDefaultForRole,
} = require('../config/modules');

const KEY_SET = new Set(ALL_PERMISSION_KEYS);
const MODULE_KEY_SET = new Set(MODULE_KEYS);

/**
 * Convert a Mongoose Map (or plain object) of permissions into a plain
 * { key: boolean } object limited to known permission keys.
 */
const toPlainMap = (permissions) => {
  const out = {};
  if (!permissions) return out;
  const entries = permissions instanceof Map
    ? Array.from(permissions.entries())
    : Object.entries(permissions);
  for (const [k, v] of entries) {
    if (KEY_SET.has(k)) out[k] = Boolean(v);
  }
  return out;
};

/**
 * Normalise an actions object into { moduleKey: { view, add, edit, delete, manage } }
 * limited to known module keys and known actions.
 */
const toPlainActions = (actions) => {
  const src = actions instanceof Map ? Object.fromEntries(actions) : (actions || {});
  const out = {};
  for (const key of MODULE_KEYS) {
    const a = (src && typeof src === 'object' && src[key]) || {};
    out[key] = {};
    for (const act of ACTIONS) out[key][act] = Boolean(a[act]);
  }
  return out;
};

/**
 * Ensure a RolePermission document exists for a managed role, seeding it with
 * defaults when missing. Returns { permissions, actions } (plain) for the role.
 */
const ensureRole = async (role) => {
  let doc = await RolePermission.findOne({ role });
  if (!doc) {
    doc = await RolePermission.create({
      role,
      permissions: defaultMapForRole(role),
      actions: actionsDefaultForRole(role),
    });
  }

  // Merge newly-added module/submodule keys into the stored permission map.
  const currentPerms = toPlainMap(doc.permissions);
  const defaultPerms = defaultMapForRole(role);
  let changed = false;
  for (const key of ALL_PERMISSION_KEYS) {
    if (!(key in currentPerms)) {
      currentPerms[key] = defaultPerms[key];
      changed = true;
    }
  }

  // Merge newly-added modules into the stored actions map.
  const currentActions = toPlainActions(doc.actions);
  const defaultActions = actionsDefaultForRole(role);
  const storedActions = doc.actions instanceof Map ? Object.fromEntries(doc.actions) : (doc.actions || {});
  for (const key of MODULE_KEYS) {
    if (!storedActions || !(key in storedActions)) {
      currentActions[key] = defaultActions[key];
      changed = true;
    }
  }

  if (changed) {
    doc.permissions = currentPerms;
    doc.actions = currentActions;
    // Mixed fields require markModified so Mongoose persists the mutation.
    doc.markModified('permissions');
    doc.markModified('actions');
    await doc.save();
  }

  return { permissions: currentPerms, actions: currentActions };
};

/**
 * Resolve the effective permission + action maps for ANY role, including Admin.
 * Admin → every permission + every action true. Managed roles → stored/seeded.
 * Unknown roles → everything false.
 */
const resolvePermissionsForRole = async (role) => {
  if (role === 'Admin') {
    const permissions = {};
    for (const key of ALL_PERMISSION_KEYS) permissions[key] = true;
    const actions = {};
    for (const key of MODULE_KEYS) {
      actions[key] = {};
      for (const act of ACTIONS) actions[key][act] = true;
    }
    return { permissions, actions };
  }
  if (MANAGED_ROLES.includes(role)) {
    return ensureRole(role);
  }
  const permissions = {};
  for (const key of ALL_PERMISSION_KEYS) permissions[key] = false;
  const actions = {};
  for (const key of MODULE_KEYS) {
    actions[key] = {};
    for (const act of ACTIONS) actions[key][act] = false;
  }
  return { permissions, actions };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/permissions           (admin) — all managed roles + module registry
// ─────────────────────────────────────────────────────────────────────────────
const getAllPermissions = async (req, res) => {
  try {
    const roles = {};
    for (const role of MANAGED_ROLES) {
      roles[role] = await ensureRole(role); // { permissions, actions }
    }
    res.json({ success: true, modules: MODULES, actions: ACTIONS, roles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/permissions/:role     (admin) — one managed role's maps
// ─────────────────────────────────────────────────────────────────────────────
const getRolePermissions = async (req, res) => {
  try {
    const { role } = req.params;
    if (!MANAGED_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: `Role must be one of: ${MANAGED_ROLES.join(', ')}` });
    }
    const { permissions, actions } = await ensureRole(role);
    res.json({ success: true, role, permissions, actions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/permissions/:role     (admin) — replace a managed role's maps
// Body: { permissions: { key: boolean }, actions: { moduleKey: { view, ... } } }
// Unknown keys are ignored; missing known keys/actions default to false.
// ─────────────────────────────────────────────────────────────────────────────
const updateRolePermissions = async (req, res) => {
  try {
    const { role } = req.params;
    if (!MANAGED_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: `Role must be one of: ${MANAGED_ROLES.join(', ')}` });
    }

    const incoming = req.body && req.body.permissions;
    if (!incoming || typeof incoming !== 'object') {
      return res.status(400).json({ success: false, message: 'permissions (object) is required' });
    }

    // Sanitise the module/submodule permission map.
    const sanitisedPerms = {};
    for (const key of ALL_PERMISSION_KEYS) {
      sanitisedPerms[key] = Boolean(incoming[key]);
    }

    // Sanitise the actions map. If a module's `view` action is false, force all
    // other actions false for that module (you can't act on what you can't see).
    const incomingActions = (req.body && req.body.actions) || {};
    const sanitisedActions = {};
    for (const key of MODULE_KEYS) {
      const a = (incomingActions && typeof incomingActions === 'object' && incomingActions[key]) || {};
      const view = Boolean(a.view);
      sanitisedActions[key] = {
        view,
        add: view && Boolean(a.add),
        edit: view && Boolean(a.edit),
        delete: view && Boolean(a.delete),
        manage: view && Boolean(a.manage),
      };
    }

    const doc = await RolePermission.findOneAndUpdate(
      { role },
      { role, permissions: sanitisedPerms, actions: sanitisedActions },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({
      success: true,
      role,
      permissions: toPlainMap(doc.permissions),
      actions: toPlainActions(doc.actions),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllPermissions,
  getRolePermissions,
  updateRolePermissions,
  // internal helpers reused by auth + middleware
  resolvePermissionsForRole,
  toPlainMap,
  toPlainActions,
};
