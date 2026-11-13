import { motion } from 'framer-motion';
import { Building2, User, Briefcase, MapPin, Shield, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PageTransition from '../../layouts/PageTransition';
import { Link } from 'react-router-dom';
import { getCategoryLabel, getStartupFounders } from '../../utils/applicationMappers';

function InfoRow({ label, value }) {
  return (
    <div className="py-2">
      <p className="text-xs text-text-secondary uppercase tracking-wide">{label}</p>
      <p className="text-sm text-text-primary mt-0.5 font-medium">{value || '—'}</p>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-text-primary">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

export default function StartupProfile() {
  const { startup, user, isApiSession, startupLoading, startupError, refreshStartupProfile } = useAuth();

  if (startupLoading && isApiSession) {
    return <PageTransition><div role="status" className="card p-10 text-center text-sm text-text-secondary">Loading your startup profile…</div></PageTransition>;
  }

  if (startupError && isApiSession) {
    return (
      <PageTransition>
        <div className="card p-8 text-center max-w-xl mx-auto">
          <h1 className="text-xl font-bold text-text-primary mb-2">Unable to Load Profile</h1>
          <p role="alert" className="text-sm text-error mb-5">{startupError}</p>
          <button onClick={() => refreshStartupProfile().catch(() => {})} className="btn-secondary inline-flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Retry</button>
        </div>
      </PageTransition>
    );
  }

  if (!startup) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="card p-10 text-center max-w-md">
            <Building2 className="w-12 h-12 text-primary/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-text-primary mb-2">Complete Your Startup Profile</h2>
            <p className="text-text-secondary text-sm mb-6">
              Start an application to create your startup profile on AYUSH Setu.
            </p>
            <Link to="/dashboard/applications/new" className="btn-primary inline-flex items-center gap-2">Get Started</Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  const founders = getStartupFounders(startup);
  const primaryFounder = founders.find((founder) => founder.isPrimary) || founders[0];
  const coFounders = founders.filter((founder) => founder !== primaryFounder);
  const fields = [
    { label: 'Legal Name', value: startup.legalName },
    { label: 'Brand Name', value: startup.brandName },
    { label: 'Incorporation Date', value: startup.incorporationDate ? String(startup.incorporationDate).slice(0, 10) : '' },
    { label: 'Incorporation Type', value: startup.incorporationType },
    { label: 'Registration Number', value: startup.registrationNumber },
    { label: 'Website', value: startup.website },
    { label: 'Official Email', value: startup.officialEmail || startup.email },
  ];
  const completedFields = fields.filter((field) => field.value).length
    + (primaryFounder ? 5 : 0)
    + (startup.ayushDomain ? 1 : 0)
    + (startup.description ? 1 : 0)
    + (startup.state ? 1 : 0);
  const totalFields = fields.length + 5 + 1 + 1 + 1;
  const completionPct = Math.round((completedFields / totalFields) * 100);
  const activities = startup.businessActivities || startup.businessActivity || [];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Startup Profile</h1>
            <p className="text-text-secondary text-sm mt-1">{startup.brandName || startup.legalName || user?.email}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-secondary mb-1">Profile Completion</p>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-100 rounded-full h-2"><div className="h-2 bg-primary rounded-full" style={{ width: `${completionPct}%` }} /></div>
              <span className="text-sm font-medium text-primary">{completionPct}%</span>
            </div>
          </div>
        </div>

        <Section title="Company Information" icon={Building2}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6">{fields.map((field) => <InfoRow key={field.label} label={field.label} value={field.value} />)}</div>
        </Section>

        <Section title="Founder Details" icon={User}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
            <InfoRow label="Name" value={primaryFounder?.name} />
            <InfoRow label="Designation" value={primaryFounder?.designation} />
            <InfoRow label="Email" value={primaryFounder?.email} />
            <InfoRow label="Phone" value={primaryFounder?.phone} />
            <InfoRow label="Qualification" value={primaryFounder?.qualification} />
          </div>
          {coFounders.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border-light">
              <h3 className="text-sm font-medium text-text-secondary mb-3">Co-Founders</h3>
              {coFounders.map((founder, index) => (
                <div key={founder.id || founder.email || index} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 mb-2">
                  <InfoRow label="Name" value={founder.name} />
                  <InfoRow label="Designation" value={founder.designation} />
                  <InfoRow label="Email" value={founder.email} />
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="AYUSH Classification" icon={Briefcase}>
          <div className="grid sm:grid-cols-2 gap-x-6">
            <InfoRow label="AYUSH Domain" value={getCategoryLabel(startup.ayushDomain)} />
            <InfoRow label="Business Activities" value={activities.join(', ')} />
          </div>
        </Section>

        <Section title="Business Details" icon={MapPin}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
            <div className="sm:col-span-2 lg:col-span-3"><InfoRow label="Description" value={startup.description} /></div>
            <InfoRow label="Products / Services" value={startup.products} />
            <InfoRow label="Business Stage" value={startup.businessStage} />
            <InfoRow label="Target Market" value={startup.targetMarket} />
            <InfoRow label="Operational Status" value={startup.operationalStatus} />
            <InfoRow label="State" value={startup.state} />
            <InfoRow label="City" value={startup.city} />
          </div>
        </Section>

        <Section title="Regulatory Information" icon={Shield}>
          <div className="grid sm:grid-cols-2 gap-x-6">
            <InfoRow label="DPIIT Recognized" value={startup.dpiitRecognized ? 'Yes' : 'No'} />
            <InfoRow label="DPIIT Number" value={startup.dpiitNumber} />
            <InfoRow label="Existing Licences" value={startup.existingLicences?.join(', ') || 'None'} />
          </div>
        </Section>
      </div>
    </PageTransition>
  );
}
