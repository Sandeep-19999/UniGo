export function fmtMoney(n) {
  const x = Number(n || 0);
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "LKR" }).format(x);
}
export function fmtDateTime(d) {
  if (!d) return "-";
  return new Date(d).toLocaleString();
}
