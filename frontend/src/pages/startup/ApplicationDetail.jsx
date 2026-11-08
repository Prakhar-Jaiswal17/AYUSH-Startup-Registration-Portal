import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Upload, Send } from 'lucide-react';
import { useApplications } from '../../context/ApplicationContext';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import Timeline from '../../components/common/Timeline';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import PageTransition from '../../layouts/PageTransition';
import { formatDate } from '../../utils/helpers';
import { mockStartups } from '../../data/mockData';

const tabs = ['Overview', 'Documents', 'Timeline', 'Clarification'];

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getApplicationById, getDocumentsByApplication, updateApplicationStatus, addDocument } = useApplications();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('Overview');
  const [showUpload, setShowUpload] = useState(false);
  const [clarificationText, setClarificationText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState('');

  const app = getApplicationById(id);
  const docs = getDocumentsByApplication(id);
  const startup = app ? mockStartups.find(s => s.id === app.startupId) : null;

  if (!app) {
    return (
      <PageTransition>
        <EmptyState icon={FileText} title="Application Not Found" description="This application does not exist or you don't have access." action={<Link to="/dashboard/applications" className="btn-primary">Back to Applications</Link>} />
      </PageTransition>
    );
  }

  const visibleTabs = app.status === 'Clarification Required' ? tabs : tabs.filter(t => t !== 'Clarification');

  const handleResubmit = () => {
    if (!clarificationText.trim()) return;
    updateApplicationStatus(id, 'Resubmitted', clarificationText, user?.name);
    addNotification({ type: 'status_update', title: 'Application Resubmitted', message: `Your application ${id} has been resubmitted.`, applicationId: id });
    setClarificationText('');
    setActiveTab('Timeline');
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard/applications" className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5 text-text-secondary" /></Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-text-primary">{app.id}</h1>
                <StatusBadge status={app.status} />
              </div>
              <p className="text-sm text-text-secondary mt-0.5">{app.ayushDomain} &middot; {app.submittedAt ? `Submitted ${formatDate(app.submittedAt)}` : 'Draft'}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex gap-1 overflow-x-auto">
            {visibleTabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'Overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-semibold text-text-primary mb-4">Company Information</h3>
              <div className="space-y-3 text-sm">
                <div><span className="text-text-secondary">Legal Name:</span> <span className="font-medium ml-2">{startup?.legalName || app.startupName}</span></div>
                <div><span className="text-text-secondary">Brand Name:</span> <span className="font-medium ml-2">{startup?.brandName || app.brandName}</span></div>
                <div><span className="text-text-secondary">Type:</span> <span className="font-medium ml-2">{startup?.incorporationType || '—'}</span></div>
                <div><span className="text-text-secondary">Registration No:</span> <span className="font-medium ml-2">{startup?.registrationNumber || '—'}</span></div>
                <div><span className="text-text-secondary">Website:</span> <span className="font-medium ml-2">{startup?.website || '—'}</span></div>
              </div>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold text-text-primary mb-4">Founder Details</h3>
              <div className="space-y-3 text-sm">
                <div><span className="text-text-secondary">Name:</span> <span className="font-medium ml-2">{startup?.founder?.name || '—'}</span></div>
                <div><span className="text-text-secondary">Designation:</span> <span className="font-medium ml-2">{startup?.founder?.designation || '—'}</span></div>
                <div><span className="text-text-secondary">Email:</span> <span className="font-medium ml-2">{startup?.founder?.email || '—'}</span></div>
                <div><span className="text-text-secondary">Phone:</span> <span className="font-medium ml-2">{startup?.founder?.phone || '—'}</span></div>
                <div><span className="text-text-secondary">Qualification:</span> <span className="font-medium ml-2">{startup?.founder?.qualification || '—'}</span></div>
              </div>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold text-text-primary mb-4">AYUSH Classification</h3>
              <div className="space-y-3 text-sm">
                <div><span className="text-text-secondary">Domain:</span> <span className="font-medium ml-2">{app.ayushDomain}</span></div>
                <div><span className="text-text-secondary">Activities:</span> <span className="font-medium ml-2">{startup?.businessActivity?.join(', ') || '—'}</span></div>
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
            <div className="flex justify-end">
              <button onClick={() => setShowUpload(true)} className="btn-primary inline-flex items-center gap-2 text-sm"><Upload className="w-4 h-4" /> Upload Document</button>
            </div>
            {docs.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {docs.map((doc, i) => (
                  <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <p className="font-medium text-sm text-text-primary">{doc.name}</p>
                      </div>
                      <StatusBadge status={doc.status} size="sm" />
                    </div>
                    <p className="text-xs text-text-secondary ml-6">{doc.fileName} &middot; {doc.fileSize}</p>
                    {doc.remark && <p className="text-xs text-warning mt-2 ml-6 italic">Remark: {doc.remark}</p>}
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState icon={FileText} title="No Documents" description="Upload documents for this application." />
            )}
            <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Upload Document">
              <div className="space-y-4">
                <div>
                  <label className="label">Document Name</label>
                  <input type="text" value={uploadName} onChange={e => setUploadName(e.target.value)} placeholder="e.g., Certificate of Incorporation" className="input-field" />
                </div>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-text-secondary/40 mx-auto mb-2" />
                  <p className="text-sm text-text-secondary">Click to select or drag and drop</p>
                  <p className="text-xs text-text-secondary/60 mt-1">PDF, JPG, PNG up to 10MB</p>
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowUpload(false)} className="btn-ghost text-sm">Cancel</button>
                  <button onClick={handleUpload} disabled={!uploadName.trim() || uploading} className="btn-primary text-sm">
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </div>
            </Modal>
          </motion.div>
        )}

        {activeTab === 'Timeline' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="card p-6">
              <Timeline events={app.timeline} />
            </div>
          </motion.div>
        )}

        {activeTab === 'Clarification' && app.status === 'Clarification Required' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="card p-6 border-l-4 border-l-warning">
              <h3 className="font-semibold text-text-primary mb-2">Clarification Requested</h3>
              <p className="text-sm text-text-secondary">{app.timeline.filter(t => t.status === 'Clarification Required').pop()?.remark}</p>
              <p className="text-xs text-text-secondary mt-2">By {app.timeline.filter(t => t.status === 'Clarification Required').pop()?.officer} &middot; {formatDate(app.timeline.filter(t => t.status === 'Clarification Required').pop()?.date)}</p>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold text-text-primary mb-3">Your Response</h3>
              <textarea value={clarificationText} onChange={e => setClarificationText(e.target.value)} placeholder="Provide your response and any additional information..." className="input-field min-h-[120px] resize-y" />
              <div className="flex justify-end mt-4">
                <button onClick={handleResubmit} disabled={!clarificationText.trim()} className="btn-primary inline-flex items-center gap-2">
                  <Send className="w-4 h-4" /> Resubmit Application
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}

