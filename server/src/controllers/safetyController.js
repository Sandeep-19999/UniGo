import Safety from '../models/Safety.js';
import { sendNotification } from '../utils/safetyHelpers.js';

const allowedRelationships = new Set(['Parent', 'Guardian', 'Sibling', 'Friend', 'Other']);
const allowedNotificationPreferences = new Set(['SMS', 'Email', 'Both']);

function sanitizePhoneNumber(value) {
  return String(value || '').replace(/[\s-]/g, '').trim();
}

function normalizeEmergencyContactInput(data = {}) {
  return {
    name: typeof data.name === 'string' ? data.name.trim() : '',
    phoneNumber: sanitizePhoneNumber(data.phoneNumber),
    email: typeof data.email === 'string' ? data.email.trim() : '',
    relationship: data.relationship,
    notificationPreference: data.notificationPreference,
  };
}

function validateEmergencyContactInput(data, options = {}) {
  const { partial = false } = options;

  if (!partial || data.name !== undefined) {
    if (!data.name) {
      return 'Name is required';
    }
    if (!/^[A-Za-z][A-Za-z\s'.-]{1,59}$/.test(data.name)) {
      return 'Name should be 2-60 characters and contain only letters/spaces';
    }
  }

  if (!partial || data.phoneNumber !== undefined) {
    if (!data.phoneNumber) {
      return 'Phone number is required';
    }
    if (!/^(?:0\d{9}|\+94\d{9})$/.test(data.phoneNumber)) {
      return 'Phone number must be in 0701234567 or +94701234567 format';
    }
  }

  if (!partial || data.relationship !== undefined) {
    if (!allowedRelationships.has(data.relationship)) {
      return 'Invalid relationship value';
    }
  }

  if (!partial || data.notificationPreference !== undefined) {
    const preference = data.notificationPreference || 'Both';
    if (!allowedNotificationPreferences.has(preference)) {
      return 'Invalid notification preference';
    }
  }

  return null;
}

// ========== SOS ALERT FUNCTIONS ==========

/**
 * Send SOS Alert
 * POST /api/safety/sos
 */
export const sendSosAlert = async (req, res) => {
  try {
    const { rideId, driverId, alertType, message, location } = req.body;
    const userId = req.user.id;

    if (!alertType || !location) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let safety = await Safety.findOne({ userId });
    if (!safety) {
      safety = new Safety({ userId, emergencyContacts: [] });
    }

    const sosAlert = {
      userId,
      rideId,
      driverId,
      status: 'Pending',
      location,
      message,
      alertType,
      emergencyContactsNotified: [],
      adminNotified: false,
      createdAt: new Date(),
    };

    safety.sosAlertHistory.push(sosAlert);

    const notifiedContacts = [];
    const notificationFailures = [];

    for (const contact of safety.emergencyContacts) {
      if (contact.notificationPreference === 'SMS' || contact.notificationPreference === 'Both') {
        try {
          await sendNotification(contact.phoneNumber, 'SOS', {
            userName: req.user.name,
            location: location.address,
            alertType,
          });
        } catch (notifyError) {
          notificationFailures.push({
            contactId: contact._id,
            name: contact.name,
            phoneNumber: contact.phoneNumber,
            reason: notifyError.message || 'Failed to send SMS',
          });
        }
      }

      notifiedContacts.push({
        contactId: contact._id,
        notifiedAt: new Date(),
        notificationMethod: contact.notificationPreference,
      });
    }

    sosAlert.emergencyContactsNotified = notifiedContacts;
    sosAlert.adminNotified = true;

    await safety.save();

    const deliveredCount = Math.max(0, notifiedContacts.length - notificationFailures.length);

    res.status(201).json({
      success: true,
      message:
        notificationFailures.length > 0
          ? 'SOS alert created, but some notifications failed'
          : 'SOS alert sent successfully',
      sosAlert,
      notificationSummary: {
        totalContacts: safety.emergencyContacts.length,
        deliveredCount,
        failedCount: notificationFailures.length,
        failures: notificationFailures,
      },
    });
  } catch (error) {
    console.error('Error sending SOS alert:', error);
    res.status(500).json({
      message: error.message || 'Error sending SOS alert',
      error: error.message,
    });
  }
};

/**
 * Get SOS Alert Status
 * GET /api/safety/sos/:sosId
 */
export const getSosAlertStatus = async (req, res) => {
  try {
    const { sosId } = req.params;
    const userId = req.user.id;

    const safety = await Safety.findOne({ userId });
    if (!safety) {
      return res.status(404).json({ message: 'Safety record not found' });
    }

    const sosAlert = safety.sosAlertHistory.id(sosId);
    if (!sosAlert) {
      return res.status(404).json({ message: 'SOS alert not found' });
    }

    res.status(200).json({
      success: true,
      sosAlert,
    });
  } catch (error) {
    console.error('Error fetching SOS alert status:', error);
    res.status(500).json({ message: 'Error fetching SOS alert status', error: error.message });
  }
};

/**
 * Get SOS Alert History
 * GET /api/safety/sos-history
 */
export const getSosAlertHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const safety = await Safety.findOne({ userId }).select('sosAlertHistory');
    if (!safety) {
      return res.status(404).json({ message: 'Safety record not found' });
    }

    res.status(200).json({
      success: true,
      sosAlertHistory: safety.sosAlertHistory,
    });
  } catch (error) {
    console.error('Error fetching SOS alert history:', error);
    res.status(500).json({ message: 'Error fetching SOS alert history', error: error.message });
  }
};

/**
 * Resolve SOS Alert
 * PUT /api/safety/sos/:sosId/resolve
 */
export const resolveSosAlert = async (req, res) => {
  try {
    const { sosId } = req.params;
    const { resolvedNotes } = req.body;
    const userId = req.user.id;

    const safety = await Safety.findOne({ userId });
    if (!safety) {
      return res.status(404).json({ message: 'Safety record not found' });
    }

    const sosAlert = safety.sosAlertHistory.id(sosId);
    if (!sosAlert) {
      return res.status(404).json({ message: 'SOS alert not found' });
    }

    sosAlert.status = 'Resolved';
    sosAlert.resolvedAt = new Date();
    sosAlert.resolvedBy = userId;
    sosAlert.resolvedNotes = resolvedNotes || '';

    await safety.save();

    res.status(200).json({
      success: true,
      message: 'SOS alert resolved',
      sosAlert,
    });
  } catch (error) {
    console.error('Error resolving SOS alert:', error);
    res.status(500).json({ message: 'Error resolving SOS alert', error: error.message });
  }
};

// ========== LOCATION FUNCTIONS ==========

/**
 * Update Location
 * POST /api/safety/location/update
 */
export const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, address, rideId } = req.body;
    const userId = req.user.id;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    let safety = await Safety.findOne({ userId });
    if (!safety) {
      safety = new Safety({ userId });
    }

    const newLocation = {
      latitude,
      longitude,
      address: address || 'Unknown location',
      timestamp: new Date(),
      rideId,
    };

    safety.currentLocation = newLocation;
    safety.locationHistory.push(newLocation);
    safety.lastLocationUpdate = new Date();

    if (safety.locationHistory.length > 100) {
      safety.locationHistory = safety.locationHistory.slice(-100);
    }

    await safety.save();

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      location: newLocation,
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Error updating location', error: error.message });
  }
};

/**
 * Get Current Location
 * GET /api/safety/location/current
 */
export const getCurrentLocation = async (req, res) => {
  try {
    const userId = req.user.id;

    const safety = await Safety.findOne({ userId }).select('currentLocation');
    if (!safety || !safety.currentLocation) {
      return res.status(404).json({ message: 'No current location found' });
    }

    res.status(200).json({
      success: true,
      location: safety.currentLocation,
    });
  } catch (error) {
    console.error('Error fetching current location:', error);
    res.status(500).json({ message: 'Error fetching current location', error: error.message });
  }
};

/**
 * Get Location History
 * GET /api/safety/location/history
 */
export const getLocationHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50 } = req.query;

    const safety = await Safety.findOne({ userId }).select('locationHistory');
    if (!safety) {
      return res.status(404).json({ message: 'Safety record not found' });
    }

    const history = safety.locationHistory.slice(-limit);

    res.status(200).json({
      success: true,
      locationHistory: history,
    });
  } catch (error) {
    console.error('Error fetching location history:', error);
    res.status(500).json({ message: 'Error fetching location history', error: error.message });
  }
};

/**
 * Enable Location Sharing
 * POST /api/safety/location/sharing/enable
 */
export const enableLocationSharing = async (req, res) => {
  try {
    const { shareWith } = req.body;
    const userId = req.user.id;

    let safety = await Safety.findOne({ userId });
    if (!safety) {
      safety = new Safety({ userId });
    }

    safety.locationSharing = {
      isEnabled: true,
      shareWith: shareWith || 'Both',
      enabledAt: new Date(),
    };

    await safety.save();

    res.status(200).json({
      success: true,
      message: 'Location sharing enabled',
      locationSharing: safety.locationSharing,
    });
  } catch (error) {
    console.error('Error enabling location sharing:', error);
    res.status(500).json({ message: 'Error enabling location sharing', error: error.message });
  }
};

/**
 * Disable Location Sharing
 * POST /api/safety/location/sharing/disable
 */
export const disableLocationSharing = async (req, res) => {
  try {
    const userId = req.user.id;

    const safety = await Safety.findOne({ userId });
    if (!safety) {
      return res.status(404).json({ message: 'Safety record not found' });
    }

    safety.locationSharing = {
      isEnabled: false,
      disabledAt: new Date(),
    };

    await safety.save();

    res.status(200).json({
      success: true,
      message: 'Location sharing disabled',
      locationSharing: safety.locationSharing,
    });
  } catch (error) {
    console.error('Error disabling location sharing:', error);
    res.status(500).json({ message: 'Error disabling location sharing', error: error.message });
  }
};

// ========== EMERGENCY CONTACTS FUNCTIONS ==========

/**
 * Get Emergency Contacts
 * GET /api/safety/emergency-contacts/:userId
 */
export const getEmergencyContacts = async (req, res) => {
  try {
    const userId = req.user.id;

    const safety = await Safety.findOne({ userId }).select('emergencyContacts');
    if (!safety) {
      return res.status(404).json({ message: 'Safety record not found' });
    }

    res.status(200).json({
      success: true,
      emergencyContacts: safety.emergencyContacts,
    });
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    res.status(500).json({ message: 'Error fetching emergency contacts', error: error.message });
  }
};

/**
 * Add Emergency Contact
 * POST /api/safety/emergency-contacts
 */
export const addEmergencyContact = async (req, res) => {
  try {
    const input = normalizeEmergencyContactInput(req.body);
    const userId = req.user.id;

    const validationError = validateEmergencyContactInput(input);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    let safety = await Safety.findOne({ userId });
    if (!safety) {
      safety = new Safety({ userId });
    }

    const duplicateContact = safety.emergencyContacts.find(
      (contact) => sanitizePhoneNumber(contact.phoneNumber) === input.phoneNumber
    );
    if (duplicateContact) {
      return res.status(409).json({ message: 'This phone number already exists in emergency contacts' });
    }

    const newContact = {
      name: input.name,
      phoneNumber: input.phoneNumber,
      email: input.email || '',
      relationship: input.relationship,
      notificationPreference: input.notificationPreference || 'Both',
      isNotified: false,
    };

    safety.emergencyContacts.push(newContact);
    await safety.save();

    res.status(201).json({
      success: true,
      message: 'Emergency contact added successfully',
      contact: newContact,
    });
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    res.status(500).json({ message: 'Error adding emergency contact', error: error.message });
  }
};

/**
 * Update Emergency Contact
 * PUT /api/safety/emergency-contacts/:contactId
 */
export const updateEmergencyContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const input = normalizeEmergencyContactInput(req.body);
    const userId = req.user.id;

    const safety = await Safety.findOne({ userId });
    if (!safety) {
      return res.status(404).json({ message: 'Safety record not found' });
    }

    const contact = safety.emergencyContacts.id(contactId);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    const updates = {};
    if (req.body.name !== undefined) updates.name = input.name;
    if (req.body.phoneNumber !== undefined) updates.phoneNumber = input.phoneNumber;
    if (req.body.email !== undefined) updates.email = input.email;
    if (req.body.relationship !== undefined) updates.relationship = input.relationship;
    if (req.body.notificationPreference !== undefined) {
      updates.notificationPreference = input.notificationPreference;
    }

    const validationError = validateEmergencyContactInput(updates, { partial: true });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (updates.phoneNumber) {
      const duplicateContact = safety.emergencyContacts.find(
        (existingContact) =>
          String(existingContact._id) !== String(contactId) &&
          sanitizePhoneNumber(existingContact.phoneNumber) === updates.phoneNumber
      );
      if (duplicateContact) {
        return res.status(409).json({ message: 'This phone number already exists in emergency contacts' });
      }
    }

    contact.name = updates.name ?? contact.name;
    contact.phoneNumber = updates.phoneNumber ?? contact.phoneNumber;
    contact.email = updates.email ?? contact.email;
    contact.relationship = updates.relationship ?? contact.relationship;
    contact.notificationPreference = updates.notificationPreference ?? contact.notificationPreference;

    await safety.save();

    res.status(200).json({
      success: true,
      message: 'Emergency contact updated successfully',
      contact,
    });
  } catch (error) {
    console.error('Error updating emergency contact:', error);
    res.status(500).json({ message: 'Error updating emergency contact', error: error.message });
  }
};

/**
 * Delete Emergency Contact
 * DELETE /api/safety/emergency-contacts/:contactId
 */
export const deleteEmergencyContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = req.user.id;

    const safety = await Safety.findOne({ userId });
    if (!safety) {
      return res.status(404).json({ message: 'Safety record not found' });
    }

    safety.emergencyContacts.id(contactId).deleteOne();
    await safety.save();

    res.status(200).json({
      success: true,
      message: 'Emergency contact deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    res.status(500).json({ message: 'Error deleting emergency contact', error: error.message });
  }
};

/**
 * Send Test Notification to Contact
 * POST /api/safety/emergency-contacts/:contactId/test-notification
 */
export const sendTestNotification = async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = req.user.id;

    const safety = await Safety.findOne({ userId });
    if (!safety) {
      return res.status(404).json({ message: 'Safety record not found' });
    }

    const contact = safety.emergencyContacts.id(contactId);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    if (contact.notificationPreference === 'SMS' || contact.notificationPreference === 'Both') {
      await sendNotification(contact.phoneNumber, 'TEST', {
        message: 'This is a test notification from UniGo Safety',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Test notification sent successfully',
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      message: error.message || 'Error sending test notification',
      error: error.message,
    });
  }
};

// ========== SAFETY SCORE FUNCTIONS ==========

/**
 * Get Safety Score
 * GET /api/safety/score/:userId
 */
export const getSafetyScore = async (req, res) => {
  try {
    const userId = req.user.id;

    const safety = await Safety.findOne({ userId }).select('safetyScore');
    if (!safety) {
      return res.status(404).json({ message: 'Safety record not found' });
    }

    res.status(200).json({
      success: true,
      safetyScore: safety.safetyScore,
    });
  } catch (error) {
    console.error('Error fetching safety score:', error);
    res.status(500).json({ message: 'Error fetching safety score', error: error.message });
  }
};

/**
 * Update Safety Score
 * PUT /api/safety/score
 */
export const updateSafetyScore = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newScore } = req.body;

    if (newScore < 0 || newScore > 100) {
      return res.status(400).json({ message: 'Safety score must be between 0 and 100' });
    }

    const safety = await Safety.findOne({ userId });
    if (!safety) {
      return res.status(404).json({ message: 'Safety record not found' });
    }

    safety.safetyScore = newScore;
    await safety.save();

    res.status(200).json({
      success: true,
      message: 'Safety score updated',
      safetyScore: safety.safetyScore,
    });
  } catch (error) {
    console.error('Error updating safety score:', error);
    res.status(500).json({ message: 'Error updating safety score', error: error.message });
  }
};

// ========== TRAVEL HISTORY FUNCTIONS ==========

/**
 * Get Travel History
 * GET /api/safety/travel-history/:userId
 */
export const getTravelHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const safety = await Safety.findOne({ userId }).select('travelHistory');
    if (!safety) {
      return res.status(404).json({ message: 'Safety record not found' });
    }

    res.status(200).json({
      success: true,
      travelHistory: safety.travelHistory,
    });
  } catch (error) {
    console.error('Error fetching travel history:', error);
    res.status(500).json({ message: 'Error fetching travel history', error: error.message });
  }
};

/**
 * Add Travel Record
 * POST /api/safety/travel-history
 */
export const addTravelRecord = async (req, res) => {
  try {
    const { rideId, driverId, driverName, safetyRating, remarks } = req.body;
    const userId = req.user.id;

    let safety = await Safety.findOne({ userId });
    if (!safety) {
      safety = new Safety({ userId });
    }

    const travelRecord = {
      rideId,
      driverId,
      driverName,
      date: new Date(),
      safetyRating: safetyRating || 5,
      remarks: remarks || '',
    };

    safety.travelHistory.push(travelRecord);
    await safety.save();

    res.status(201).json({
      success: true,
      message: 'Travel record added',
      travelRecord,
    });
  } catch (error) {
    console.error('Error adding travel record:', error);
    res.status(500).json({ message: 'Error adding travel record', error: error.message });
  }
};

// ========== INCIDENT REPORT FUNCTIONS ==========

/**
 * Report Incident
 * POST /api/safety/incident-report
 */
export const reportIncident = async (req, res) => {
  try {
    const { type, description, rideId } = req.body;
    const userId = req.user.id;

    if (!type || !description) {
      return res.status(400).json({ message: 'Type and description are required' });
    }

    let safety = await Safety.findOne({ userId });
    if (!safety) {
      safety = new Safety({ userId });
    }

    const incidentReport = {
      reportId: new (await import('mongodb')).ObjectId(),
      type,
      description,
      reportedAt: new Date(),
      status: 'Pending',
      rideId,
    };

    safety.incidentReports.push(incidentReport);
    await safety.save();

    res.status(201).json({
      success: true,
      message: 'Incident report submitted',
      incidentReport,
    });
  } catch (error) {
    console.error('Error reporting incident:', error);
    res.status(500).json({ message: 'Error reporting incident', error: error.message });
  }
};

/**
 * Get Incident Reports
 * GET /api/safety/incident-reports/:userId
 */
export const getIncidentReports = async (req, res) => {
  try {
    const userId = req.user.id;

    const safety = await Safety.findOne({ userId }).select('incidentReports');
    if (!safety) {
      return res.status(404).json({ message: 'Safety record not found' });
    }

    res.status(200).json({
      success: true,
      incidentReports: safety.incidentReports,
    });
  } catch (error) {
    console.error('Error fetching incident reports:', error);
    res.status(500).json({ message: 'Error fetching incident reports', error: error.message });
  }
};

/**
 * Get Incident Report Details
 * GET /api/safety/incident-report/:reportId
 */
export const getIncidentReportDetails = async (req, res) => {
  try {
    const { reportId } = req.params;

    const safety = await Safety.findOne({ 'incidentReports.reportId': reportId });
    if (!safety) {
      return res.status(404).json({ message: 'Incident report not found' });
    }

    const report = safety.incidentReports.id(reportId);

    res.status(200).json({
      success: true,
      incidentReport: report,
    });
  } catch (error) {
    console.error('Error fetching incident report details:', error);
    res.status(500).json({ message: 'Error fetching incident report details', error: error.message });
  }
};

// ========== SAFETY SETTINGS FUNCTIONS ==========

/**
 * Get Safety Settings
 * GET /api/safety/settings/:userId
 */
export const getSafetySettings = async (req, res) => {
  try {
    const userId = req.user.id;

    const safety = await Safety.findOne({ userId });
    if (!safety) {
      return res.status(404).json({ message: 'Safety record not found' });
    }

    const settings = {
      sosButtonEnabled: safety.sosButtonEnabled,
      locationSharing: safety.locationSharing,
      emergencyContactsCount: safety.emergencyContacts.length,
    };

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Error fetching safety settings:', error);
    res.status(500).json({ message: 'Error fetching safety settings', error: error.message });
  }
};

/**
 * Update Safety Settings
 * PUT /api/safety/settings
 */
export const updateSafetySettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sosButtonEnabled } = req.body;

    const safety = await Safety.findOne({ userId });
    if (!safety) {
      return res.status(404).json({ message: 'Safety record not found' });
    }

    safety.sosButtonEnabled = sosButtonEnabled !== undefined ? sosButtonEnabled : safety.sosButtonEnabled;
    await safety.save();

    res.status(200).json({
      success: true,
      message: 'Safety settings updated',
      settings: {
        sosButtonEnabled: safety.sosButtonEnabled,
      },
    });
  } catch (error) {
    console.error('Error updating safety settings:', error);
    res.status(500).json({ message: 'Error updating safety settings', error: error.message });
  }
};