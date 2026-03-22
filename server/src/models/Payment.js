import mongoose from 'mongoose';

// Invoice Schema
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
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

// Refund Schema
const refundSchema = new mongoose.Schema({
  refundId: {
    type: String,
    unique: true,
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

// Payment Transaction Schema
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

// Driver Earnings Schema
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
  completedRides: {
    type: Number,
    default: 0,
  },
  rideEarnings: [
    {
      rideId: mongoose.Schema.Types.ObjectId,
      amount: Number,
      earnedAt: Date,
    },
  ],
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

// Create indexes for better query performance
paymentSchema.index({ userId: 1 });
paymentSchema.index({ rideId: 1 });
paymentSchema.index({ driverId: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ transactionId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
const DriverEarnings = mongoose.model('DriverEarnings', driverEarningsSchema);

export { Payment, DriverEarnings };
export default Payment;