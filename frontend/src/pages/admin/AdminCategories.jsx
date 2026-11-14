import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Heart, FlaskConical, Atom, Droplets, Settings, CheckSquare, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { categoryAPI, getApiErrorMessage } from '../../services/api';
import { ayushDomains, businessActivities, documentCategories } from '../../data/mockData';
import PageTransition from '../../layouts/PageTransition';

const iconMap = { Leaf, Heart, FlaskConical, Atom, Droplets };

export default function AdminCategories() {
  const { isApiSession } = useAuth();
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [apiCategories, setApiCategories] = useState([]);
  const [loading, setLoading] = useState(isApiSession);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!isApiSession) {
      setApiCategories([]);
      setLoading(false);
      setError('');
      return undefined;
    }

    let active = true;
    setLoading(true);
    setError('');
    categoryAPI.getAll()
      .then((response) => {
        const categories = response?.data?.data;
        if (!response?.data?.success || !Array.isArray(categories)) {
          throw new Error('The category service returned an invalid list.');
        }
        if (active) setApiCategories(categories);
      })
      .catch((requestError) => {
        if (active) setError(requestError?.apiMessage || getApiErrorMessage(requestError, 'Unable to load AYUSH categories.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [isApiSession, retryCount]);

  const domains = useMemo(() => {
    if (!isApiSession) return ayushDomains;
    return apiCategories.map((category) => {
      const presentation = ayushDomains.find((domain) => domain.name === category.name) || {};
      return {
        ...presentation,
        ...category,
        id: category.code,
      };
    });
  }, [apiCategories, isApiSession]);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AYUSH Categories</h1>
          <p className="text-text-secondary text-sm mt-1">AYUSH domains are loaded from the server; business activities and document requirements are reference lists.</p>
        </div>

        {/* Domain Cards */}
        <div>
          <h2 className="font-semibold text-text-primary mb-3">AYUSH Domains</h2>
          {error && (
            <div className="mb-4 rounded-lg border border-error/20 bg-error/5 px-4 py-3 flex items-center justify-between gap-3">
              <p role="alert" className="text-sm text-error">{error}</p>
              <button onClick={() => setRetryCount((count) => count + 1)} className="btn-ghost text-sm inline-flex items-center gap-2 shrink-0"><RefreshCw className="w-4 h-4" /> Retry</button>
            </div>
          )}
          {loading ? (
            <div role="status" className="card p-8 text-center text-sm text-text-secondary">Loading AYUSH categories…</div>
          ) : domains.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {domains.map((domain, i) => {
              const IconComp = iconMap[domain.icon] || Leaf;
              const domainId = domain.code || domain.id;
              return (
                <motion.button key={domainId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} onClick={() => setSelectedDomain(selectedDomain === domainId ? null : domainId)} className={`card p-5 text-left transition-all ${selectedDomain === domainId ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-md'}`}>
                  <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ backgroundColor: domain.bgColor || '#E8F5E9' }}>
                    <IconComp className="w-5 h-5" style={{ color: domain.color || '#2D7D46' }} />
                  </div>
                  <p className="font-semibold text-sm text-text-primary">{domain.name}</p>
                  {domain.description && <p className="text-xs text-text-secondary mt-2 line-clamp-3">{domain.description}</p>}
                </motion.button>
              );
            })}
            </div>
          ) : (
            <div className="card p-8 text-center text-sm text-text-secondary">No active AYUSH categories are available.</div>
          )}
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

