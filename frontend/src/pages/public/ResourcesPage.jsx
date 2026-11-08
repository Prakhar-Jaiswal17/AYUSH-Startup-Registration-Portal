import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  ExternalLink,
  ShieldCheck,
  BookOpen,
  FolderOpen,
} from 'lucide-react';
import { mockResources } from '../../data/mockData';
import PageTransition from '../../layouts/PageTransition';

const categories = [
  'All',
  'Government Portal',
  'Startup Support',
  'Research',
  'Regulatory',
  'Guide',
];

const categoryColors = {
  'Government Portal': 'bg-blue-100 text-blue-700',
  'Startup Support': 'bg-emerald-100 text-emerald-700',
  Research: 'bg-purple-100 text-purple-700',
  Regulatory: 'bg-red-100 text-red-700',
  Guide: 'bg-amber-100 text-amber-700',
  'Government Scheme': 'bg-teal-100 text-teal-700',
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function ResourcesPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredResources = mockResources.filter((resource) => {
    const matchesCategory =
      selectedCategory === 'All' || resource.category === selectedCategory;
    const matchesSearch =
      searchTerm.trim() === '' ||
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PageTransition>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-secondary py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            AYUSH Resources & Support
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-lg text-white/80 max-w-2xl mx-auto"
          >
            Explore official portals, guides, and support resources curated for AYUSH startups and entrepreneurs.
          </motion.p>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="py-10 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative max-w-md mx-auto mb-8"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search resources…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-11 w-full"
            />
          </motion.div>

          {/* Category Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2 mb-10"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-text-secondary border border-border hover:border-primary/40 hover:text-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>

          {/* Resource Grid */}
          {filteredResources.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              key={selectedCategory + searchTerm}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredResources.map((resource) => (
                <motion.div
                  key={resource.id}
                  variants={cardVariants}
                  className="card hover:shadow-lg transition-shadow flex flex-col"
                >
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          categoryColors[resource.category] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {resource.category}
                      </span>
                      {resource.type === 'official' && (
                        <ShieldCheck className="w-4 h-4 text-blue-500" title="Official Portal" />
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-text-primary mb-2 leading-snug">
                      {resource.title}
                    </h3>

                    <p className="text-text-secondary text-sm leading-relaxed flex-1 mb-5">
                      {resource.description}
                    </p>

                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-accent transition-colors"
                    >
                      {resource.type === 'official' ? 'Visit Portal' : 'Learn More'}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <FolderOpen className="w-16 h-16 text-text-secondary/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No resources found
              </h3>
              <p className="text-text-secondary">
                Try adjusting your search term or selecting a different category.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Additional Help */}
      <section className="py-16 px-4 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <BookOpen className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Can't find what you're looking for?
          </h2>
          <p className="text-text-secondary mb-6">
            Reach out to our support team and we'll help you navigate the AYUSH registration landscape.
          </p>
          <a
            href="mailto:support@ayushsetu.gov.in"
            className="btn-primary inline-flex items-center gap-2"
          >
            Contact Support
          </a>
        </motion.div>
      </section>
    </PageTransition>
  );
}
