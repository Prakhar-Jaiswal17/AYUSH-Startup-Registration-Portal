import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Target, Users, Globe, Lightbulb, TrendingUp, Shield, ArrowRight } from 'lucide-react';
import PageTransition from '../../layouts/PageTransition';
import { ayushDomains } from '../../data/mockData';

export default function AboutPage() {
  return (
    <PageTransition>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-secondary py-20">
        <div className="page-container text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-bold text-white mb-4">
            About AYUSH Setu
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-lg text-white/80 max-w-2xl mx-auto">
            Bridging the gap between India's traditional medicine startups and the support they need to thrive.
          </motion.p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="page-container">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="card p-8">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-3">Our Mission</h2>
              <p className="text-text-secondary leading-relaxed">
                To simplify and digitize the onboarding process for AYUSH startups, making regulatory compliance
                accessible and transparent. We aim to reduce the administrative burden on entrepreneurs so they can
                focus on innovation in traditional medicine.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="card p-8">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                <Lightbulb className="w-6 h-6 text-accent" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-3">Our Vision</h2>
              <p className="text-text-secondary leading-relaxed">
                A thriving AYUSH startup ecosystem where every innovator has clear, equal access to registration support,
                regulatory guidance, and government resources—powered by digital transformation and inclusive governance.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-16 bg-primary/[0.03]">
        <div className="page-container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="section-title mb-3">The Problem We Solve</h2>
            <p className="section-subtitle mx-auto">AYUSH startups face unique challenges that hinder their growth and innovation.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Globe, title: 'Decentralized Processes', desc: 'Registration procedures are scattered across multiple agencies and portals, causing confusion and delays.' },
              { icon: BookOpen, title: 'Unclear Documentation', desc: 'Startups struggle to understand which documents are required for their specific domain and business type.' },
              { icon: Shield, title: 'Opaque Status Tracking', desc: 'Once applications are submitted, there is little visibility into the review process or expected timelines.' },
              { icon: Users, title: 'Regulatory Complexity', desc: 'Different AYUSH domains have different regulatory requirements that are difficult to navigate independently.' },
              { icon: TrendingUp, title: 'Limited Access to Support', desc: 'Many startups are unaware of government schemes, incubation programs, and resources available to them.' },
              { icon: Target, title: 'Manual Verification', desc: 'Traditional paper-based verification processes create bottlenecks and are prone to errors and delays.' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="card p-6">
                <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center mb-3">
                  <item.icon className="w-5 h-5 text-error" />
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{item.title}</h3>
                <p className="text-sm text-text-secondary">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Objectives */}
      <section className="py-16">
        <div className="page-container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="section-title mb-3">Key Objectives</h2>
          </motion.div>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              'Provide a single digital window for AYUSH startup registration and facilitation.',
              'Deliver domain-specific regulatory guidance through an interactive guidance engine.',
              'Enable transparent, real-time application tracking with detailed status timelines.',
              'Digitize document management with smart verification workflows.',
              'Connect startups with government schemes, resources, and support networks.',
            ].map((obj, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex items-start gap-4 card p-5">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">{i + 1}</span>
                </div>
                <p className="text-text-primary">{obj}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AYUSH Domains */}
      <section className="py-16 bg-primary/[0.03]">
        <div className="page-container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="section-title mb-3">The Five AYUSH Domains</h2>
            <p className="section-subtitle mx-auto">India's rich heritage of traditional medicine systems.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {ayushDomains.map((domain, i) => (
              <motion.div key={domain.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="card p-5 text-center">
                <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: domain.bgColor }}>
                  <span className="text-xl" style={{ color: domain.color }}>●</span>
                </div>
                <h3 className="font-semibold text-text-primary mb-2 text-sm">{domain.name}</h3>
                <p className="text-xs text-text-secondary">{domain.startupCount}+ startups</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="page-container">
          <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-10 text-center">
            <h2 className="text-3xl font-bold text-white mb-3">Join the AYUSH Innovation Movement</h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">Register your AYUSH startup today and access the support you need to grow.</p>
            <Link to="/register" className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}

