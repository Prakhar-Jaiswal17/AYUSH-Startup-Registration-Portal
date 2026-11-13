import { getStatusLabel } from './statusHelpers';

const CATEGORY_CODE_BY_LABEL = {
  Ayurveda: 'AYURVEDA',
  'Yoga & Naturopathy': 'YOGA_NATUROPATHY',
  Unani: 'UNANI',
  Siddha: 'SIDDHA',
  Homoeopathy: 'HOMOEOPATHY',
};

const CATEGORY_LABEL_BY_CODE = Object.fromEntries(
  Object.entries(CATEGORY_CODE_BY_LABEL).map(([label, code]) => [code, label]),
);

const DOCUMENT_STATUS_LABELS = {
  UPLOADED: 'Uploaded',
  PENDING_VERIFICATION: 'Pending Verification',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
};

export function getCategoryCode(category) {
  if (!category) return '';
  return CATEGORY_CODE_BY_LABEL[category] || category.toUpperCase();
}

export function getCategoryLabel(categoryCode) {
  return CATEGORY_LABEL_BY_CODE[categoryCode] || categoryCode || '';
}

export function getStartupFounders(startup) {
  if (Array.isArray(startup?.founders)) return startup.founders;
  return [startup?.founder, ...(startup?.coFounders || [])].filter(Boolean);
}

export function startupToApplicationForm(startup) {
  if (!startup) return {};
  const founders = getStartupFounders(startup);
  const primaryFounder = founders.find((founder) => founder.isPrimary) || founders[0] || {};
  const category = startup.ayushDomain;

  return {
    legalName: startup.legalName || '',
    brandName: startup.brandName || '',
    incorporationDate: startup.incorporationDate ? String(startup.incorporationDate).slice(0, 10) : '',
    incorporationType: startup.incorporationType || '',
    registrationNumber: startup.registrationNumber || '',
    website: startup.website || '',
    officialEmail: startup.officialEmail || startup.email || '',
    founderName: primaryFounder.name || '',
    founderDesignation: primaryFounder.designation || '',
    founderEmail: primaryFounder.email || '',
    founderPhone: primaryFounder.phone || '',
    founderQualification: primaryFounder.qualification || '',
    coFounders: founders.filter((founder) => founder !== primaryFounder).map((founder) => ({
      name: founder.name || '',
      designation: founder.designation || '',
      email: founder.email || '',
      phone: founder.phone || '',
      qualification: founder.qualification || '',
    })),
    ayushDomain: getCategoryLabel(category),
    selectedActivities: startup.businessActivities || startup.businessActivity || [],
    description: startup.description || '',
    products: startup.products || '',
    businessStage: startup.businessStage || '',
    targetMarket: startup.targetMarket || '',
    operationalStatus: startup.operationalStatus || '',
    state: startup.state || '',
    city: startup.city || '',
    isDPIITRecognized: startup.dpiitRecognized ? 'yes' : 'no',
    dpiitNumber: startup.dpiitNumber || '',
    hasExistingLicences: startup.existingLicences?.length ? 'yes' : 'no',
    licenceDetails: startup.existingLicences?.join(', ') || '',
  };
}

export function applicationToForm(application, startup) {
  const profile = startup || application?.startup || {};
  const form = startupToApplicationForm(profile);
  const founders = application?.founders || [];
  const primaryFounder = founders.find((founder) => founder.isPrimary) || founders[0];
  const regulatory = application?.regulatoryInfo || {};
  const business = application?.businessInfo || {};

  return {
    ...form,
    legalName: profile.legalName || application?.startup?.legalName || form.legalName || '',
    brandName: profile.brandName || application?.startup?.brandName || form.brandName || '',
    ayushDomain: getCategoryLabel(application?.categoryCode || application?.category?.code || profile.ayushDomain),
    state: application?.state || profile.state || '',
    founderName: primaryFounder?.name || form.founderName || '',
    founderDesignation: primaryFounder?.designation || form.founderDesignation || '',
    founderEmail: primaryFounder?.email || form.founderEmail || '',
    founderPhone: primaryFounder?.phone || form.founderPhone || '',
    founderQualification: primaryFounder?.qualification || form.founderQualification || '',
    coFounders: founders.filter((founder) => founder !== primaryFounder).map((founder) => ({
      name: founder.name || '',
      designation: founder.designation || '',
      email: founder.email || '',
      phone: founder.phone || '',
      qualification: founder.qualification || '',
    })),
    selectedActivities: profile.businessActivities || form.selectedActivities || [],
    description: profile.description || '',
    products: profile.products || '',
    businessStage: profile.businessStage || '',
    targetMarket: profile.targetMarket || '',
    operationalStatus: profile.operationalStatus || '',
    city: profile.city || '',
    isDPIITRecognized: regulatory.isDPIITRecognized !== undefined
      ? (regulatory.isDPIITRecognized ? 'yes' : 'no')
      : (profile.dpiitRecognized ? 'yes' : 'no'),
    dpiitNumber: regulatory.dpiitNumber || profile.dpiitNumber || '',
    hasExistingLicences: regulatory.hasExistingLicences || (profile.existingLicences?.length ? 'yes' : 'no'),
    licenceDetails: regulatory.licenceDetails || profile.existingLicences?.join(', ') || '',
    hasDrugLicence: regulatory.hasDrugLicence || '',
    drugLicenceNumber: regulatory.drugLicenceNumber || '',
    hasClinicalApproval: regulatory.hasClinicalApproval || '',
    clinicalDetails: regulatory.clinicalDetails || '',
    hasOtherRegistrations: regulatory.hasOtherRegistrations || '',
    otherDetails: regulatory.otherDetails || '',
    hasManufacturing: business.hasManufacturing || '',
    facilityLocation: business.facilityLocation || '',
    hasClinicalEstablishment: business.hasClinicalEstablishment || '',
    practitionerCount: business.practitionerCount || '',
    researchType: business.researchType || '',
    uploadedFiles: [],
    declaration: false,
  };
}

function parseFounder(founder, isPrimary, label) {
  const normalized = {
    name: founder.name?.trim() || '',
    designation: founder.designation?.trim() || '',
    email: founder.email?.trim() || '',
    phone: founder.phone?.trim() || '',
    qualification: founder.qualification?.trim() || '',
  };
  const hasAnyValue = Object.values(normalized).some(Boolean);
  if (!hasAnyValue) return null;

  const missing = Object.entries(normalized).filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) throw new Error(`${label} needs ${missing.join(', ')} before the draft can be saved.`);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
    throw new Error(`${label} must have a valid email address.`);
  }

  return { ...normalized, isPrimary };
}

function nonEmptyStrings(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => typeof item !== 'string' || item.trim() !== '')
      .map(([key, item]) => [key, typeof item === 'string' ? item.trim() : item]),
  );
}

export function applicationFormToPayload(formData, { hasStartupProfile = false, requireFounder = false } = {}) {
  const categoryCode = getCategoryCode(formData.ayushDomain);
  const founders = [
    parseFounder({
      name: formData.founderName,
      designation: formData.founderDesignation,
      email: formData.founderEmail,
      phone: formData.founderPhone,
      qualification: formData.founderQualification,
    }, true, 'Primary founder'),
    ...(formData.coFounders || []).map((founder, index) => parseFounder(founder, false, `Co-founder ${index + 1}`)),
  ].filter(Boolean);

  if (requireFounder && !founders.length) {
    throw new Error('Add at least one complete founder before submitting the application.');
  }
  if (!categoryCode) throw new Error('Select an AYUSH domain before saving the application.');

  const dpiitRecognized = formData.isDPIITRecognized === 'yes';
  const licences = formData.hasExistingLicences === 'yes'
    ? (formData.licenceDetails || '').split(/[,;\n]/).map((licence) => licence.trim()).filter(Boolean)
    : [];

  const startupDetails = nonEmptyStrings({
    legalName: formData.legalName,
    brandName: formData.brandName,
    incorporationDate: formData.incorporationDate || null,
    incorporationType: formData.incorporationType,
    registrationNumber: formData.registrationNumber,
    officialEmail: formData.officialEmail,
    website: formData.website,
    description: formData.description,
    products: formData.products,
    businessStage: formData.businessStage,
    targetMarket: formData.targetMarket,
    operationalStatus: formData.operationalStatus,
    state: formData.state,
    city: formData.city,
    dpiitNumber: dpiitRecognized ? formData.dpiitNumber : '',
  });
  startupDetails.ayushDomain = categoryCode;
  startupDetails.dpiitRecognized = dpiitRecognized;
  startupDetails.businessActivities = formData.selectedActivities || [];
  startupDetails.existingLicences = licences;

  return {
    categoryCode,
    state: formData.state,
    startupDetails,
    ...(founders.length ? { founders } : (!hasStartupProfile ? { founders: [] } : {})),
    regulatoryInfo: {
      hasExistingLicences: formData.hasExistingLicences,
      licenceDetails: formData.licenceDetails,
      hasDrugLicence: formData.hasDrugLicence,
      drugLicenceNumber: formData.drugLicenceNumber,
      hasClinicalApproval: formData.hasClinicalApproval,
      clinicalDetails: formData.clinicalDetails,
      isDPIITRecognized: dpiitRecognized,
      dpiitNumber: formData.dpiitNumber,
      hasOtherRegistrations: formData.hasOtherRegistrations,
      otherDetails: formData.otherDetails,
    },
    businessInfo: {
      hasManufacturing: formData.hasManufacturing,
      facilityLocation: formData.facilityLocation,
      hasClinicalEstablishment: formData.hasClinicalEstablishment,
      practitionerCount: formData.practitionerCount,
      researchType: formData.researchType,
    },
  };
}

export function applicationDtoToView(application) {
  const timeline = (application.statusHistory || []).map((event) => ({
    status: getStatusLabel(event.status),
    date: event.createdAt,
    remark: event.remark,
    officer: event.changedBy?.name,
  }));
  const documents = (application.documents || []).map((document) => ({
    ...document,
    name: (document.documentTypeCode || 'Supporting document').replaceAll('_', ' '),
    status: DOCUMENT_STATUS_LABELS[document.status] || document.status,
  }));

  return {
    ...application,
    startupId: application.startup?.id,
    startupName: application.startup?.legalName,
    brandName: application.startup?.brandName,
    ayushDomain: application.category?.name || getCategoryLabel(application.categoryCode),
    status: getStatusLabel(application.status),
    timeline,
    documents,
  };
}
