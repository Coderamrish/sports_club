const express = require('express');
const router  = express.Router();

const adminAuthController = require('../controllers/admin/adminAuth.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { requirePermission, requireAdminLevel, auditLog } = require('../middleware/permissions.middleware');

// All admin routes require: valid JWT + role=admin
router.use(protect, restrictTo('admin'));

// ── Admin profile (self) ─────────────────────────────────────────────────────
router.get('/me', adminAuthController.getAdminProfile);

// ── Admin management (super_admin only) ──────────────────────────────────────
router.post(
  '/admins',
  requireAdminLevel('super_admin'),
  auditLog('create_admin'),
  adminAuthController.createAdmin
);

router.get(
  '/admins',
  requireAdminLevel('super_admin'),
  adminAuthController.listAdmins
);

router.patch(
  '/admins/:id',
  requireAdminLevel('super_admin'),
  auditLog('update_admin'),
  adminAuthController.updateAdmin
);

router.delete(
  '/admins/:id',
  requireAdminLevel('super_admin'),
  auditLog('deactivate_admin'),
  adminAuthController.deactivateAdmin
);

// ── Dashboard overview (admin + super_admin) ──────────────────────────────────
router.get(
  '/dashboard',
  requirePermission('view_analytics'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Admin dashboard — metrics endpoint coming in Day 3',
      adminInfo: {
        name:        req.user.fullName,
        adminLevel:  req.user.adminLevel,
        permissions: req.user.permissions,
      },
    });
  }
);

// ── Placeholder routes for Day 3+ ─────────────────────────────────────────────
router.get('/athletes',    requirePermission('manage_athletes'),    (req, res) => res.json({ success: true, message: 'Athlete management — Day 3' }));
router.get('/coaches',     requirePermission('manage_coaches'),     (req, res) => res.json({ success: true, message: 'Coach management — Day 3' }));
router.get('/competitions',requirePermission('manage_competitions'),(req, res) => res.json({ success: true, message: 'Competition management — Day 3' }));
router.get('/payments',    requirePermission('manage_payments'),    (req, res) => res.json({ success: true, message: 'Payment management — Day 3' }));

module.exports = router;
