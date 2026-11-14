import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { mockApplications, mockDocuments } from '../data/mockData';
import { useAuth } from './AuthContext';
import { applicationAPI, getApiErrorMessage, officerAPI } from '../services/api';
import { getStatusLabel } from '../utils/statusHelpers';

const ApplicationContext = createContext(null);
const APPS_STORAGE_KEY = 'ayush_setu_applications';
const DOCS_STORAGE_KEY = 'ayush_setu_documents';

function getInitialData(storageKey, fallback) {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn(`Failed to parse ${storageKey}; restoring demo data.`, error);
  }
  try {
    localStorage.setItem(storageKey, JSON.stringify(fallback));
  } catch {
    // Local storage can be unavailable in restricted browser contexts.
  }
  return fallback;
}

function responseData(response) {
  const body = response?.data;
  if (!body?.success || body.data === undefined || body.data === null) {
    throw new Error(body?.error || 'The application service returned an unexpected response.');
  }
  return body.data;
}

function mapApplicationSummary(application, startupId) {
  const assignedOfficer = application.assignedOfficer;
  return {
    ...application,
    startupId: startupId || null,
    startupName: application.legalName || application.startupName || '',
    brandName: application.brandName || application.legalName || '',
    ayushDomain: application.categoryName || application.categoryCode || application.ayushDomain || '',
    status: getStatusLabel(application.status),
    assignedOfficer: typeof assignedOfficer === 'object' ? assignedOfficer?.id || null : assignedOfficer || null,
    assignedOfficerName: typeof assignedOfficer === 'object' ? assignedOfficer?.name || '' : application.assignedOfficerName || '',
    timeline: application.statusHistory || application.timeline || [],
    documents: application.documents || [],
  };
}

export function ApplicationProvider({ children }) {
  const { user, loading: authLoading, isApiSession, startup } = useAuth();
  const [applications, setApplications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [applicationLoading, setApplicationLoading] = useState(true);
  const [applicationError, setApplicationError] = useState('');
  const isLiveStartup = isApiSession && user?.role === 'startup';
  const isLiveReviewer = isApiSession && ['officer', 'admin'].includes(user?.role);

  const saveMockApplications = useCallback((nextApplications) => {
    setApplications(nextApplications);
    try {
      localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(nextApplications));
    } catch (error) {
      console.error('Error saving applications to localStorage', error);
    }
  }, []);

  const saveMockDocuments = useCallback((nextDocuments) => {
    setDocuments(nextDocuments);
    try {
      localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(nextDocuments));
    } catch (error) {
      console.error('Error saving documents to localStorage', error);
    }
  }, []);

  const refreshApplications = useCallback(async () => {
    if (!isLiveStartup && !isLiveReviewer) return [];

    setApplicationLoading(true);
    setApplicationError('');
    try {
      const getPage = isLiveStartup ? applicationAPI.getAll : officerAPI.getAssigned;
      const firstPage = responseData(await getPage({ page: 1, limit: 50 }));
      const allItems = [...(firstPage.items || [])];
      const totalPages = Math.max(1, firstPage.pagination?.totalPages || 1);

      for (let page = 2; page <= totalPages; page += 1) {
        const nextPage = responseData(await getPage({ page, limit: 50 }));
        allItems.push(...(nextPage.items || []));
      }

      const mapped = allItems.map((application) => mapApplicationSummary(application, startup?.id));
      setApplications(mapped);
      return mapped;
    } catch (error) {
      const message = error?.apiMessage || getApiErrorMessage(error, 'Unable to load your applications.');
      setApplicationError(message);
      throw new Error(message);
    } finally {
      setApplicationLoading(false);
    }
  }, [isLiveReviewer, isLiveStartup, startup?.id]);

  useEffect(() => {
    if (authLoading) return;

    if (isLiveStartup || isLiveReviewer) {
      setApplications([]);
      setDocuments([]);
      refreshApplications().catch(() => {});
      return;
    }

    setApplicationError('');
    setApplicationLoading(false);
    if (user && !isApiSession) {
      setApplications(getInitialData(APPS_STORAGE_KEY, mockApplications));
      setDocuments(getInitialData(DOCS_STORAGE_KEY, mockDocuments));
    } else {
      setApplications([]);
      setDocuments([]);
    }
  }, [authLoading, isApiSession, isLiveReviewer, isLiveStartup, refreshApplications, user]);

  const getApplicationsByStartup = useCallback((startupId) => {
    if (!startupId) return [];
    return (applications || []).filter((application) => application?.startupId === startupId);
  }, [applications]);

  const getApplicationsByOfficer = useCallback((officerId) => (
    (applications || []).filter((application) => !application?.assignedOfficer || application?.assignedOfficer === officerId)
  ), [applications]);

  const getApplicationById = useCallback((applicationId) => (
    (applications || []).find((application) => application?.id === applicationId)
  ), [applications]);

  const getDocumentsByApplication = useCallback((applicationId) => {
    if (!applicationId) return [];
    return (documents || []).filter((document) => document?.applicationId === applicationId);
  }, [documents]);

  const getDocumentsByStartup = useCallback((startupId) => {
    if (!startupId) return [];
    return (documents || []).filter((document) => document?.startupId === startupId);
  }, [documents]);

  const createApplication = useCallback(async (applicationData) => {
    if (isApiSession) {
      if (!isLiveStartup) throw new Error('Only startup accounts can create applications.');
      const created = responseData(await applicationAPI.create(applicationData));
      await refreshApplications().catch(() => {});
      return created;
    }

    const localId = globalThis.crypto?.randomUUID?.()
      || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newApplication = {
      id: `mock-${localId}`,
      ...applicationData,
      trackingNumber: applicationData.trackingNumber || null,
      status: applicationData.status || 'Draft',
      submittedAt: applicationData.status === 'Submitted' ? new Date().toISOString() : null,
      lastUpdated: new Date().toISOString(),
      assignedOfficer: null,
      timeline: [
        { status: 'Draft', date: new Date().toISOString(), remark: 'Application created' },
        ...(applicationData.status === 'Submitted'
          ? [{ status: 'Submitted', date: new Date().toISOString(), remark: 'Application submitted successfully' }]
          : []),
      ],
      documents: [],
    };
    saveMockApplications([newApplication, ...(applications || [])]);
    return newApplication;
  }, [applications, isApiSession, isLiveStartup, refreshApplications, saveMockApplications]);

  const updateApplication = useCallback(async (applicationId, applicationData) => {
    if (isApiSession) {
      if (!isLiveStartup) throw new Error('Only startup accounts can update applications.');
      const updated = responseData(await applicationAPI.update(applicationId, applicationData));
      await refreshApplications().catch(() => {});
      return updated;
    }

    const updatedApplications = (applications || []).map((application) => (
      application?.id === applicationId
        ? { ...application, ...applicationData, lastUpdated: new Date().toISOString() }
        : application
    ));
    saveMockApplications(updatedApplications);
    return updatedApplications.find((application) => application?.id === applicationId) || null;
  }, [applications, isApiSession, isLiveStartup, refreshApplications, saveMockApplications]);

  const submitApplication = useCallback(async (applicationId) => {
    if (isApiSession) {
      if (!isLiveStartup) throw new Error('Only startup accounts can submit applications.');
      const submitted = responseData(await applicationAPI.submit(applicationId));
      await refreshApplications().catch(() => {});
      return submitted;
    }

    const submittedAt = new Date().toISOString();
    let result = null;
    const updatedApplications = (applications || []).map((application) => {
      if (application?.id !== applicationId) return application;
      result = {
        ...application,
        status: 'Submitted',
        submittedAt,
        lastUpdated: submittedAt,
        timeline: [
          ...(application.timeline || []),
          { status: 'Submitted', date: submittedAt, remark: 'Application submitted successfully' },
        ],
      };
      return result;
    });
    saveMockApplications(updatedApplications);
    return result;
  }, [applications, isApiSession, isLiveStartup, refreshApplications, saveMockApplications]);

  const assignApplication = useCallback(async (applicationId, officerId) => {
    if (!isApiSession || user?.role !== 'admin') throw new Error('Only administrators can assign review officers.');
    const assigned = responseData(await officerAPI.assign(applicationId, { officerId }));
    await refreshApplications().catch(() => {});
    return assigned;
  }, [isApiSession, refreshApplications, user?.role]);

  const startApplicationReview = useCallback(async (applicationId) => {
    if (!isApiSession || !['officer', 'admin'].includes(user?.role)) throw new Error('Review actions are available to officers and administrators.');
    const started = responseData(await officerAPI.startReview(applicationId));
    await refreshApplications().catch(() => {});
    return started;
  }, [isApiSession, refreshApplications, user?.role]);

  const decideApplication = useCallback(async (applicationId, decision, officerRemarks) => {
    if (!isApiSession || !['officer', 'admin'].includes(user?.role)) throw new Error('Review actions are available to officers and administrators.');
    const decided = responseData(await officerAPI.decide(applicationId, { decision, officerRemarks }));
    await refreshApplications().catch(() => {});
    return decided;
  }, [isApiSession, refreshApplications, user?.role]);

  const updateApplicationStatus = useCallback((applicationId, status, remark, officerName) => {
    if (isApiSession) throw new Error('This status change is not available through the connected API workflow yet.');
    const updatedApplications = (applications || []).map((application) => {
      if (application?.id !== applicationId) return application;
      const updatedAt = new Date().toISOString();
      return {
        ...application,
        status,
        lastUpdated: updatedAt,
        assignedOfficer: application.assignedOfficer || user?.id,
        timeline: [
          ...(application.timeline || []),
          {
            status,
            date: updatedAt,
            remark: remark || `Application status changed to ${status}`,
            officer: officerName || user?.name || 'Review Officer',
          },
        ],
      };
    });
    saveMockApplications(updatedApplications);
  }, [applications, isApiSession, saveMockApplications, user]);

  const addDocument = useCallback((document) => {
    if (isApiSession) throw new Error('Document upload is not connected to the backend yet.');
    const newDocument = {
      id: `doc_${Date.now()}`,
      status: 'Uploaded',
      uploadedAt: new Date().toISOString(),
      verifiedAt: null,
      remark: null,
      ...document,
    };
    saveMockDocuments([newDocument, ...(documents || [])]);

    if (document.applicationId) {
      const updatedApplications = (applications || []).map((application) => (
        application?.id === document.applicationId
          ? { ...application, documents: [...(application.documents || []), newDocument.id] }
          : application
      ));
      saveMockApplications(updatedApplications);
    }
    return newDocument;
  }, [applications, documents, isApiSession, saveMockApplications, saveMockDocuments]);

  const updateDocumentStatus = useCallback((documentId, status, remark) => {
    if (isApiSession) throw new Error('Document verification is not connected to the backend yet.');
    const updatedDocuments = (documents || []).map((document) => (
      document?.id === documentId
        ? {
          ...document,
          status,
          remark: remark || document.remark,
          verifiedAt: ['Verified', 'Rejected'].includes(status) ? new Date().toISOString() : document.verifiedAt,
        }
        : document
    ));
    saveMockDocuments(updatedDocuments);
  }, [documents, isApiSession, saveMockDocuments]);

  const resetToMockData = useCallback(() => {
    if (isApiSession) return;
    saveMockApplications(mockApplications);
    saveMockDocuments(mockDocuments);
  }, [isApiSession, saveMockApplications, saveMockDocuments]);

  const value = {
    applications: applications || [],
    documents: documents || [],
    applicationLoading,
    applicationError,
    refreshApplications,
    getApplicationsByStartup,
    getApplicationsByOfficer,
    getApplicationById,
    getDocumentsByApplication,
    getDocumentsByStartup,
    createApplication,
    updateApplication,
    submitApplication,
    assignApplication,
    startApplicationReview,
    decideApplication,
    updateApplicationStatus,
    addDocument,
    updateDocumentStatus,
    resetToMockData,
  };

  return (
    <ApplicationContext.Provider value={value}>
      {children}
    </ApplicationContext.Provider>
  );
}

export function useApplications() {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error('useApplications must be used within an ApplicationProvider');
  }
  return context;
}
