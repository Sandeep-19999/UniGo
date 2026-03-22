import { useEffect, useState } from "react";
import { api } from "../../api/axios";

export default function EmergencyContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    relationship: "Parent",
    notificationPreference: "Both",
  });

  useEffect(() => {
    loadContacts();
  }, []);

  async function getUserId() {
    const { data } = await api.get("/auth/me");
    return data?.user?.id;
  }

  async function loadContacts() {
    try {
      setError("");
      const userId = await getUserId();
      const { data } = await api.get(`/safety/emergency-contacts/${userId}`);
      setContacts(data.emergencyContacts || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }

  async function addContact(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/safety/emergency-contacts", form);
      setForm({
        name: "",
        phoneNumber: "",
        relationship: "Parent",
        notificationPreference: "Both",
      });
      await loadContacts();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to add contact");
    } finally {
      setSaving(false);
    }
  }

  async function removeContact(contactId) {
    const contact = contacts.find((item) => item._id === contactId);
    const label = contact?.name || "this contact";
    const confirmed = window.confirm(`Remove ${label} from emergency contacts?`);

    if (!confirmed) {
      return;
    }

    setDeletingId(contactId);
    setError("");

    try {
      await api.delete(`/safety/emergency-contacts/${contactId}`);
      setContacts((prev) => prev.filter((contact) => contact._id !== contactId));
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to remove contact");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-xl font-bold text-slate-900">Emergency Contacts</h3>
      <p className="mt-1 text-sm text-slate-600">Add trusted contacts who should be notified in emergencies.</p>

      {error ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <form onSubmit={addContact} className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          className="rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Phone Number (e.g. 0701234567 or +94701234567)"
          value={form.phoneNumber}
          onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
          required
        />
        <select
          className="rounded-lg border border-slate-300 px-3 py-2"
          value={form.relationship}
          onChange={(e) => setForm({ ...form, relationship: e.target.value })}
        >
          <option>Parent</option>
          <option>Guardian</option>
          <option>Sibling</option>
          <option>Friend</option>
          <option>Other</option>
        </select>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2"
          value={form.notificationPreference}
          onChange={(e) => setForm({ ...form, notificationPreference: e.target.value })}
        >
          <option>Both</option>
          <option>SMS</option>
          <option>Email</option>
        </select>
        <button
          type="submit"
          disabled={saving}
          className="md:col-span-2 rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Add Contact"}
        </button>
      </form>

      <div className="mt-5 space-y-2">
        {loading ? <p className="text-sm text-slate-600">Loading contacts...</p> : null}
        {!loading && contacts.length === 0 ? <p className="text-sm text-slate-600">No emergency contacts added yet.</p> : null}
        {contacts.map((contact) => (
          <div key={contact._id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <div>
              <p className="font-semibold text-slate-900">{contact.name}</p>
              <p className="text-slate-600">{contact.phoneNumber} - {contact.relationship}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-200 px-2 py-1 text-xs text-slate-700">{contact.notificationPreference}</span>
              <button
                type="button"
                onClick={() => removeContact(contact._id)}
                disabled={deletingId === contact._id}
                className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {deletingId === contact._id ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
