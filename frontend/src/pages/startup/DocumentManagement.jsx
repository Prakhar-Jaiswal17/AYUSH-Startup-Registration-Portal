import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, Search, FolderOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApplications } from '../../context/ApplicationContext';
import { documentCategories } from '../../data/mockData';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import PageTransition from '../../layouts/PageTransition';
import { formatDate } from '../../utils/helpers';
import { DOCUMENT_FORMAT_LABEL, DOCUMENT_MAX_SIZE_MB } from '../../utils/documentUpload';

export default function DocumentManagement() {
  const { startup } = useAuth();
  const { getDocumentsByStartup, addDocument } = useApplications();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({ name: '', category: 'incorporation' });
  const [uploading, setUploading] = useState(false);

  const docs = getDocumentsByStartup(startup?.id || '');

  const filtered = useMemo(() => {
    return docs.filter(doc => {
      const matchSearch = !search || doc.name.toLowerCase().includes(search.toLowerCase()) || doc.fileName.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === 'all' || doc.category === catFilter;
      return matchSearch && matchCat;
    });
  }, [docs, search, catFilter]);

  const handleUpload = () => {
    if (!uploadData.name.trim()) return;
    setUploading(true);
    setTimeout(() => {
      addDocument({ startupId: startup?.id, applicationId: null, name: uploadData.name, category: uploadData.category, fileName: `${uploadData.name.toLowerCase().replace(/\s+/g, '_')}.pdf`, fileSize: '1.5 MB' });
      setUploading(false);
      setShowUpload(false);
      setUploadData({ name: '', category: 'incorporation' });
    }, 800);
  };

  const categoryCounts = useMemo(() => {
    const counts = { all: docs.length };
    documentCategories.forEach(c => { counts[c.id] = docs.filter(d => d.category === c.id).length; });
    return counts;
  }, [docs]);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Document Centre</h1>
            <p className="text-text-secondary text-sm mt-1">{docs.length} document{docs.length !== 1 ? 's' : ''} uploaded</p>
          </div>
          <button onClick={() => setShowUpload(true)} className="btn-primary inline-flex items-center gap-2 self-start">
            <Upload className="w-4 h-4" /> Upload Document
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setCatFilter('all')} className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${catFilter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'}`}>
            All ({categoryCounts.all})
          </button>
          {documentCategories.map(c => (
            <button key={c.id} onClick={() => setCatFilter(c.id)} className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${catFilter === c.id ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'}`}>
              {c.label.split(' ')[0]} ({categoryCounts[c.id] || 0})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input type="text" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
        </div>

        {/* Documents Grid */}
        {filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((doc, i) => (
                <motion.div key={doc.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.03 }} className="card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-text-primary truncate">{doc.name}</p>
                        <p className="text-xs text-text-secondary">{doc.fileName}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">{doc.fileSize} &middot; {formatDate(doc.uploadedAt)}</span>
                    <StatusBadge status={doc.status} size="sm" />
                  </div>
                  {doc.remark && (
                    <p className="text-xs text-warning mt-2 pt-2 border-t border-border-light italic">{doc.remark}</p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <EmptyState icon={FolderOpen} title="No Documents Found" description={search || catFilter !== 'all' ? 'Try adjusting your filters.' : 'Upload your first document to get started.'} />
        )}

        {/* Upload Modal */}
        <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Upload Document">
          <div className="space-y-4">
            <div>
              <label className="label">Document Name</label>
              <input type="text" value={uploadData.name} onChange={e => setUploadData(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Certificate of Incorporation" className="input-field" />
            </div>
            <div>
              <label className="label">Category</label>
              <select value={uploadData.category} onChange={e => setUploadData(p => ({ ...p, category: e.target.value }))} className="input-field">
                {documentCategories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/40 transition-colors">
              <Upload className="w-8 h-8 text-text-secondary/40 mx-auto mb-2" />
              <p className="text-sm text-text-secondary">Click to select a file or drag and drop</p>
                  <p className="text-xs text-text-secondary/60 mt-1">{DOCUMENT_FORMAT_LABEL} up to {DOCUMENT_MAX_SIZE_MB} MB</p>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setShowUpload(false)} className="btn-ghost text-sm">Cancel</button>
              <button onClick={handleUpload} disabled={!uploadData.name.trim() || uploading} className="btn-primary text-sm">{uploading ? 'Uploading...' : 'Upload'}</button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}

