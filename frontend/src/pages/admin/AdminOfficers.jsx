import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Mail, Phone, MapPin, Briefcase, Plus } from 'lucide-react';
import { mockUsers } from '../../data/mockData';
import { useApplications } from '../../context/ApplicationContext';
import Modal from '../../components/common/Modal';
import PageTransition from '../../layouts/PageTransition';
import { formatDate } from '../../utils/helpers';

export default function AdminOfficers() {
  const { applications } = useApplications();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOfficer, setNewOfficer] = useState({ name: '', email: '', phone: '', designation: '', states: '' });

  const officers = mockUsers.filter(u => u.role === 'officer');

  const getOfficerStats = (officerId) => {
    const assigned = applications.filter(a => a.assignedOfficer === officerId);
    return {
      total: assigned.length,
      pending: assigned.filter(a => ['Submitted', 'Under Review', 'Clarification Required'].includes(a.status)).length,
      resolved: assigned.filter(a => ['Approved', 'Rejected'].includes(a.status)).length,
    };
  };

  const handleAdd = () => {
    alert(`Officer "${newOfficer.name}" would be added via the backend API.`);
    setShowAddModal(false);
    setNewOfficer({ name: '', email: '', phone: '', designation: '', states: '' });
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Officer Management</h1>
            <p className="text-text-secondary text-sm mt-1">{officers.length} review officer{officers.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary inline-flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Add Officer</button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {officers.map((o, i) => {
            const stats = getOfficerStats(o.id);
            return (
              <motion.div key={o.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{o.name}</p>
                    <p className="text-xs text-text-secondary">{o.designation}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2 text-text-secondary"><Mail className="w-3.5 h-3.5" />{o.email}</div>
                  <div className="flex items-center gap-2 text-text-secondary"><Phone className="w-3.5 h-3.5" />{o.phone}</div>
                  {o.department && <div className="flex items-center gap-2 text-text-secondary"><Briefcase className="w-3.5 h-3.5" />{o.department}</div>}
                  {o.assignedStates && <div className="flex items-center gap-2 text-text-secondary"><MapPin className="w-3.5 h-3.5" />{o.assignedStates.join(', ')}</div>}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border-light">
                  <div className="text-center"><p className="text-lg font-bold text-text-primary">{stats.total}</p><p className="text-xs text-text-secondary">Assigned</p></div>
                  <div className="text-center"><p className="text-lg font-bold text-warning">{stats.pending}</p><p className="text-xs text-text-secondary">Pending</p></div>
                  <div className="text-center"><p className="text-lg font-bold text-success">{stats.resolved}</p><p className="text-xs text-text-secondary">Resolved</p></div>
                </div>
                <p className="text-xs text-text-secondary mt-3">Joined {formatDate(o.createdAt)}</p>
              </motion.div>
            );
          })}
        </div>

        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Officer">
          <div className="space-y-4">
            <div><label className="label">Full Name</label><input type="text" value={newOfficer.name} onChange={e => setNewOfficer(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="Dr. Name" /></div>
            <div><label className="label">Email</label><input type="email" value={newOfficer.email} onChange={e => setNewOfficer(p => ({ ...p, email: e.target.value }))} className="input-field" /></div>
            <div><label className="label">Phone</label><input type="tel" value={newOfficer.phone} onChange={e => setNewOfficer(p => ({ ...p, phone: e.target.value }))} className="input-field" /></div>
            <div><label className="label">Designation</label><input type="text" value={newOfficer.designation} onChange={e => setNewOfficer(p => ({ ...p, designation: e.target.value }))} className="input-field" placeholder="Review Officer" /></div>
            <div><label className="label">Assigned States</label><input type="text" value={newOfficer.states} onChange={e => setNewOfficer(p => ({ ...p, states: e.target.value }))} className="input-field" placeholder="Maharashtra, Gujarat" /></div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setShowAddModal(false)} className="btn-ghost text-sm">Cancel</button>
              <button onClick={handleAdd} disabled={!newOfficer.name.trim() || !newOfficer.email.trim()} className="btn-primary text-sm">Add Officer</button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}

