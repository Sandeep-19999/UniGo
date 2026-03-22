import nodemailer from 'nodemailer';
import axios from 'axios';

// Configure your email service (use environment variables)
const emailTransporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send SMS Notification
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} type - Type of notification (SOS, TEST, etc)
 * @param {object} data - Data to include in message
 */
export const sendNotification = async (phoneNumber, type, data) => {
  try {
    let message = '';

    switch (type) {
      case 'SOS':
        message = `URGENT: ${data.userName} has triggered an SOS alert. Location: ${data.location}. Alert Type: ${data.alertType}`;
        break;
      case 'TEST':
        message = data.message;
        break;
      default:
        message = 'You have a notification from UniGo';
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_TOKEN;
    const fromNumberRaw = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_FROM;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID || process.env.TWILIO_MESSAGING_SID;

    if (!accountSid || !authToken || (!fromNumberRaw && !messagingServiceSid)) {
      throw new Error('SMS provider is not configured. Set TWILIO_ACCOUNT_SID (or TWILIO_SID), TWILIO_AUTH_TOKEN (or TWILIO_TOKEN), and either TWILIO_PHONE_NUMBER (or TWILIO_FROM_NUMBER) or TWILIO_MESSAGING_SERVICE_SID.');
    }

    const toNumber = normalizePhoneNumber(phoneNumber);
    const fromNumber = fromNumberRaw ? normalizePhoneNumber(fromNumberRaw) : '';

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const payload = new URLSearchParams();
    payload.set('To', toNumber);
    payload.set('Body', message);
    if (messagingServiceSid) {
      payload.set('MessagingServiceSid', messagingServiceSid);
    } else {
      payload.set('From', fromNumber);
    }

    const response = await axios.post(url, payload.toString(), {
      auth: {
        username: accountSid,
        password: authToken,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 12000,
    });

    console.log(`[SMS] Sent to: ${toNumber} (sid: ${response.data.sid || 'n/a'})`);

    return {
      success: true,
      message: 'SMS sent',
      providerMessageId: response.data.sid,
      to: toNumber,
    };
  } catch (error) {
    const providerMessage =
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      error.message ||
      'Unknown SMS provider error';

    const guidance =
      providerMessage.includes('Invalid From Number') || providerMessage.includes('From phone number')
        ? ' Use a Twilio SMS-enabled sender number in E.164 format (TWILIO_PHONE_NUMBER) or set TWILIO_MESSAGING_SERVICE_SID.'
        : '';

    console.error('Error sending SMS notification:', providerMessage);
    throw new Error(`${providerMessage}${guidance}`);
  }
};

function normalizePhoneNumber(phoneNumber) {
  const cleaned = String(phoneNumber || '').replace(/[\s\-()]/g, '');
  if (!cleaned) {
    throw new Error('Phone number is required for SMS notifications');
  }

  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  const defaultCountryCode = process.env.SMS_DEFAULT_COUNTRY_CODE || '+94';

  if (/^\d+$/.test(cleaned) && cleaned.startsWith('0')) {
    return `${defaultCountryCode}${cleaned.slice(1)}`;
  }

  if (/^\d+$/.test(cleaned)) {
    return `${defaultCountryCode}${cleaned}`;
  }

  throw new Error('Invalid phone number format for SMS notifications');
}

export const getSmsConfigStatus = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID || '';
  const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_TOKEN || '';
  const fromNumber = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_FROM || '';
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID || process.env.TWILIO_MESSAGING_SID || '';
  const defaultCountryCode = process.env.SMS_DEFAULT_COUNTRY_CODE || '+94';

  const missing = [];
  if (!accountSid) missing.push('TWILIO_ACCOUNT_SID (or TWILIO_SID)');
  if (!authToken) missing.push('TWILIO_AUTH_TOKEN (or TWILIO_TOKEN)');
  if (!fromNumber && !messagingServiceSid) {
    missing.push('TWILIO_PHONE_NUMBER (or TWILIO_FROM_NUMBER) or TWILIO_MESSAGING_SERVICE_SID');
  }

  const warnings = [];
  if (accountSid && !/^AC[0-9a-zA-Z]{32}$/.test(accountSid)) {
    warnings.push('TWILIO_ACCOUNT_SID format looks invalid (expected AC followed by 32 chars).');
  }
  if (fromNumber && !/^\+?[1-9]\d{7,14}$/.test(fromNumber)) {
    warnings.push('TWILIO_PHONE_NUMBER should be in E.164 format (example: +14155552671).');
  }
  if (messagingServiceSid && !/^MG[0-9a-zA-Z]{32}$/.test(messagingServiceSid)) {
    warnings.push('TWILIO_MESSAGING_SERVICE_SID format looks invalid (expected MG followed by 32 chars).');
  }
  if (!/^\+[1-9]\d{0,3}$/.test(defaultCountryCode)) {
    warnings.push('SMS_DEFAULT_COUNTRY_CODE should be like +94, +1, +44.');
  }

  return {
    ok: missing.length === 0,
    missing,
    warnings,
    meta: {
      sidPrefix: accountSid ? accountSid.slice(0, 2) : '',
      hasAuthToken: Boolean(authToken),
      fromNumber,
      messagingServiceSidPrefix: messagingServiceSid ? messagingServiceSid.slice(0, 2) : '',
      defaultCountryCode,
    },
  };
};

/**
 * Send Email Notification
 * @param {string} email - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML email content
 */
export const sendEmailNotification = async (email, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html: htmlContent,
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`[EMAIL] Sent to: ${email}`);

    return { success: true, message: 'Email sent' };
  } catch (error) {
    console.error('Error sending email notification:', error);
    throw error;
  }
};

/**
 * Format Location for Display
 * @param {number} latitude
 * @param {number} longitude
 * @returns {object}
 */
export const formatLocation = (latitude, longitude) => {
  return {
    latitude: parseFloat(latitude).toFixed(6),
    longitude: parseFloat(longitude).toFixed(6),
    coordinates: `${latitude}, ${longitude}`,
  };
};

/**
 * Calculate Distance Between Two Points (Haversine Formula)
 * @param {number} lat1 - Starting latitude
 * @param {number} lon1 - Starting longitude
 * @param {number} lat2 - Ending latitude
 * @param {number} lon2 - Ending longitude
 * @returns {number} - Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return parseFloat(distance.toFixed(2));
};

/**
 * Check if Location is Safe
 * @param {object} location - Location object
 * @returns {boolean}
 */
export const isLocationSafe = (location) => {
  return true; // Default to safe
};

/**
 * Generate Emergency Contact Template
 * @param {object} contact - Emergency contact object
 * @returns {object}
 */
export const generateEmergencyContactTemplate = (contact) => {
  return {
    id: contact._id,
    name: contact.name,
    phone: contact.phoneNumber,
    email: contact.email,
    relationship: contact.relationship,
    canNotify: contact.notificationPreference !== 'None',
  };
};

/**
 * Generate SOS Alert Email Template
 * @param {object} sosAlert - SOS alert object
 * @param {object} user - User object
 * @returns {string} - HTML email content
 */
export const generateSosEmailTemplate = (sosAlert, user) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
        .container { background-color: white; padding: 20px; border-radius: 8px; max-width: 600px; margin: 20px auto; }
        .header { background-color: #ff4444; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .alert-info { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .location-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { color: #666; font-size: 12px; margin-top: 20px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 SOS ALERT RECEIVED</h1>
        </div>
        
        <h2>Emergency Alert Details</h2>
        
        <div class="alert-info">
          <p><strong>User Name:</strong> ${user.name}</p>
          <p><strong>Alert Type:</strong> ${sosAlert.alertType}</p>
          <p><strong>Status:</strong> ${sosAlert.status}</p>
          <p><strong>Time:</strong> ${new Date(sosAlert.createdAt).toLocaleString()}</p>
          ${sosAlert.message ? `<p><strong>Message:</strong> ${sosAlert.message}</p>` : ''}
        </div>
        
        <h3>Location Information</h3>
        <div class="location-info">
          <p><strong>Address:</strong> ${sosAlert.location.address}</p>
          <p><strong>Coordinates:</strong> ${sosAlert.location.latitude}, ${sosAlert.location.longitude}</p>
        </div>
        
        <p style="color: #ff4444; font-weight: bold;">If you are the emergency contact, please respond immediately or contact authorities if needed.</p>
        
        <div class="footer">
          <p>This is an automated alert from UniGo Safety System</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return htmlContent;
};

/**
 * Generate Travel History Report
 * @param {array} travelHistory - Array of travel records
 * @returns {object}
 */
export const generateTravelHistoryReport = (travelHistory) => {
  const totalRides = travelHistory.length;
  const averageSafetyRating =
    travelHistory.length > 0 ? (travelHistory.reduce((sum, ride) => sum + (ride.safetyRating || 5), 0) / travelHistory.length).toFixed(1) : 0;

  return {
    totalRides,
    averageSafetyRating,
    lastRide: travelHistory[travelHistory.length - 1] || null,
    report: travelHistory,
  };
};

/**
 * Validate Emergency Contact Data
 * @param {object} contactData - Contact data to validate
 * @returns {object} - { isValid: boolean, errors: array }
 */
export const validateEmergencyContactData = (contactData) => {
  const errors = [];

  if (!contactData.name || contactData.name.trim() === '') {
    errors.push('Name is required');
  }

  if (!contactData.phoneNumber || !/^\+?[\d\s\-()]+$/.test(contactData.phoneNumber)) {
    errors.push('Valid phone number is required');
  }

  if (contactData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactData.email)) {
    errors.push('Valid email address is required');
  }

  if (!contactData.relationship || !['Parent', 'Guardian', 'Sibling', 'Friend', 'Other'].includes(contactData.relationship)) {
    errors.push('Valid relationship is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate SOS Alert Data
 * @param {object} sosData - SOS data to validate
 * @returns {object} - { isValid: boolean, errors: array }
 */
export const validateSosAlertData = (sosData) => {
  const errors = [];

  if (!sosData.location || !sosData.location.latitude || !sosData.location.longitude) {
    errors.push('Valid location with latitude and longitude is required');
  }

  if (!sosData.alertType || !['Emergency', 'Unsafe', 'Harassment', 'Accident', 'Other'].includes(sosData.alertType)) {
    errors.push('Valid alert type is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Generate Safety Score
 * @param {object} safety - Safety record object
 * @returns {number} - Safety score (0-100)
 */
export const generateSafetyScore = (safety) => {
  let score = 100;

  score -= safety.sosAlertHistory.length * 5;
  score -= safety.incidentReports.length * 10;

  const safeRides = safety.travelHistory.filter(ride => ride.safetyRating === 5).length;
  score += safeRides * 2;

  return Math.max(0, Math.min(100, score));
};

/**
 * Check if Emergency Contact Notification is Needed
 * @param {object} contact - Emergency contact object
 * @returns {boolean}
 */
export const shouldNotifyContact = (contact) => {
  return contact.notificationPreference !== 'None' && contact.isNotified === false;
};

/**
 * Format SOS Alert for API Response
 * @param {object} sosAlert - SOS alert object
 * @returns {object}
 */
export const formatSosAlertResponse = (sosAlert) => {
  return {
    id: sosAlert._id,
    status: sosAlert.status,
    alertType: sosAlert.alertType,
    location: {
      latitude: sosAlert.location.latitude,
      longitude: sosAlert.location.longitude,
      address: sosAlert.location.address,
    },
    message: sosAlert.message,
    createdAt: sosAlert.createdAt,
    notifiedContacts: sosAlert.emergencyContactsNotified.length,
    adminNotified: sosAlert.adminNotified,
  };
};

/**
 * Log Safety Event
 * @param {object} event - Event object
 */
export const logSafetyEvent = (event) => {
  const timestamp = new Date().toISOString();
  console.log(`[SAFETY_EVENT] ${timestamp} - ${JSON.stringify(event)}`);
};