import { useEffect, useState } from "react";
import { api } from "../../../api/axios";

export default function PassengerHome() {
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get("/passenger/home")
      .then((r) => setMsg(r.data.message))
      .catch((e) => setErr(e?.response?.data?.message || "Failed to load passenger home"));
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Passenger Home</h1>
        <p className="text-sm text-slate-600">Passenger module scaffold.</p>
      </div>

      {err ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div> : null}

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="font-semibold">API Check</div>
        <div className="mt-2 text-sm text-slate-700">{msg || "Loading..."}</div>
      </div>
    </div>
  );
}
