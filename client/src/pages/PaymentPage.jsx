import { useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/axios";
import FareCalculator from "../components/PaymentFeatures/FareCalculator";
import PaymentGateway from "../components/PaymentFeatures/PaymentGateway";
import PaymentHistory from "../components/PaymentFeatures/PaymentHistory";

function getRideDisplayFare(ride) {
  if (!ride) return 0;
  if (Number(ride.finalFare) > 0) return Number(ride.finalFare);
  if (Number(ride.estimatedFare) > 0) return Number(ride.estimatedFare);
  if (Number(ride.estimatedPrice) > 0) return Number(ride.estimatedPrice);

  const distanceKm = Number(ride.distanceKm || 0);
  if (distanceKm > 0) {
    const ratePerKm = ride.vehicleType === "bike" ? 40 : 60;
    return Number((distanceKm * ratePerKm).toFixed(2));
  }

  return 0;
}

export default function PaymentPage() {
	const location = useLocation();
	const bookingData = location.state || {};
	const [rides, setRides] = useState([]);
	const [loadingRides, setLoadingRides] = useState(true);

	useEffect(() => {
		let active = true;

		api
			.get("/passenger/rides")
			.then((res) => {
				if (!active) return;
				setRides(Array.isArray(res.data?.rideRequests) ? res.data.rideRequests : []);
			})
			.catch(() => {
				if (!active) return;
				setRides([]);
			})
			.finally(() => {
				if (!active) return;
				setLoadingRides(false);
			});

		return () => {
			active = false;
		};
	}, []);

	const currentRide = useMemo(() => {
		return rides.find((ride) => ["pending", "accepted", "started"].includes(ride.status)) || null;
	}, [rides]);

	const selectedBookingRide = useMemo(() => {
		return bookingData?.bookingDetails && bookingData.bookingDetails._id ? bookingData.bookingDetails : null;
	}, [bookingData]);

	const payableRide = useMemo(() => {
		return selectedBookingRide || currentRide;
	}, [selectedBookingRide, currentRide]);

	const currentRideAmount = useMemo(() => {
		if (Number(bookingData?.estimatedFare) > 0) return Number(bookingData.estimatedFare);
		return getRideDisplayFare(payableRide);
	}, [bookingData?.estimatedFare, payableRide]);

	const currentRideRoute = useMemo(() => {
		if (bookingData?.pickupLocation && bookingData?.dropLocation) {
			return `${bookingData.pickupLocation} -> ${bookingData.dropLocation}`;
		}
		if (payableRide?.pickupLocation && payableRide?.dropLocation) {
			return `${payableRide.pickupLocation} -> ${payableRide.dropLocation}`;
		}
		return "No active ride";
	}, [bookingData?.dropLocation, bookingData?.pickupLocation, payableRide]);

	const payableStatus = useMemo(() => {
		if (selectedBookingRide?.status) return selectedBookingRide.status;
		if (payableRide?.status) return payableRide.status;
		return "N/A";
	}, [selectedBookingRide, payableRide]);

	const payableSource = useMemo(() => {
		if (selectedBookingRide) return "Selected booking";
		if (loadingRides) return "Loading current ride...";
		return payableRide ? "Active booking" : "No active booking";
	}, [selectedBookingRide, loadingRides, payableRide]);

	return (
		<main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
			<header className="mb-8">
				<h1 className="text-3xl font-bold text-slate-900">Payments</h1>
				<p className="mt-2 text-slate-600">
					Calculate fare, complete payments, and review transaction history.
				</p>
				{bookingData?.bookingId && (
					<div className="mt-4 flex flex-col gap-2 text-sm text-slate-700">
						<p><span className="font-semibold">Booking ID:</span> {bookingData.bookingId}</p>
						<p><span className="font-semibold">Route:</span> {bookingData.pickupLocation} → {bookingData.dropLocation}</p>
						<p><span className="font-semibold">Amount:</span> Rs. {Number(currentRideAmount || 0).toFixed(2)}</p>
						<p><span className="font-semibold">Payment Method:</span> {bookingData.paymentMethod || "Not specified"}</p>
					</div>
				)}
			</header>

			<section className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm md:p-6">
				<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div>
						<h2 className="text-xl font-semibold text-slate-900">Current Ride Amount</h2>
						<p className="mt-1 text-sm text-slate-600">Current amount for passenger payment from the active ride.</p>
					</div>
					<div className="text-right">
						<div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Current payable</div>
						<div className="mt-1 text-3xl font-extrabold text-emerald-700">LKR {Number(currentRideAmount || 0).toFixed(2)}</div>
					</div>
				</div>

				<div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
					<div><span className="font-semibold">Route:</span> {currentRideRoute}</div>
					<div><span className="font-semibold">Status:</span> {payableStatus}</div>
					<div><span className="font-semibold">Source:</span> {payableSource}</div>
				</div>
			</section>

			<section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
				<h2 className="mb-4 text-xl font-semibold text-slate-900">
					Fare Calculator
				</h2>
				<FareCalculator bookingData={bookingData} />
			</section>

			<section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
				<h2 className="mb-4 text-xl font-semibold text-slate-900">
					Payment Gateway
				</h2>
				<PaymentGateway bookingData={bookingData} currentRide={payableRide} currentRideAmount={currentRideAmount} />
			</section>

			<section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
				<h2 className="mb-4 text-xl font-semibold text-slate-900">
					Payment History
				</h2>
				<PaymentHistory rides={rides} />
			</section>
		</main>
	);
}
