import express from "express";
import * as paymentController from "../controllers/paymentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// ========== PAYMENT GATEWAY WEBHOOKS (NO AUTH REQUIRED) ==========
router.post("/gateway/webhook/stripe", paymentController.stripeWebhook);
router.post("/gateway/webhook/razorpay", paymentController.razorpayWebhook);

// Middleware to verify user is authenticated (applied to all routes below)
router.use(authMiddleware);

// ========== PAYMENT PROCESSING ROUTES ==========
router.post("/process", paymentController.processPayment);
router.post("/validate", paymentController.validatePayment);
router.post("/confirm/:transactionId", paymentController.confirmPayment);

// ========== PAYMENT STATUS ROUTES ==========
router.get("/status/:transactionId", paymentController.getPaymentStatus);
router.get("/history/:userId", paymentController.getPaymentHistory);
router.get("/receipt/:transactionId", paymentController.getPaymentReceipt);

// ========== FARE CALCULATION ROUTES ==========
router.post("/fare/calculate", paymentController.calculateFare);
router.get("/fare-rates", paymentController.getFareRates);

// ========== REFUND ROUTES ==========
router.post("/refund/request", paymentController.requestRefund);
router.get("/refund/status/:refundId", paymentController.getRefundStatus);
router.get("/refund/history/:userId", paymentController.getRefundHistory);
router.put("/refund/:refundId/cancel", paymentController.cancelRefund);

// ========== INVOICE ROUTES ==========
router.get("/invoice/:transactionId", paymentController.getInvoice);
router.post("/invoice/generate", paymentController.generateInvoice);
router.get("/invoice/download/:invoiceId", paymentController.downloadInvoice);

// ========== DRIVER EARNINGS ROUTES ==========
router.get("/driver-earnings/:driverId", paymentController.getDriverEarnings);
router.get("/driver-earnings/:driverId/history", paymentController.getDriverEarningsHistory);
router.post("/driver-earnings/withdraw", paymentController.withdrawEarnings);

// ========== PAYMENT METHODS ROUTES ==========
router.get("/payment-methods/:userId", paymentController.getPaymentMethods);
router.post("/payment-methods", paymentController.addPaymentMethod);
router.delete("/payment-methods/:methodId", paymentController.deletePaymentMethod);
router.put("/payment-methods/:methodId/default", paymentController.setDefaultPaymentMethod);

// ========== TRANSACTION ROUTES ==========
router.get("/transactions/:userId", paymentController.getTransactions);
router.get("/transaction/:transactionId", paymentController.getTransactionDetails);

export default router;