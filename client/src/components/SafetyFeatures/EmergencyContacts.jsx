import { useEffect, useState } from "react";
import { api } from "../../api/axios";

export default function EmergencyContacts() {
  const allowedRelationships = ["Parent", "Guardian", "Sibling", "Friend", "Other"];
  const allowedNotificationPreferences = ["Both", "SMS", "Email"];

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    relationship: "Parent",
    notificationPreference: "Both",
  });

  function sanitizePhoneNumber(value) {
    return String(value || "").replace(/[\s-]/g, "").trim();
  }

  function validateForm() {
    const validationErrors = {};
    const trimmedName = form.name.trim();
    const sanitizedPhoneNumber = sanitizePhoneNumber(form.phoneNumber);

    if (!trimmedName) {
      validationErrors.name = "Name is required.";
    } else if (!/^[A-Za-z][A-Za-z\s'.-]{1,59}$/.test(trimmedName)) {
      validationErrors.name = "Name should be 2-60 characters and contain only letters/spaces.";
    }

    if (!sanitizedPhoneNumber) {
      validationErrors.phoneNumber = "Phone number is required.";
    } else if (!/^(?:0\d{9}|\+94\d{9})$/.test(sanitizedPhoneNumber)) {
      validationErrors.phoneNumber = "Use 0701234567 or +94701234567 format.";
    }

    if (!allowedRelationships.includes(form.relationship)) {
      validationErrors.relationship = "Please select a valid relationship.";
    }

    if (!allowedNotificationPreferences.includes(form.notificationPreference)) {
      validationErrors.notificationPreference = "Please select a valid notification preference.";
    }

    const duplicateContact = contacts.find(
      (contact) => sanitizePhoneNumber(contact.phoneNumber) === sanitizedPhoneNumber
    );
    if (duplicateContact) {
      validationErrors.phoneNumber = "This phone number is already in your emergency contacts.";
    }

    return {
      hasErrors: Object.keys(validationErrors).length > 0,
      validationErrors,
      payload: {
        ...form,
        name: trimmedName,
        phoneNumber: sanitizedPhoneNumber,
      },
    };
  }

  function updateFormField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[field];
        return nextErrors;
      });
    }
  }

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    try {
      setError("");
      const { data } = await api.get("/safety/emergency-contacts");
      setContacts(data.emergencyContacts || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }

  async function addContact(e) {
    e.preventDefault();
    const { hasErrors, validationErrors, payload } = validateForm();
    if (hasErrors) {
      setFieldErrors(validationErrors);
      setError("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    setError("");
    setFieldErrors({});
    try {
      await api.post("/safety/emergency-contacts", payload);
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
          className={`rounded-lg border px-3 py-2 ${fieldErrors.name ? "border-rose-500" : "border-slate-300"}`}
          placeholder="Name"
          maxLength={60}
          value={form.name}
          onChange={(e) => updateFormField("name", e.target.value)}
          required
        />
        {fieldErrors.name ? <p className="-mt-2 text-xs text-rose-600 md:col-span-2">{fieldErrors.name}</p> : null}
        <input
          className={`rounded-lg border px-3 py-2 ${fieldErrors.phoneNumber ? "border-rose-500" : "border-slate-300"}`}
          placeholder="Phone Number (e.g. 0701234567 or +94701234567)"
          maxLength={13}
          value={form.phoneNumber}
          onChange={(e) => updateFormField("phoneNumber", e.target.value)}
          required
        />
        {fieldErrors.phoneNumber ? <p className="-mt-2 text-xs text-rose-600 md:col-span-2">{fieldErrors.phoneNumber}</p> : null}
        <select
          className={`rounded-lg border px-3 py-2 ${fieldErrors.relationship ? "border-rose-500" : "border-slate-300"}`}
          value={form.relationship}
          onChange={(e) => updateFormField("relationship", e.target.value)}
        >
          <option>Parent</option>
          <option>Guardian</option>
          <option>Sibling</option>
          <option>Friend</option>
          <option>Other</option>
        </select>
        {fieldErrors.relationship ? <p className="-mt-2 text-xs text-rose-600 md:col-span-2">{fieldErrors.relationship}</p> : null}
        <select
          className={`rounded-lg border px-3 py-2 ${fieldErrors.notificationPreference ? "border-rose-500" : "border-slate-300"}`}
          value={form.notificationPreference}
          onChange={(e) => updateFormField("notificationPreference", e.target.value)}
        >
          <option>Both</option>
          <option>SMS</option>
          <option>Email</option>
        </select>
        {fieldErrors.notificationPreference ? (
          <p className="-mt-2 text-xs text-rose-600 md:col-span-2">{fieldErrors.notificationPreference}</p>
        ) : null}
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
