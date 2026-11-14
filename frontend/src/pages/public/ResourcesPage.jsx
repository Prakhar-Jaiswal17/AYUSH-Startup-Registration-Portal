import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search,
  ExternalLink,
  ShieldCheck,
  BookOpen,
  FolderOpen,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Check,
  X,
  Filter,
} from 'lucide-react';
import { resourceAPI, getApiErrorMessage } from '../../services/api';
import PageTransition from '../../layouts/PageTransition';
import HighlightText from '../../components/common/HighlightText';

const categories = [
  'All',
  'Government Portal',
  'Startup Support',
  'Research',
  'Regulatory',
  'Guide',
  'Government Scheme',
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export default function ResourcesPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [page, setPage] = useState(1);
  const [resources, setResources] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyLink = (res) => {
    const fullUrl = res.url.startsWith('/')
      ? `${window.location.origin}${res.url}`
      : res.url;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedId(res.id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch((err) => console.error('Failed to copy link:', err));
  };

  // Debounce search input to avoid hitting API on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch resources from API
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const params = {
      page,
      limit: 9,
    };
    if (selectedCategory !== 'All') {
      params.category = selectedCategory;
    }
    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }
    if (sortBy === 'title-asc') {
      params.sortBy = 'title';
      params.order = 'asc';
    } else if (sortBy === 'title-desc') {
      params.sortBy = 'title';
      params.order = 'desc';
    } else if (sortBy === 'category') {
      params.sortBy = 'category';
      params.order = 'asc';
    }

    resourceAPI
      .getAll(params)
      .then((response) => {
        if (isCancelled) return;
        const resData = response?.data?.data;
        if (resData && Array.isArray(resData.items)) {
          setResources(resData.items);
          setPagination(
            resData.pagination || {
              page,
              limit: 9,
              total: resData.items.length,
              totalPages: 1,
            }
          );
        } else {
          setResources([]);
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error('Resource API error:', err);
        setError(
          getApiErrorMessage(
            err,
            'Unable to load resources from server. Please try again.'
          )
        );
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [page, selectedCategory, debouncedSearch, reloadTrigger]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedCategory('All');
    setSortBy('default');
    setPage(1);
  };

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
          {/* Search & Sort */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto mb-8"
          >
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="text"
                aria-label="Search AYUSH resources"
                placeholder="Search resources…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-11 w-full"
              />
            </div>
            <select
              aria-label="Sort resources order"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="input-field w-full sm:w-auto text-sm py-2 px-3 text-text-secondary bg-white border border-border rounded-xl"
            >
              <option value="default">Default Order</option>
              <option value="title-asc">Title (A → Z)</option>
              <option value="title-desc">Title (Z → A)</option>
              <option value="category">Category</option>
            </select>
          </motion.div>

          {/* Active Filter Chips */}
          {(selectedCategory !== 'All' || searchTerm.trim() || sortBy !== 'default') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-wrap items-center justify-center gap-2 mb-8 text-xs"
            >
              <span className="text-text-secondary inline-flex items-center gap-1 font-medium">
                <Filter className="w-3.5 h-3.5" /> Active filters:
              </span>
              {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                  Category: {selectedCategory}
                  <button
                    onClick={() => handleCategoryChange('All')}
                    className="hover:text-primary/70"
                    title="Remove category filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchTerm.trim() && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                  Query: "{searchTerm}"
                  <button
                    onClick={() => { setSearchTerm(''); setDebouncedSearch(''); setPage(1); }}
                    className="hover:text-primary/70"
                    title="Clear search query"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {sortBy !== 'default' && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                  Sorted: {sortBy}
                  <button
                    onClick={() => { setSortBy('default'); setPage(1); }}
                    className="hover:text-primary/70"
                    title="Reset sort"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={handleClearFilters}
                className="text-text-secondary hover:text-red-600 underline font-medium ml-1"
              >
                Reset all
              </button>
            </motion.div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2 mb-10"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
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

          {/* Error State */}
          {error && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card max-w-xl mx-auto p-8 text-center border-red-200 bg-red-50/50 mb-10"
            >
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Unable to Load Resources
              </h3>
              <p className="text-text-secondary text-sm mb-6">{error}</p>
              <button
                onClick={() => setReloadTrigger((prev) => prev + 1)}
                className="btn-primary inline-flex items-center gap-2 text-sm mx-auto"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </motion.div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="card p-6 flex flex-col animate-pulse">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-5 w-24 bg-gray-200 rounded-full" />
                  </div>
                  <div className="h-6 w-3/4 bg-gray-200 rounded mb-3" />
                  <div className="space-y-2 flex-1 mb-6">
                    <div className="h-4 w-full bg-gray-200 rounded" />
                    <div className="h-4 w-5/6 bg-gray-200 rounded" />
                  </div>
                  <div className="h-4 w-28 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Resource Grid */}
          {!loading && !error && resources.length > 0 && (
            <>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                key={selectedCategory + debouncedSearch + page}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {resources.map((resource) => (
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
                          <ShieldCheck className="w-4 h-4 text-blue-500" title="Official Government Portal" />
                        )}
                        {resource.url && resource.url !== '#' && (
                          <button
                            type="button"
                            onClick={() => handleCopyLink(resource)}
                            className="ml-auto text-text-secondary hover:text-primary transition-colors p-1 rounded-md hover:bg-gray-100"
                            title={copiedId === resource.id ? 'Copied link to clipboard!' : 'Copy resource link'}
                          >
                            {copiedId === resource.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-text-primary mb-2 leading-snug">
                        <HighlightText text={resource.title} query={debouncedSearch} />
                      </h3>

                      <p className="text-text-secondary text-sm leading-relaxed flex-1 mb-5">
                        <HighlightText text={resource.description || resource.summary} query={debouncedSearch} />
                      </p>

                      <div className="pt-4 border-t border-border-light mt-auto">
                        {resource.isAvailable === false || !resource.url || resource.url === '#' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5" /> Documentation Under Review
                          </span>
                        ) : resource.url.startsWith('/') ? (
                          <Link
                            to={resource.url}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-accent transition-colors"
                          >
                            Read Guide
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        ) : (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-accent transition-colors"
                          >
                            {resource.type === 'official' ? 'Visit Portal' : 'Learn More'}
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <nav
                  aria-label="Resources pagination"
                  className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6"
                >
                  <p className="text-sm text-text-secondary">
                    Showing <span className="font-medium text-text-primary">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                    <span className="font-medium text-text-primary">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium text-text-primary">{pagination.total}</span> resources
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Previous page"
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={pagination.page <= 1}
                      className="btn-outline px-3 py-1.5 text-sm inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          aria-label={`Page ${pageNum}`}
                          aria-current={pagination.page === pageNum ? 'page' : undefined}
                          onClick={() => setPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            pagination.page === pageNum
                              ? 'bg-primary text-white'
                              : 'text-text-secondary hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      aria-label="Next page"
                      onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                      disabled={pagination.page >= pagination.totalPages}
                      className="btn-outline px-3 py-1.5 text-sm inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </nav>
              )}
            </>
          )}

          {/* Empty State */}
          {!loading && !error && resources.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 card max-w-md mx-auto"
            >
              <FolderOpen className="w-16 h-16 text-text-secondary/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No resources found
              </h3>
              <p className="text-text-secondary text-sm mb-6">
                Try adjusting your search term or selecting a different category.
              </p>
              {(searchTerm || selectedCategory !== 'All') && (
                <button
                  onClick={handleClearFilters}
                  className="btn-outline text-sm"
                >
                  Clear Filters
                </button>
              )}
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
