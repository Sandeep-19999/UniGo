import mongoose from 'mongoose';

// Emergency Contact Schema
const emergencyContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  relationship: {
    type: String,
    enum: ['Parent', 'Guardian', 'Sibling', 'Friend', 'Other'],
    required: true,
  },
  notificationPreference: {
    type: String,
    enum: ['SMS', 'Email', 'Both'],
    default: 'Both',
  },
  isNotified: {
    type: Boolean,
    default: false,
  },
});

// Location History Schema
const locationHistorySchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  address: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
  },
});

// SOS Alert Schema
const sosAlertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['Pending', 'Acknowledged', 'Resolved', 'Escalated'],
    default: 'Pending',
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
  },
  message: String,
  alertType: {
    type: String,
    enum: ['Emergency', 'Unsafe', 'Harassment', 'Accident', 'Other'],
    required: true,
  },
  emergencyContactsNotified: [
    {
      contactId: mongoose.Schema.Types.ObjectId,
      notifiedAt: Date,
      notificationMethod: String,
    },
  ],
  adminNotified: {
    type: Boolean,
    default: false,
  },
  adminNotificationTime: Date,
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolvedNotes: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Main Safety Schema
const safetySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    emergencyContacts: [emergencyContactSchema],
    locationSharing: {
      isEnabled: {
        type: Boolean,
        default: false,
      },
      shareWith: {
        type: String,
        enum: ['Driver', 'EmergencyContacts', 'Both', 'None'],
        default: 'Both',
      },
      enabledAt: Date,
      disabledAt: Date,
    },
    sosAlertHistory: [sosAlertSchema],
    currentLocation: locationHistorySchema,
    locationHistory: [locationHistorySchema],
    lastLocationUpdate: Date,
    safetyScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    sosButtonEnabled: {
      type: Boolean,
      default: true,
    },
    travelHistory: [
      {
        rideId: mongoose.Schema.Types.ObjectId,
        driverId: mongoose.Schema.Types.ObjectId,
        driverName: String,
        date: Date,
        safetyRating: {
          type: Number,
          min: 1,
          max: 5,
        },
        remarks: String,
      },
    ],
    incidentReports: [
      {
        reportId: mongoose.Schema.Types.ObjectId,
        type: String,
        description: String,
        reportedAt: Date,
        status: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
safetySchema.index({ userId: 1 });
safetySchema.index({ 'sosAlertHistory.createdAt': -1 });
safetySchema.index({ 'locationHistory.timestamp': -1 });

export default mongoose.model('Safety', safetySchema);