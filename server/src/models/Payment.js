import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
  },
  itemDescription: String,
  quantity: Number,
  unitPrice: Number,
  tax: Number,
  discount: Number,
  total: Number,
  issuedAt: {
    type: Date,
    default: Date.now,
  },
});

const refundSchema = new mongoose.Schema({
  refundId: {
    type: String,
    required: true,
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    enum: ['Ride Cancelled', 'Duplicate Charge', 'Damaged Vehicle', 'Driver Cancellation', 'Other'],
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Completed', 'Failed'],
    default: 'Pending',
  },
  description: String,
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  processedAt: Date,
  notes: String,
});

const paymentSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      unique: true,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'LKR',
    },
    paymentMethod: {
      type: String,
      enum: ['Credit Card', 'Debit Card', 'UPI', 'Wallet', 'Net Banking'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Cancelled'],
      default: 'Pending',
    },
    fareBreakdown: {
      baseFare: Number,
      distanceFare: Number,
      timeFare: Number,
      surgeFare: {
        type: Number,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
      },
      tax: {
        type: Number,
        default: 0,
      },
      platformFee: {
        type: Number,
        default: 0,
      },
    },
    rideDetails: {
      pickupLocation: String,
      dropoffLocation: String,
      distance: Number,
      duration: Number,
      seats: Number,
    },
    paymentGateway: {
      gateway: {
        type: String,
        enum: ['Stripe', 'Razorpay', 'PayPal', 'Manual'],
        required: true,
      },
      gatewayTransactionId: String,
      gatewayResponse: mongoose.Schema.Types.Mixed,
    },
    invoice: invoiceSchema,
    refund: refundSchema,
    paymentProcessedAt: Date,
    paymentFailureReason: String,
    receiptUrl: String,
    notes: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const cashoutRequestSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, trim: true, default: 'bank_transfer' },
    accountHolderName: { type: String, trim: true, default: '' },
    accountNumber: { type: String, trim: true, default: '' },
    bankName: { type: String, trim: true, default: '' },
    note: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'rejected'],
      default: 'pending'
    },
    adminNote: { type: String, trim: true, default: '' },
    payoutReference: { type: String, trim: true, default: '' },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date, default: null }
  },
  { _id: true }
);

const driverEarningsSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  totalEarnings: {
    type: Number,
    default: 0,
  },
  availableBalance: {
    type: Number,
    default: 0,
  },
  totalWithdrawn: {
    type: Number,
    default: 0,
  },
  completedRides: {
    type: Number,
    default: 0,
  },
  rideEarnings: [
    {
      rideId: mongoose.Schema.Types.ObjectId,
      passengerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      routeLabel: { type: String, default: '' },
      amount: Number,
      earnedAt: Date,
      status: { type: String, default: 'completed' }
    },
  ],
  cashoutRequests: {
    type: [cashoutRequestSchema],
    default: []
  },
  bonusEarnings: {
    type: Number,
    default: 0,
  },
  penalties: {
    type: Number,
    default: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

paymentSchema.index({ userId: 1 });
paymentSchema.index({ rideId: 1 });
paymentSchema.index({ driverId: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ createdAt: -1 });
driverEarningsSchema.index({ driverId: 1, lastUpdated: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
const DriverEarnings = mongoose.model('DriverEarnings', driverEarningsSchema);

export { Payment, DriverEarnings };
export default Payment;