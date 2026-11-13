import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, FileText, ShieldCheck, ShieldX } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApplications } from '../../context/ApplicationContext';
import { useNotifications } from '../../context/NotificationContext';
import { mockStartups } from '../../data/mockData';
import { applicationAPI, startupAPI, officerAPI, queryAPI, getApiErrorMessage } from '../../services/api';
import { applicationDtoToView, getStartupFounders } from '../../utils/applicationMappers';
import StatusBadge from '../../components/common/StatusBadge';
import Timeline from '../../components/common/Timeline';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import PageTransition from '../../layouts/PageTransition';
import { formatDate } from '../../utils/helpers';

export default function OfficerApplicationReview() {
  const { id } = useParams();
  const { user, isApiSession } = useAuth();
  const { getApplicationById, getDocumentsByApplication, updateApplicationStatus, updateDocumentStatus, startApplicationReview, decideApplication, refreshApplications } = useApplications();
  const { addNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState('info');
  const [showClarifyModal, setShowClarifyModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [detailLoading, setDetailLoading] = useState(isApiSession);
  const [detailError, setDetailError] = useState('');
  const [apiApplication, setApiApplication] = useState(null);
  const [apiStartup, setApiStartup] = useState(null);

  const loadApiDetails = useCallback(async () => {
    setDetailLoading(true);
    setDetailError('');
    try {
      const [response, queriesResponse] = await Promise.all([
        applicationAPI.getById(id),
        queryAPI.getByApplication(id),
      ]);
      const data = response?.data?.data;
      const queries = queriesResponse?.data?.data;
      if (!data) throw new Error('Application details were not returned by the server.');
      if (!Array.isArray(queries)) throw new Error('Clarification queries were not returned by the server.');
      setApiApplication(applicationDtoToView({ ...data, queries }));
      if (data.startup?.id) {
        try {
          const profileResponse = await startupAPI.getProfile(data.startup.id);
          setApiStartup(profileResponse?.data?.data || null);
        } catch {
          setApiStartup(null);
        }
      } else {
        setApiStartup(null);
      }
      return data;
    } catch (error) {
      const message = error?.apiMessage || getApiErrorMessage(error, 'Unable to load this application.');
      setDetailError(message);
      throw new Error(message);
    } finally {
      setDetailLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isApiSession) {
      loadApiDetails().catch(() => {});
    } else {
      setApiApplication(null);
      setApiStartup(null);
      setDetailLoading(false);
      setDetailError('');
    }
  }, [isApiSession, loadApiDetails]);

  const app = isApiSession ? apiApplication : getApplicationById(id);
  const docs = isApiSession ? (app?.documents || []) : getDocumentsByApplication(id);
  const startup = isApiSession
    ? (apiStartup || (app ? { id: app.startupId, legalName: app.startupName, brandName: app.brandName, founders: app.founders || [] } : null))
    : (app ? mockStartups.find((item) => item.id === app.startupId) : null);
  const founders = getStartupFounders(startup);
  const primaryFounder = founders.find((founder) => founder.isPrimary) || founders[0];
  const coFounders = founders.filter((founder) => founder !== primaryFounder);
  const reviewBasePath = user?.role === 'admin' ? '/admin/applications' : '/officer/applications';

  if (isApiSession && detailLoading) {
    return <PageTransition><div role="status" className="card p-10 text-center text-sm text-text-secondary">Loading application review…</div></PageTransition>;
  }

  if (isApiSession && detailError) {
    return (
      <PageTransition>
        <div className="card p-8 text-center max-w-xl mx-auto">
          <p role="alert" className="text-sm text-error mb-4">{detailError}</p>
          <button onClick={() => loadApiDetails().catch(() => {})} className="btn-secondary text-sm">Retry</button>
          <Link to={reviewBasePath} className="ml-3 text-sm text-primary hover:underline">Back to Applications</Link>
        </div>
      </PageTransition>
    );
  }

  if (!app) {
    return (
      <PageTransition>
        <EmptyState icon={FileText} title="Application Not Found" description="This application does not exist or you do not have access." action={<Link to={reviewBasePath} className="btn-primary">Back to Applications</Link>} />
      </PageTransition>
    );
  }

  const isDecided = ['Approved', 'Rejected'].includes(app.status);
  const canStartReview = ['Submitted', 'Resubmitted'].includes(app.status);
  const canDecide = app.status === 'Under Review';

  const performAction = async (status, remark) => {
    if (actionLoading) return;
    setActionLoading(true);
    setActionError('');
    try {
      if (isApiSession) {
        const decision = status === 'Approved' ? 'APPROVED' : 'REJECTED';
        await decideApplication(id, decision, remark);
        await loadApiDetails();
      } else {
        updateApplicationStatus(id, status, remark, user?.name);
        addNotification({
          type: 'status_update',
          title: `Application ${status}`,
          message: `Application ${id} has been ${status.toLowerCase()}. ${remark}`,
          applicationId: id,
        });
      }
      setShowClarifyModal(false);
      setShowApproveModal(false);
      setShowRejectModal(false);
      setRemarks('');
    } catch (error) {
      setActionError(error?.apiMessage || getApiErrorMessage(error, 'Unable to update this application.'));
    } finally {
      setActionLoading(false);
    }
  };

  const beginReview = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      await startApplicationReview(id);
      await loadApiDetails();
    } catch (error) {
      setActionError(error?.apiMessage || getApiErrorMessage(error, 'Unable to start the review.'));
    } finally {
      setActionLoading(false);
    }
  };

  const requestClarification = async () => {
    if (!remarks.trim() || actionLoading) return;
    if (!isApiSession) {
      await performAction('Clarification Required', remarks);
      return;
    }

    setActionLoading(true);
    setActionError('');
    try {
      await officerAPI.requestClarification(id, { queryText: remarks.trim() });
      await Promise.all([loadApiDetails(), refreshApplications().catch(() => {})]);
      setShowClarifyModal(false);
      setRemarks('');
    } catch (error) {
      setActionError(error?.apiMessage || getApiErrorMessage(error, 'Unable to request clarification.'));
    } finally {
      setActionLoading(false);
    }
  };

  const resolveClarification = async (queryId) => {
    if (actionLoading) return;
    setActionLoading(true);
    setActionError('');
    try {
      await queryAPI.resolve(queryId);
      await Promise.all([loadApiDetails(), refreshApplications().catch(() => {})]);
    } catch (error) {
      setActionError(error?.apiMessage || getApiErrorMessage(error, 'Unable to resolve this clarification.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyDoc = (docId) => {
    updateDocumentStatus(docId, 'Verified', 'Document verified by ' + user?.name);
  };

  const handleRejectDoc = (docId) => {
    updateDocumentStatus(docId, 'Rejected', 'Document flagged — please upload a valid copy.');
  };

  const tabs = [
    { id: 'info', label: 'Startup Info' },
    { id: 'business', label: 'Business Details' },
    { id: 'documents', label: 'Documents' },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to={reviewBasePath} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-text-primary">{app.id}</h1>
              <StatusBadge status={app.status} />
              <span className="text-xs px-2 py-0.5 bg-primary/5 text-primary rounded-md font-medium">{app.ayushDomain}</span>
            </div>
            <p className="text-sm text-text-secondary mt-0.5">{app.startupName} &middot; {app.state} &middot; {app.submittedAt ? `Submitted ${formatDate(app.submittedAt)}` : 'Not submitted'}</p>
            {isApiSession && (app.assignedOfficer?.name || app.assignedOfficerName) && <p className="text-xs text-text-secondary mt-1">Assigned to {app.assignedOfficer?.name || app.assignedOfficerName}</p>}
          </div>
        </div>

        {actionError && <p role="alert" className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">{actionError}</p>}

        {/* Split layout */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left Panel — Application Details */}
          <div className="lg:col-span-3 space-y-5">
            {/* Tab nav */}
            <div className="border-b border-border">
              <div className="flex gap-1">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'info' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <div className="card p-6">
                  <h3 className="font-semibold text-text-primary mb-4">Company Information</h3>
                  <div className="grid sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                    {[
                      ['Legal Name', startup?.legalName || app.startupName],
                      ['Brand Name', startup?.brandName || app.brandName],
                      ['Type', startup?.incorporationType],
                      ['Reg. Number', startup?.registrationNumber],
                      ['Incorporation', startup?.incorporationDate],
                      ['Website', startup?.website],
                      ['Email', startup?.officialEmail || startup?.email],
                    ].map(([l, v], i) => (
                      <div key={i}><span className="text-text-secondary">{l}:</span> <span className="font-medium ml-1">{v || '—'}</span></div>
                    ))}
                  </div>
                </div>
                <div className="card p-6">
                  <h3 className="font-semibold text-text-primary mb-4">Founder Details</h3>
                  <div className="grid sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                    {[
                      ['Name', primaryFounder?.name],
                      ['Designation', primaryFounder?.designation],
                      ['Email', primaryFounder?.email],
                      ['Phone', primaryFounder?.phone],
                      ['Qualification', primaryFounder?.qualification],
                    ].map(([l, v], i) => (
                      <div key={i}><span className="text-text-secondary">{l}:</span> <span className="font-medium ml-1">{v || '—'}</span></div>
                    ))}
                  </div>
                  {coFounders.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border-light">
                      <p className="text-sm font-medium text-text-secondary mb-2">Co-Founders</p>
                      {coFounders.map((founder, i) => (
                        <p key={founder.id || founder.email || i} className="text-sm">{founder.name} — {founder.designation} ({founder.email})</p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="card p-6">
                  <h3 className="font-semibold text-text-primary mb-4">Regulatory Status</h3>
                  <div className="grid sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                    <div><span className="text-text-secondary">DPIIT Recognized:</span> <span className="font-medium ml-1">{startup?.dpiitRecognized ? 'Yes' : 'No'}</span></div>
                    <div><span className="text-text-secondary">Existing Licences:</span> <span className="font-medium ml-1">{startup?.existingLicences?.join(', ') || 'None'}</span></div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'business' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6">
                <h3 className="font-semibold text-text-primary mb-4">Business Details</h3>
                <div className="space-y-4 text-sm">
                  <div><span className="text-text-secondary block mb-1">AYUSH Domain:</span><span className="font-medium">{app.ayushDomain}</span></div>
                  <div><span className="text-text-secondary block mb-1">Business Activities:</span><span className="font-medium">{(startup?.businessActivities || startup?.businessActivity || []).join(', ') || '—'}</span></div>
                  <div><span className="text-text-secondary block mb-1">Description:</span><p className="font-medium leading-relaxed">{startup?.description || '—'}</p></div>
                  <div className="grid sm:grid-cols-2 gap-y-3 gap-x-6">
                    <div><span className="text-text-secondary">Products:</span> <span className="font-medium ml-1">{startup?.products || '—'}</span></div>
                    <div><span className="text-text-secondary">Business Stage:</span> <span className="font-medium ml-1">{startup?.businessStage || '—'}</span></div>
                    <div><span className="text-text-secondary">Target Market:</span> <span className="font-medium ml-1">{startup?.targetMarket || '—'}</span></div>
                    <div><span className="text-text-secondary">Status:</span> <span className="font-medium ml-1">{startup?.operationalStatus || '—'}</span></div>
                    <div><span className="text-text-secondary">State:</span> <span className="font-medium ml-1">{startup?.state || app.state}</span></div>
                    <div><span className="text-text-secondary">City:</span> <span className="font-medium ml-1">{startup?.city || '—'}</span></div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'documents' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {isApiSession && <p className="rounded-lg border border-info/20 bg-info-light px-4 py-3 text-sm text-text-secondary">The list shows document metadata from the server. File viewing and verification actions are not connected yet.</p>}
                {docs.length > 0 ? docs.map((doc, i) => (
                  <motion.div key={doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-text-primary">{doc.name || doc.documentTypeCode || 'Supporting document'}</p>
                        <p className="text-xs text-text-secondary">{doc.fileName}{doc.fileSize ? ` · ${doc.fileSize}` : ''}{doc.category ? ` · ${doc.category}` : ''}</p>
                        {doc.remark && <p className="text-xs mt-1 italic text-text-secondary">{doc.remark}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={doc.status} size="sm" />
                      {!isApiSession && !['Verified', 'Rejected'].includes(doc.status) && !isDecided && (
                        <>
                          <button onClick={() => handleVerifyDoc(doc.id)} className="p-1.5 rounded-lg bg-success/10 hover:bg-success/20 text-success transition-colors" title="Verify">
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleRejectDoc(doc.id)} className="p-1.5 rounded-lg bg-error/10 hover:bg-error/20 text-error transition-colors" title="Reject">
                            <ShieldX className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )) : (
                  <EmptyState icon={FileText} title="No Documents" description="No documents have been uploaded for this application." />
                )}
              </motion.div>
            )}
          </div>

          {/* Right Panel — Actions & Timeline */}
          <div className="lg:col-span-2 space-y-5">
            {/* Review Actions */}
            <div className="card p-6">
              <h3 className="font-semibold text-text-primary mb-4">Review Actions</h3>
              {isDecided ? (
                <div className="text-center py-4">
                  <p className="text-sm text-text-secondary">This application has been <span className="font-semibold">{app.status.toLowerCase()}</span>.</p>
                </div>
              ) : isApiSession ? (
                <div className="space-y-3">
                  {canStartReview && <button onClick={beginReview} disabled={actionLoading} className="w-full btn-primary text-sm disabled:opacity-50">{actionLoading ? 'Starting review…' : 'Start Review'}</button>}
                  {canDecide && (
                    <>
                      <button onClick={() => setShowClarifyModal(true)} disabled={actionLoading} className="w-full btn-secondary text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"><MessageSquare className="w-4 h-4" /> Request Clarification</button>
                      <button onClick={() => setShowApproveModal(true)} disabled={actionLoading} className="w-full btn-primary text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"><CheckCircle className="w-4 h-4" /> Approve Application</button>
                      <button onClick={() => setShowRejectModal(true)} disabled={actionLoading} className="w-full btn-danger text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"><XCircle className="w-4 h-4" /> Reject Application</button>
                    </>
                  )}
                  {!canStartReview && !canDecide && <p className="text-sm text-text-secondary">Review actions are unavailable for this application status.</p>}
                  <p className="text-xs text-text-secondary">Document verification is not connected yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <button onClick={() => setShowClarifyModal(true)} className="w-full btn-secondary text-sm inline-flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Request Clarification
                  </button>
                  <button onClick={() => setShowApproveModal(true)} className="w-full btn-primary text-sm inline-flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Approve Application
                  </button>
                  <button onClick={() => setShowRejectModal(true)} className="w-full btn-danger text-sm inline-flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" /> Reject Application
                  </button>
                </div>
              )}
            </div>

            {isApiSession && app.queries?.length > 0 && (
              <div className="card p-6 space-y-4">
                <h3 className="font-semibold text-text-primary">Clarification Queries</h3>
                {app.queries.map((query) => (
                  <div key={query.id} className="rounded-lg border border-border-light p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-text-primary">{query.queryText}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${query.status === 'RESOLVED' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {query.status === 'RESOLVED' ? 'Resolved' : 'Pending'}
                      </span>
                    </div>
                    {query.createdAt && <p className="text-xs text-text-secondary">Requested {formatDate(query.createdAt)}</p>}
                    {query.applicantResponse
                      ? <div className="rounded-md bg-gray-50 p-3"><p className="text-xs font-medium text-text-secondary mb-1">Startup response</p><p className="text-sm text-text-primary whitespace-pre-wrap">{query.applicantResponse}</p></div>
                      : <p className="text-sm text-text-secondary">Waiting for the startup to respond.</p>}
                    {query.status === 'PENDING' && (
                      <button onClick={() => resolveClarification(query.id)} disabled={actionLoading} className="btn-secondary text-sm disabled:opacity-50">
                        {actionLoading ? 'Updating…' : 'Mark Resolved'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Timeline */}
            <div className="card p-6">
              <h3 className="font-semibold text-text-primary mb-4">Application Timeline</h3>
              <Timeline events={app.timeline} />
            </div>
          </div>
        </div>

        {/* Clarification Modal */}
        <Modal isOpen={showClarifyModal} onClose={() => setShowClarifyModal(false)} title="Request Clarification" size="md">
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">Specify what information or documents the startup needs to provide.</p>
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} maxLength={4000} placeholder="Enter clarification details..." className="input-field min-h-[120px] resize-y" />
            <p className="text-xs text-text-secondary text-right">{remarks.length}/4000</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowClarifyModal(false)} className="btn-ghost text-sm">Cancel</button>
              <button onClick={requestClarification} disabled={!remarks.trim() || actionLoading} className="btn-secondary text-sm">
                {actionLoading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Approve Modal */}
        <Modal isOpen={showApproveModal} onClose={() => setShowApproveModal(false)} title="Approve Application" size="md">
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">Are you sure you want to approve application <strong>{app.id}</strong>?</p>
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Add approval remarks (optional)..." className="input-field min-h-[80px] resize-y" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowApproveModal(false)} className="btn-ghost text-sm">Cancel</button>
              <button onClick={() => performAction('Approved', remarks || (isApiSession ? 'Application approved by reviewer.' : 'Application meets all requirements. Registration approved.'))} disabled={actionLoading} className="btn-primary text-sm">
                {actionLoading ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Reject Modal */}
        <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Application" size="md">
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">Please provide the reason for rejecting application <strong>{app.id}</strong>.</p>
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Enter rejection reason (required)..." className="input-field min-h-[120px] resize-y" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowRejectModal(false)} className="btn-ghost text-sm">Cancel</button>
              <button onClick={() => performAction('Rejected', remarks)} disabled={!remarks.trim() || actionLoading} className="btn-danger text-sm">
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}

