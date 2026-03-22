import EmergencyContacts from "../components/SafetyFeatures/EmergencyContacts";
import LocationSharing from "../components/SafetyFeatures/LocationSharing";
import SosButton from "../components/SafetyFeatures/SosButton";

export default function SafetyPage() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 md:px-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Safety Center</h1>
        <p className="mt-2 text-slate-600">Manage emergency contacts, location updates, and SOS alerts.</p>
      </header>

      <SosButton />
      <LocationSharing />
      <EmergencyContacts />
    </main>
  );
}
