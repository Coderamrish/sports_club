/**
 * payment.service.js
 * Handles Razorpay checkout flow end-to-end.
 *
 * Flow:
 *  1. createOrder()  → backend creates Razorpay order, returns orderId + keyId
 *  2. openCheckout() → loads Razorpay JS SDK, opens the payment modal
 *  3. verifyPayment()→ on success, backend verifies signature and marks paid
 */
import api from './api';

// ── Load Razorpay JS SDK lazily ───────────────────────────────────────────────
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

// ═══════════════════════════════════════════════════════════════════════════════
/**
 * initiatePayment
 *
 * @param {object} params
 *   entityType  'competition_registration' | 'profile_registration'
 *   entityId    MongoDB ObjectId of the entity being paid for
 *   description Human-readable label shown in Razorpay modal
 *   onSuccess   callback(paymentData) — called after backend verify succeeds
 *   onFailure   callback(error)       — called on any failure
 */
export const initiatePayment = async ({ entityType, entityId, description, onSuccess, onFailure }) => {
  try {
    // 1. Load Razorpay SDK
    const sdkLoaded = await loadRazorpayScript();
    if (!sdkLoaded) {
      throw new Error('Failed to load Razorpay. Please check your internet connection.');
    }

    // 2. Create backend order
    const { data: orderRes } = await api.post('/payments/create-order', { entityType, entityId });
    const { orderId, amount, currency, paymentId: paymentDocId, keyId, prefill } = orderRes.data;

    // 3. Open Razorpay checkout
    await new Promise((resolve, reject) => {
      const options = {
        key:         keyId,
        amount,                       // in paise
        currency,
        name:        'Sports Club',
        description: description || 'Sports Club Payment',
        order_id:    orderId,
        prefill: {
          name:  prefill?.name  || '',
          email: prefill?.email || '',
        },
        theme: { color: '#1565C0' },
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled by user.')),
        },
        handler: async (response) => {
          // 4. Verify with backend
          try {
            const { data: verifyRes } = await api.post('/payments/verify', {
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentDocId,
            });
            resolve(verifyRes.data);
          } catch (verifyErr) {
            reject(verifyErr);
          }
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response) => {
        reject(new Error(response.error?.description || 'Payment failed'));
      });

      rzp.open();
    })
      .then((paymentData) => {
        if (onSuccess) onSuccess(paymentData);
      })
      .catch((err) => {
        const errorMsg = err.response?.data?.message || err.message || 'Payment initiation failed';
        if (onFailure) onFailure(new Error(errorMsg));
      });

  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || 'Payment failed to initialize';
    if (onFailure) onFailure(new Error(errorMsg));
  }
};

// ── Get user's payment history ────────────────────────────────────────────────
export const getMyPayments = async () => {
  const { data } = await api.get('/payments/my-payments');
  return data.data;
};

// ── Admin: get all payments ───────────────────────────────────────────────────
export const adminGetPayments = async (params = {}) => {
  const { data } = await api.get('/admin/payments', { params });
  return data.data;
};

export const adminGetPaymentSummary = async () => {
  const { data } = await api.get('/admin/payments/summary');
  return data.data;
};