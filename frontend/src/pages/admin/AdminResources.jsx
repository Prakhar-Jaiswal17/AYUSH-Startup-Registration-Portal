import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, ExternalLink, BookOpen, Trash2, Edit2 } from 'lucide-react';
import { mockResources } from '../../data/mockData';
import Modal from '../../components/common/Modal';
import PageTransition from '../../layouts/PageTransition';

const categories = ['All', 'Government Portal', 'Startup Support', 'Research', 'Regulatory', 'Guide'];

export default function AdminResources() {
  const [resources, setResources] = useState(mockResources);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    category: 'Government Portal',
    url: '',
    type: 'official',
  });

  const filtered = useMemo(() => {
    return resources.filter(r => {
      const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'All' || r.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [resources, search, categoryFilter]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newResource.title.trim()) return;
    const added = {
      id: `res_${Date.now()}`,
      ...newResource,
    };
    setResources([added, ...resources]);
    setShowAddModal(false);
    setNewResource({
      title: '',
      description: '',
      category: 'Government Portal',
      url: '',
      type: 'official',
    });
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      setResources(resources.filter(r => r.id !== id));
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Resource Management</h1>
            <p className="text-text-secondary text-sm mt-1">Configure guidance materials, official government links, and knowledge base resources.</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary inline-flex items-center gap-2 self-start">
            <Plus className="w-4 h-4" /> Add Resource
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search resources..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="input-field w-auto"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>

        {/* Resources Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((res, i) => (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary font-medium rounded-full">
                    {res.category}
                  </span>
                  <button
                    onClick={() => handleDelete(res.id)}
                    className="p-1 text-text-secondary hover:text-error transition-colors"
                    title="Delete Resource"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-semibold text-text-primary text-base mb-1">{res.title}</h3>
                <p className="text-sm text-text-secondary line-clamp-3 mb-4">{res.description}</p>
              </div>

              <div className="pt-3 border-t border-border-light flex items-center justify-between text-xs">
                <span className="capitalize text-text-secondary font-medium">Type: {res.type}</span>
                {res.url && res.url !== '#' && (
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-medium inline-flex items-center gap-1 hover:underline"
                  >
                    Link <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 card">
            <BookOpen className="w-10 h-10 text-text-secondary/40 mx-auto mb-2" />
            <p className="text-text-secondary">No resources found matching the criteria.</p>
          </div>
        )}

        {/* Add Modal */}
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Resource">
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="label">Resource Title</label>
              <input
                type="text"
                required
                value={newResource.title}
                onChange={e => setNewResource(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. FSSAI Guidelines for Herbal Formulations"
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Category</label>
              <select
                value={newResource.category}
                onChange={e => setNewResource(p => ({ ...p, category: e.target.value }))}
                className="input-field"
              >
                {categories.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select
                value={newResource.type}
                onChange={e => setNewResource(p => ({ ...p, type: e.target.value }))}
                className="input-field"
              >
                <option value="official">Official Government Link</option>
                <option value="guide">Internal Guidance</option>
                <option value="external">Partner / Third Party</option>
              </select>
            </div>
            <div>
              <label className="label">URL</label>
              <input
                type="url"
                value={newResource.url}
                onChange={e => setNewResource(p => ({ ...p, url: e.target.value }))}
                placeholder="https://..."
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                required
                value={newResource.description}
                onChange={e => setNewResource(p => ({ ...p, description: e.target.value }))}
                placeholder="Brief summary of resource contents..."
                className="input-field min-h-[90px] resize-y"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="btn-ghost text-sm">
                Cancel
              </button>
              <button type="submit" className="btn-primary text-sm">
                Save Resource
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
}

