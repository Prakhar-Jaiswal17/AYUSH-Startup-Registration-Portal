-- Clean existing data
TRUNCATE TABLE audit_logs, notifications, clarification_queries, 
               application_status_history, documents, applications, 
               founders, startups, document_types, ayush_categories, users 
CASCADE;

-- ----------------------------------------------------------------------------
-- 1. SEED AYUSH CATEGORIES (Master Data)
-- ----------------------------------------------------------------------------
INSERT INTO ayush_categories (code, name, description, regulatory_authority, is_active) VALUES
('AYURVEDA', 'Ayurveda', 
 'Ancient Indian holistic health science emphasizing equilibrium between Vata, Pitta, and Kapha doshas through natural pharmacopoeia and lifestyle.', 
 'Pharmacopoeia Commission for Indian Medicine & Homoeopathy (PCIM&H)', TRUE),

('YOGA_NATUROPATHY', 'Yoga & Naturopathy', 
 'Drugless, non-invasive therapeutic system combining yogic asanas, pranayama, meditation, hydrotherapy, and natural restorative regimens.', 
 'Central Council for Research in Yoga & Naturopathy (CCRYN)', TRUE),

('UNANI', 'Unani', 
 'Perso-Arabic traditional medical system based on Hippocratic humoral theory (Dam, Balgham, Safra, Sauda) and herbal-mineral pharmacology.', 
 'Central Council for Research in Unani Medicine (CCRUM)', TRUE),

('SIDDHA', 'Siddha', 
 'Dravidian therapeutic system pioneered by Siddhars utilizing plant extracts, mineral-metal calces (Bhasmas), and Kayak Karpam therapeutics.', 
 'Central Council for Research in Siddha (CCRS)', TRUE),

('HOMOEOPATHY', 'Homoeopathy', 
 'Complementary medical system operating on the foundational principle of Similia Similibus Curentur (like cures like) with potentized dilutions.', 
 'National Commission for Homoeopathy (NCH)', TRUE);

-- ----------------------------------------------------------------------------
-- 2. SEED DOCUMENT TYPES (Master Data)
-- ----------------------------------------------------------------------------
INSERT INTO document_types (code, name, category, allowed_formats, max_size_mb, is_mandatory) VALUES
('INCORPORATION_PROOF', 'Certificate of Incorporation / Registration Proof', 'incorporation', '.pdf,.jpg,.png', 5, TRUE),
('PAN_GST_CERT', 'PAN & GST Registration Certificates', 'financial', '.pdf,.jpg,.png', 5, TRUE),
('AYUSH_DRUG_LICENCE', 'AYUSH Drug Manufacturing License (Form 25D)', 'regulatory', '.pdf,.jpg,.png', 5, FALSE),
('LAB_TEST_REPORT', 'Laboratory & Quality Testing Certificate / NABL Report', 'clinical', '.pdf', 10, FALSE),
('CLINICAL_TRIAL_CLEARANCE', 'Clinical Trial Clearance / CTRI Registration Proof', 'clinical', '.pdf', 10, FALSE),
('PITCH_DECK', 'Pitch Deck & Innovation Summary', 'other', '.pdf', 15, FALSE),
('OTHER', 'Other Supplementary Supporting Document', 'other', '.pdf,.jpg,.png', 5, FALSE);

-- ----------------------------------------------------------------------------
-- 3. SEED USERS
-- Valid Bcrypt hash for password 'demo1234': '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'
-- ----------------------------------------------------------------------------
INSERT INTO users (id, email, password_hash, full_name, role, phone, designation, department, assigned_states) VALUES
-- Startup Founders
('a0000000-0000-0000-0000-000000000001', 'startup@ayushsetu.demo', 
 '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 
 'Rajesh Kumar', 'startup', '+91 98765 43210', 'Founder & CEO', NULL, '{}'),

('a0000000-0000-0000-0000-000000000002', 'ananya@yogaflow.demo', 
 '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 
 'Ananya Singh', 'startup', '+91 87654 32109', 'Managing Director', NULL, '{}'),

('a0000000-0000-0000-0000-000000000003', 'dr.tariq@unaniherbs.demo', 
 '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 
 'Dr. Tariq Ahmad', 'startup', '+91 76543 21098', 'Chief Medical Officer', NULL, '{}'),

-- Government Review Officers
('b0000000-0000-0000-0000-000000000001', 'officer@ayushsetu.demo', 
 '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 
 'Dr. Priya Sharma', 'officer', '+91 98765 43211', 'Senior Review Officer', 
 'AYUSH Registration Division', '{"Maharashtra", "Gujarat", "Rajasthan", "Karnataka"}'),

('b0000000-0000-0000-0000-000000000002', 'officer.verma@ayushsetu.demo', 
 '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 
 'Dr. S. K. Verma', 'officer', '+91 98765 43214', 'Technical Evaluation Officer', 
 'Drug Standards & Licensing Cell', '{"Delhi", "Uttar Pradesh", "Madhya Pradesh"}'),

-- System Administrator
('b0000000-0000-0000-0000-000000000003', 'admin@ayushsetu.demo', 
 '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 
 'Amit Verma', 'admin', '+91 98765 43212', 'Platform Administrator', 
 'Ministry of AYUSH IT Infrastructure', '{}');

-- ----------------------------------------------------------------------------
-- 4. SEED STARTUPS
-- ----------------------------------------------------------------------------
INSERT INTO startups (
    id, user_id, legal_name, brand_name, incorporation_date, 
    incorporation_type, registration_number, official_email, website, 
    ayush_domain, business_activities, description, products, 
    business_stage, target_market, operational_status, state, city, 
    dpiit_recognized, dpiit_number, existing_licences
) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
 'VedaCure Wellness Pvt. Ltd.', 'VedaCure', '2024-03-15',
 'Private Limited', 'U85100MH2024PTC123456', 'info@vedacure.example.com', 'https://vedacure.example.com',
 'AYURVEDA', '{"Manufacturing", "Healthcare Services"}',
 'VedaCure is an innovative Ayurvedic healthcare startup developing evidence-based herbal formulations using modern pharmaceutical technology. Our products combine traditional Ayurvedic wisdom with contemporary quality standards.',
 'Standardized Ayurvedic formulations, herbal supplements, and wellness consultation platform',
 'Growth', 'Pan-India, with expansion plans for Southeast Asia', 'Active', 'Maharashtra', 'Pune',
 TRUE, 'DIPP-98234', '{"GMP Certificate", "FSSAI Licence"}'),

('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002',
 'YogaFlow Technologies LLP', 'YogaFlow', '2024-06-01',
 'LLP', 'AAB-1234', 'hello@yogaflow.example.com', 'https://yogaflow.example.com',
 'YOGA_NATUROPATHY', '{"Technology", "Wellness"}',
 'YogaFlow is a digital wellness platform offering AI-powered personalized yoga therapy sessions, connecting certified yoga practitioners with patients seeking alternative therapeutic solutions.',
 'YogaFlow Mobile App, Tele-Yoga Consultation Portal, Posture AI tracker',
 'Early Stage', 'Urban working professionals across Tier-1 cities in India', 'Active', 'Karnataka', 'Bengaluru',
 TRUE, 'DIPP-104921', '{"ISO 27001", "HIPAA Compliance Certificate"}'),

('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003',
 'UnaniBio Remedies Private Limited', 'UnaniBio', '2023-11-20',
 'Private Limited', 'U24233DL2023PTC876543', 'contact@unanibio.example.com', 'https://unanibio.example.com',
 'UNANI', '{"Manufacturing", "R&D"}',
 'UnaniBio specializes in extracting high-potency bio-active compounds from medicinal herbs based on traditional Greco-Arabic pharmacology for metabolic disorder management.',
 'Herbal glycemic control tablets, natural digestive tonics, immuno-modulating syrups',
 'Validation', 'Ayurvedic & Unani specialty clinics in North India and GCC export markets', 'Active', 'Delhi', 'New Delhi',
 FALSE, NULL, '{"State AYUSH Drug License Form 25D"}');

-- ----------------------------------------------------------------------------
-- 5. SEED FOUNDERS
-- ----------------------------------------------------------------------------
INSERT INTO founders (id, startup_id, name, designation, email, phone, qualification, is_primary) VALUES
-- VedaCure Founders
('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 
 'Rajesh Kumar', 'CEO & Founder', 'rajesh@vedacure.example.com', '+91 98765 43210', 'BAMS, MBA Healthcare', TRUE),
('f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 
 'Meera Patel', 'CTO & Co-Founder', 'meera@vedacure.example.com', '+91 98765 43213', 'B.Tech, M.Tech AI', FALSE),

-- YogaFlow Founder
('f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 
 'Ananya Singh', 'Founder & Director', 'ananya@yogaflow.example.com', '+91 87654 32109', 'MSc Yoga Sciences', TRUE),

-- UnaniBio Founder
('f0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003', 
 'Dr. Tariq Ahmad', 'Managing Director', 'tariq@unanibio.example.com', '+91 76543 21098', 'BUMS, PhD Pharmacology', TRUE);

-- ----------------------------------------------------------------------------
-- 6. SEED APPLICATIONS
-- ----------------------------------------------------------------------------
INSERT INTO applications (
    id, startup_id, ayush_domain, status, state, assigned_officer_id, 
    regulatory_details, business_details_snapshot, certificate_number, 
    certificate_issued_at, submitted_at, last_updated
) VALUES
-- 1. Under Review (VedaCure - Current active evaluation)
('APP-2025-001', 'c0000000-0000-0000-0000-000000000001', 'AYURVEDA', 
 'Under Review', 'Maharashtra', 'b0000000-0000-0000-0000-000000000001',
 '{"hasDrugLicence": "yes", "drugLicenceNumber": "MH-AYU-2024-991", "hasManufacturing": "yes", "facilityLocation": "MIDC Bhosari, Pune", "hasClinicalApproval": "yes", "clinicalDetails": "Phase II completed with AIIA pilot"}'::jsonb,
 '{"brandName": "VedaCure", "businessStage": "Growth", "legalName": "VedaCure Wellness Pvt. Ltd."}'::jsonb,
 NULL, NULL, '2025-09-01 10:30:00+05:30', '2025-09-15 14:00:00+05:30'),

-- 2. Clarification Required (YogaFlow - Discrepancy flagged)
('APP-2025-002', 'c0000000-0000-0000-0000-000000000002', 'YOGA_NATUROPATHY', 
 'Clarification Required', 'Karnataka', 'b0000000-0000-0000-0000-000000000001',
 '{"hasClinicalEstablishment": "yes", "practitionerCount": "12", "researchType": "Digital Health / AI Posture Tracking"}'::jsonb,
 '{"brandName": "YogaFlow", "businessStage": "Early Stage", "legalName": "YogaFlow Technologies LLP"}'::jsonb,
 NULL, NULL, '2025-08-20 11:00:00+05:30', '2025-09-12 16:00:00+05:30'),

-- 3. Approved (VedaCure - Prior completed registration)
('APP-2025-003', 'c0000000-0000-0000-0000-000000000001', 'AYURVEDA', 
 'Approved', 'Maharashtra', 'b0000000-0000-0000-0000-000000000001',
 '{"hasDrugLicence": "yes", "drugLicenceNumber": "MH-AYU-2023-412"}'::jsonb,
 '{"brandName": "VedaCure Herbal Drops", "businessStage": "Validation"}'::jsonb,
 'AYUSH-REG-2025-0012', '2025-07-28 15:30:00+05:30', '2025-06-15 09:00:00+05:30', '2025-07-28 15:30:00+05:30'),

-- 4. Submitted (UnaniBio - Freshly submitted in reviewer pool)
('APP-2025-004', 'c0000000-0000-0000-0000-000000000003', 'UNANI', 
 'Submitted', 'Delhi', NULL,
 '{"hasDrugLicence": "yes", "drugLicenceNumber": "DL-UNANI-2024-55"}'::jsonb,
 '{"brandName": "UnaniBio", "businessStage": "Validation"}'::jsonb,
 NULL, NULL, '2025-10-01 12:00:00+05:30', '2025-10-01 12:00:00+05:30'),

-- 5. Draft (YogaFlow - Unsubmitted new initiative)
('APP-2025-005', 'c0000000-0000-0000-0000-000000000002', 'YOGA_NATUROPATHY', 
 'Draft', 'Karnataka', NULL,
 '{"researchType": "Naturopathy Telehealth"}'::jsonb,
 '{"brandName": "YogaFlow Clinic"}'::jsonb,
 NULL, NULL, NULL, '2025-10-05 14:15:00+05:30'),

-- 6. Rejected (UnaniBio - Non-compliant trial submission)
('APP-2025-006', 'c0000000-0000-0000-0000-000000000003', 'UNANI', 
 'Rejected', 'Delhi', 'b0000000-0000-0000-0000-000000000002',
 '{"hasDrugLicence": "no"}'::jsonb,
 '{"brandName": "Unani Cure Fast"}'::jsonb,
 NULL, NULL, '2025-05-10 10:00:00+05:30', '2025-05-25 17:00:00+05:30');

-- ----------------------------------------------------------------------------
-- 7. SEED DOCUMENTS
-- ----------------------------------------------------------------------------
INSERT INTO documents (
    id, application_id, startup_id, document_type_code, name, 
    file_name, file_url, file_size, mime_type, status, remark, 
    verified_by_id, verified_at, uploaded_at
) VALUES
-- Documents for APP-2025-001 (Under Review)
('d0000000-0000-0000-0000-000000000001', 'APP-2025-001', 'c0000000-0000-0000-0000-000000000001',
 'INCORPORATION_PROOF', 'Certificate of Incorporation', 'vedacure_incorporation_cert.pdf',
 'https://storage.ayushportal.gov.in/docs/vedacure_inc.pdf', '2.4 MB', 'application/pdf',
 'Verified', 'MCA verification confirmed via portal integration', 'b0000000-0000-0000-0000-000000000001', 
 '2025-09-11 11:30:00+05:30', '2025-09-01 10:15:00+05:30'),

('d0000000-0000-0000-0000-000000000002', 'APP-2025-001', 'c0000000-0000-0000-0000-000000000001',
 'PAN_GST_CERT', 'PAN & GST Certificates', 'vedacure_tax_docs.pdf',
 'https://storage.ayushportal.gov.in/docs/vedacure_tax.pdf', '1.1 MB', 'application/pdf',
 'Verified', 'GSTIN 27AABCV1234F1Z5 active and verified', 'b0000000-0000-0000-0000-000000000001',
 '2025-09-11 11:45:00+05:30', '2025-09-01 10:18:00+05:30'),

('d0000000-0000-0000-0000-000000000003', 'APP-2025-001', 'c0000000-0000-0000-0000-000000000001',
 'AYUSH_DRUG_LICENCE', 'Manufacturing License (Form 25D)', 'vedacure_drug_licence.pdf',
 'https://storage.ayushportal.gov.in/docs/vedacure_licence.pdf', '3.8 MB', 'application/pdf',
 'Pending Verification', NULL, NULL, NULL, '2025-09-01 10:20:00+05:30'),

('d0000000-0000-0000-0000-000000000004', 'APP-2025-001', 'c0000000-0000-0000-0000-000000000001',
 'LAB_TEST_REPORT', 'NABL Heavy Metal Analysis Report', 'vedacure_lab_report.pdf',
 'https://storage.ayushportal.gov.in/docs/vedacure_lab.pdf', '4.2 MB', 'application/pdf',
 'Pending Verification', NULL, NULL, NULL, '2025-09-01 10:22:00+05:30'),

-- Documents for APP-2025-002 (Clarification Required)
('d0000000-0000-0000-0000-000000000005', 'APP-2025-002', 'c0000000-0000-0000-0000-000000000002',
 'INCORPORATION_PROOF', 'LLP Agreement & Incorporation Certificate', 'yogaflow_llp_agreement.pdf',
 'https://storage.ayushportal.gov.in/docs/yogaflow_inc.pdf', '1.9 MB', 'application/pdf',
 'Verified', 'Verified with RoC Bengaluru records', 'b0000000-0000-0000-0000-000000000001',
 '2025-09-05 14:00:00+05:30', '2025-08-20 10:45:00+05:30'),

('d0000000-0000-0000-0000-000000000006', 'APP-2025-002', 'c0000000-0000-0000-0000-000000000002',
 'PITCH_DECK', 'Clinical AI Validation Deck', 'yogaflow_deck.pdf',
 'https://storage.ayushportal.gov.in/docs/yogaflow_deck.pdf', '5.5 MB', 'application/pdf',
 'Rejected', 'Document flagged: Lacks published clinical methodology or ethical board review clearance.', 
 'b0000000-0000-0000-0000-000000000001', '2025-09-12 16:00:00+05:30', '2025-08-20 10:50:00+05:30');

-- ----------------------------------------------------------------------------
-- 8. SEED APPLICATION STATUS HISTORY (Timeline)
-- ----------------------------------------------------------------------------
INSERT INTO application_status_history (
    application_id, previous_status, status, remark, officer_name, actor_id, created_at
) VALUES
-- APP-2025-001 Timeline
('APP-2025-001', NULL, 'Draft', 'Application draft initialized by founder', 'System', 
 'a0000000-0000-0000-0000-000000000001', '2025-08-25 10:00:00+05:30'),
('APP-2025-001', 'Draft', 'Submitted', 'Application submitted with 4 attached compliance files', 'Rajesh Kumar', 
 'a0000000-0000-0000-0000-000000000001', '2025-09-01 10:30:00+05:30'),
('APP-2025-001', 'Submitted', 'Under Review', 'Assigned to Senior Review Officer for regulatory due diligence', 'Dr. Priya Sharma', 
 'b0000000-0000-0000-0000-000000000001', '2025-09-10 09:00:00+05:30'),

-- APP-2025-002 Timeline
('APP-2025-002', NULL, 'Draft', 'Application draft created by director', 'System', 
 'a0000000-0000-0000-0000-000000000002', '2025-08-15 10:00:00+05:30'),
('APP-2025-002', 'Draft', 'Submitted', 'Application submitted for Yoga & Naturopathy category', 'Ananya Singh', 
 'a0000000-0000-0000-0000-000000000002', '2025-08-20 11:00:00+05:30'),
('APP-2025-002', 'Submitted', 'Under Review', 'Assigned to Dr. Priya Sharma for scrutiny', 'Dr. Priya Sharma', 
 'b0000000-0000-0000-0000-000000000001', '2025-08-28 09:00:00+05:30'),
('APP-2025-002', 'Under Review', 'Clarification Required', 
 'Please provide updated business plan with financial projections and clarify clinical validation methodology for AI-powered yoga therapy claims.', 
 'Dr. Priya Sharma', 'b0000000-0000-0000-0000-000000000001', '2025-09-12 16:00:00+05:30'),

-- APP-2025-003 Timeline (Approved)
('APP-2025-003', NULL, 'Draft', 'Application draft created', 'System', 
 'a0000000-0000-0000-0000-000000000001', '2025-06-01 10:00:00+05:30'),
('APP-2025-003', 'Draft', 'Submitted', 'Application submitted with documentation', 'Rajesh Kumar', 
 'a0000000-0000-0000-0000-000000000001', '2025-06-15 09:00:00+05:30'),
('APP-2025-003', 'Submitted', 'Under Review', 'Review started by AYUSH committee', 'Dr. Priya Sharma', 
 'b0000000-0000-0000-0000-000000000001', '2025-06-25 11:00:00+05:30'),
('APP-2025-003', 'Under Review', 'Approved', 'Full statutory compliance verified. AYUSH Startup Certificate issued.', 'Dr. Priya Sharma', 
 'b0000000-0000-0000-0000-000000000001', '2025-07-28 15:30:00+05:30');

-- ----------------------------------------------------------------------------
-- 9. SEED CLARIFICATION QUERIES
-- ----------------------------------------------------------------------------
INSERT INTO clarification_queries (
    id, application_id, officer_id, query_text, response_text, status, created_at, resolved_at
) VALUES
('e0000000-0000-0000-0000-000000000001', 'APP-2025-002', 'b0000000-0000-0000-0000-000000000001',
 'Please provide updated business plan with financial projections and clarify the clinical validation methodology for the AI-powered yoga therapy claims.',
 NULL, 'Pending', '2025-09-12 16:00:00+05:30', NULL);

-- ----------------------------------------------------------------------------
-- 10. SEED NOTIFICATIONS
-- ----------------------------------------------------------------------------
INSERT INTO notifications (user_id, title, message, type, application_id, is_read, created_at) VALUES
('a0000000-0000-0000-0000-000000000001', 'Application Under Review', 
 'Your application APP-2025-001 has been assigned to Senior Review Officer Dr. Priya Sharma.', 
 'status_update', 'APP-2025-001', TRUE, '2025-09-10 09:05:00+05:30'),

('a0000000-0000-0000-0000-000000000002', 'Action Required: Clarification Requested', 
 'Reviewer Dr. Priya Sharma has requested clarification on application APP-2025-002. Please review feedback in your dashboard.', 
 'clarification', 'APP-2025-002', FALSE, '2025-09-12 16:05:00+05:30'),

('a0000000-0000-0000-0000-000000000001', 'Certificate Issued: APP-2025-003', 
 'Congratulations! Application APP-2025-003 has been approved. Certificate AYUSH-REG-2025-0012 is available for download.', 
 'status_update', 'APP-2025-003', TRUE, '2025-07-28 15:35:00+05:30'),

('b0000000-0000-0000-0000-000000000001', 'New Application Submitted', 
 'A new application APP-2025-004 from UnaniBio Remedies has been submitted for evaluation.', 
 'system', 'APP-2025-004', FALSE, '2025-10-01 12:05:00+05:30');

-- ----------------------------------------------------------------------------
-- 11. SEED AUDIT LOGS
-- ----------------------------------------------------------------------------
INSERT INTO audit_logs (
    actor_id, actor_name, actor_role, action, target_entity, target_id, details, ip_address, created_at
) VALUES
('a0000000-0000-0000-0000-000000000001', 'Rajesh Kumar', 'startup', 
 'Application Submitted', 'Application', 'APP-2025-001', 
 'Founder submitted application with 4 attached regulatory files', '103.21.124.5', '2025-09-01 10:30:00+05:30'),

('b0000000-0000-0000-0000-000000000001', 'Dr. Priya Sharma', 'officer', 
 'Application Assigned', 'Application', 'APP-2025-001', 
 'Senior Review Officer claimed application for review', '14.139.122.18', '2025-09-10 09:00:00+05:30'),

('b0000000-0000-0000-0000-000000000001', 'Dr. Priya Sharma', 'officer', 
 'Document Verified', 'Document', 'd0000000-0000-0000-0000-000000000001', 
 'Verified Certificate of Incorporation with MCA portal records', '14.139.122.18', '2025-09-11 11:30:00+05:30'),

('b0000000-0000-0000-0000-000000000001', 'Dr. Priya Sharma', 'officer', 
 'Clarification Raised', 'Application', 'APP-2025-002', 
 'Flagged missing clinical methodology details in pitch deck', '14.139.122.18', '2025-09-12 16:00:00+05:30'),

('b0000000-0000-0000-0000-000000000001', 'Dr. Priya Sharma', 'officer', 
 'Application Approved', 'Application', 'APP-2025-003', 
 'Application approved; certificate AYUSH-REG-2025-0012 generated', '14.139.122.18', '2025-07-28 15:30:00+05:30'),

('b0000000-0000-0000-0000-000000000003', 'Amit Verma', 'admin', 
 'Officer Role Provisioned', 'User', 'b0000000-0000-0000-0000-000000000002', 
 'Created and activated reviewer account for Dr. S. K. Verma', '10.0.4.12', '2025-01-15 10:00:00+05:30');
