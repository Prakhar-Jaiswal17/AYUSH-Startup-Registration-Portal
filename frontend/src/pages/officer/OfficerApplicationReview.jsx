import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, FileText, ShieldCheck, ShieldX, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApplications } from '../../context/ApplicationContext';
import { useNotifications } from '../../context/NotificationContext';
import { mockStartups } from '../../data/mockData';
import StatusBadge from '../../components/common/StatusBadge';
import Timeline from '../../components/common/Timeline';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import PageTransition from '../../layouts/PageTransition';
import { formatDate } from '../../utils/helpers';

export default function OfficerApplicationReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getApplicationById, getDocumentsByApplication, updateApplicationStatus, updateDocumentStatus } = useApplications();
  const { addNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState('info');
  const [showClarifyModal, setShowClarifyModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const app = getApplicationById(id);
  const docs = getDocumentsByApplication(id);
  const startup = app ? mockStartups.find(s => s.id === app.startupId) : null;

  if (!app) {
    return (
      <PageTransition>
        <EmptyState icon={FileText} title="Application Not Found" description="This application does not exist." action={<Link to="/officer/applications" className="btn-primary">Back to Queue</Link>} />
      </PageTransition>
    );
  }

  const isDecided = ['Approved', 'Rejected'].includes(app.status);

  const performAction = (status, remark) => {
    setActionLoading(true);
    setTimeout(() => {
      updateApplicationStatus(id, status, remark, user?.name);
      addNotification({
        type: status === 'Approved' ? 'status_update' : status === 'Rejected' ? 'status_update' : 'resubmission',
        title: `Application ${status}`,
        message: `Application ${id} has been ${status.toLowerCase()}. ${remark}`,
        applicationId: id,
      });
      setActionLoading(false);
      setShowClarifyModal(false);
      setShowApproveModal(false);
      setShowRejectModal(false);
      setRemarks('');
    }, 600);
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
          <Link to="/officer/applications" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-text-primary">{app.id}</h1>
              <StatusBadge status={app.status} />
              <span className="text-xs px-2 py-0.5 bg-primary/5 text-primary rounded-md font-medium">{app.ayushDomain}</span>
            </div>
            <p className="text-sm text-text-secondary mt-0.5">{app.startupName} &middot; {app.state} &middot; Submitted {formatDate(app.submittedAt)}</p>
          </div>
        </div>

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
                      ['Email', startup?.email],
                    ].map(([l, v], i) => (
                      <div key={i}><span className="text-text-secondary">{l}:</span> <span className="font-medium ml-1">{v || '—'}</span></div>
                    ))}
                  </div>
                </div>
                <div className="card p-6">
                  <h3 className="font-semibold text-text-primary mb-4">Founder Details</h3>
                  <div className="grid sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                    {[
                      ['Name', startup?.founder?.name],
                      ['Designation', startup?.founder?.designation],
                      ['Email', startup?.founder?.email],
                      ['Phone', startup?.founder?.phone],
                      ['Qualification', startup?.founder?.qualification],
                    ].map(([l, v], i) => (
                      <div key={i}><span className="text-text-secondary">{l}:</span> <span className="font-medium ml-1">{v || '—'}</span></div>
                    ))}
                  </div>
                  {startup?.coFounders?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border-light">
                      <p className="text-sm font-medium text-text-secondary mb-2">Co-Founders</p>
                      {startup.coFounders.map((cf, i) => (
                        <p key={i} className="text-sm">{cf.name} — {cf.designation} ({cf.email})</p>
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
                  <div><span className="text-text-secondary block mb-1">Business Activities:</span><span className="font-medium">{startup?.businessActivity?.join(', ') || '—'}</span></div>
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
                {docs.length > 0 ? docs.map((doc, i) => (
                  <motion.div key={doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-text-primary">{doc.name}</p>
                        <p className="text-xs text-text-secondary">{doc.fileName} &middot; {doc.fileSize} &middot; {doc.category}</p>
                        {doc.remark && <p className="text-xs mt-1 italic text-text-secondary">{doc.remark}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={doc.status} size="sm" />
                      {!['Verified', 'Rejected'].includes(doc.status) && !isDecided && (
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
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Enter clarification details..." className="input-field min-h-[120px] resize-y" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowClarifyModal(false)} className="btn-ghost text-sm">Cancel</button>
              <button onClick={() => performAction('Clarification Required', remarks)} disabled={!remarks.trim() || actionLoading} className="btn-secondary text-sm">
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
              <button onClick={() => performAction('Approved', remarks || 'Application meets all requirements. Registration approved.')} disabled={actionLoading} className="btn-primary text-sm">
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

