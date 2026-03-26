import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import OnboardingShell from '../../components/driver/OnboardingShell';
import { documentMetaFromRouteParam, getDriverNextRoute } from '../../utils/driverOnboarding';
import { prepareDocumentPayload } from '../../utils/fileUpload';

export default function DriverDocumentUpload() {
  const { documentType } = useParams();
  const navigate = useNavigate();
  const { refreshDriverOnboarding } = useAuth();

  const meta = useMemo(() => documentMetaFromRouteParam(documentType), [documentType]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [existingDocument, setExistingDocument] = useState(null);
  const [primaryVehicle, setPrimaryVehicle] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [form, setForm] = useState({
    documentNumber: '',
    expiryDate: '',
    notes: ''
  });

  useEffect(() => {
    let active = true;

    (async () => {
      if (!meta) {
        setError('Unsupported document type.');
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/driver/onboarding/detail');
        if (!active) return;

        const documents = Array.isArray(data?.documents) ? data.documents : [];
        const found = documents.find((item) => item.documentType === documentType) || null;
        setExistingDocument(found);
        setPrimaryVehicle(data?.primaryVehicle || null);
        setPreviewUrl(found?.fileUrl || '');
        setForm({
          documentNumber: found?.documentNumber || '',
          expiryDate: found?.expiryDate ? String(found.expiryDate).slice(0, 10) : '',
          notes: found?.notes || ''
        });
      } catch (err) {
        if (active) setError(err?.response?.data?.message || 'Failed to load document form.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [documentType, meta]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setError('');

    if (!file) {
      setPreviewUrl(existingDocument?.fileUrl || '');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const upload = selectedFile ? await prepareDocumentPayload(selectedFile) : null;

      if (!upload && !existingDocument?.fileUrl) {
        throw new Error('Please choose a file before submitting.');
      }

      await api.put(`/driver/onboarding/documents/${documentType}`, {
        fileUrl: upload?.fileUrl || existingDocument?.fileUrl,
        fileName: upload?.fileName || existingDocument?.fileName || '',
        mimeType: upload?.mimeType || existingDocument?.mimeType || '',
        documentNumber: form.documentNumber,
        expiryDate: form.expiryDate || undefined,
        notes: form.notes,
        vehicleId: primaryVehicle?._id || undefined
      });

      const onboarding = await refreshDriverOnboarding();
      navigate('/driver/onboarding/submitted', {
        state: {
          title: meta.title,
          nextRoute: getDriverNextRoute(onboarding)
        }
      });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to submit the document.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Remove this document from onboarding?')) return;
    setError('');
    try {
      await api.delete(`/driver/onboarding/documents/${documentType}`);
      const onboarding = await refreshDriverOnboarding();
      navigate(getDriverNextRoute(onboarding));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete the document.');
    }
  }

  if (!meta) {
    return <div className="mx-auto max-w-4xl p-6">Unsupported document type.</div>;
  }

  return (
    <OnboardingShell
      title={meta.helperTitle}
      description={meta.helperText}
      footer={
        <div className="text-sm text-slate-500">
          Current API stores the file as an inline payload. Use clear images or small PDFs for smooth submission.
        </div>
      }
    >
      {loading ? (
        <div className="text-sm text-slate-500">Loading document page...</div>
      ) : (
        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.2fr]">
          <aside className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="text-lg font-bold text-slate-950">Submission guide</div>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                {meta.tips.map((tip) => (
                  <li key={tip} className="flex gap-3">
                    <span className="mt-[6px] h-2 w-2 rounded-full bg-emerald-500" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">Current status</div>
              <div className="mt-2 text-sm text-slate-500">
                {existingDocument?.status === 'approved'
                  ? 'Approved'
                  : existingDocument?.status === 'submitted'
                    ? 'In review'
                    : existingDocument?.status === 'rejected'
                      ? 'Rejected — please re-submit'
                      : 'Not submitted yet'}
              </div>
              {existingDocument?.reviewNote ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {existingDocument.reviewNote}
                </div>
              ) : null}
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Choose file</span>
              <input type="file" accept={meta.accepts} onChange={handleFileChange} className="driver-input" />
            </label>

            {previewUrl ? (
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                {String(previewUrl).startsWith('data:image') || selectedFile?.type?.startsWith('image/') ? (
                  <img src={previewUrl} alt={meta.title} className="mx-auto max-h-[420px] rounded-[24px] object-contain" />
                ) : (
                  <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-sm text-slate-600">
                    File selected: {selectedFile?.name || existingDocument?.fileName || meta.title}
                  </div>
                )}
              </div>
            ) : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Document number</span>
                <input name="documentNumber" value={form.documentNumber} onChange={handleChange} className="driver-input" placeholder="Optional if not applicable" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Expiry date</span>
                <input name="expiryDate" type="date" value={form.expiryDate} onChange={handleChange} className="driver-input" />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Notes</span>
              <textarea name="notes" value={form.notes} onChange={handleChange} className="driver-input min-h-[120px]" placeholder="Optional notes for reviewers" />
            </label>

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className="driver-btn-primary min-w-[180px]">
                {saving ? 'Submitting...' : existingDocument ? 'Re-submit document' : 'Submit document'}
              </button>
              {existingDocument ? (
                <button type="button" onClick={handleDelete} className="driver-btn-secondary">
                  Remove
                </button>
              ) : null}
              <button type="button" onClick={() => navigate('/driver/onboarding')} className="driver-btn-secondary">
                Back to status
              </button>
            </div>
          </form>
        </div>
      )}
    </OnboardingShell>
  );
}
