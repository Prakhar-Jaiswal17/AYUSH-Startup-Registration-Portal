import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Search,
  BookOpen,
  Shield,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import { resourceAPI, getApiErrorMessage } from '../../services/api';
import PageTransition from '../../layouts/PageTransition';
import HighlightText from '../../components/common/HighlightText';

const categories = [
  'All',
  'Bookmarked',
  'Government Portal',
  'Startup Support',
  'Research',
  'Regulatory',
  'Guide',
  'Government Scheme',
];

export default function StartupResources() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('All');
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
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('ayush_bookmarked_resources');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleBookmark = (id) => {
    setBookmarks((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      try {
        localStorage.setItem('ayush_bookmarked_resources', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleCopyLink = (res) => {
    const fullUrl = res.url.startsWith('/')
      ? `${window.location.origin}${res.url}`
      : res.url;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedId(res.id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch((err) => console.error('Failed to copy link:', err));
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch resources
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const params = {
      page: category === 'Bookmarked' ? 1 : page,
      limit: category === 'Bookmarked' ? 50 : 9,
    };
    if (category !== 'All' && category !== 'Bookmarked') {
      params.category = category;
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
          const finalItems = category === 'Bookmarked'
            ? resData.items.filter((item) => bookmarks.includes(item.id))
            : resData.items;
          setResources(finalItems);
          setPagination(
            category === 'Bookmarked'
              ? { page: 1, limit: 50, total: finalItems.length, totalPages: 1 }
              : (resData.pagination || {
                  page,
                  limit: 9,
                  total: resData.items.length,
                  totalPages: 1,
                })
          );
        } else {
          setResources([]);
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error('Failed to load startup resources:', err);
        setError(
          getApiErrorMessage(
            err,
            'Unable to load resources. Please try again.'
          )
        );
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [page, category, debouncedSearch, reloadTrigger]);

  const handleCategoryChange = (c) => {
    setCategory(c);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCategory('All');
    setSortBy('default');
    setPage(1);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Resources & Support</h1>
          <p className="text-text-secondary text-sm mt-1">
            Access guidelines, schemes, and support resources for AYUSH startups.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="input-field w-auto text-xs py-1.5 px-3 text-text-secondary bg-white border border-border rounded-lg"
          >
            <option value="default">Default Order</option>
            <option value="title-asc">Title (A → Z)</option>
            <option value="title-desc">Title (Z → A)</option>
            <option value="category">Category</option>
          </select>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => handleCategoryChange(c)}
                className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
                  category === c
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && !loading && (
          <div className="card p-6 border-red-200 bg-red-50/50 text-center max-w-lg mx-auto">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-text-primary mb-1">
              Failed to Load Resources
            </h3>
            <p className="text-sm text-text-secondary mb-4">{error}</p>
            <button
              onClick={() => setReloadTrigger((prev) => prev + 1)}
              className="btn-primary inline-flex items-center gap-2 text-sm mx-auto"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="card p-5 animate-pulse flex flex-col">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 bg-gray-200 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
                <div className="space-y-2 flex-1 mb-4">
                  <div className="h-3.5 bg-gray-200 rounded w-full" />
                  <div className="h-3.5 bg-gray-200 rounded w-5/6" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-20" />
              </div>
            ))}
          </div>
        )}

        {/* Resources Grid */}
        {!loading && !error && resources.length > 0 && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((res, i) => (
                <motion.div
                  key={res.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="card-hover p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        {res.type === 'official' ? (
                          <Shield className="w-4 h-4 text-primary" />
                        ) : (
                          <BookOpen className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-text-primary leading-snug">
                          <HighlightText text={res.title} query={debouncedSearch} />
                        </p>
                        <span className="text-xs px-1.5 py-0.5 bg-primary/5 text-primary rounded mt-1 inline-block">
                          {res.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleBookmark(res.id)}
                          className="text-text-secondary hover:text-amber-500 transition-colors p-1 rounded-md hover:bg-gray-100"
                          title={bookmarks.includes(res.id) ? 'Remove from bookmarks' : 'Add to bookmarks'}
                        >
                          {bookmarks.includes(res.id) ? (
                            <BookmarkCheck className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          ) : (
                            <Bookmark className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {res.url && res.url !== '#' && (
                          <button
                            type="button"
                            onClick={() => handleCopyLink(res)}
                            className="text-text-secondary hover:text-primary transition-colors p-1 rounded-md hover:bg-gray-100"
                            title={copiedId === res.id ? 'Copied link!' : 'Copy link'}
                          >
                            {copiedId === res.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary mb-4 line-clamp-3">
                      {res.description || res.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border-light mt-auto">
                    {res.isAvailable === false || !res.url || res.url === '#' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Clock className="w-3 h-3" /> Under Review
                      </span>
                    ) : res.url.startsWith('/') ? (
                      <Link
                        to={res.url}
                        className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1"
                      >
                        Read Guide <ArrowRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1"
                      >
                        {res.type === 'official' ? 'Visit Portal' : 'Learn More'}{' '}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-4">
                <p className="text-xs text-text-secondary">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} resources
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={pagination.page <= 1}
                    className="btn-outline px-2.5 py-1 text-xs inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3 h-3" /> Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
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
                    onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="btn-outline px-2.5 py-1 text-xs inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && !error && resources.length === 0 && (
          <div className="text-center py-12 card max-w-sm mx-auto">
            <BookOpen className="w-10 h-10 text-text-secondary/30 mx-auto mb-3" />
            <p className="text-text-secondary text-sm mb-4">No resources match your search.</p>
            {(search || category !== 'All') && (
              <button
                onClick={handleClearFilters}
                className="btn-outline text-xs px-3 py-1.5"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
