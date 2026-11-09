

-- ============================================================================
-- SECTION 1: BASIC CRUD OPERATIONS
-- ============================================================================

-- 1.1 SELECT: Fetch all active startups registered under Ayurveda or Yoga
SELECT 
    id, 
    legal_name, 
    brand_name, 
    ayush_domain, 
    state, 
    dpiit_recognized
FROM startups
WHERE ayush_domain IN ('AYURVEDA', 'YOGA_NATUROPATHY')
  AND operational_status = 'Active';

-- 1.2 INSERT: Create a new draft application for an existing startup
INSERT INTO applications (
    id, startup_id, ayush_domain, status, state, regulatory_details
) VALUES (
    'APP-2025-007', 
    'c0000000-0000-0000-0000-000000000001', 
    'AYURVEDA', 
    'Draft', 
    'Maharashtra',
    '{"hasDrugLicence": "yes", "drugLicenceNumber": "MH-AYU-2025-004"}'::jsonb
);

-- 1.3 UPDATE: Update application status and timestamp upon resubmission
UPDATE applications
SET 
    status = 'Resubmitted',
    last_updated = CURRENT_TIMESTAMP
WHERE id = 'APP-2025-002';

-- 1.4 DELETE: Delete a draft application and cascade cleanup (safely restricted to 'Draft' only)
DELETE FROM applications
WHERE id = 'APP-2025-007' 
  AND status = 'Draft';


-- ============================================================================
-- SECTION 2: RELATIONAL JOINS
-- ============================================================================

-- 2.1 INNER JOIN: Reviewer Application Queue
-- Joins applications, startups, users (founders), and master categories
SELECT 
    a.id AS application_id,
    s.legal_name AS startup_legal_name,
    s.brand_name,
    ac.name AS ayush_stream,
    a.status AS application_status,
    a.state,
    a.submitted_at,
    u.full_name AS applicant_name,
    u.email AS applicant_email
FROM applications a
INNER JOIN startups s ON a.startup_id = s.id
INNER JOIN users u ON s.user_id = u.id
INNER JOIN ayush_categories ac ON a.ayush_domain = ac.code
WHERE a.status != 'Draft'
ORDER BY a.submitted_at ASC;

-- 2.2 LEFT JOIN: Assigned Officers Oversight
-- Lists all applications and their assigned reviewing officer (including unassigned)
SELECT 
    a.id AS application_id,
    a.ayush_domain,
    a.status,
    a.submitted_at,
    COALESCE(off.full_name, 'Unassigned / In Pool') AS reviewing_officer,
    off.department
FROM applications a
LEFT JOIN users off ON a.assigned_officer_id = off.id
ORDER BY a.status, a.submitted_at;

-- 2.3 MULTI-TABLE JOIN: Detailed Application Dossier
-- Fetches application, startup, primary founder, and document count
SELECT 
    a.id AS application_id,
    s.legal_name,
    s.registration_number,
    f.name AS primary_founder,
    f.qualification,
    f.phone,
    COUNT(d.id) AS total_documents_uploaded,
    COUNT(CASE WHEN d.status = 'Verified' THEN 1 END) AS verified_documents_count
FROM applications a
INNER JOIN startups s ON a.startup_id = s.id
LEFT JOIN founders f ON s.id = f.startup_id AND f.is_primary = TRUE
LEFT JOIN documents d ON a.id = d.application_id
WHERE a.id = 'APP-2025-001'
GROUP BY a.id, s.legal_name, s.registration_number, f.name, f.qualification, f.phone;


-- ============================================================================
-- SECTION 3: AGGREGATE FUNCTIONS & GROUP BY
-- ============================================================================

-- 3.1 Aggregations by AYUSH Discipline
-- Total startups and applications per stream
SELECT 
    ac.name AS ayush_discipline,
    COUNT(DISTINCT s.id) AS registered_startups,
    COUNT(a.id) AS total_applications,
    COUNT(CASE WHEN a.status = 'Approved' THEN 1 END) AS approved_applications
FROM ayush_categories ac
LEFT JOIN startups s ON ac.code = s.ayush_domain
LEFT JOIN applications a ON ac.code = a.ayush_domain
GROUP BY ac.name
ORDER BY total_applications DESC;

-- 3.2 Status Breakdown & Approval Rate Calculation
SELECT 
    COUNT(*) AS total_applications,
    COUNT(CASE WHEN status = 'Approved' THEN 1 END) AS approved_count,
    COUNT(CASE WHEN status = 'Rejected' THEN 1 END) AS rejected_count,
    COUNT(CASE WHEN status IN ('Submitted', 'Under Review', 'Clarification Required', 'Resubmitted') THEN 1 END) AS pending_count,
    ROUND(
        (COUNT(CASE WHEN status = 'Approved' THEN 1 END)::numeric / 
        NULLIF(COUNT(CASE WHEN status IN ('Approved', 'Rejected') THEN 1 END), 0) * 100), 
        1
    ) AS decision_approval_rate_percentage
FROM applications
WHERE status != 'Draft';


-- ============================================================================
-- SECTION 4: FILTERING, PATTERN MATCHING & SORTING
-- ============================================================================

-- 4.1 Case-Insensitive Fuzzy Search on Startups
SELECT 
    s.id,
    s.legal_name,
    s.brand_name,
    s.state,
    s.city,
    s.dpiit_recognized
FROM startups s
WHERE (s.legal_name ILIKE '%cure%' OR s.brand_name ILIKE '%cure%')
  AND s.state = 'Maharashtra'
ORDER BY s.legal_name ASC;

-- 4.2 Paginated User Notifications (Page 1, 10 items)
SELECT 
    id,
    title,
    message,
    type,
    application_id,
    is_read,
    created_at
FROM notifications
WHERE user_id = 'a0000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;


-- ============================================================================
-- SECTION 5: SUBQUERIES AND COMMON TABLE EXPRESSIONS (CTEs)
-- ============================================================================

-- 5.1 Subquery with EXISTS: Startups that hold an official AYUSH Certificate
SELECT 
    s.id,
    s.legal_name,
    s.brand_name,
    s.ayush_domain
FROM startups s
WHERE EXISTS (
    SELECT 1 
    FROM applications a 
    WHERE a.startup_id = s.id 
      AND a.status = 'Approved' 
      AND a.certificate_number IS NOT NULL
);

-- 5.2 CTE: Reviewer Workload Analysis
WITH ReviewerWorkload AS (
    SELECT 
        u.id AS officer_id,
        u.full_name,
        u.department,
        COUNT(a.id) AS assigned_count,
        COUNT(CASE WHEN a.status = 'Under Review' THEN 1 END) AS active_reviews,
        COUNT(CASE WHEN a.status = 'Clarification Required' THEN 1 END) AS pending_applicant_clarifications,
        COUNT(CASE WHEN a.status IN ('Approved', 'Rejected') THEN 1 END) AS completed_adjudications
    FROM users u
    LEFT JOIN applications a ON u.id = a.assigned_officer_id
    WHERE u.role = 'officer'
    GROUP BY u.id, u.full_name, u.department
)
SELECT 
    officer_id,
    full_name,
    department,
    assigned_count,
    active_reviews,
    pending_applicant_clarifications,
    completed_adjudications
FROM ReviewerWorkload
ORDER BY active_reviews DESC;


-- ============================================================================
-- SECTION 6: ACID TRANSACTIONS
-- ============================================================================

-- 6.1 Transaction: Formal Application Submission
-- Moves application from Draft to Submitted, logs history, and creates notification
BEGIN;

UPDATE applications
SET 
    status = 'Submitted',
    submitted_at = CURRENT_TIMESTAMP,
    last_updated = CURRENT_TIMESTAMP
WHERE id = 'APP-2025-005' AND status = 'Draft';

INSERT INTO application_status_history (
    application_id, previous_status, status, remark, officer_name, actor_id
) VALUES (
    'APP-2025-005', 'Draft', 'Submitted', 
    'Application formally submitted with compliance declaration', 
    'Ananya Singh', 'a0000000-0000-0000-0000-000000000002'
);

INSERT INTO notifications (
    user_id, title, message, type, application_id
) VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'Application Submitted Successfully',
    'Your application APP-2025-005 has been submitted and is now queued for evaluation.',
    'status_update',
    'APP-2025-005'
);

COMMIT;

-- 6.2 Transaction: Application Approval & Certificate Generation
-- Approves application, assigns certificate number, records history, and writes audit log
BEGIN;

UPDATE applications
SET 
    status = 'Approved',
    certificate_number = 'AYUSH-REG-2025-0099',
    certificate_issued_at = CURRENT_TIMESTAMP,
    last_updated = CURRENT_TIMESTAMP
WHERE id = 'APP-2025-001' AND status = 'Under Review';

INSERT INTO application_status_history (
    application_id, previous_status, status, remark, officer_name, actor_id
) VALUES (
    'APP-2025-001', 'Under Review', 'Approved', 
    'Full statutory compliance verified under AYUSH rules. Certificate issued.', 
    'Dr. Priya Sharma', 'b0000000-0000-0000-0000-000000000001'
);

INSERT INTO audit_logs (
    actor_id, actor_name, actor_role, action, target_entity, target_id, details
) VALUES (
    'b0000000-0000-0000-0000-000000000001', 'Dr. Priya Sharma', 'officer',
    'Application Approved', 'Application', 'APP-2025-001',
    'Granted recognition and generated Certificate AYUSH-REG-2025-0099'
);

COMMIT;


-- ============================================================================
-- SECTION 7: APPLICATION STATUS TRACKING & TIMELINE
-- ============================================================================

-- 7.1 Chronological Status Timeline for ApplicationDetail.jsx
SELECT 
    h.id AS history_id,
    h.previous_status,
    h.status AS new_status,
    h.remark,
    COALESCE(h.officer_name, u.full_name, 'System') AS actor,
    h.created_at AS transition_timestamp
FROM application_status_history h
LEFT JOIN users u ON h.actor_id = u.id
WHERE h.application_id = 'APP-2025-002'
ORDER BY h.created_at ASC;

-- 7.2 Active Clarification Queries for an Application
SELECT 
    q.id AS query_id,
    q.query_text,
    q.response_text,
    q.status AS query_status,
    q.created_at AS query_date,
    q.resolved_at AS response_date,
    off.full_name AS raised_by_officer
FROM clarification_queries q
INNER JOIN users off ON q.officer_id = off.id
WHERE q.application_id = 'APP-2025-002';


-- ============================================================================
-- SECTION 8: ADMIN ANALYTICS QUERIES (Recharts Data Feeds)
-- ============================================================================

-- 8.1 Monthly Registration Trends (Feeds AreaChart in AdminDashboard.jsx)
SELECT 
    TO_CHAR(created_at, 'Mon YYYY') AS month_year,
    DATE_TRUNC('month', created_at) AS month_date,
    COUNT(*) AS applications_count
FROM applications
GROUP BY DATE_TRUNC('month', created_at), TO_CHAR(created_at, 'Mon YYYY')
ORDER BY month_date ASC;

-- 8.2 Applications by Domain (Feeds PieChart in AdminDashboard.jsx)
SELECT 
    ac.name AS domain,
    COUNT(a.id) AS count,
    ROUND(COUNT(a.id)::numeric / NULLIF((SELECT COUNT(*) FROM applications), 0) * 100, 1) AS percentage
FROM ayush_categories ac
LEFT JOIN applications a ON ac.code = a.ayush_domain
GROUP BY ac.name
ORDER BY count DESC;

