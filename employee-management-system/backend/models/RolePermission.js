const mongoose = require('mongoose');
const { MANAGED_ROLES } = require('../config/modules');

/**
 * One document per managed role (HR, Manager, Employee) storing a flat map of
 * permissionKey -> boolean. Admin is never stored here — Admin always has full
 * access, enforced in code.
 *
 * `permissions` is a Mixed map ({ "employees": true, "employees.list": false, ... }).
 * The controller sanitises it against the canonical module registry on write.
 */
const rolePermissionSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    unique: true,
    enum: MANAGED_ROLES,
    index: true,
  },
  // Flat map of permissionKey -> boolean, e.g. { "employees": true, "employees.list": false }.
  //
  // NOTE: stored as Mixed (a plain object), NOT a Mongoose `Map`. Our permission
  // keys contain dots (submodules like "employees.list"), and Mongoose Maps
  // reject keys containing dots — that caused the
  //   "RolePermission validation failed: permissions: Cast to Map failed"
  // error. A Mixed object stores dotted keys without issue.
  permissions: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // Action-level permissions per top-level module:
  //   { moduleKey: { view, add, edit, delete, manage } }
  // Stored as Mixed so the nested action object is persisted verbatim.
  actions: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { timestamps: true });

module.exports = mongoose.model('RolePermission', rolePermissionSchema);
