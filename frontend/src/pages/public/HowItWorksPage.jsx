import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  ClipboardList,
  FileUp,
  BarChart3,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import PageTransition from '../../layouts/PageTransition';

const steps = [
  {
    number: 1,
    title: 'Create Your Account',
    icon: UserPlus,
    description:
      'Sign up with your email and basic details. It takes less than 2 minutes. You will receive a verification email to activate your account and get started with the registration process.',
    color: 'bg-primary',
  },
  {
    number: 2,
    title: 'Complete Startup Registration',
    icon: ClipboardList,
    description:
      'Fill in your startup details through our guided registration wizard. Provide information about your AYUSH domain, business activity, and team. The multi-step wizard saves your progress so you can return at any time.',
    color: 'bg-accent',
  },
  {
    number: 3,
    title: 'Submit Required Documents',
    icon: FileUp,
    description:
      "Upload necessary documents based on your domain and business type. Our smart checklist ensures you don't miss anything. Supported formats include PDF, JPEG, and PNG with a maximum file size of 10 MB per document.",
    color: 'bg-secondary',
  },
  {
    number: 4,
    title: 'Track Your Application',
    icon: BarChart3,
    description:
      'Monitor your application in real-time. Receive notifications at every stage and respond to any clarification requests directly through the platform. The typical review cycle is 15–30 working days.',
    color: 'bg-primary',
  },
];

const tips = [
  {
    title: 'Prepare Documents in Advance',
    description:
      'Have all incorporation certificates, PAN, licences, and founder ID proofs ready in PDF format before you start the registration.',
  },
  {
    title: 'Use Accurate Information',
    description:
      'Ensure all details match your official documents. Discrepancies may delay the review process or result in clarification requests.',
  },
  {
    title: 'Choose the Right AYUSH Domain',
    description:
      'Select the AYUSH domain that best represents your primary business activity. This determines the document checklist and regulatory requirements.',
  },
  {
    title: 'Save Progress Regularly',
    description:
      "The registration wizard supports draft saving. Save your progress at each step so you don't lose any entered information.",
  },
  {
    title: 'Respond to Clarifications Promptly',
    description:
      'If a reviewing officer requests additional information, respond quickly to avoid delays. You can reply directly from your dashboard.',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function HowItWorksPage() {
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
            How It Works
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto"
          >
            From sign-up to approval — a simple, guided journey to register your AYUSH startup on the platform.
          </motion.p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="relative"
          >
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  variants={itemVariants}
                  className="relative flex gap-6 md:gap-10 mb-12 last:mb-0"
                >
                  {/* Vertical connecting line */}
                  <div className="hidden md:flex flex-col items-center">
                    <div
                      className={`w-14 h-14 rounded-full ${step.color} flex items-center justify-center text-white text-xl font-bold shrink-0 z-10 shadow-lg`}
                    >
                      {step.number}
                    </div>
                    {index < steps.length - 1 && (
                      <div className="w-0.5 flex-1 bg-border mt-2" />
                    )}
                  </div>

                  {/* Mobile number badge */}
                  <div
                    className={`md:hidden w-10 h-10 rounded-full ${step.color} flex items-center justify-center text-white text-sm font-bold shrink-0 mt-1`}
                  >
                    {step.number}
                  </div>

                  {/* Card */}
                  <div className="card flex-1 p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg ${step.color}/10 flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-text-primary">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-text-secondary leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Registration Tips */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Lightbulb className="w-4 h-4" />
              Helpful Advice
            </div>
            <h2 className="text-3xl font-bold text-text-primary">
              Registration Tips
            </h2>
            <p className="text-text-secondary mt-2 max-w-xl mx-auto">
              Follow these recommendations to ensure a smooth and quick registration experience.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {tips.map((tip, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="card-hover p-6"
              >
                <div className="flex items-start gap-3 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <h4 className="font-semibold text-text-primary">
                    {tip.title}
                  </h4>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed pl-8">
                  {tip.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center bg-gradient-to-br from-primary to-secondary rounded-2xl p-10 md:p-14 shadow-xl"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to begin?
          </h2>
          <p className="text-white/80 mb-8 text-lg max-w-lg mx-auto">
            Join hundreds of AYUSH startups already on the platform. Create your account and start your registration today.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors shadow-lg"
          >
            Register Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>
    </PageTransition>
  );
}
