import { useLocation } from "react-router-dom";
import FareCalculator from "../components/PaymentFeatures/FareCalculator";
import PaymentGateway from "../components/PaymentFeatures/PaymentGateway";
import PaymentHistory from "../components/PaymentFeatures/PaymentHistory";

export default function PaymentPage() {
	const location = useLocation();
	const bookingData = location.state || {};

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
						<p><span className="font-semibold">Amount:</span> Rs. {bookingData.estimatedFare?.toFixed(2) || "N/A"}</p>
						<p><span className="font-semibold">Payment Method:</span> {bookingData.paymentMethod || "Not specified"}</p>
					</div>
				)}
			</header>

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
				<PaymentGateway bookingData={bookingData} />
			</section>

			<section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
				<h2 className="mb-4 text-xl font-semibold text-slate-900">
					Payment History
				</h2>
				<PaymentHistory />
			</section>
		</main>
	);
}
