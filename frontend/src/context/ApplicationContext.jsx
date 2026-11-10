import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { mockApplications, mockDocuments } from '../data/mockData';
import { useAuth } from './AuthContext';

const ApplicationContext = createContext(null);
//************ */
const APPS_STORAGE_KEY = 'ayush_setu_applications';
const DOCS_STORAGE_KEY = 'ayush_setu_documents';
//************ */

const getInitialApplications = () => {
  try {
    const stored = localStorage.getItem(APPS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored applications, resetting to mock data', e);
  }
  try {
    localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(mockApplications));
  } catch {}
  return mockApplications;
};

const getInitialDocuments = () => {
  try {
    const stored = localStorage.getItem(DOCS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored documents, resetting to mock data', e);
  }
  try {
    localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(mockDocuments));
  } catch {}
  return mockDocuments;
};

export function ApplicationProvider({ children }) {
  const { user } = useAuth();
  const [applications, setApplications] = useState(getInitialApplications);
  const [documents, setDocuments] = useState(getInitialDocuments);

  // Sync to localStorage whenever state changes
  const saveApplications = useCallback((apps) => {
    setApplications(apps);
    try {
      localStorage.setItem(APPS_STORAGE_KEY, JSON.stringify(apps));
    } catch (e) {
      console.error('Error saving applications to localStorage', e);
    }
  }, []);

  const saveDocuments = useCallback((docs) => {
    setDocuments(docs);
    try {
      localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(docs));
    } catch (e) {
      console.error('Error saving documents to localStorage', e);
    }
  }, []);

  const getApplicationsByStartup = useCallback((startupId) => {
    if (!startupId) return [];
    return (applications || []).filter(app => app?.startupId === startupId);
  }, [applications]);

  const getApplicationsByOfficer = useCallback((officerId) => {
    return (applications || []).filter(app => !app?.assignedOfficer || app?.assignedOfficer === officerId);
  }, [applications]);

  const getApplicationById = useCallback((appId) => {
    return (applications || []).find(app => app?.id === appId);
  }, [applications]);

  const getDocumentsByApplication = useCallback((appId) => {
    if (!appId) return [];
    return (documents || []).filter(doc => doc?.applicationId === appId);
  }, [documents]);

  const getDocumentsByStartup = useCallback((startupId) => {
    if (!startupId) return [];
    return (documents || []).filter(doc => doc?.startupId === startupId);
  }, [documents]);

  const createApplication = useCallback((applicationData) => {
    const newId = `APP-${new Date().getFullYear()}-${String((applications || []).length + 1).padStart(3, '0')}`;
    const newApp = {
      id: newId,
      ...applicationData,
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
    const updated = [newApp, ...(applications || [])];
    saveApplications(updated);
    return newApp;
  }, [applications, saveApplications]);

  const submitApplication = useCallback((appId) => {
    const updated = (applications || []).map(app => {
      if (app?.id === appId) {
        return {
          ...app,
          status: 'Submitted',
          submittedAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          timeline: [
            ...(app.timeline || []),
            { status: 'Submitted', date: new Date().toISOString(), remark: 'Application submitted successfully' },
          ],
        };
      }
      return app;
    });
    saveApplications(updated);
  }, [applications, saveApplications]);

  const updateApplicationStatus = useCallback((appId, status, remark, officerName) => {
    const updated = (applications || []).map(app => {
      if (app?.id === appId) {
        return {
          ...app,
          status,
          lastUpdated: new Date().toISOString(),
          assignedOfficer: app.assignedOfficer || user?.id,
          timeline: [
            ...(app.timeline || []),
            {
              status,
              date: new Date().toISOString(),
              remark: remark || `Application status changed to ${status}`,
              officer: officerName || user?.name || 'Review Officer',
            },
          ],
        };
      }
      return app;
    });
    saveApplications(updated);
  }, [applications, saveApplications, user]);

  const addDocument = useCallback((doc) => {
    const newDoc = {
      id: `doc_${Date.now()}`,
      status: 'Uploaded',
      uploadedAt: new Date().toISOString(),
      verifiedAt: null,
      remark: null,
      ...doc,
    };
    const updatedDocs = [newDoc, ...(documents || [])];
    saveDocuments(updatedDocs);

    if (doc.applicationId) {
      const updatedApps = (applications || []).map(app => {
        if (app?.id === doc.applicationId) {
          return { ...app, documents: [...(app.documents || []), newDoc.id] };
        }
        return app;
      });
      saveApplications(updatedApps);
    }

    return newDoc;
  }, [documents, applications, saveDocuments, saveApplications]);

  const updateDocumentStatus = useCallback((docId, status, remark) => {
    const updated = (documents || []).map(doc => {
      if (doc?.id === docId) {
        return {
          ...doc,
          status,
          remark: remark || doc.remark,
          verifiedAt: ['Verified', 'Rejected'].includes(status) ? new Date().toISOString() : doc.verifiedAt,
        };
      }
      return doc;
    });
    saveDocuments(updated);
  }, [documents, saveDocuments]);

  const resetToMockData = useCallback(() => {
    saveApplications(mockApplications);
    saveDocuments(mockDocuments);
  }, [saveApplications, saveDocuments]);

  const value = {
    applications: applications || [],
    documents: documents || [],
    getApplicationsByStartup,
    getApplicationsByOfficer,
    getApplicationById,
    getDocumentsByApplication,
    getDocumentsByStartup,
    createApplication,
    submitApplication,
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
