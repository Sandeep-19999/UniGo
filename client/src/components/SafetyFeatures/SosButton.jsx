import { useState } from "react";
import { api } from "../../api/axios";

export default function SosButton() {
  const [alertType, setAlertType] = useState("Emergency");
  const [message, setMessage] = useState("Need immediate assistance");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");

  function sendSos(latitude, longitude) {
    return api.post("/safety/sos", {
      alertType,
      message,
      location: {
        latitude,
        longitude,
        address: "Live browser location",
      },
    });
  }

  async function handleSos() {
    if (!navigator.geolocation) {
      setResult("Geolocation is not supported in this browser.");
      return;
    }

    setSending(true);
    setResult("Sending SOS alert...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { data } = await sendSos(position.coords.latitude, position.coords.longitude);
          if (data?.notificationSummary?.failedCount > 0) {
            const firstFailure = data.notificationSummary.failures?.[0];
            setResult(
              `${data.message}. First failure: ${firstFailure?.name || "Contact"} (${firstFailure?.phoneNumber || "N/A"}) - ${firstFailure?.reason || "Unknown error"}`
            );
          } else {
            setResult("SOS alert sent successfully.");
          }
        } catch (e) {
          setResult(e?.response?.data?.error || e?.response?.data?.message || "Failed to send SOS alert.");
        } finally {
          setSending(false);
        }
      },
      async () => {
        try {
          const { data } = await sendSos(0, 0);
          if (data?.notificationSummary?.failedCount > 0) {
            const firstFailure = data.notificationSummary.failures?.[0];
            setResult(
              `${data.message}. First failure: ${firstFailure?.name || "Contact"} (${firstFailure?.phoneNumber || "N/A"}) - ${firstFailure?.reason || "Unknown error"}`
            );
          } else {
            setResult("SOS alert sent with fallback location.");
          }
        } catch (e) {
          setResult(e?.response?.data?.error || e?.response?.data?.message || "Failed to send SOS alert.");
        } finally {
          setSending(false);
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <section className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
      <h3 className="text-xl font-bold text-red-900">SOS Alert</h3>
      <p className="mt-1 text-sm text-red-800">Trigger an emergency alert to notify contacts and safety team.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <select
          className="rounded-lg border border-red-200 px-3 py-2"
          value={alertType}
          onChange={(e) => setAlertType(e.target.value)}
        >
          <option>Emergency</option>
          <option>Unsafe</option>
          <option>Harassment</option>
          <option>Accident</option>
          <option>Other</option>
        </select>
        <input
          className="rounded-lg border border-red-200 px-3 py-2"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Optional message"
        />
      </div>

      <button
        onClick={handleSos}
        disabled={sending}
        className="mt-4 w-full rounded-lg bg-red-600 px-4 py-3 text-lg font-bold text-white hover:bg-red-700 disabled:opacity-60"
      >
        {sending ? "Sending..." : "Send SOS"}
      </button>

      {result ? <p className="mt-3 text-sm text-red-900">{result}</p> : null}
    </section>
  );
}
