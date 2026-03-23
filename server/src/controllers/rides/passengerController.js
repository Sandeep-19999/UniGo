import Ride from "../../models/rides/Ride.js";
import User from "../../models/users/User.js";
import Vehicle from "../../models/vehicles/Vehicle.js";

export async function listAvailableRides(req, res, next) {
  try {
    const { origin, destination, date } = req.query;

    const query = { status: "pending" };

    if (origin) {
      query["origin.label"] = { $regex: origin, $options: "i" };
    }

    if (destination) {
      query["destination.label"] = { $regex: destination, $options: "i" };
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query.departureTime = { $gte: startOfDay, $lte: endOfDay };
    }

    const rides = await Ride.find(query)
      .populate({
        path: "driver",
        select: "name email",
      })
      .populate({
        path: "vehicle",
        select: "type plateNumber seatCapacity",
      })
      .sort({ departureTime: 1 });

    res.json({ rides });
  } catch (err) {
    next(err);
  }
}

export async function getRideDetail(req, res, next) {
  try {
    const { rideId } = req.params;

    const ride = await Ride.findById(rideId)
      .populate({
        path: "driver",
        select: "name email _id",
      })
      .populate({
        path: "vehicle",
        select: "type plateNumber seatCapacity",
      });

    if (!ride) {
      return res.status(404).json({ message: "Ride not found." });
    }

    res.json(ride);
  } catch (err) {
    next(err);
  }
}

export async function listAvailableDrivers(req, res, next) {
  try {
    const drivers = await User.find({ role: "driver" })
      .select("name email")
      .sort({ createdAt: -1 });

    res.json({ drivers });
  } catch (err) {
    next(err);
  }
}

export async function getDriverDetail(req, res, next) {
  try {
    const { driverId } = req.params;

    const driver = await User.findById(driverId).select("name email _id");

    if (!driver) {
      return res.status(404).json({ message: "Driver not found." });
    }

    // Get driver's vehicles
    const vehicles = await Vehicle.find({ driver: driverId }).sort({
      createdAt: -1,
    });

    // Get driver's upcoming rides
    const upcomingRides = await Ride.find({
      driver: driverId,
      status: "pending",
      departureTime: { $gt: new Date() },
    })
      .populate("vehicle", "type plateNumber seatCapacity")
      .sort({ departureTime: 1 })
      .limit(5);

    res.json({
      driver,
      vehicles,
      upcomingRides,
    });
  } catch (err) {
    next(err);
  }
}
