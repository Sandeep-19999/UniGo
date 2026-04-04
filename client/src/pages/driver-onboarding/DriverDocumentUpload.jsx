import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import OnboardingShell from '../../components/driver/OnboardingShell';
import { documentMetaFromRouteParam, getDriverNextRoute } from '../../utils/driverOnboarding';
import { validateDocumentFile } from '../../utils/fileUpload';

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
      } catch (err) {
        if (active) setError(err?.response?.data?.message || 'Failed to load document form.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [documentType, meta]);

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setError('');

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(existingDocument?.fileUrl || '');
      return;
    }

    try {
      validateDocumentFile(file);
      setSelectedFile(file);

      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(URL.createObjectURL(file));
    } catch (err) {
      event.target.value = '';
      setSelectedFile(null);
      setPreviewUrl(existingDocument?.fileUrl || '');
      setError(err.message || 'Invalid file.');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (!selectedFile) {
        throw new Error('Please choose a file before submitting.');
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      if (primaryVehicle?._id) {
        formData.append('vehicleId', primaryVehicle._id);
      }

      await api.put(`/driver/onboarding/documents/${documentType}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
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

  const showImagePreview = selectedFile?.type?.startsWith('image/') || (!selectedFile && /^https?:\/\/.+$/i.test(String(previewUrl)) && !String(existingDocument?.mimeType || '').includes('pdf'));

  return (
    <OnboardingShell
      title={meta.helperTitle}
      description={meta.helperText}
      footer={
        <div className="text-sm text-slate-500">
          Files upload directly to secure cloud storage. JPG, PNG, WEBP, and PDF are supported up to 8MB.
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
                {showImagePreview ? (
                  <img src={previewUrl} alt={meta.title} className="mx-auto max-h-[420px] rounded-[24px] object-contain" />
                ) : (
                  <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-sm text-slate-600 space-y-3">
                    <div>File selected: {selectedFile?.name || existingDocument?.fileName || meta.title}</div>
                    {existingDocument?.fileUrl ? (
                      <a href={existingDocument.fileUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        Open current file
                      </a>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}

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
