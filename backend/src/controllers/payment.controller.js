const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/payment.model');
const CompetitionRegistration = require('../models/CompetitionRegistration.model');
const AthleteProfile = require('../models/AthleteProfile.model');
const CoachProfile = require('../models/CoachProfile.model');
const Competition = require('../models/Competition.model');
const User = require('../models/User.model');
const { AppError } = require('../utils/appError');
const emailService = require('../services/email.service');
const logger = require('../utils/logger');
const generateReceipt = require('../utils/generateReceipt');
const fs = require('fs');

//Razorpay instance (lazy, so missing keys in dev don't crash import)
let razorpayInstance = null;
const getRazorpay = () => {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new AppError('Razorpay credentials not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env', 500);
    }
    razorpayInstance = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

// Helper: receipt id (max 40 chars for Razorpay)
const makeReceipt = (prefix, id) => `${prefix}_${String(id).slice(-16)}_${Date.now().toString().slice(-6)}`;

/*
POST /api/payments/create-order
Body: { entityType, entityId }
Creates a Razorpay order and returns it to the frontend to open the checkout
*/
exports.createOrder = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.body;
    if (!entityType || !entityId) {
      return next(new AppError(`Missing required fields: entityType=${entityType}, entityId=${entityId}`, 400));
    }

    let amount, description, entity;

    // Resolve entity & amount
    if (entityType === 'competition_registration') {
      entity = await CompetitionRegistration.findById(entityId)
        .populate('competition', 'title registrationFee');
      if (!entity) return next(new AppError(`Competition registration not found for ID: ${entityId}`, 404));
      if (String(entity.athlete) !== String(req.user._id)) {
        return next(new AppError('Not authorised for this registration.', 403));
      }
      if (entity.paymentStatus === 'Paid') {
        return next(new AppError('This registration has already been paid.', 400));
      }
      amount      = entity.competition.registrationFee;
      description = `Competition fee – ${entity.competition.title}`;

    } else if (entityType === 'profile_registration') {
      // Profile registration fee (athlete or coach)
      if (req.user.role === 'athlete') {
        entity = await AthleteProfile.findOne({ user: req.user._id });
        amount = Number(process.env.ATHLETE_REGISTRATION_FEE) || 1500;
      } else if (req.user.role === 'coach') {
        entity = await CoachProfile.findOne({ user: req.user._id });
        amount = Number(process.env.COACH_REGISTRATION_FEE) || 2500;
      }
      if (!entity) return next(new AppError(`Profile not found for user ${req.user._id}`, 404));
      if (entity.profileFeeStatus === 'Paid') {
        return next(new AppError('Profile registration fee has already been marked as Paid.', 400));
      }
      description = `Profile registration fee – ${req.user.fullName}`;

    } else {
      return next(new AppError(`Invalid entityType: ${entityType}`, 400));
    }

    if (!amount || amount <= 0) {
      return next(new AppError(`Invalid amount: ${amount}`, 400));
    }

    // Create Razorpay order 
    const razorpayOrder = await getRazorpay().orders.create({
      amount:   Math.round(amount * 100), // Razorpay works in paise
      currency: 'INR',
      receipt:  makeReceipt(entityType === 'competition_registration' ? 'comp' : 'prof', entityId),
      notes: {
        userId:     String(req.user._id),
        entityType,
        entityId:   String(entityId),
        userName:   req.user.fullName,
        userEmail:  req.user.email,
      },
    });

    // Save Payment doc 
    const payment = await Payment.create({
      user:            req.user._id,
      entityType,
      entityId,
      amount,
      razorpayOrderId: razorpayOrder.id,
      description,
      status:          'created',
    });

    res.status(201).json({
      success: true,
      data: {
        orderId:    razorpayOrder.id,
        amount:     razorpayOrder.amount,        // in paise
        currency:   razorpayOrder.currency,
        paymentId:  payment._id,
        keyId:      process.env.RAZORPAY_KEY_ID,
        // Prefill data for Razorpay checkout
        prefill: {
          name:  req.user.fullName,
          email: req.user.email,
        },
        description,
      },
    });
  } catch (err) {
    next(err);
  }
};


// POST /api/payments/verify
// Called by frontend after Razorpay checkout succeeds.
// Verifies the signature, marks payment as paid, updates the entity.
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentDocId } = req.body;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !paymentDocId) {
      return next(new AppError('Missing payment verification fields.', 400));
    }

    // 1 Signature verification
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      logger.warn(`⚠️  Payment signature mismatch for order ${razorpayOrderId}`);
      return next(new AppError('Payment verification failed. Invalid signature.', 400));
    }

    //2 Find our Payment document 
    const payment = await Payment.findById(paymentDocId);
    if (!payment) return next(new AppError('Payment record not found.', 404));
    if (payment.status === 'paid') {
      // Idempotent — already processed
      return res.status(200).json({ success: true, message: 'Payment already confirmed.', data: payment });
    }

    // 3 Update Payment doc 
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status            = 'paid';
    payment.paidAt            = new Date();
    await payment.save();

    // 4. Update the entity that was paid for 
    let entityDoc, emailData;
    const user = await User.findById(payment.user);

    if (payment.entityType === 'competition_registration') {
      entityDoc = await CompetitionRegistration.findByIdAndUpdate(
        payment.entityId,
        {
          paymentStatus:    'Paid',
          paymentReference: razorpayPaymentId,
          paymentDate:      new Date(),
          paymentAmount:    payment.amount,
        },
        { new: true }
      ).populate('competition', 'title date venue registrationFee');

      emailData = {
        type:        'competition',
        competition: entityDoc?.competition,
        amount:      payment.amount,
        txnId:       razorpayPaymentId,
        orderId:     razorpayOrderId,
      };

    } else if (payment.entityType === 'profile_registration') {
      // Mark profile fee as paid and advance formStep to indicate full completion
      if (user?.role === 'athlete') {
        entityDoc = await AthleteProfile.findByIdAndUpdate(
          payment.entityId,
          {
            profileFeeStatus:        'Paid',
            profileFeePaidAt:        new Date(),
            profileFeeTransactionId: razorpayPaymentId,
            formStep:                9,   // max = fully complete (8 steps + payment)
          },
          { new: true }
        );
      } else {
        entityDoc = await CoachProfile.findByIdAndUpdate(
          payment.entityId,
          {
            profileFeeStatus:        'Paid',
            profileFeePaidAt:        new Date(),
            profileFeeTransactionId: razorpayPaymentId,
            formStep:                6,   // max = fully complete (5 steps + payment)
          },
          { new: true }
        );
      }
      emailData = {
        type:   'profile',
        amount: payment.amount,
        txnId:  razorpayPaymentId,
        orderId: razorpayOrderId,
      };
    }

    //5 Send confirmation email
    if (user) {
      try {
        await emailService.sendPaymentConfirmationEmail({
          to:       user.email,
          fullName: user.fullName,
          ...emailData,
          paidAt:   payment.paidAt,
        });
      } catch (emailErr) {
        // Don't fail the response if email fails
        logger.error(`Email send failed after payment: ${emailErr.message}`);
      }
    }

    logger.info(`✅ Payment verified: ${razorpayPaymentId} for user ${payment.user}`);

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully!',
      data: {
        payment,
        txnId: razorpayPaymentId,
      },
    });
  } catch (err) {
    next(err);
  }
};


// POST /api/payments/webhook
// Razorpay webhook endpoint — handles payment.failed events.
// Verify the webhook signature using RAZORPAY_WEBHOOK_SECRET.
exports.handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const receivedSignature = req.headers['x-razorpay-signature'];
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      if (receivedSignature !== expectedSignature) {
        logger.warn('⚠️  Invalid Razorpay webhook signature');
        return res.status(400).json({ success: false });
      }
    }

    const event   = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.failed') {
      const rpPayment = payload?.payment?.entity;
      if (rpPayment?.order_id) {
        const payment = await Payment.findOneAndUpdate(
          { razorpayOrderId: rpPayment.order_id, status: 'created' },
          {
            status:          'failed',
            failureReason:   rpPayment.error_description || 'Payment failed',
            razorpayPaymentId: rpPayment.id,
          },
          { new: true }
        );
        if (payment) {
          // Update entity payment status to Failed
          if (payment.entityType === 'competition_registration') {
            await CompetitionRegistration.findByIdAndUpdate(
              payment.entityId,
              { paymentStatus: 'Failed' }
            );
          }
          // Send failure email
          const user = await User.findById(payment.user);
          if (user) {
            await emailService.sendPaymentFailedEmail({
              to:       user.email,
              fullName: user.fullName,
              amount:   payment.amount,
              orderId:  rpPayment.order_id,
              reason:   rpPayment.error_description,
            }).catch(() => {});
          }
          logger.info(`❌ Payment failed recorded: order ${rpPayment.order_id}`);
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error(`Webhook error: ${err.message}`);
    res.status(500).json({ success: false });
  }
};

// GET /api/payments/my-payments
// Logged-in user's own payment history
exports.getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    // Enrich with entity names
    const enriched = await Promise.all(
      payments.map(async (p) => {
        const doc = p.toObject();
        if (p.entityType === 'competition_registration') {
          const reg = await CompetitionRegistration.findById(p.entityId)
            .populate('competition', 'title date');
          doc.entityName = reg?.competition?.title || 'Competition';
          doc.entityDate = reg?.competition?.date;
        } else {
          doc.entityName = 'Profile Registration';
        }
        return doc;
      })
    );

    res.status(200).json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
};
// GET /api/admin/payments          — all payments with filters
// GET /api/admin/payments/summary  — totals for dashboard

exports.adminGetAllPayments = async (req, res, next) => {
  try {
    const { status, entityType, page = 1, limit = 30, search } = req.query;
    const filter = {};
    if (status)     filter.status = status;
    if (entityType) filter.entityType = entityType;

    // Search by user email/name
    if (search) {
      const users = await User.find({
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email:    { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      filter.user = { $in: users.map(u => u._id) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('user', 'fullName email mobile role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Payment.countDocuments(filter),
    ]);

    // Enrich entity names
    const enriched = await Promise.all(
      payments.map(async (p) => {
        const doc = p.toObject();
        if (p.entityType === 'competition_registration') {
          const reg = await CompetitionRegistration.findById(p.entityId)
            .populate('competition', 'title');
          doc.entityName = reg?.competition?.title || '—';
        } else {
          doc.entityName = 'Profile Registration';
        }
        return doc;
      })
    );

    res.status(200).json({
      success: true,
      data: {
        payments: enriched,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.adminGetPaymentSummary = async (req, res, next) => {
  try {
    const [totalPaid, totalPending, totalFailed, recentPayments] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.countDocuments({ status: 'created' }),
      Payment.countDocuments({ status: 'failed' }),
      Payment.find({ status: 'paid' })
        .populate('user', 'fullName email')
        .sort({ paidAt: -1 })
        .limit(5),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalRevenue:  totalPaid[0]?.total || 0,
        totalPaidCount: totalPaid[0]?.count || 0,
        pendingCount:  totalPending,
        failedCount:   totalFailed,
        recentPayments,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/payments/receipt/:paymentId
// Generate and download a PDF receipt for a paid payment

exports.downloadReceipt = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.paymentId,
      user: req.user._id,
      status: 'paid',
    });

    if (!payment) {
      return next(new AppError('Paid payment not found.', 404));
    }

    // Enrich description
    let entityName = payment.description || 'Payment';
    if (payment.entityType === 'competition_registration') {
      const reg = await CompetitionRegistration.findById(payment.entityId)
        .populate('competition', 'title');
      entityName = `Competition Fee – ${reg?.competition?.title || 'Competition'}`;
    } else {
      entityName = `Profile Registration Fee – ${req.user.fullName}`;
    }

    const { filePath, fileName } = await generateReceipt({
      receiptNo: `REC-${payment._id.toString().slice(-8).toUpperCase()}`,
      userName: req.user.fullName,
      userEmail: req.user.email,
      description: entityName,
      amount: payment.amount,
      txnId: payment.razorpayPaymentId,
      orderId: payment.razorpayOrderId,
      paidAt: payment.paidAt,
      entityType: payment.entityType,
    });

    res.download(filePath, `Receipt_${fileName}`, (err) => {
      if (err) logger.error(`Receipt download error: ${err.message}`);
      // Clean up generated file after download
      fs.unlink(filePath, () => {});
    });
  } catch (err) {
    next(err);
  }
};