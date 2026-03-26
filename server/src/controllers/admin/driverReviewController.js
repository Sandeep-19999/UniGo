import User from "../../models/users/User.js";
import DriverDocument, { DRIVER_DOCUMENT_TYPES } from "../../models/drivers/DriverDocument.js";
import { buildDriverOnboardingSummary } from "../../services/onboardingService.js";

export async function getDriverOnboardingQueue(req, res, next) {
  try {
    const drivers = await User.find({ role: "driver" }).sort({ createdAt: -1 });
    const items = [];

    for (const driver of drivers) {
      const onboarding = await buildDriverOnboardingSummary(driver._id);
      items.push({
        driver: {
          id: driver._id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone || "",
          city: driver.city || ""
        },
        onboarding
      });
    }

    res.json({ items, total: items.length });
  } catch (err) {
    next(err);
  }
}

export async function getDriverOnboardingByDriverId(req, res, next) {
  try {
    const { driverId } = req.params;
    const driver = await User.findOne({ _id: driverId, role: "driver" }).select("name email phone city role createdAt");
    if (!driver) {
      return res.status(404).json({ message: "Driver not found." });
    }

    const onboarding = await buildDriverOnboardingSummary(driverId);
    res.json({ driver, onboarding });
  } catch (err) {
    next(err);
  }
}

export async function reviewDriverDocument(req, res, next) {
  try {
    const { driverId, documentType } = req.params;
    const { status, reviewNote } = req.body;

    if (!DRIVER_DOCUMENT_TYPES.includes(documentType)) {
      return res.status(400).json({ message: "Invalid document type." });
    }

    if (!["approved", "rejected"].includes(String(status || "").trim())) {
      return res.status(400).json({ message: "status must be approved or rejected." });
    }

    const document = await DriverDocument.findOne({ driver: driverId, documentType });
    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    document.status = status;
    document.reviewNote = String(reviewNote || "").trim();
    document.reviewedAt = new Date();
    document.reviewedBy = req.user._id;
    await document.save();

    const onboarding = await buildDriverOnboardingSummary(driverId);
    res.json({ message: `Document ${status}.`, document, onboarding });
  } catch (err) {
    next(err);
  }
}
