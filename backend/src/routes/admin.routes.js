const express  = require('express');
const router   = express.Router();

const adminAuthController       = require('../controllers/admin/adminAuth.controller');
const adminManagementController = require('../controllers/admin/adminManagement.controller');
const { protect, restrictTo }   = require('../middleware/auth.middleware');
const { requirePermission, requireAdminLevel, auditLog } = require('../middleware/permissions.middleware');

// All admin routes: valid JWT + role=admin
router.use(protect, restrictTo('admin'));

// ── Self profile ──────────────────────────────────────────────────────────────
router.get('/me', adminAuthController.getAdminProfile);

// ── Dashboard (real metrics) ──────────────────────────────────────────────────
router.get('/dashboard',
  requirePermission('view_analytics'),
  adminManagementController.getDashboard
);

// ── Admin account management (super_admin only) ───────────────────────────────
router.post('/admins',   requireAdminLevel('super_admin'), auditLog('create_admin'), adminAuthController.createAdmin);
router.get('/admins',    requireAdminLevel('super_admin'),                           adminAuthController.listAdmins);
router.patch('/admins/:id', requireAdminLevel('super_admin'), auditLog('update_admin'), adminAuthController.updateAdmin);
router.delete('/admins/:id',requireAdminLevel('super_admin'), auditLog('deactivate_admin'), adminAuthController.deactivateAdmin);

// ── Athlete management ────────────────────────────────────────────────────────
router.get('/athletes',
  requirePermission('view_all_profiles'),
  adminManagementController.listAthletes
);
router.get('/athletes/:id',
  requirePermission('view_all_profiles'),
  adminManagementController.getAthlete
);
router.patch('/athletes/:id/status',
  requirePermission('approve_documents'),
  auditLog('update_athlete_status'),
  adminManagementController.updateAthleteStatus
);
router.patch('/athletes/:id/documents/:docType',
  requirePermission('approve_documents'),
  auditLog('review_document'),
  adminManagementController.reviewDocument
);

// ── Coach management ──────────────────────────────────────────────────────────
router.get('/coaches',
  requirePermission('view_all_profiles'),
  adminManagementController.listCoaches
);
router.get('/coaches/:id',
  requirePermission('view_all_profiles'),
  adminManagementController.getCoach
);
router.patch('/coaches/:id/status',
  requirePermission('approve_documents'),
  adminManagementController.updateCoachStatus
);

// ── Competition management ──────────────────────────────────────────────────
const competitionController = require('../controllers/competition.controller');
router.post('/competitions',
  requirePermission('manage_settings'),
  auditLog('create_competition'),
  competitionController.createCompetition
);
router.get('/competitions',
  requirePermission('view_all_profiles'),
  competitionController.getAllCompetitions
);

module.exports = router;