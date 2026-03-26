import Vehicle from "../../models/vehicles/Vehicle.js";
import DriverDocument, { DRIVER_DOCUMENT_TYPES } from "../../models/drivers/DriverDocument.js";
import DriverProfile from "../../models/drivers/DriverProfile.js";
import { buildDriverOnboardingSummary, ensureDriverProfile } from "../../services/onboardingService.js";

function validateNonEmpty(label, value) {
  if (!String(value || "").trim()) {
    throw new Error(`${label} is required.`);
  }
}

export async function getOnboardingStatus(req, res, next) {
  try {
    await ensureDriverProfile(req.user);
    const summary = await buildDriverOnboardingSummary(req.user._id);
    res.json({ onboarding: summary });
  } catch (err) {
    next(err);
  }
}

export async function getDriverOnboardingDetail(req, res, next) {
  try {
    const summary = await buildDriverOnboardingSummary(req.user._id);
    res.json({
      profile: summary.profile,
      primaryVehicle: summary.primaryVehicle,
      documents: summary.documents,
      onboarding: summary
    });
  } catch (err) {
    next(err);
  }
}

export async function upsertDriverProfile(req, res, next) {
  try {
    const { firstName, lastName, phone, city } = req.body;

    validateNonEmpty("First name", firstName);
    validateNonEmpty("Last name", lastName);
    validateNonEmpty("Phone", phone);
    validateNonEmpty("City", city);

    await ensureDriverProfile(req.user);

    await DriverProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          firstName: String(firstName).trim(),
          lastName: String(lastName).trim(),
          phone: String(phone).trim(),
          city: String(city).trim()
        }
      },
      { new: true }
    );

    req.user.name = `${String(firstName).trim()} ${String(lastName).trim()}`.trim();
    req.user.phone = String(phone).trim();
    req.user.city = String(city).trim();
    await req.user.save();

    const onboarding = await buildDriverOnboardingSummary(req.user._id);
    res.json({ message: "Driver profile saved successfully.", onboarding, profile: onboarding.profile });
  } catch (err) {
    next(err);
  }
}

export async function submitVehicleInformation(req, res, next) {
  try {
    const { vehicleId, type, plateNumber, seatCapacity, make, model, year, color, isPrimary } = req.body;

    validateNonEmpty("Vehicle type", type);
    validateNonEmpty("License plate", plateNumber);
    validateNonEmpty("Make", make);
    validateNonEmpty("Model", model);

    const seats = Number(seatCapacity);
    const parsedYear = Number(year);

    if (!Number.isFinite(seats) || seats < 1) {
      return res.status(400).json({ message: "seatCapacity must be a positive number." });
    }

    if (!Number.isFinite(parsedYear)) {
      return res.status(400).json({ message: "year must be a valid number." });
    }

    let vehicle = null;
    if (vehicleId) {
      vehicle = await Vehicle.findOne({ _id: vehicleId, driver: req.user._id });
      if (!vehicle) return res.status(404).json({ message: "Vehicle not found." });
    }

    if (!vehicle) {
      vehicle = new Vehicle({ driver: req.user._id });
    }

    vehicle.type = type;
    vehicle.plateNumber = plateNumber;
    vehicle.seatCapacity = seats;
    vehicle.make = String(make).trim();
    vehicle.model = String(model).trim();
    vehicle.year = parsedYear;
    vehicle.color = String(color || "").trim();
    vehicle.isPrimary = Boolean(isPrimary ?? true);
    vehicle.reviewStatus = "approved";
    vehicle.approvedAt = new Date();
    vehicle.reviewNote = "";

    await vehicle.save();

    if (vehicle.isPrimary) {
      await Vehicle.updateMany(
        { driver: req.user._id, _id: { $ne: vehicle._id } },
        { $set: { isPrimary: false } }
      );
    }

    const onboarding = await buildDriverOnboardingSummary(req.user._id);
    res.json({ message: "Vehicle information saved successfully.", vehicle, onboarding });
  } catch (err) {
    next(err);
  }
}

export async function listDriverDocuments(req, res, next) {
  try {
    const documents = await DriverDocument.find({ driver: req.user._id }).sort({ updatedAt: -1 });
    res.json({ documents });
  } catch (err) {
    next(err);
  }
}

export async function submitDriverDocument(req, res, next) {
  try {
    const { documentType } = req.params;
    const { fileUrl, fileName, mimeType, documentNumber, expiryDate, notes, vehicleId } = req.body;

    if (!DRIVER_DOCUMENT_TYPES.includes(documentType)) {
      return res.status(400).json({ message: "Invalid document type." });
    }

    validateNonEmpty("fileUrl", fileUrl);

    let vehicle = null;
    if (vehicleId) {
      vehicle = await Vehicle.findOne({ _id: vehicleId, driver: req.user._id });
      if (!vehicle) return res.status(404).json({ message: "Vehicle not found." });
    } else {
      vehicle = await Vehicle.findOne({ driver: req.user._id }).sort({ isPrimary: -1, createdAt: -1 });
    }

    const payload = {
      driver: req.user._id,
      vehicle: vehicle?._id || null,
      documentType,
      fileUrl: String(fileUrl).trim(),
      fileName: String(fileName || "").trim(),
      mimeType: String(mimeType || "").trim(),
      documentNumber: String(documentNumber || "").trim(),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      notes: String(notes || "").trim(),
      status: "submitted",
      submittedAt: new Date(),
      reviewedAt: null,
      reviewNote: "",
      reviewedBy: null
    };

    const document = await DriverDocument.findOneAndUpdate(
      { driver: req.user._id, documentType },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const onboarding = await buildDriverOnboardingSummary(req.user._id);
    res.json({ message: "Document submitted for review.", document, onboarding });
  } catch (err) {
    next(err);
  }
}

export async function deleteDriverDocument(req, res, next) {
  try {
    const { documentType } = req.params;
    if (!DRIVER_DOCUMENT_TYPES.includes(documentType)) {
      return res.status(400).json({ message: "Invalid document type." });
    }

    await DriverDocument.findOneAndDelete({ driver: req.user._id, documentType });
    const onboarding = await buildDriverOnboardingSummary(req.user._id);
    res.json({ message: "Document removed.", onboarding });
  } catch (err) {
    next(err);
  }
}
