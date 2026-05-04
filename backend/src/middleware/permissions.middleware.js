const { AppError } = require('../utils/appError');

/**
 * requirePermission(...perms)
 *
 * Usage:
 *   router.delete('/user/:id', protect, restrictTo('admin'), requirePermission('manage_athletes'), handler)
 *
 * Supports AND logic (all listed permissions required):
 *   requirePermission('manage_athletes', 'export_data')
 *
 * Super admin automatically passes every check.
 */
const requirePermission = (...permissions) => (req, res, next) => {
  const user = req.user;

  if (!user) return next(new AppError('Not authenticated.', 401));
  if (user.role !== 'admin') return next(new AppError('Admin access required.', 403));

  // Super admin bypasses all permission checks
  if (user.adminLevel === 'super_admin') return next();

  const missing = permissions.filter((p) => !user.permissions?.includes(p));
  if (missing.length > 0) {
    return next(
      new AppError(
        `You do not have permission to perform this action. Required: ${missing.join(', ')}.`,
        403
      )
    );
  }

  next();
};

/**
 * requireAdminLevel(...levels)
 *
 * Usage:
 *   requireAdminLevel('super_admin')           — only super admins
 *   requireAdminLevel('super_admin', 'admin')  — super + admin, not moderator
 */
const requireAdminLevel = (...levels) => (req, res, next) => {
  const user = req.user;
  if (!user || user.role !== 'admin') return next(new AppError('Admin access required.', 403));

  if (!levels.includes(user.adminLevel)) {
    return next(
      new AppError(
        `This action requires one of: ${levels.map((l) => l.replace('_', ' ')).join(', ')}.`,
        403
      )
    );
  }
  next();
};

/**
 * auditLog — lightweight request audit trail for admin actions
 * Attaches audit metadata to res.locals for logging in a post-handler hook
 */
const auditLog = (action) => (req, res, next) => {
  res.locals.audit = {
    action,
    adminId: req.user?._id,
    adminLevel: req.user?.adminLevel,
    ip: req.ip,
    timestamp: new Date().toISOString(),
    params: req.params,
  };
  next();
};

module.exports = { requirePermission, requireAdminLevel, auditLog };
