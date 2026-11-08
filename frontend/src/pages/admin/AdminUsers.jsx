import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, User, Building2, Mail, Phone } from 'lucide-react';
import { mockUsers, mockStartups } from '../../data/mockData';
import PageTransition from '../../layouts/PageTransition';
import { formatDate } from '../../utils/helpers';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const startupUsers = mockUsers.filter(u => u.role === 'startup');

  const filtered = useMemo(() => {
    return startupUsers.filter(u => {
      if (!search) return true;
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [startupUsers, search]);

  const getStartup = (userId) => mockStartups.find(s => s.userId === userId);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
            <p className="text-text-secondary text-sm mt-1">{startupUsers.length} registered startup accounts</p>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((u, i) => {
            const s = getStartup(u.id);
            return (
              <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-text-primary truncate">{u.name}</p>
                    <p className="text-xs text-text-secondary">{u.role}</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-text-secondary"><Mail className="w-3.5 h-3.5" /><span className="truncate">{u.email}</span></div>
                  {u.phone && <div className="flex items-center gap-2 text-text-secondary"><Phone className="w-3.5 h-3.5" /><span>{u.phone}</span></div>}
                  {s && <div className="flex items-center gap-2 text-text-secondary"><Building2 className="w-3.5 h-3.5" /><span className="truncate">{s.brandName}</span></div>}
                </div>
                <div className="mt-3 pt-3 border-t border-border-light flex items-center justify-between text-xs text-text-secondary">
                  <span>Joined {formatDate(u.createdAt)}</span>
                  <span className="px-2 py-0.5 bg-success-light text-success rounded font-medium">Active</span>
                </div>
              </motion.div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-text-secondary/30 mx-auto mb-3" />
            <p className="text-text-secondary">No users match your search.</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

