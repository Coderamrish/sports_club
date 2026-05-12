const express  = require('express');
const router   = express.Router();

const adminAuthController       = require('../controllers/admin/adminAuth.controller');
const adminManagementController = require('../controllers/admin/adminManagement.controller');
const { protect, restrictTo }   = require('../middleware/auth.middleware');
const { requirePermission, requireAdminLevel, auditLog } = require('../middleware/permissions.middleware');

// All admin routes: valid JWT + role=admin
router.use(protect, restrictTo('admin'));

// Self profile
router.get('/me', adminAuthController.getAdminProfile);

// Dashboard (real metrics)
router.get('/dashboard',
  requirePermission('view_analytics'),
  adminManagementController.getDashboard
);

// Admin account management (super_admin only) 
router.post('/admins',   requireAdminLevel('super_admin'), auditLog('create_admin'), adminAuthController.createAdmin);
router.get('/admins',    requireAdminLevel('super_admin'),                           adminAuthController.listAdmins);
router.patch('/admins/:id', requireAdminLevel('super_admin'), auditLog('update_admin'), adminAuthController.updateAdmin);
router.delete('/admins/:id',requireAdminLevel('super_admin'), auditLog('deactivate_admin'), adminAuthController.deactivateAdmin);

//Athlete management
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

//Coach management
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

//Competition management
const competitionController = require('../controllers/competition.controller');
router.post('/competitions',
  requirePermission('manage_competitions'),
  auditLog('create_competition'),
  competitionController.createCompetition
);
router.get('/competitions',
  requirePermission('view_all_profiles'),
  competitionController.getAllCompetitions
);
router.patch('/competitions/:id',
  requirePermission('manage_competitions'),
  auditLog('update_competition'),
  competitionController.updateCompetition
);
router.patch('/competitions/:id/status',
  requirePermission('manage_competitions'),
  auditLog('update_competition_status'),
  competitionController.updateCompetitionStatus
);
router.delete('/competitions/:id',
  requirePermission('manage_competitions'),
  auditLog('delete_competition'),
  competitionController.deleteCompetition
);
router.get('/competitions/:competitionId/registrations',
  requirePermission('manage_competitions'),
  adminManagementController.getCompetitionRegistrations
);
router.patch('/competitions/registrations/:id/status',
  requirePermission('manage_competitions'),
  adminManagementController.updateRegistrationStatus
);

//Payment management
const paymentController = require('../controllers/payment.controller');
router.get('/payments',
  requirePermission('manage_payments'),
  paymentController.adminGetAllPayments
);
router.get('/payments/summary',
  requirePermission('view_analytics'),
  paymentController.adminGetPaymentSummary
);

//Analytics & Export 
const analyticsController = require('../controllers/admin/adminAnalytics.controller');
router.get('/analytics/overview',
  requirePermission('view_analytics'),
  analyticsController.getAnalyticsOverview
);
router.get('/analytics/export',
  requirePermission('view_analytics'),
  analyticsController.exportAnalyticsCSV
);
router.patch('/analytics/registrations/:id/result',
  requirePermission('manage_competitions'),
  analyticsController.updateRegistrationResult
);

module.exports = router;