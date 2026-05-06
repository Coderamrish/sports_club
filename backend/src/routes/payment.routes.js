const express = require('express');
const router  = express.Router();
const { protect, restrictTo } = require('../middleware/auth.middleware');
const paymentController = require('../controllers/payment.controller');

// ── Webhook (no auth — Razorpay calls this directly, signature verified inside) ──
// Must use raw body — mounted BEFORE express.json() in app.js via rawBody middleware
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    // Parse raw body back to JSON for the controller
    try { req.body = JSON.parse(req.body); } catch { req.body = {}; }
    next();
  },
  paymentController.handleWebhook
);

// ── Authenticated user routes ─────────────────────────────────────────────────
router.use(protect);

// Create Razorpay order (athlete or coach)
router.post('/create-order', restrictTo('athlete', 'coach'), paymentController.createOrder);

// Verify payment after Razorpay checkout
router.post('/verify',       restrictTo('athlete', 'coach'), paymentController.verifyPayment);

// My payment history
router.get('/my-payments',   restrictTo('athlete', 'coach'), paymentController.getMyPayments);

// Download PDF receipt for a paid payment
router.get('/receipt/:paymentId', restrictTo('athlete', 'coach'), paymentController.downloadReceipt);

module.exports = router;