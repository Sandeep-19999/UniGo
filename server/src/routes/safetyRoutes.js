import express from "express";
import * as safetyController from "../controllers/safetyController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Middleware to verify user is authenticated
router.use(authMiddleware);

// ========== SOS ALERT ROUTES ==========
router.post("/sos", safetyController.sendSosAlert);
router.get("/sos/:sosId", safetyController.getSosAlertStatus);
router.get("/sos-history/:userId", safetyController.getSosAlertHistory);
router.put("/sos/:sosId/resolve", safetyController.resolveSosAlert);

// ========== LOCATION ROUTES ==========
router.post("/location/update", safetyController.updateLocation);
router.get("/location/current/:userId", safetyController.getCurrentLocation);
router.get("/location/history/:userId", safetyController.getLocationHistory);
router.post("/location/sharing/enable", safetyController.enableLocationSharing);
router.post("/location/sharing/disable", safetyController.disableLocationSharing);

// ========== EMERGENCY CONTACTS ROUTES ==========
router.get("/emergency-contacts/:userId", safetyController.getEmergencyContacts);
router.post("/emergency-contacts", safetyController.addEmergencyContact);
router.put("/emergency-contacts/:contactId", safetyController.updateEmergencyContact);
router.delete("/emergency-contacts/:contactId", safetyController.deleteEmergencyContact);
router.post("/emergency-contacts/:contactId/test-notification", safetyController.sendTestNotification);

// ========== SAFETY SCORE ROUTES ==========
router.get("/score/:userId", safetyController.getSafetyScore);
router.put("/score/:userId", safetyController.updateSafetyScore);

// ========== TRAVEL HISTORY ROUTES ==========
router.get("/travel-history/:userId", safetyController.getTravelHistory);
router.post("/travel-history", safetyController.addTravelRecord);

// ========== INCIDENT REPORT ROUTES ==========
router.post("/incident-report", safetyController.reportIncident);
router.get("/incident-reports/:userId", safetyController.getIncidentReports);
router.get("/incident-report/:reportId", safetyController.getIncidentReportDetails);

// ========== SAFETY SETTINGS ROUTES ==========
router.get("/settings/:userId", safetyController.getSafetySettings);
router.put("/settings/:userId", safetyController.updateSafetySettings);

export default router;