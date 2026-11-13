import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Upload, Send, RefreshCw } from 'lucide-react';
import { useApplications } from '../../context/ApplicationContext';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { applicationAPI, getApiErrorMessage, queryAPI } from '../../services/api';
import { applicationDtoToView } from '../../utils/applicationMappers';
import StatusBadge from '../../components/common/StatusBadge';
import Timeline from '../../components/common/Timeline';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import PageTransition from '../../layouts/PageTransition';
import { formatDate } from '../../utils/helpers';
import { mockStartups } from '../../data/mockData';
import { DOCUMENT_FORMAT_LABEL, DOCUMENT_MAX_SIZE_MB } from '../../utils/documentUpload';

const tabs = ['Overview', 'Documents', 'Timeline', 'Clarification'];

export default function ApplicationDetail() {
  const { id } = useParams();
  const { user, startup: currentStartup, isApiSession } = useAuth();
  const { getApplicationById, getDocumentsByApplication, updateApplicationStatus, addDocument, submitApplication, refreshApplications } = useApplications();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('Overview');
  const [showUpload, setShowUpload] = useState(false);
  const [clarificationText, setClarificationText] = useState('');
  const [clarificationResponses, setClarificationResponses] = useState({});
  const [clarificationSavingId, setClarificationSavingId] = useState('');
  const [clarificationSubmitting, setClarificationSubmitting] = useState(false);
  const [clarificationError, setClarificationError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [apiApplication, setApiApplication] = useState(null);
  const [loading, setLoading] = useState(isApiSession);
  const [loadError, setLoadError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const fetchApiApplication = useCallback(async () => {
    const [applicationResponse, queriesResponse] = await Promise.all([
      applicationAPI.getById(id),
      queryAPI.getByApplication(id),
    ]);
    const application = applicationResponse?.data?.data;
    const queries = queriesResponse?.data?.data;
    if (!application) throw new Error('Application details were not returned by the server.');
    if (!Array.isArray(queries)) throw new Error('Clarification queries were not returned by the server.');
    return applicationDtoToView({ ...application, queries });
  }, [id]);

  useEffect(() => {
    if (!isApiSession) {
      setApiApplication(null);
      setLoading(false);
      setLoadError('');
      return undefined;
    }

    let active = true;
    setLoading(true);
    setLoadError('');
    fetchApiApplication()
      .then((application) => {
        if (active) setApiApplication(application);
      })
      .catch((error) => {
        if (active) setLoadError(error?.apiMessage || getApiErrorMessage(error, 'Unable to load this application.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [fetchApiApplication, isApiSession, retryCount]);

  const app = isApiSession ? apiApplication : getApplicationById(id);
  const docs = isApiSession ? (app?.documents || []) : getDocumentsByApplication(id);
  const startup = isApiSession
    ? (currentStartup || (app ? {
      id: app.startupId,
      legalName: app.startupName,
      brandName: app.brandName,
      founders: app.founders || [],
    } : null))
    : (app ? mockStartups.find((item) => item.id === app.startupId) : null);
  const founders = startup?.founders || [startup?.founder, ...(startup?.coFounders || [])].filter(Boolean);
  const primaryFounder = founders.find((founder) => founder.isPrimary) || founders[0];

  if (loading) {
    return (
      <PageTransition>
        <div role="status" className="card p-10 text-center text-sm text-text-secondary">Loading application details…</div>
      </PageTransition>
    );
  }

  if (loadError) {
    return (
      <PageTransition>
        <div className="card p-8 text-center max-w-xl mx-auto">
          <p role="alert" className="text-sm text-error mb-4">{loadError}</p>
          <button onClick={() => setRetryCount((count) => count + 1)} className="btn-secondary inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
          <Link to="/dashboard/applications" className="ml-3 text-sm text-primary hover:underline">Back to Applications</Link>
        </div>
      </PageTransition>
    );
  }

  if (!app) {
    return (
      <PageTransition>
        <EmptyState icon={FileText} title="Application Not Found" description="This application does not exist or you don't have access." action={<Link to="/dashboard/applications" className="btn-primary">Back to Applications</Link>} />
      </PageTransition>
    );
  }

  const visibleTabs = app.status === 'Clarification Required' ? tabs : tabs.filter((tab) => tab !== 'Clarification');
  const queries = app.queries || [];
  const pendingQueries = queries.filter((query) => query.status === 'PENDING');
  const latestQuery = queries[queries.length - 1];
  const canResubmitApiApplication = queries.length > 0
    && queries.every((query) => query.status === 'RESOLVED' || Boolean(query.applicantResponse?.trim()));
  const clarificationEvent = [...(app.timeline || [])].reverse().find((event) => event.status === 'Clarification Required');

  const handleMockResubmit = () => {
    if (!clarificationText.trim()) return;
    updateApplicationStatus(id, 'Resubmitted', clarificationText, user?.name);
    addNotification({ type: 'status_update', title: 'Application Resubmitted', message: `Your application ${id} has been resubmitted.`, applicationId: id });
    setClarificationText('');
    setActiveTab('Timeline');
  };

  const handleApiResponse = async (query) => {
    const applicantResponse = clarificationResponses[query.id]?.trim();
    if (!applicantResponse || clarificationSavingId) return;
    setClarificationSavingId(query.id);
    setClarificationError('');
    try {
      await queryAPI.respond(query.id, { applicantResponse });
      setApiApplication(await fetchApiApplication());
      setClarificationResponses((current) => ({ ...current, [query.id]: '' }));
      await refreshApplications().catch(() => {});
    } catch (error) {
      setClarificationError(error?.apiMessage || getApiErrorMessage(error, 'Unable to submit your response.'));
    } finally {
      setClarificationSavingId('');
    }
  };

  const handleApiResubmit = async () => {
    if (!canResubmitApiApplication || clarificationSubmitting) return;
    setClarificationSubmitting(true);
    setClarificationError('');
    try {
      await submitApplication(id);
      setApiApplication(await fetchApiApplication());
      setClarificationText('');
      setActiveTab('Timeline');
    } catch (error) {
      setClarificationError(error?.apiMessage || getApiErrorMessage(error, 'Unable to resubmit this application.'));
    } finally {
      setClarificationSubmitting(false);
    }
  };

  const handleUpload = () => {
    if (!uploadName.trim()) return;
    setUploading(true);
    setTimeout(() => {
      addDocument({ applicationId: id, startupId: app.startupId, name: uploadName, category: 'other', fileName: `${uploadName.toLowerCase().replace(/\s+/g, '_')}.pdf`, fileSize: '1.2 MB' });
      setUploading(false);
      setShowUpload(false);
      setUploadName('');
    }, 800);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard/applications" className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5 text-text-secondary" /></Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-text-primary">{app.trackingNumber || app.id}</h1>
                <StatusBadge status={app.status} />
              </div>
              <p className="text-sm text-text-secondary mt-0.5">{app.ayushDomain} &middot; {app.submittedAt ? `Submitted ${formatDate(app.submittedAt)}` : 'Draft'}</p>
            </div>
          </div>
          {isApiSession && app.status === 'Draft' && (
            <Link to={`/dashboard/applications/new?draft=${encodeURIComponent(app.id)}`} className="btn-primary inline-flex items-center gap-2 self-start">Edit Draft</Link>
          )}
        </div>

        <div className="border-b border-border">
          <div className="flex gap-1 overflow-x-auto">
            {visibleTabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'Overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-semibold text-text-primary mb-4">Company Information</h3>
              <div className="space-y-3 text-sm">
                <div><span className="text-text-secondary">Legal Name:</span> <span className="font-medium ml-2">{startup?.legalName || app.startupName || '—'}</span></div>
                <div><span className="text-text-secondary">Brand Name:</span> <span className="font-medium ml-2">{startup?.brandName || app.brandName || '—'}</span></div>
                <div><span className="text-text-secondary">Type:</span> <span className="font-medium ml-2">{startup?.incorporationType || '—'}</span></div>
                <div><span className="text-text-secondary">Registration No:</span> <span className="font-medium ml-2">{startup?.registrationNumber || '—'}</span></div>
                <div><span className="text-text-secondary">Website:</span> <span className="font-medium ml-2">{startup?.website || '—'}</span></div>
              </div>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold text-text-primary mb-4">Founder Details</h3>
              <div className="space-y-3 text-sm">
                <div><span className="text-text-secondary">Name:</span> <span className="font-medium ml-2">{primaryFounder?.name || '—'}</span></div>
                <div><span className="text-text-secondary">Designation:</span> <span className="font-medium ml-2">{primaryFounder?.designation || '—'}</span></div>
                <div><span className="text-text-secondary">Email:</span> <span className="font-medium ml-2">{primaryFounder?.email || '—'}</span></div>
                <div><span className="text-text-secondary">Phone:</span> <span className="font-medium ml-2">{primaryFounder?.phone || '—'}</span></div>
                <div><span className="text-text-secondary">Qualification:</span> <span className="font-medium ml-2">{primaryFounder?.qualification || '—'}</span></div>
              </div>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold text-text-primary mb-4">AYUSH Classification</h3>
              <div className="space-y-3 text-sm">
                <div><span className="text-text-secondary">Domain:</span> <span className="font-medium ml-2">{app.ayushDomain || '—'}</span></div>
                <div><span className="text-text-secondary">Activities:</span> <span className="font-medium ml-2">{(startup?.businessActivities || startup?.businessActivity || []).join(', ') || '—'}</span></div>
                <div><span className="text-text-secondary">State:</span> <span className="font-medium ml-2">{app.state || startup?.state || '—'}</span></div>
              </div>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold text-text-primary mb-4">Business Details</h3>
              <div className="space-y-3 text-sm">
                <div><span className="text-text-secondary">Stage:</span> <span className="font-medium ml-2">{startup?.businessStage || '—'}</span></div>
                <div><span className="text-text-secondary">Status:</span> <span className="font-medium ml-2">{startup?.operationalStatus || '—'}</span></div>
                <div><span className="text-text-secondary">Target Market:</span> <span className="font-medium ml-2">{startup?.targetMarket || '—'}</span></div>
                <div><span className="text-text-secondary">DPIIT:</span> <span className="font-medium ml-2">{startup?.dpiitRecognized ? 'Yes' : 'No'}</span></div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'Documents' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {!isApiSession && (
              <div className="flex justify-end">
                <button onClick={() => setShowUpload(true)} className="btn-primary inline-flex items-center gap-2 text-sm"><Upload className="w-4 h-4" /> Upload Document</button>
              </div>
            )}
            {isApiSession && <p className="rounded-lg border border-info/20 bg-info-light px-4 py-3 text-sm text-text-secondary">Document upload is not connected yet. The list below shows files recorded by the server.</p>}
            {docs.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {docs.map((doc, index) => (
                  <motion.div key={doc.id || index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary shrink-0" /><p className="font-medium text-sm text-text-primary">{doc.name || doc.documentTypeCode || 'Supporting document'}</p></div>
                      <StatusBadge status={doc.status} size="sm" />
                    </div>
                    <p className="text-xs text-text-secondary ml-6">{doc.fileName}{doc.fileSize ? ` · ${doc.fileSize}` : ''}</p>
                    {doc.remark && <p className="text-xs text-warning mt-2 ml-6 italic">Remark: {doc.remark}</p>}
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState icon={FileText} title="No Documents" description={isApiSession ? 'No documents have been uploaded for this application.' : 'Upload documents for this application.'} />
            )}
            {!isApiSession && <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Upload Document">
              <div className="space-y-4">
                <div><label className="label">Document Name</label><input type="text" value={uploadName} onChange={(event) => setUploadName(event.target.value)} placeholder="e.g., Certificate of Incorporation" className="input-field" /></div>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center"><Upload className="w-8 h-8 text-text-secondary/40 mx-auto mb-2" /><p className="text-sm text-text-secondary">Click to select or drag and drop</p><p className="text-xs text-text-secondary/60 mt-1">{DOCUMENT_FORMAT_LABEL} up to {DOCUMENT_MAX_SIZE_MB} MB</p></div>
                <div className="flex gap-3 justify-end"><button onClick={() => setShowUpload(false)} className="btn-ghost text-sm">Cancel</button><button onClick={handleUpload} disabled={!uploadName.trim() || uploading} className="btn-primary text-sm">{uploading ? 'Uploading...' : 'Upload'}</button></div>
              </div>
            </Modal>}
          </motion.div>
        )}

        {activeTab === 'Timeline' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><div className="card p-6"><Timeline events={app.timeline || []} /></div></motion.div>
        )}

        {activeTab === 'Clarification' && app.status === 'Clarification Required' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {isApiSession ? (
              <div className="space-y-4">
                {queries.map((query) => (
                  <div key={query.id} className="card p-6 border-l-4 border-l-warning">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-text-primary">Clarification Requested</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${query.status === 'RESOLVED' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {query.status === 'RESOLVED' ? 'Resolved' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary mt-2 whitespace-pre-wrap">{query.queryText}</p>
                    {query.createdAt && <p className="text-xs text-text-secondary mt-2">Requested {formatDate(query.createdAt)}</p>}
                    {query.applicantResponse ? (
                      <p className="text-sm text-text-primary mt-4 whitespace-pre-wrap"><span className="font-medium">Your response:</span> {query.applicantResponse}</p>
                    ) : query.status === 'PENDING' ? (
                      <div className="mt-4">
                        <label htmlFor={`clarification-${query.id}`} className="label">Your Response</label>
                        <textarea
                          id={`clarification-${query.id}`}
                          value={clarificationResponses[query.id] || ''}
                          onChange={(event) => setClarificationResponses((current) => ({ ...current, [query.id]: event.target.value }))}
                          maxLength={4000}
                          placeholder="Provide the requested information..."
                          className="input-field min-h-[120px] resize-y"
                        />
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-text-secondary">{(clarificationResponses[query.id] || '').length}/4000</span>
                          <button
                            onClick={() => handleApiResponse(query)}
                            disabled={!clarificationResponses[query.id]?.trim() || Boolean(clarificationSavingId)}
                            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
                          >
                            <Send className="w-4 h-4" />
                            {clarificationSavingId === query.id ? 'Sending…' : 'Send Response'}
                          </button>
                        </div>
                      </div>
                    ) : <p className="text-sm text-text-secondary mt-4">This query has been resolved.</p>}
                  </div>
                ))}
                {queries.length === 0 && <div className="card p-5 text-sm text-text-secondary">No clarification details were returned for this application.</div>}
                {clarificationError && <p role="alert" className="text-sm text-error">{clarificationError}</p>}
                {canResubmitApiApplication && (
                  <div className="card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-sm text-text-secondary">Your responses are ready. Resubmit the application to return it to review.</p>
                    <button onClick={handleApiResubmit} disabled={clarificationSubmitting} className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50">
                      <Send className="w-4 h-4" /> {clarificationSubmitting ? 'Resubmitting…' : 'Resubmit Application'}
                    </button>
                  </div>
                )}
                {pendingQueries.length > 0 && !canResubmitApiApplication && (
                  <p className="text-xs text-text-secondary">Respond to each pending clarification before resubmitting.</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="card p-6 border-l-4 border-l-warning">
                  <h3 className="font-semibold text-text-primary mb-2">Clarification Requested</h3>
                  <p className="text-sm text-text-secondary">{latestQuery?.queryText || clarificationEvent?.remark || 'A clarification was requested for this application.'}</p>
                  {(latestQuery?.createdAt || clarificationEvent?.date) && <p className="text-xs text-text-secondary mt-2">{latestQuery?.createdAt ? formatDate(latestQuery.createdAt) : formatDate(clarificationEvent.date)}</p>}
                  {latestQuery?.applicantResponse && <p className="text-sm text-text-primary mt-4"><span className="font-medium">Your response:</span> {latestQuery.applicantResponse}</p>}
                </div>
                <div className="card p-6">
                  <h3 className="font-semibold text-text-primary mb-3">Your Response</h3>
                  <textarea value={clarificationText} onChange={(event) => setClarificationText(event.target.value)} placeholder="Provide your response and any additional information..." className="input-field min-h-[120px] resize-y" />
                  <div className="flex justify-end mt-4"><button onClick={handleMockResubmit} disabled={!clarificationText.trim()} className="btn-primary inline-flex items-center gap-2"><Send className="w-4 h-4" /> Resubmit Application</button></div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
