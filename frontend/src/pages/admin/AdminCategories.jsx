import { useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Heart, FlaskConical, Atom, Droplets, Settings, CheckSquare } from 'lucide-react';
import { ayushDomains, businessActivities, documentCategories } from '../../data/mockData';
import PageTransition from '../../layouts/PageTransition';

const iconMap = { Leaf, Heart, FlaskConical, Atom, Droplets };

export default function AdminCategories() {
  const [selectedDomain, setSelectedDomain] = useState(null);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AYUSH Categories</h1>
          <p className="text-text-secondary text-sm mt-1">Manage AYUSH domains, business activities, and document requirements.</p>
        </div>

        {/* Domain Cards */}
        <div>
          <h2 className="font-semibold text-text-primary mb-3">AYUSH Domains</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {ayushDomains.map((domain, i) => {
              const IconComp = iconMap[domain.icon] || Leaf;
              return (
                <motion.button key={domain.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} onClick={() => setSelectedDomain(selectedDomain === domain.id ? null : domain.id)} className={`card p-5 text-left transition-all ${selectedDomain === domain.id ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-md'}`}>
                  <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ backgroundColor: domain.bgColor }}>
                    <IconComp className="w-5 h-5" style={{ color: domain.color }} />
                  </div>
                  <p className="font-semibold text-sm text-text-primary">{domain.name}</p>
                  <p className="text-xs text-text-secondary mt-1">{domain.startupCount}+ startups</p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Business Activities */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-text-primary">Business Activities</h2>
          </div>
          <p className="text-sm text-text-secondary mb-4">Activities available for selection during startup registration.</p>
          <div className="flex flex-wrap gap-2">
            {businessActivities.map(act => (
              <div key={act} className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg">
                <CheckSquare className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-text-primary">{act}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Document Categories */}
        <div className="card p-6">
          <h2 className="font-semibold text-text-primary mb-4">Document Categories & Requirements</h2>
          <div className="space-y-3">
            {documentCategories.map((cat, i) => (
              <motion.div key={cat.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-start gap-4 p-4 border border-border-light rounded-lg">
                <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-accent">{cat.id.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-medium text-sm text-text-primary">{cat.label}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{cat.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

