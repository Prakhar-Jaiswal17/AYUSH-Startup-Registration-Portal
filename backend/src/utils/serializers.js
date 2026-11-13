const ROLE_TO_API = { startup: 'STARTUP', officer: 'OFFICER', admin: 'ADMIN' }
const STATUS_TO_API = {
    Draft: 'DRAFT', Submitted: 'SUBMITTED', 'Under Review': 'UNDER_REVIEW',
    'Clarification Required': 'QUERY_RAISED', Resubmitted: 'RESUBMITTED',
    Approved: 'APPROVED', Rejected: 'REJECTED',
}

function userDto(user) {
    return { id: user.id, name: user.fullName, email: user.email, role: ROLE_TO_API[user.role], phone: user.phone, createdAt: user.createdAt }
}

function startupDto(startup) {
    return {
        id: startup.id, userId: startup.userId, legalName: startup.legalName,
        brandName: startup.brandName, incorporationDate: startup.incorporationDate,
        incorporationType: startup.incorporationType, registrationNumber: startup.registrationNumber,
        officialEmail: startup.officialEmail, website: startup.website, ayushDomain: startup.ayushDomain,
        businessActivities: startup.businessActivities, description: startup.description,
        products: startup.products, businessStage: startup.businessStage, targetMarket: startup.targetMarket,
        operationalStatus: startup.operationalStatus, state: startup.state, city: startup.city,
        dpiitRecognized: startup.dpiitRecognized, dpiitNumber: startup.dpiitNumber,
        existingLicences: startup.existingLicences, createdAt: startup.createdAt, updatedAt: startup.updatedAt,
        founders: startup.founders?.map(f => ({ id: f.id, name: f.name, designation: f.designation, email: f.email, phone: f.phone, qualification: f.qualification, isPrimary: f.isPrimary })),
    }
}

function queryDto(query) {
    const isResolved = query.status === 'Resolved'
    return {
        id: query.id,
        applicationId: query.applicationId,
        queryText: query.queryText,
        applicantResponse: query.responseText,
        status: isResolved ? 'RESOLVED' : 'PENDING',
        isResolved,
        createdAt: query.createdAt,
        resolvedAt: query.resolvedAt,
    }
}

function applicationDto(application) {
    const status = STATUS_TO_API[application.status] || application.status
    return {
        id: application.id,
        trackingNumber: application.id,
        status,
        category: application.category ? { code: application.category.code, name: application.category.name } : undefined,
        categoryCode: application.ayushDomain,
        startup: application.startup ? { id: application.startup.id, legalName: application.startup.legalName, brandName: application.startup.brandName } : undefined,
        state: application.state,
        assignedOfficer: application.assignedOfficer ? { id: application.assignedOfficer.id, name: application.assignedOfficer.fullName } : null,
        founders: application.startup?.founders?.map(f => ({ id: f.id, name: f.name, designation: f.designation, email: f.email, phone: f.phone, qualification: f.qualification, isPrimary: f.isPrimary })) || [],
        regulatoryInfo: application.regulatoryDetails || {},
        businessInfo: application.businessDetailsSnapshot || {},
        documents: application.documents?.map(d => ({ id: d.id, fileName: d.fileName, status: d.status.toUpperCase().replaceAll(' ', '_'), documentTypeCode: d.documentTypeCode })) || [],
        statusHistory: application.statusHistory?.map(h => ({
            previousStatus: h.previousStatus ? STATUS_TO_API[h.previousStatus] : null,
            status: STATUS_TO_API[h.status] || h.status,
            remark: h.remark,
            changedBy: h.actor ? { id: h.actor.id, name: h.actor.fullName } : (h.officerName ? { name: h.officerName } : null),
            createdAt: h.createdAt,
        })) || [],
        queries: application.queries?.map(queryDto) || [],
        submittedAt: application.submittedAt,
        createdAt: application.createdAt,
        lastUpdated: application.lastUpdated,
    }
}

module.exports = { userDto, startupDto, applicationDto, queryDto, STATUS_TO_API }
