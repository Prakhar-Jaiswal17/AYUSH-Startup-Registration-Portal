import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft, Save, Send, Plus, X, Upload, CheckCircle, Pencil, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApplications } from '../../context/ApplicationContext';
import { useNotifications } from '../../context/NotificationContext';
import { ayushDomains, indianStates, incorporationTypes, businessActivities, businessStages } from '../../data/mockData';
import { DOCUMENT_FORMAT_LABEL, DOCUMENT_MAX_SIZE_MB } from '../../utils/documentUpload';
import { applicationAPI, getApiErrorMessage } from '../../services/api';
import { applicationFormToPayload, applicationToForm, startupToApplicationForm } from '../../utils/applicationMappers';
import Modal from '../../components/common/Modal';
import PageTransition from '../../layouts/PageTransition';

const STEPS = ['Basic Info', 'Founders', 'AYUSH Domain', 'Business Details', 'Regulatory', 'Documents', 'Review'];
const DRAFT_KEY = 'ayush_setu_draft_application';

const initialFormData = {
  legalName: '', brandName: '', incorporationDate: '', incorporationType: '', registrationNumber: '', website: '', officialEmail: '',
  founderName: '', founderDesignation: '', founderEmail: '', founderPhone: '', founderQualification: '',
  coFounders: [],
  ayushDomain: '', selectedActivities: [],
  hasManufacturing: '', facilityLocation: '', hasClinicalEstablishment: '', practitionerCount: '', researchType: '',
  description: '', products: '', businessStage: '', targetMarket: '', operationalStatus: '', state: '', city: '',
  hasExistingLicences: '', licenceDetails: '', hasDrugLicence: '', drugLicenceNumber: '',
  hasClinicalApproval: '', clinicalDetails: '', isDPIITRecognized: '', dpiitNumber: '', hasOtherRegistrations: '', otherDetails: '',
  uploadedFiles: [],
  declaration: false,
};

export default function NewApplication() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editDraftId = searchParams.get('draft');
  const { user, startup, isApiSession, startupLoading, startupError, refreshStartupProfile } = useAuth();
  const { createApplication, updateApplication, submitApplication } = useApplications();
  const { addNotification } = useNotifications();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [direction, setDirection] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdApplicationId, setCreatedApplicationId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftLoading, setDraftLoading] = useState(Boolean(isApiSession && editDraftId));
  const [saveFeedback, setSaveFeedback] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const initializedKey = useRef('');
  const draftStorageKey = isApiSession ? `${DRAFT_KEY}:${user?.id || 'account'}` : DRAFT_KEY;

  useEffect(() => {
    if (isApiSession && startupLoading) return undefined;
    const loadKey = `${isApiSession ? 'api' : 'demo'}:${user?.id || 'guest'}:${editDraftId || 'new'}`;
    if (initializedKey.current === loadKey) return undefined;
    initializedKey.current = loadKey;
    let active = true;

    const restoreDraft = async () => {
      setDraftLoading(isApiSession && Boolean(editDraftId));
      setSubmissionError('');
      try {
        if (isApiSession && editDraftId) {
          const response = await applicationAPI.getById(editDraftId);
          const application = response?.data?.data;
          if (!application) throw new Error('Application details were not returned by the server.');
          if (active) {
            const restoredForm = applicationToForm(application, startup);
            setFormData({ ...initialFormData, ...restoredForm });
            setApplicationId(application.id);
            localStorage.setItem(draftStorageKey, JSON.stringify({ formData: restoredForm, applicationId: application.id }));
          }
          return;
        }

        const stored = localStorage.getItem(draftStorageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          const savedForm = parsed?.formData ? parsed.formData : parsed;
          if (active) {
            setFormData({ ...initialFormData, ...savedForm });
            setApplicationId(parsed?.formData ? parsed.applicationId || '' : '');
          }
        } else if (isApiSession && startup) {
          if (active) {
            setFormData({ ...initialFormData, ...startupToApplicationForm(startup) });
            setApplicationId('');
          }
        } else if (active) {
          setFormData(initialFormData);
          setApplicationId('');
        }
      } catch (error) {
        if (active) setSubmissionError(error?.apiMessage || getApiErrorMessage(error, 'Unable to load this application draft.'));
      } finally {
        if (active) setDraftLoading(false);
      }
    };

    restoreDraft();
    return () => {
      active = false;
    };
  }, [draftStorageKey, editDraftId, isApiSession, startup, startupLoading, user?.id]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveFeedback('');
    setSubmissionError('');
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const saveDraftLocally = () => {
    localStorage.setItem(draftStorageKey, JSON.stringify({ formData, applicationId }));
  };

  const saveDraft = async () => {
    if (savingDraft || submitting || startupLoading || draftLoading || startupError) return;
    setSavingDraft(true);
    setSubmissionError('');
    setSaveFeedback('');

    try {
      if (!isApiSession) {
        saveDraftLocally();
        setSaveFeedback('Draft saved in this browser.');
        return;
      }

      const missing = [];
      if (!formData.legalName.trim()) missing.push('legal name');
      if (!formData.brandName.trim()) missing.push('brand name');
      if (!formData.state) missing.push('state');
      if (!formData.ayushDomain) missing.push('AYUSH domain');
      if (!startup?.id && !formData.founderName.trim()) missing.push('a primary founder');
      if (missing.length) {
        saveDraftLocally();
        setSaveFeedback(`Saved in this browser. Add ${missing.join(', ')} to save this draft to your account.`);
        return;
      }

      const payload = applicationFormToPayload(formData, {
        hasStartupProfile: Boolean(startup?.id),
        requireFounder: !startup?.id,
      });
      const saved = applicationId
        ? await updateApplication(applicationId, payload)
        : await createApplication(payload);
      const savedId = saved?.id || saved?.trackingNumber;
      if (!savedId) throw new Error('The server did not return an application ID.');

      setApplicationId(savedId);
      localStorage.setItem(draftStorageKey, JSON.stringify({ formData, applicationId: savedId }));
      await refreshStartupProfile().catch(() => null);
      setSaveFeedback(`Draft ${savedId} saved to your account.`);
    } catch (error) {
      setSubmissionError(error?.apiMessage || getApiErrorMessage(error, 'Unable to save this draft. Please try again.'));
    } finally {
      setSavingDraft(false);
    }
  };

  const validateStep = (step) => {
    const e = {};
    if (step === 0) {
      if (!formData.legalName.trim()) e.legalName = 'Required';
      if (!formData.brandName.trim()) e.brandName = 'Required';
      if (!formData.incorporationDate) e.incorporationDate = 'Required';
      if (!formData.incorporationType) e.incorporationType = 'Required';
      if (!formData.registrationNumber.trim()) e.registrationNumber = 'Required';
      if (!formData.officialEmail.trim()) e.officialEmail = 'Required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.officialEmail)) e.officialEmail = 'Invalid email';
    } else if (step === 1) {
      if (!startup?.founders?.length && !startup?.founder) {
        if (!formData.founderName.trim()) e.founderName = 'Required';
        if (!formData.founderDesignation.trim()) e.founderDesignation = 'Required';
        if (!formData.founderEmail.trim()) e.founderEmail = 'Required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.founderEmail)) e.founderEmail = 'Invalid email';
        if (!formData.founderPhone.trim()) e.founderPhone = 'Required';
        if (!formData.founderQualification.trim()) e.founderQualification = 'Required';
      }
    } else if (step === 2) {
      if (!formData.ayushDomain) e.ayushDomain = 'Select a domain';
      if (formData.selectedActivities.length === 0) e.selectedActivities = 'Select at least one activity';
    } else if (step === 3) {
      if (!formData.description.trim()) e.description = 'Required';
      else if (formData.description.trim().length < 50) e.description = 'At least 50 characters';
      if (!formData.products.trim()) e.products = 'Required';
      if (!formData.businessStage) e.businessStage = 'Required';
      if (!formData.targetMarket.trim()) e.targetMarket = 'Required';
      if (!formData.state) e.state = 'Required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (validateStep(currentStep)) {
      setDirection(1);
      setCurrentStep(s => Math.min(s + 1, STEPS.length - 1));
    }
  };

  const goPrev = () => { setDirection(-1); setCurrentStep(s => Math.max(s - 1, 0)); };
  const goToStep = (step) => { setDirection(step > currentStep ? 1 : -1); setCurrentStep(step); };

  const handleSubmit = async () => {
    if (!formData.declaration || submitting || startupLoading || draftLoading || startupError) return;
    setSubmitting(true);
    setSubmissionError('');
    setSaveFeedback('');

    try {
      let submittedId;
      if (isApiSession) {
        const payload = applicationFormToPayload(formData, {
          hasStartupProfile: Boolean(startup?.id),
          requireFounder: true,
        });
        const draft = applicationId
          ? await updateApplication(applicationId, payload)
          : await createApplication(payload);
        const draftId = draft?.id || draft?.trackingNumber;
        if (!draftId) throw new Error('The server did not return an application ID.');

        setApplicationId(draftId);
        localStorage.setItem(draftStorageKey, JSON.stringify({ formData, applicationId: draftId }));
        await refreshStartupProfile().catch(() => null);
        const submitted = await submitApplication(draftId);
        submittedId = submitted?.id || submitted?.trackingNumber || draftId;
      } else {
        await new Promise(resolve => setTimeout(resolve, 500));
        const application = await createApplication({
          startupId: startup?.id || `stp_${Date.now()}`,
          startupName: formData.legalName,
          brandName: formData.brandName,
          ayushDomain: formData.ayushDomain,
          state: formData.state,
          status: 'Submitted',
          formData: { ...formData },
        });

        addNotification({
          type: 'status_update',
          title: 'Application Submitted',
          message: 'Your application was submitted in the local demo. A tracking number will be assigned by the server when live submission is available.',
          applicationId: application.id,
        });
        submittedId = application.id;
      }

      try {
        localStorage.removeItem(draftStorageKey);
      } catch {
        // The application is already saved by the selected flow.
      }
      setCreatedApplicationId(submittedId);
      setShowSuccess(true);
    } catch (error) {
      setSubmissionError(error?.apiMessage || getApiErrorMessage(error, 'Unable to submit the application. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const addCoFounder = () => {
    if (formData.coFounders.length < 3) {
      updateField('coFounders', [...formData.coFounders, { name: '', designation: '', email: '', phone: '', qualification: '' }]);
    }
  };

  const removeCoFounder = (i) => {
    updateField('coFounders', formData.coFounders.filter((_, idx) => idx !== i));
  };

  const updateCoFounder = (i, field, val) => {
    const cf = [...formData.coFounders];
    cf[i] = { ...cf[i], [field]: val };
    updateField('coFounders', cf);
  };

  const toggleActivity = (act) => {
    const acts = formData.selectedActivities.includes(act) ? formData.selectedActivities.filter(a => a !== act) : [...formData.selectedActivities, act];
    updateField('selectedActivities', acts);
  };

  const addFile = (docType) => {
    const exists = formData.uploadedFiles.find(f => f.docType === docType);
    if (!exists) {
      updateField('uploadedFiles', [...formData.uploadedFiles, { docType, fileName: `${docType.toLowerCase().replace(/\s+/g, '_')}.pdf`, fileSize: `${(Math.random() * 4 + 0.5).toFixed(1)} MB` }]);
    }
  };

  const removeFile = (docType) => {
    updateField('uploadedFiles', formData.uploadedFiles.filter(f => f.docType !== docType));
  };

  const slideVariants = {
    enter: (d) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
  };

  const requiredDocs = ['Certificate of Incorporation', 'PAN Card', 'Founder ID Proof', 'Business Plan'];
  if (formData.selectedActivities.includes('Manufacturing')) requiredDocs.push('GMP Certificate', 'Manufacturing Licence');
  if (formData.isDPIITRecognized === 'yes') requiredDocs.push('DPIIT Recognition Certificate');
  if (formData.hasExistingLicences === 'yes') requiredDocs.push('Licence Copies');

  const FieldError = ({ name }) => errors[name] ? <p className="text-xs text-error mt-1">{errors[name]}</p> : null;

  if (isApiSession && (startupLoading || draftLoading)) {
    return (
      <PageTransition>
        <div role="status" className="card p-10 text-center text-sm text-text-secondary">
          {draftLoading ? 'Loading your saved application…' : 'Loading your startup profile…'}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">New Application</h1>
          <p className="text-text-secondary text-sm mt-1">Complete the registration wizard to submit your application.</p>
        </div>

        {startupError && isApiSession && (
          <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" role="alert">
            <p className="text-sm text-error">{startupError} Reload your profile before editing or submitting this application.</p>
            <button onClick={() => refreshStartupProfile().catch(() => {})} className="btn-secondary text-sm">Retry profile load</button>
          </div>
        )}

        {saveFeedback && (
          <p role="status" className="rounded-lg border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
            {saveFeedback}
          </p>
        )}
        {submissionError && (
          <p role="alert" className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
            {submissionError}
          </p>
        )}

        {/* Progress Bar */}
        <div className="card p-4">
          <div className="hidden md:flex items-center justify-between">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center">
                <button onClick={() => i < currentStep && goToStep(i)} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i < currentStep ? 'bg-primary text-white cursor-pointer' : i === currentStep ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-gray-200 text-gray-500'}`}>
                  {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
                </button>
                <span className={`ml-2 text-xs font-medium hidden lg:inline ${i === currentStep ? 'text-primary' : 'text-text-secondary'}`}>{step}</span>
                {i < STEPS.length - 1 && <div className={`w-8 lg:w-16 h-0.5 mx-2 ${i < currentStep ? 'bg-primary' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <div className="md:hidden flex items-center justify-between">
            <span className="text-sm font-medium text-primary">Step {currentStep + 1} of {STEPS.length}</span>
            <span className="text-sm text-text-secondary">{STEPS[currentStep]}</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="card p-6 min-h-[400px] overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={currentStep} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeInOut' }}>

              {/* Step 0: Basic Info */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-text-primary mb-4">Basic Startup Information</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className="label">Startup Legal Name <span className="text-error">*</span></label><input type="text" value={formData.legalName} onChange={e => updateField('legalName', e.target.value)} className="input-field" placeholder="e.g., VedaCure Wellness Pvt. Ltd." /><FieldError name="legalName" /></div>
                    <div><label className="label">Brand Name <span className="text-error">*</span></label><input type="text" value={formData.brandName} onChange={e => updateField('brandName', e.target.value)} className="input-field" placeholder="e.g., VedaCure" /><FieldError name="brandName" /></div>
                    <div><label className="label">Date of Incorporation <span className="text-error">*</span></label><input type="date" value={formData.incorporationDate} onChange={e => updateField('incorporationDate', e.target.value)} className="input-field" /><FieldError name="incorporationDate" /></div>
                    <div><label className="label">Incorporation Type <span className="text-error">*</span></label><select value={formData.incorporationType} onChange={e => updateField('incorporationType', e.target.value)} className="input-field"><option value="">Select type...</option>{incorporationTypes.map(t => <option key={t} value={t}>{t}</option>)}</select><FieldError name="incorporationType" /></div>
                    <div><label className="label">Registration Number <span className="text-error">*</span></label><input type="text" value={formData.registrationNumber} onChange={e => updateField('registrationNumber', e.target.value)} className="input-field" placeholder="CIN / LLP Number / Udyam" /><FieldError name="registrationNumber" /></div>
                    <div><label className="label">Website</label><input type="url" value={formData.website} onChange={e => updateField('website', e.target.value)} className="input-field" placeholder="https://..." /></div>
                    <div className="sm:col-span-2"><label className="label">Official Email <span className="text-error">*</span></label><input type="email" value={formData.officialEmail} onChange={e => updateField('officialEmail', e.target.value)} className="input-field" placeholder="info@yourcompany.com" /><FieldError name="officialEmail" /></div>
                  </div>
                </div>
              )}

              {/* Step 1: Founders */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-text-primary mb-4">Founder Details</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className="label">Founder Name <span className="text-error">*</span></label><input type="text" value={formData.founderName} onChange={e => updateField('founderName', e.target.value)} className="input-field" /><FieldError name="founderName" /></div>
                    <div><label className="label">Designation <span className="text-error">*</span></label><input type="text" value={formData.founderDesignation} onChange={e => updateField('founderDesignation', e.target.value)} className="input-field" placeholder="e.g., CEO & Founder" /><FieldError name="founderDesignation" /></div>
                    <div><label className="label">Email <span className="text-error">*</span></label><input type="email" value={formData.founderEmail} onChange={e => updateField('founderEmail', e.target.value)} className="input-field" /><FieldError name="founderEmail" /></div>
                    <div><label className="label">Mobile Number <span className="text-error">*</span></label><input type="tel" value={formData.founderPhone} onChange={e => updateField('founderPhone', e.target.value)} className="input-field" placeholder="+91 XXXXX XXXXX" /><FieldError name="founderPhone" /></div>
                    <div className="sm:col-span-2"><label className="label">Educational Qualification <span className="text-error">*</span></label><input type="text" value={formData.founderQualification} onChange={e => updateField('founderQualification', e.target.value)} className="input-field" placeholder="e.g., BAMS, MBA" /><FieldError name="founderQualification" /></div>
                  </div>
                  <AnimatePresence>
                    {formData.coFounders.map((cf, i) => (
                      <motion.div key={i} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border border-border rounded-lg p-4 mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-text-primary">Co-Founder {i + 1}</h3>
                          <button onClick={() => removeCoFounder(i)} className="p-1 hover:bg-red-50 rounded text-error"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <input type="text" placeholder="Name" value={cf.name} onChange={e => updateCoFounder(i, 'name', e.target.value)} className="input-field text-sm" />
                          <input type="text" placeholder="Designation" value={cf.designation} onChange={e => updateCoFounder(i, 'designation', e.target.value)} className="input-field text-sm" />
                          <input type="email" placeholder="Email" value={cf.email} onChange={e => updateCoFounder(i, 'email', e.target.value)} className="input-field text-sm" />
                          <input type="tel" placeholder="Phone" value={cf.phone} onChange={e => updateCoFounder(i, 'phone', e.target.value)} className="input-field text-sm" />
                          <input type="text" placeholder="Qualification" value={cf.qualification} onChange={e => updateCoFounder(i, 'qualification', e.target.value)} className="input-field text-sm sm:col-span-2" />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {formData.coFounders.length < 3 && (
                    <button onClick={addCoFounder} className="btn-ghost text-sm inline-flex items-center gap-2 mt-2"><Plus className="w-4 h-4" /> Add Co-Founder</button>
                  )}
                </div>
              )}

              {/* Step 2: AYUSH Classification */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary mb-2">AYUSH Domain</h2>
                    <p className="text-sm text-text-secondary mb-4">Select the AYUSH domain your startup belongs to.</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {ayushDomains.map(d => (
                        <button key={d.id} onClick={() => updateField('ayushDomain', d.name)} className={`p-4 rounded-xl border-2 text-left transition-all ${formData.ayushDomain === d.name ? 'border-primary bg-primary/5' : 'border-border-light hover:border-primary/30'}`}>
                          <div className="w-8 h-8 rounded-lg mb-2 flex items-center justify-center" style={{ backgroundColor: d.bgColor }}><span style={{ color: d.color }} className="text-sm font-bold">●</span></div>
                          <p className="font-medium text-sm text-text-primary">{d.name}</p>
                          <p className="text-xs text-text-secondary mt-1 line-clamp-2">{d.description}</p>
                        </button>
                      ))}
                    </div>
                    <FieldError name="ayushDomain" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-2">Business Activity <span className="text-error">*</span></h3>
                    <div className="flex flex-wrap gap-2">
                      {businessActivities.map(act => (
                        <button key={act} onClick={() => toggleActivity(act)} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${formData.selectedActivities.includes(act) ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary hover:border-primary/40'}`}>{act}</button>
                      ))}
                    </div>
                    <FieldError name="selectedActivities" />
                  </div>
                  <AnimatePresence>
                    {formData.selectedActivities.includes('Manufacturing') && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 bg-gray-50 rounded-lg space-y-3">
                        <p className="text-sm font-medium">Do you have a manufacturing facility?</p>
                        <div className="flex gap-4">
                          {['yes', 'no'].map(v => <label key={v} className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="hasManufacturing" checked={formData.hasManufacturing === v} onChange={() => updateField('hasManufacturing', v)} className="accent-primary" />{v === 'yes' ? 'Yes' : 'No'}</label>)}
                        </div>
                        {formData.hasManufacturing === 'yes' && <div><label className="label text-xs">Facility Location</label><input type="text" value={formData.facilityLocation} onChange={e => updateField('facilityLocation', e.target.value)} className="input-field text-sm" /></div>}
                      </motion.div>
                    )}
                    {formData.selectedActivities.includes('Healthcare Services') && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 bg-gray-50 rounded-lg space-y-3">
                        <p className="text-sm font-medium">Do you have a clinical establishment?</p>
                        <div className="flex gap-4">
                          {['yes', 'no'].map(v => <label key={v} className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="hasClinical" checked={formData.hasClinicalEstablishment === v} onChange={() => updateField('hasClinicalEstablishment', v)} className="accent-primary" />{v === 'yes' ? 'Yes' : 'No'}</label>)}
                        </div>
                        {formData.hasClinicalEstablishment === 'yes' && <div><label className="label text-xs">Number of Practitioners</label><input type="number" value={formData.practitionerCount} onChange={e => updateField('practitionerCount', e.target.value)} className="input-field text-sm" /></div>}
                      </motion.div>
                    )}
                    {formData.selectedActivities.includes('Research and Development') && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 bg-gray-50 rounded-lg space-y-3">
                        <p className="text-sm font-medium">Type of Research</p>
                        <select value={formData.researchType} onChange={e => updateField('researchType', e.target.value)} className="input-field text-sm"><option value="">Select...</option><option>Clinical</option><option>Pre-clinical</option><option>Analytical</option><option>Other</option></select>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Step 3: Business Details */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-text-primary mb-4">Business Details</h2>
                  <div><label className="label">Startup Description <span className="text-error">*</span></label><textarea value={formData.description} onChange={e => updateField('description', e.target.value)} className="input-field min-h-[100px] resize-y" placeholder="Describe your startup, its mission, and what problem it solves (min 50 chars)..." /><FieldError name="description" /><p className="text-xs text-text-secondary mt-1">{formData.description.length} / 50 min characters</p></div>
                  <div><label className="label">Product / Service Information <span className="text-error">*</span></label><textarea value={formData.products} onChange={e => updateField('products', e.target.value)} className="input-field min-h-[80px] resize-y" placeholder="Describe your products or services..." /><FieldError name="products" /></div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className="label">Business Stage <span className="text-error">*</span></label><select value={formData.businessStage} onChange={e => updateField('businessStage', e.target.value)} className="input-field"><option value="">Select...</option>{businessStages.map(s => <option key={s} value={s}>{s}</option>)}</select><FieldError name="businessStage" /></div>
                    <div><label className="label">Target Market <span className="text-error">*</span></label><input type="text" value={formData.targetMarket} onChange={e => updateField('targetMarket', e.target.value)} className="input-field" placeholder="e.g., Pan-India, Export" /><FieldError name="targetMarket" /></div>
                    <div><label className="label">Operational Status</label><select value={formData.operationalStatus} onChange={e => updateField('operationalStatus', e.target.value)} className="input-field"><option value="">Select...</option><option>Pre-launch</option><option>Active</option><option>Scaling</option><option>Pivoting</option></select></div>
                    <div><label className="label">State <span className="text-error">*</span></label><select value={formData.state} onChange={e => updateField('state', e.target.value)} className="input-field"><option value="">Select state...</option>{indianStates.map(s => <option key={s} value={s}>{s}</option>)}</select><FieldError name="state" /></div>
                    <div><label className="label">City</label><input type="text" value={formData.city} onChange={e => updateField('city', e.target.value)} className="input-field" placeholder="City name" /></div>
                  </div>
                </div>
              )}

              {/* Step 4: Regulatory */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold text-text-primary mb-2">Regulatory Information</h2>
                  <p className="text-sm text-text-secondary bg-info-light p-3 rounded-lg">Not all fields may apply to your startup. Answer based on your current status.</p>
                  {[
                    { q: 'Does your startup hold any existing AYUSH-related licences?', field: 'hasExistingLicences', detailField: 'licenceDetails', detailLabel: 'Licence Details', show: true },
                    { q: 'Do you have a Drug Manufacturing Licence?', field: 'hasDrugLicence', detailField: 'drugLicenceNumber', detailLabel: 'Licence Number', show: formData.selectedActivities.includes('Manufacturing') },
                    { q: 'Do you have clinical or research approvals?', field: 'hasClinicalApproval', detailField: 'clinicalDetails', detailLabel: 'Approval Details', show: formData.selectedActivities.includes('Research and Development') || formData.selectedActivities.includes('Healthcare Services') },
                    { q: 'Is your startup recognized by DPIIT?', field: 'isDPIITRecognized', detailField: 'dpiitNumber', detailLabel: 'DPIIT Recognition Number', show: true },
                    { q: 'Do you have any other applicable registrations?', field: 'hasOtherRegistrations', detailField: 'otherDetails', detailLabel: 'Details', show: true },
                  ].filter(item => item.show).map((item, i) => (
                    <div key={i} className="p-4 border border-border-light rounded-lg space-y-3">
                      <p className="text-sm font-medium text-text-primary">{item.q}</p>
                      <div className="flex gap-4">
                        {['yes', 'no'].map(v => <label key={v} className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name={item.field} checked={formData[item.field] === v} onChange={() => updateField(item.field, v)} className="accent-primary" />{v === 'yes' ? 'Yes' : 'No'}</label>)}
                      </div>
                      {formData[item.field] === 'yes' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <label className="label text-xs">{item.detailLabel}</label>
                          {item.detailField === 'licenceDetails' || item.detailField === 'clinicalDetails' || item.detailField === 'otherDetails' ? (
                            <textarea value={formData[item.detailField]} onChange={e => updateField(item.detailField, e.target.value)} className="input-field text-sm min-h-[60px]" />
                          ) : (
                            <input type="text" value={formData[item.detailField]} onChange={e => updateField(item.detailField, e.target.value)} className="input-field text-sm" />
                          )}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Step 5: Documents */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-text-primary mb-2">Document Uploads</h2>
                  <p className="text-sm text-text-secondary mb-4">{isApiSession ? 'Document upload is not connected yet. You can save and submit the application details; files will not be attached.' : 'Upload the required documents. You can also upload them later from the Document Centre.'}</p>
                  <div className="space-y-3">
                    {requiredDocs.map(docType => {
                      const uploaded = formData.uploadedFiles.find(f => f.docType === docType);
                      return (
                        <div key={docType} className={`p-4 border rounded-lg flex items-center justify-between transition-colors ${uploaded ? 'border-success/30 bg-success-light/30' : 'border-border-light'}`}>
                          <div className="flex items-center gap-3">
                            <FileText className={`w-5 h-5 ${uploaded ? 'text-success' : 'text-text-secondary/40'}`} />
                            <div>
                              <p className="text-sm font-medium text-text-primary">{docType}</p>
                              {!isApiSession && uploaded && <p className="text-xs text-text-secondary">{uploaded.fileName} &middot; {uploaded.fileSize}</p>}
                            </div>
                          </div>
                          {isApiSession ? (
                            <span className="text-xs text-text-secondary">Not connected</span>
                          ) : uploaded ? (
                            <button onClick={() => removeFile(docType)} className="text-xs text-error hover:underline">Remove</button>
                          ) : (
                            <button onClick={() => addFile(docType)} className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1"><Upload className="w-3 h-3" /> Upload</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {!isApiSession && <p className="text-xs text-text-secondary">Supported formats: {DOCUMENT_FORMAT_LABEL}. Max file size: {DOCUMENT_MAX_SIZE_MB} MB per document.</p>}
                </div>
              )}

              {/* Step 6: Review */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-text-primary mb-2">Review & Submit</h2>
                  <p className="text-sm text-text-secondary mb-4">Review your application before submitting.</p>
                  {[
                    { title: 'Basic Information', step: 0, items: [['Legal Name', formData.legalName], ['Brand Name', formData.brandName], ['Incorporation Date', formData.incorporationDate], ['Type', formData.incorporationType], ['Reg. Number', formData.registrationNumber], ['Email', formData.officialEmail], ['Website', formData.website || '—']] },
                    { title: 'Founder Details', step: 1, items: [['Name', formData.founderName], ['Designation', formData.founderDesignation], ['Email', formData.founderEmail], ['Phone', formData.founderPhone], ['Qualification', formData.founderQualification], ['Co-Founders', formData.coFounders.length > 0 ? formData.coFounders.map(c => c.name).join(', ') : 'None']] },
                    { title: 'AYUSH Classification', step: 2, items: [['Domain', formData.ayushDomain], ['Activities', formData.selectedActivities.join(', ') || '—']] },
                    { title: 'Business Details', step: 3, items: [['Stage', formData.businessStage], ['Target Market', formData.targetMarket], ['Status', formData.operationalStatus || '—'], ['Location', [formData.city, formData.state].filter(Boolean).join(', ') || '—']] },
                    { title: 'Regulatory', step: 4, items: [['Existing Licences', formData.hasExistingLicences === 'yes' ? `Yes — ${formData.licenceDetails}` : 'No'], ['DPIIT Recognized', formData.isDPIITRecognized === 'yes' ? `Yes — ${formData.dpiitNumber}` : 'No']] },
                    { title: 'Documents', step: 5, items: isApiSession ? [['Status', 'Upload is not connected; no files will be attached']] : formData.uploadedFiles.length > 0 ? formData.uploadedFiles.map(f => [f.docType, f.fileName]) : [['Status', 'No documents uploaded yet']] },
                  ].map((section) => (
                    <div key={section.title} className="border border-border-light rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-text-primary text-sm">{section.title}</h3>
                        <button onClick={() => goToStep(section.step)} className="text-xs text-primary hover:underline inline-flex items-center gap-1"><Pencil className="w-3 h-3" /> Edit</button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {section.items.map(([label, value], i) => (
                          <div key={i} className="text-sm"><span className="text-text-secondary">{label}:</span> <span className="font-medium ml-1">{value}</span></div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-border pt-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={formData.declaration} onChange={e => updateField('declaration', e.target.checked)} className="accent-primary mt-1" />
                      <span className="text-sm text-text-secondary">I hereby declare that all information provided is true and accurate to the best of my knowledge. I understand that providing false information may result in rejection of my application.</span>
                    </label>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between card p-4">
          <button onClick={goPrev} disabled={currentStep === 0 || draftLoading} className="btn-ghost inline-flex items-center gap-2 text-sm disabled:opacity-30"><ChevronLeft className="w-4 h-4" /> Previous</button>
          <button onClick={saveDraft} disabled={savingDraft || submitting || startupLoading || draftLoading || Boolean(startupError)} className="btn-secondary text-sm inline-flex items-center gap-2 disabled:opacity-50"><Save className="w-4 h-4" /> {savingDraft ? 'Saving…' : 'Save Draft'}</button>
          {currentStep < STEPS.length - 1 ? (
            <button onClick={goNext} disabled={draftLoading} className="btn-primary inline-flex items-center gap-2 text-sm disabled:opacity-50">Next <ChevronRight className="w-4 h-4" /></button>
          ) : (
            <button onClick={handleSubmit} disabled={!formData.declaration || submitting || savingDraft || startupLoading || draftLoading || Boolean(startupError)} className="btn-primary inline-flex items-center gap-2 text-sm disabled:opacity-50">{submitting ? 'Submitting...' : <><Send className="w-4 h-4" /> Submit Application</>}</button>
          )}
        </div>

        {/* Success Modal */}
        <Modal isOpen={showSuccess} onClose={() => {}} title="" size="sm">
          <div className="text-center py-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
              <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            </motion.div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Application Submitted</h2>
            {isApiSession ? (
              <>
                <p className="text-sm text-text-secondary mb-2">Your application was submitted successfully.</p>
                <p className="text-sm font-semibold text-primary mb-6">Tracking number: {createdApplicationId}</p>
              </>
            ) : (
              <>
                <p className="text-sm text-text-secondary mb-4">Your application was submitted in the local demo. No tracking number has been issued.</p>
                <p className="text-xs text-text-secondary mb-6">The server will provide a tracking number when live application submission is connected.</p>
              </>
            )}
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm">Go to Dashboard</button>
              <button onClick={() => navigate(`/dashboard/applications/${createdApplicationId}`)} className="btn-secondary text-sm">View Application</button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}

