import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Search, BookOpen, Shield } from 'lucide-react';
import { mockResources } from '../../data/mockData';
import PageTransition from '../../layouts/PageTransition';

const categories = ['All', 'Government Portal', 'Startup Support', 'Research', 'Regulatory', 'Guide'];

export default function StartupResources() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    return mockResources.filter(r => {
      const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'All' || r.category === category;
      return matchSearch && matchCat;
    });
  }, [search, category]);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Resources & Support</h1>
          <p className="text-text-secondary text-sm mt-1">Access guidelines, schemes, and support resources for AYUSH startups.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input type="text" placeholder="Search resources..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${category === c ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'}`}>{c}</button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((res, i) => (
            <motion.div key={res.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card-hover p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  {res.type === 'official' ? <Shield className="w-4 h-4 text-primary" /> : <BookOpen className="w-4 h-4 text-primary" />}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-text-primary">{res.title}</p>
                  <span className="text-xs px-1.5 py-0.5 bg-primary/5 text-primary rounded mt-1 inline-block">{res.category}</span>
                </div>
              </div>
              <p className="text-sm text-text-secondary mb-3 line-clamp-2">{res.description}</p>
              {res.url && res.url !== '#' && (
                <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1">
                  Visit Portal <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </motion.div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-10 h-10 text-text-secondary/30 mx-auto mb-3" />
            <p className="text-text-secondary">No resources match your search.</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

