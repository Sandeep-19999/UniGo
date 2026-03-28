import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../api/axios";

// =========================================================
// DOCUMENT ORDER CONFIG
// Controls the order and labels of driver onboarding documents
// =========================================================
const DOCUMENT_ORDER = [
  {
    key: "profile_photo",
    label: "Profile Photo",
    description: "Driver face photo for identity verification"
  },
  {
    key: "driving_license",
    label: "Driving License",
    description: "Valid driving license document"
  },
  {
    key: "vehicle_insurance",
    label: "Vehicle Insurance",
    description: "Insurance for the selected onboarding vehicle"
  },
  {
    key: "revenue_license",
    label: "Revenue License",
    description: "Revenue license for the vehicle"
  },
  {
    key: "vehicle_registration_document",
    label: "Vehicle Registration Document",
    description: "Official vehicle registration record"
  }
];

// =========================================================
// HELPER: JOIN CLASS NAMES
// =========================================================
function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

// =========================================================
// HELPER: STATUS BADGE STYLES
// =========================================================
function getStatusBadgeClasses(status) {
  switch (status) {
    case "approved":
    case "completed":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "submitted":
    case "under_review":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "rejected":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

// =========================================================
// HELPER: PRETTY STATUS TEXT
// =========================================================
function prettyStatus(status) {
  if (!status) return "Not submitted";
  return String(status)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

// =========================================================
// HELPER: DATE FORMATTER
// =========================================================
function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

// =========================================================
// SKELETON: DRIVER QUEUE LOADING
// =========================================================
function DriverQueueSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4"
        >
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-28 rounded bg-slate-100" />
          <div className="mt-3 h-3 w-full rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

// =========================================================
// EMPTY STATE COMPONENT
// =========================================================
function EmptyState({ title, subtitle }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

// =========================================================
// STATUS PILL
// Reusable pill for showing status labels
// =========================================================
function StatusPill({ label, status }) {
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
        getStatusBadgeClasses(status)
      )}
    >
      {label}
    </span>
  );
}

// =========================================================
// DOCUMENT PREVIEW PANEL
// Supports images and PDFs, with fallback open-file link
// =========================================================
function PreviewPanel({ document }) {
  if (!document?.fileUrl) {
    return (
      <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        No file preview available
      </div>
    );
  }

  const fileUrl = document.fileUrl;
  const mimeType = document.mimeType || "";
  const fileName = document.fileName || "document";

  const isImage =
    fileUrl.startsWith("data:image/") || mimeType.startsWith("image/");
  const isPdf =
    fileUrl.startsWith("data:application/pdf") ||
    mimeType === "application/pdf";

  if (isImage) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        <img
          src={fileUrl}
          alt={fileName}
          className="max-h-[28rem] w-full object-contain"
        />
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <iframe title={fileName} src={fileUrl} className="h-[32rem] w-full" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-sm text-slate-600">
        Preview is not supported for this file type.
      </p>
      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Open file
      </a>
    </div>
  );
}

// =========================================================
// QUEUE CARD
// Single driver card shown in the review queue
// =========================================================
function QueueCard({ item, isActive, onSelect }) {
  const onboarding = item.onboarding;
  const driver = item.driver;

  return (
    <button
      onClick={() => onSelect(driver.id)}
      className={classNames(
        "w-full rounded-2xl border p-4 text-left transition",
        isActive
          ? "border-slate-900 bg-slate-900 text-white shadow-lg"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className={classNames(
              "truncate text-base font-bold",
              isActive ? "text-white" : "text-slate-900"
            )}
          >
            {driver.name}
          </h3>
          <p
            className={classNames(
              "truncate text-sm",
              isActive ? "text-slate-200" : "text-slate-500"
            )}
          >
            {driver.email}
          </p>
        </div>

        <span
          className={classNames(
            "inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
            isActive
              ? "border-white/20 bg-white/10 text-white"
              : getStatusBadgeClasses(onboarding.overallStatus)
          )}
        >
          {prettyStatus(onboarding.overallStatus)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div
          className={classNames(
            "rounded-xl px-3 py-2",
            isActive ? "bg-white/10" : "bg-slate-50"
          )}
        >
          <div
            className={classNames(
              "font-semibold",
              isActive ? "text-white" : "text-slate-900"
            )}
          >
            {onboarding.counts?.completed ?? 0}
          </div>
          <div className={classNames(isActive ? "text-slate-200" : "text-slate-500")}>
            Approved
          </div>
        </div>

        <div
          className={classNames(
            "rounded-xl px-3 py-2",
            isActive ? "bg-white/10" : "bg-slate-50"
          )}
        >
          <div
            className={classNames(
              "font-semibold",
              isActive ? "text-white" : "text-slate-900"
            )}
          >
            {onboarding.counts?.submitted ?? 0}
          </div>
          <div className={classNames(isActive ? "text-slate-200" : "text-slate-500")}>
            In Review
          </div>
        </div>

        <div
          className={classNames(
            "rounded-xl px-3 py-2",
            isActive ? "bg-white/10" : "bg-slate-50"
          )}
        >
          <div
            className={classNames(
              "font-semibold",
              isActive ? "text-white" : "text-slate-900"
            )}
          >
            {onboarding.counts?.required ?? 0}
          </div>
          <div className={classNames(isActive ? "text-slate-200" : "text-slate-500")}>
            Pending
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div
          className={classNames(
            "mb-2 flex items-center justify-between text-xs",
            isActive ? "text-slate-200" : "text-slate-500"
          )}
        >
          <span>Progress</span>
          <span>{onboarding.progressPercent ?? 0}%</span>
        </div>

        <div
          className={classNames(
            "h-2 w-full overflow-hidden rounded-full",
            isActive ? "bg-white/10" : "bg-slate-100"
          )}
        >
          <div
            className={classNames(
              "h-full rounded-full",
              isActive ? "bg-white" : "bg-slate-900"
            )}
            style={{ width: `${onboarding.progressPercent ?? 0}%` }}
          />
        </div>
      </div>
    </button>
  );
}

// =========================================================
// STEP LIST
// Shows onboarding steps and their current state
// =========================================================
function StepList({ steps }) {
  return (
    <div className="space-y-3">
      {steps.map((step) => (
        <div
          key={step.key}
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
        >
          <div>
            <p className="font-semibold text-slate-900">{step.title}</p>
            <p className="text-sm text-slate-500">{step.subtitle || "—"}</p>
          </div>
          <StatusPill
            label={prettyStatus(step.statusLabel || step.state)}
            status={step.statusLabel || step.state}
          />
        </div>
      ))}
    </div>
  );
}

// =========================================================
// MAIN PAGE: ADMIN DRIVER REVIEW
// Allows admin to:
// - view driver review queue
// - open driver onboarding detail
// - preview documents
// - approve or reject documents
// =========================================================
export default function AdminDriverReviewPage() {
  // =======================================================
  // QUEUE STATE
  // =======================================================
  const [queue, setQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState("");

  // =======================================================
  // DRIVER DETAIL STATE
  // =======================================================
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // =======================================================
  // DOCUMENT REVIEW STATE
  // =======================================================
  const [selectedDocumentType, setSelectedDocumentType] =
    useState("profile_photo");
  const [reviewNote, setReviewNote] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  // =======================================================
  // FILTER STATE
  // =======================================================
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // =======================================================
  // FETCH DRIVER REVIEW QUEUE
  // =======================================================
  const fetchQueue = useCallback(async () => {
    try {
      setQueueLoading(true);
      setQueueError("");

      const { data } = await api.get("/admin/driver-reviews/queue");
      const items = Array.isArray(data?.items) ? data.items : [];

      setQueue(items);

      setSelectedDriverId((current) => {
        if (current && items.some((item) => item.driver.id === current)) {
          return current;
        }
        return items[0]?.driver?.id || "";
      });
    } catch (error) {
      setQueueError(
        error?.response?.data?.message ||
          "Failed to load driver review queue."
      );
    } finally {
      setQueueLoading(false);
    }
  }, []);

  // =======================================================
  // FETCH SELECTED DRIVER DETAIL
  // =======================================================
  const fetchDriverDetail = useCallback(async (driverId) => {
    if (!driverId) {
      setDetail(null);
      return;
    }

    try {
      setDetailLoading(true);
      setDetailError("");

      const { data } = await api.get(`/admin/driver-reviews/${driverId}`);
      setDetail(data);
    } catch (error) {
      setDetailError(
        error?.response?.data?.message || "Failed to load driver details."
      );
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // =======================================================
  // INITIAL LOAD
  // =======================================================
  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // =======================================================
  // LOAD DRIVER DETAIL WHEN SELECTED DRIVER CHANGES
  // =======================================================
  useEffect(() => {
    if (selectedDriverId) {
      fetchDriverDetail(selectedDriverId);
    }
  }, [selectedDriverId, fetchDriverDetail]);

  // =======================================================
  // FILTERED QUEUE
  // =======================================================
  const filteredQueue = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return queue.filter((item) => {
      const driver = item.driver;
      const onboarding = item.onboarding;

      const matchesSearch =
        !keyword ||
        driver.name?.toLowerCase().includes(keyword) ||
        driver.email?.toLowerCase().includes(keyword) ||
        driver.phone?.toLowerCase().includes(keyword) ||
        driver.city?.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "all" || onboarding?.overallStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [queue, search, statusFilter]);

  // =======================================================
  // CURRENT SELECTED DOCUMENT
  // =======================================================
  const selectedDocument = useMemo(() => {
    const docsByType = detail?.onboarding?.documentsByType || {};
    return docsByType?.[selectedDocumentType] || null;
  }, [detail, selectedDocumentType]);

  // =======================================================
  // CURRENT SELECTED DOCUMENT METADATA
  // =======================================================
  const documentMeta = useMemo(() => {
    return (
      DOCUMENT_ORDER.find((item) => item.key === selectedDocumentType) ||
      DOCUMENT_ORDER[0]
    );
  }, [selectedDocumentType]);

  // =======================================================
  // APPROVE / REJECT DOCUMENT
  // =======================================================
  const handleReview = useCallback(
    async (status) => {
      if (!selectedDriverId || !selectedDocumentType) return;

      try {
        setActionLoading(status);
        setActionMessage("");

        await api.patch(
          `/admin/driver-reviews/${selectedDriverId}/documents/${selectedDocumentType}/review`,
          {
            status,
            reviewNote
          }
        );

        setActionMessage(`Document ${status} successfully.`);
        await Promise.all([fetchQueue(), fetchDriverDetail(selectedDriverId)]);
      } catch (error) {
        setActionMessage(
          error?.response?.data?.message ||
            `Failed to mark document as ${status}.`
        );
      } finally {
        setActionLoading("");
      }
    },
    [
      fetchDriverDetail,
      fetchQueue,
      reviewNote,
      selectedDocumentType,
      selectedDriverId
    ]
  );

  // =======================================================
  // KEEP REVIEW NOTE IN SYNC WITH SELECTED DOCUMENT
  // =======================================================
  useEffect(() => {
    setReviewNote(selectedDocument?.reviewNote || "");
  }, [selectedDocumentType, selectedDocument]);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl p-6">
        {/* ===================================================
            PAGE HEADER
            Includes back button and refresh queue action
        =================================================== */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4">
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                ← Back to Dashboard
              </Link>
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Admin
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              Driver Document Review
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Review submitted driver onboarding documents, approve or reject
              them, and unlock dashboard access only after all required steps
              are verified.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchQueue}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Refresh queue
            </button>
          </div>
        </div>

        {/* ===================================================
            MAIN TWO-COLUMN LAYOUT
            Left: review queue
            Right: selected driver detail
        =================================================== */}
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          {/* =================================================
              LEFT COLUMN: FILTERS + QUEUE
          ================================================= */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Search by name, email, city, or phone"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                >
                  <option value="all">All statuses</option>
                  <option value="not_started">Not started</option>
                  <option value="in_progress">In progress</option>
                  <option value="under_review">Under review</option>
                  <option value="rejected">Rejected</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
            </div>

            {queueError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {queueError}
              </div>
            ) : null}

            {queueLoading ? (
              <DriverQueueSkeleton />
            ) : filteredQueue.length ? (
              <div className="space-y-3">
                {filteredQueue.map((item) => (
                  <QueueCard
                    key={item.driver.id}
                    item={item}
                    isActive={item.driver.id === selectedDriverId}
                    onSelect={setSelectedDriverId}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No drivers found"
                subtitle="Try changing your search text or status filter."
              />
            )}
          </div>

          {/* =================================================
              RIGHT COLUMN: DETAIL VIEW
          ================================================= */}
          <div>
            {detailLoading ? (
              <div className="space-y-6">
                <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6">
                  <div className="h-6 w-52 rounded bg-slate-200" />
                  <div className="mt-3 h-4 w-72 rounded bg-slate-100" />
                  <div className="mt-6 h-52 rounded-2xl bg-slate-100" />
                </div>
              </div>
            ) : detailError ? (
              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
                {detailError}
              </div>
            ) : detail ? (
              <div className="space-y-6">
                {/* =============================================
                    DRIVER SUMMARY CARD
                ============================================= */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">
                        {detail.driver?.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {detail.driver?.email}
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Phone
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {detail.driver?.phone || "—"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            City
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {detail.driver?.city || "—"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Progress
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {detail.onboarding?.progressPercent ?? 0}%
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Dashboard access
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {detail.onboarding?.canAccessDashboard
                              ? "Allowed"
                              : "Blocked"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusPill
                        label={prettyStatus(detail.onboarding?.overallStatus)}
                        status={detail.onboarding?.overallStatus}
                      />
                    </div>
                  </div>

                  {/* ===========================================
                      PRIMARY VEHICLE INFO
                  =========================================== */}
                  {detail.onboarding?.primaryVehicle ? (
                    <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            Primary Vehicle
                          </h3>
                          <p className="text-sm text-slate-500">
                            Saved during driver onboarding
                          </p>
                        </div>

                        <StatusPill
                          label={prettyStatus(
                            detail.onboarding.primaryVehicle.reviewStatus ||
                              "approved"
                          )}
                          status={
                            detail.onboarding.primaryVehicle.reviewStatus ||
                            "approved"
                          }
                        />
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-white px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Vehicle
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {detail.onboarding.primaryVehicle.make}{" "}
                            {detail.onboarding.primaryVehicle.model}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Type
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {detail.onboarding.primaryVehicle.type || "—"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            License Plate
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {detail.onboarding.primaryVehicle.plateNumber ||
                              "—"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Seats
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {detail.onboarding.primaryVehicle.seatCapacity ||
                              "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* =============================================
                    DETAIL GRID
                    Left: steps + doc list
                    Right: selected doc preview + actions
                ============================================= */}
                <div className="grid gap-6 2xl:grid-cols-[360px_minmax(0,1fr)]">
                  {/* LEFT SIDE */}
                  <div className="space-y-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900">
                        Onboarding Steps
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Current driver onboarding status summary
                      </p>

                      <div className="mt-5">
                        <StepList steps={detail.onboarding?.steps || []} />
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900">
                        Documents
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Select a document to preview and review it
                      </p>

                      <div className="mt-5 space-y-3">
                        {DOCUMENT_ORDER.map((item) => {
                          const docsByType = detail.onboarding?.documentsByType || {};
                          const document = docsByType[item.key];
                          const status = document?.status || "missing";

                          return (
                            <button
                              key={item.key}
                              onClick={() => setSelectedDocumentType(item.key)}
                              className={classNames(
                                "w-full rounded-2xl border p-4 text-left transition",
                                selectedDocumentType === item.key
                                  ? "border-slate-900 bg-slate-900 text-white"
                                  : "border-slate-200 bg-white hover:border-slate-300"
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p
                                    className={classNames(
                                      "font-semibold",
                                      selectedDocumentType === item.key
                                        ? "text-white"
                                        : "text-slate-900"
                                    )}
                                  >
                                    {item.label}
                                  </p>
                                  <p
                                    className={classNames(
                                      "mt-1 text-sm",
                                      selectedDocumentType === item.key
                                        ? "text-slate-200"
                                        : "text-slate-500"
                                    )}
                                  >
                                    {item.description}
                                  </p>
                                </div>

                                <span
                                  className={classNames(
                                    "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                                    selectedDocumentType === item.key
                                      ? "border-white/20 bg-white/10 text-white"
                                      : getStatusBadgeClasses(status)
                                  )}
                                >
                                  {prettyStatus(status)}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT SIDE */}
                  <div className="space-y-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <h3 className="text-xl font-black text-slate-900">
                            {documentMeta.label}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {documentMeta.description}
                          </p>
                        </div>

                        <StatusPill
                          label={prettyStatus(
                            selectedDocument?.status || "missing"
                          )}
                          status={selectedDocument?.status || "missing"}
                        />
                      </div>

                      <div className="mt-6">
                        <PreviewPanel document={selectedDocument} />
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            File Name
                          </p>
                          <p className="mt-1 break-all text-sm font-medium text-slate-900">
                            {selectedDocument?.fileName || "—"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Document Number
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {selectedDocument?.documentNumber || "—"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Expiry Date
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {selectedDocument?.expiryDate
                              ? new Date(
                                  selectedDocument.expiryDate
                                ).toLocaleDateString()
                              : "—"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Submitted At
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {formatDate(selectedDocument?.submittedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Driver Notes
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          {selectedDocument?.notes ||
                            "No notes added by the driver."}
                        </p>
                      </div>

                      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Previous Admin Review Note
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          {selectedDocument?.reviewNote ||
                            "No admin review note yet."}
                        </p>
                      </div>

                      <div className="mt-6">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Review Note
                        </label>
                        <textarea
                          rows={4}
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          placeholder="Add approval or rejection reason"
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                        />
                      </div>

                      {actionMessage ? (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                          {actionMessage}
                        </div>
                      ) : null}

                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          onClick={() => handleReview("approved")}
                          disabled={
                            !selectedDocument ||
                            actionLoading === "approved" ||
                            actionLoading === "rejected"
                          }
                          className="inline-flex min-w-[150px] items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoading === "approved"
                            ? "Approving..."
                            : "Approve"}
                        </button>

                        <button
                          onClick={() => handleReview("rejected")}
                          disabled={
                            !selectedDocument ||
                            actionLoading === "approved" ||
                            actionLoading === "rejected"
                          }
                          className="inline-flex min-w-[150px] items-center justify-center rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoading === "rejected"
                            ? "Rejecting..."
                            : "Reject"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No driver selected"
                subtitle="Choose a driver from the review queue to open the onboarding review page."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}