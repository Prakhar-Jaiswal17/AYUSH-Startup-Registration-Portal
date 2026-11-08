import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import PageTransition from '../../layouts/PageTransition';
import { ayushDomains, businessActivities, regulatoryRules } from '../../data/mockData';

export default function RegulatoryGuidance() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    domain: '',
    activities: [],
    isManufacturing: '',
    isHealthcare: '',
    isResearch: '',
    hasLicences: '',
    licenceDetails: '',
  });

  const totalSteps = 6;

  const handleDomainSelect = (domainName) => {
    setAnswers(prev => ({ ...prev, domain: domainName }));
  };

  const toggleActivity = (activity) => {
    setAnswers(prev => {
      const exists = prev.activities.includes(activity);
      const updated = exists
        ? prev.activities.filter(a => a !== activity)
        : [...prev.activities, activity];
      return { ...prev, activities: updated };
    });
  };

  const resetForm = () => {
    setStep(1);
    setAnswers({
      domain: '',
      activities: [],
      isManufacturing: '',
      isHealthcare: '',
      isResearch: '',
      hasLicences: '',
      licenceDetails: '',
    });
  };

  // Compile matching guidelines
  const getResults = () => {
    if (!answers.domain) return [];
    const domainData = regulatoryRules[answers.domain] || {};
    const relevantActivities = answers.activities.length > 0 ? answers.activities : Object.keys(domainData);

    return relevantActivities
      .map(act => {
        const rule = domainData[act];
        if (!rule) return null;
        return {
          activity: act,
          ...rule,
        };
      })
      .filter(Boolean);
  };

  const results = getResults();

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Compass className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-text-primary">Regulatory Guidance Engine</h1>
          </div>
          <p className="text-text-secondary text-sm">
            Discover domain-tailored compliance roadmaps, document checklists, and statutory bodies for your AYUSH startup.
          </p>
        </div>

        {/* Disclaimer Banner */}
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed">
            <strong>Advisory Notice:</strong> This guidance engine offers initial directional compliance mapping based on existing AYUSH regulations. It does not replace statutory legal counsel. Confirm all licensing parameters with State Drug Controllers, CDSCO, or the relevant council before product distribution.
          </p>
        </div>

        {/* Wizard / Results Card */}
        <div className="card p-6 md:p-8">
          {step <= totalSteps ? (
            <div>
              {/* Progress Tracker */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Question {step} of {totalSteps}
                </span>
                <span className="text-xs text-text-secondary">
                  {Math.round((step / totalSteps) * 100)}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-8">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                />
              </div>

              {/* Questions Carousel */}
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <h2 className="text-lg font-bold text-text-primary">
                      1. Which AYUSH domain represents your core focus?
                    </h2>
                    <p className="text-sm text-text-secondary">
                      Select one system of traditional medicine under which your solutions are formulated or offered.
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                      {ayushDomains.map(d => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => handleDomainSelect(d.name)}
                          className={`p-4 rounded-xl border text-left transition-all ${answers.domain === d.name
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                              : 'border-border-light hover:border-primary/40 bg-white'
                            }`}
                        >
                          <div
                            className="w-8 h-8 rounded-lg mb-2 flex items-center justify-center text-sm font-bold"
                            style={{ backgroundColor: d.bgColor, color: d.color }}
                          >
                            ●
                          </div>
                          <p className="font-semibold text-text-primary text-sm">{d.name}</p>
                          <p className="text-xs text-text-secondary line-clamp-2 mt-1">{d.description}</p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <h2 className="text-lg font-bold text-text-primary">
                      2. What business operations does your startup conduct?
                    </h2>
                    <p className="text-sm text-text-secondary">
                      Select all business activities that apply. Regulatory obligations vary widely between manufacturing and technology platforms.
                    </p>
                    <div className="flex flex-wrap gap-2.5 pt-2">
                      {businessActivities.map(act => (
                        <button
                          key={act}
                          type="button"
                          onClick={() => toggleActivity(act)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${answers.activities.includes(act)
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'border-border bg-white text-text-secondary hover:border-primary/40'
                            }`}
                        >
                          {act}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <h2 className="text-lg font-bold text-text-primary">
                      3. Does your startup manufacture physical formulations or wellness products?
                    </h2>
                    <p className="text-sm text-text-secondary">
                      Includes pharmaceutical extracts, classical formulations, proprietary Ayurvedic medicines, or nutritional supplements.
                    </p>
                    <div className="flex gap-4 pt-2">
                      {['yes', 'no'].map(v => (
                        <label
                          key={v}
                          className={`flex-1 p-4 rounded-xl border text-center cursor-pointer transition-all ${answers.isManufacturing === v
                              ? 'border-primary bg-primary/5 font-semibold text-primary ring-2 ring-primary/20'
                              : 'border-border bg-white text-text-primary hover:border-gray-300'
                            }`}
                        >
                          <input
                            type="radio"
                            name="isManufacturing"
                            checked={answers.isManufacturing === v}
                            onChange={() => setAnswers(prev => ({ ...prev, isManufacturing: v }))}
                            className="sr-only"
                          />
                          {v === 'yes' ? 'Yes, we manufacture products' : 'No manufacturing'}
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key="step-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <h2 className="text-lg font-bold text-text-primary">
                      4. Does your startup provide clinical consultation or healthcare therapies?
                    </h2>
                    <p className="text-sm text-text-secondary">
                      Includes running wellness retreats, physical OPD clinics, Panchakarma centers, or telemedicine platforms.
                    </p>
                    <div className="flex gap-4 pt-2">
                      {['yes', 'no'].map(v => (
                        <label
                          key={v}
                          className={`flex-1 p-4 rounded-xl border text-center cursor-pointer transition-all ${answers.isHealthcare === v
                              ? 'border-primary bg-primary/5 font-semibold text-primary ring-2 ring-primary/20'
                              : 'border-border bg-white text-text-primary hover:border-gray-300'
                            }`}
                        >
                          <input
                            type="radio"
                            name="isHealthcare"
                            checked={answers.isHealthcare === v}
                            onChange={() => setAnswers(prev => ({ ...prev, isHealthcare: v }))}
                            className="sr-only"
                          />
                          {v === 'yes' ? 'Yes, we offer healthcare services' : 'No clinical therapies'}
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div
                    key="step-5"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <h2 className="text-lg font-bold text-text-primary">
                      5. Does your startup conduct R&D, laboratory testing, or clinical trials?
                    </h2>
                    <p className="text-sm text-text-secondary">
                      Involves drug testing, bio-equivalence evaluations, phytochemical validation, or academic research collaborations.
                    </p>
                    <div className="flex gap-4 pt-2">
                      {['yes', 'no'].map(v => (
                        <label
                          key={v}
                          className={`flex-1 p-4 rounded-xl border text-center cursor-pointer transition-all ${answers.isResearch === v
                              ? 'border-primary bg-primary/5 font-semibold text-primary ring-2 ring-primary/20'
                              : 'border-border bg-white text-text-primary hover:border-gray-300'
                            }`}
                        >
                          <input
                            type="radio"
                            name="isResearch"
                            checked={answers.isResearch === v}
                            onChange={() => setAnswers(prev => ({ ...prev, isResearch: v }))}
                            className="sr-only"
                          />
                          {v === 'yes' ? 'Yes, active R&D pipeline' : 'No research activities'}
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 6 && (
                  <motion.div
                    key="step-6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <h2 className="text-lg font-bold text-text-primary">
                      6. Does your entity already hold any statutory AYUSH licences?
                    </h2>
                    <p className="text-sm text-text-secondary">
                      E.g., Drug Manufacturing Licence (Form 25D), GMP compliance certificate, FSSAI licence, or clinical registrations.
                    </p>
                    <div className="flex gap-4 pt-2">
                      {['yes', 'no'].map(v => (
                        <label
                          key={v}
                          className={`flex-1 p-4 rounded-xl border text-center cursor-pointer transition-all ${answers.hasLicences === v
                              ? 'border-primary bg-primary/5 font-semibold text-primary ring-2 ring-primary/20'
                              : 'border-border bg-white text-text-primary hover:border-gray-300'
                            }`}
                        >
                          <input
                            type="radio"
                            name="hasLicences"
                            checked={answers.hasLicences === v}
                            onChange={() => setAnswers(prev => ({ ...prev, hasLicences: v }))}
                            className="sr-only"
                          />
                          {v === 'yes' ? 'Yes, we have existing licences' : 'No, starting from scratch'}
                        </label>
                      ))}
                    </div>

                    {answers.hasLicences === 'yes' && (
                      <div className="pt-2">
                        <label className="label">Licence / Registration Numbers (Optional)</label>
                        <input
                          type="text"
                          value={answers.licenceDetails}
                          onChange={e => setAnswers(prev => ({ ...prev, licenceDetails: e.target.value }))}
                          placeholder="e.g. MH/AYU/1234, GMP-2024-X"
                          className="input-field"
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-8 border-t border-border-light mt-8">
                <button
                  type="button"
                  onClick={() => setStep(prev => Math.max(1, prev - 1))}
                  disabled={step === 1}
                  className="btn-ghost text-sm inline-flex items-center gap-1.5 disabled:opacity-30"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                {step < totalSteps ? (
                  <button
                    type="button"
                    onClick={() => setStep(prev => prev + 1)}
                    disabled={step === 1 && !answers.domain}
                    className="btn-primary text-sm inline-flex items-center gap-1.5"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep(totalSteps + 1)}
                    className="btn-primary text-sm inline-flex items-center gap-1.5"
                  >
                    Generate Roadmap <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Results Presentation */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border-light">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">
                    Tailored Compliance Roadmap for {answers.domain}
                  </h2>
                  <p className="text-sm text-text-secondary mt-0.5">
                    Based on your startup's operations and operational scope.
                  </p>
                </div>
                <button
                  onClick={resetForm}
                  className="btn-ghost text-xs inline-flex items-center gap-1 self-start"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Start Over
                </button>
              </div>

              {/* Summary Cards */}
              <div className="space-y-5">
                {results.length > 0 ? (
                  results.map((item, idx) => (
                    <motion.div
                      key={item.activity}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="p-5 rounded-xl border border-border-light bg-surface space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary font-bold rounded-lg uppercase tracking-wide">
                          {item.activity}
                        </span>
                        <span className="text-xs text-text-secondary">
                          Governed by: <strong>{item.authority}</strong>
                        </span>
                      </div>

                      {/* Requirements */}
                      <div>
                        <p className="text-xs font-semibold text-text-primary uppercase tracking-wide mb-2">
                          Key Statutory Requirements:
                        </p>
                        <ul className="space-y-1.5">
                          {item.requirements.map((req, rIdx) => (
                            <li key={rIdx} className="text-sm text-text-secondary flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Documents Checklist */}
                      <div>
                        <p className="text-xs font-semibold text-text-primary uppercase tracking-wide mb-2">
                          Required Supporting Documents:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.documents.map((doc, dIdx) => (
                            <span
                              key={dIdx}
                              className="px-2.5 py-1 bg-gray-100 rounded-md text-xs text-text-secondary flex items-center gap-1.5"
                            >
                              <FileText className="w-3 h-3 text-primary" />
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Official Links */}
                      {item.links && item.links.length > 0 && (
                        <div className="pt-2 border-t border-border-light flex flex-wrap gap-3">
                          {item.links.map((link, lIdx) => (
                            <a
                              key={lIdx}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary font-medium inline-flex items-center gap-1 hover:underline"
                            >
                              Official Portal <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="p-6 text-center card bg-gray-50/50">
                    <AlertCircle className="w-8 h-8 text-warning mx-auto mb-2" />
                    <p className="text-sm text-text-secondary">
                      General requirements apply. For novel herbal-tech formulations, consult the Ministry of AYUSH advisory cell.
                    </p>
                  </div>
                )}
              </div>

              {/* Call to action */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-primary to-secondary text-white flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                <div>
                  <h3 className="text-base font-bold">Ready to apply this checklist?</h3>
                  <p className="text-xs text-white/80 mt-0.5">
                    You can start a new application with these parameters pre-arranged.
                  </p>
                </div>
                <Link
                  to="/dashboard/applications/new"
                  className="btn-accent text-sm whitespace-nowrap inline-flex items-center gap-1.5"
                >
                  Start Application <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

