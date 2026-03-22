export const DEFAULT_CURRENCY = "LKR";

export function formatCurrency(amount, currency = DEFAULT_CURRENCY) {
	const safeAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0;
	return new Intl.NumberFormat("en-LK", {
		style: "currency",
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(safeAmount);
}
