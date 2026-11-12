const express = require('express')
const { prisma } = require('../db/prisma')
const { authenticate, allowRoles } = require('../middleware/auth')
const { asyncHandler, httpError, requireFields } = require('../utils/http')
const { applicationDto, STATUS_TO_API } = require('../utils/serializers')
const { recordAudit } = require('../utils/audit')
const { parseStartupInput, parseFounders, saveFounders, startupInclude } = require('./startups')

const router = express.Router()
const includeApplication = {
    category: true,
    startup: { include: { founders: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] } } },
    assignedOfficer: { select: { id: true, fullName: true } },
    documents: { select: { id: true, fileName: true, status: true, documentTypeCode: true }, orderBy: { uploadedAt: 'desc' } },
    statusHistory: { include: { actor: { select: { id: true, fullName: true } } }, orderBy: { createdAt: 'asc' } },
    queries: { orderBy: { createdAt: 'asc' } },
}

function parsePage(query) {
    const parse = (value, fallback) => value === undefined ? fallback : (/^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : null)
    const page = parse(query.page, 1)
    const limit = parse(query.limit, 10)
    if (page === null || limit === null || limit > 50) throw httpError(400, 'page must be a positive integer and limit must be between 1 and 50.')
    return { page, limit }
}

function plainObject(value, field) {
    if (value === undefined) return undefined
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw httpError(422, 'Validation failed', { [field]: 'Must be a JSON object.' })
    return value
}

function apiStatusToDb(status) {
    const match = Object.entries(STATUS_TO_API).find(([, api]) => api === status)
    return match?.[0]
}

async function nextTrackingNumber(tx) {
    const year = new Date().getFullYear()
    const prefix = `APP-${year}-`
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(74112601)`
    const rows = await tx.$queryRaw`SELECT COALESCE(MAX((regexp_match("id", ${`^APP-${year}-([0-9]+)$` }))[1]::integer), 0)::integer AS highest FROM "applications" WHERE "id" ~ ${`^APP-${year}-[0-9]+$`}`
    return `${prefix}${String(rows[0].highest + 1).padStart(3, '0')}`
}

async function startupForUser(tx, userId) {
    return tx.startup.findUnique({ where: { userId } })
}

async function assertApplicationAccess(applicationId, user) {
    const app = await prisma.application.findUnique({ where: { id: applicationId }, select: { id: true, startup: { select: { userId: true } }, assignedOfficerId: true } })
    if (!app) throw httpError(404, 'Application not found.')
    if (user.role === 'startup' && app.startup.userId !== user.id) throw httpError(403, 'You may only access your own applications.')
    if (user.role === 'officer' && app.assignedOfficerId !== user.id) throw httpError(403, 'This application is not assigned to you.')
    if (!['startup', 'officer', 'admin'].includes(user.role)) throw httpError(403, 'You do not have permission to access this application.')
    return app
}

router.post('/', authenticate, allowRoles('startup'), asyncHandler(async (req, res) => {
    requireFields(req.body, ['categoryCode'])
    const details = req.body.startupDetails || {}
    const founders = parseFounders(req.body.founders)
    const regulatory = plainObject(req.body.regulatoryInfo, 'regulatoryInfo')
    const business = plainObject(req.body.businessInfo, 'businessInfo')
    const existing = await prisma.startup.findUnique({ where: { userId: req.user.id } })
    const startupInput = {
        ...details,
        ayushDomain: req.body.categoryCode,
        state: req.body.state ?? details.state ?? existing?.state,
    }
    const startupData = parseStartupInput(startupInput, existing, !existing)
    const category = await prisma.ayushCategory.findUnique({ where: { code: req.body.categoryCode } })
    if (!category || !category.isActive) throw httpError(422, 'Unknown or inactive AYUSH category code.', { categoryCode: 'Choose an active AYUSH category code.' })
    if (!existing && !founders?.length) throw httpError(422, 'At least one founder is required to create the startup profile.', { founders: 'Add at least one founder.' })

    const application = await prisma.$transaction(async tx => {
        const currentStartup = await startupForUser(tx, req.user.id)
        const effectiveData = currentStartup
            ? { ...startupData, state: startupData.state ?? currentStartup.state }
            : startupData
        const startup = currentStartup
            ? await tx.startup.update({ where: { id: currentStartup.id }, data: effectiveData })
            : await tx.startup.create({ data: { ...effectiveData, userId: req.user.id } })
        await saveFounders(tx, startup.id, founders)
        const id = await nextTrackingNumber(tx)
        const created = await tx.application.create({ data: {
            id,
            startupId: startup.id,
            ayushDomain: req.body.categoryCode,
            state: req.body.state || startup.state,
            status: 'Draft',
            regulatoryDetails: regulatory ?? {},
            businessDetailsSnapshot: business ?? {},
        } })
        await tx.applicationStatusHistory.create({ data: { applicationId: created.id, previousStatus: null, status: 'Draft', remark: 'Draft created', actorId: req.user.id } })
        return tx.application.findUnique({ where: { id: created.id }, include: includeApplication })
    })

    await recordAudit({ actor: req.user, action: 'APPLICATION_DRAFT_CREATED', targetEntity: 'Application', targetId: application.id })
    return res.status(201).json({ success: true, data: { id: application.id, trackingNumber: application.id, status: 'DRAFT', categoryCode: application.ayushDomain, createdAt: application.createdAt } })
}))

router.get('/', authenticate, allowRoles('startup'), asyncHandler(async (req, res) => {
    const { page, limit } = parsePage(req.query)
    const startup = await prisma.startup.findUnique({ where: { userId: req.user.id }, select: { id: true } })
    if (!startup) return res.json({ success: true, data: { items: [], pagination: { page, limit, total: 0, totalPages: 0 } } })
    const where = { startupId: startup.id }
    if (req.query.status !== undefined) {
        if (typeof req.query.status !== 'string') throw httpError(400, 'status must be a single value.')
        const dbStatus = apiStatusToDb(req.query.status)
        if (!dbStatus) throw httpError(400, 'Unsupported application status.')
        where.status = dbStatus
    }
    const [total, applications] = await prisma.$transaction([
        prisma.application.count({ where }),
        prisma.application.findMany({ where, include: { category: true, startup: { select: { legalName: true } } }, orderBy: { lastUpdated: 'desc' }, skip: (page - 1) * limit, take: limit }),
    ])
    return res.json({ success: true, data: { items: applications.map(app => ({ id: app.id, trackingNumber: app.id, status: apiStatusToDb(app.status) ? STATUS_TO_API[app.status] : app.status, legalName: app.startup.legalName, categoryName: app.category.name, submittedAt: app.submittedAt, lastUpdated: app.lastUpdated })), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } })
}))

router.get('/:id/status-history', authenticate, asyncHandler(async (req, res) => {
    const app = await assertApplicationAccess(req.params.id, req.user)
    const history = await prisma.applicationStatusHistory.findMany({ where: { applicationId: app.id }, include: { actor: { select: { id: true, fullName: true } } }, orderBy: { createdAt: 'asc' } })
    return res.json({ success: true, data: history.map(item => ({ previousStatus: item.previousStatus ? STATUS_TO_API[item.previousStatus] : null, status: STATUS_TO_API[item.status] || item.status, remark: item.remark, changedBy: item.actor ? { id: item.actor.id, name: item.actor.fullName } : (item.officerName ? { name: item.officerName } : null), createdAt: item.createdAt })) })
}))

router.get('/:id', authenticate, asyncHandler(async (req, res) => {
    await assertApplicationAccess(req.params.id, req.user)
    const application = await prisma.application.findUnique({ where: { id: req.params.id }, include: includeApplication })
    return res.json({ success: true, data: applicationDto(application) })
}))

router.put('/:id', authenticate, allowRoles('startup'), asyncHandler(async (req, res) => {
    const access = await assertApplicationAccess(req.params.id, req.user)
    const current = await prisma.application.findUnique({ where: { id: access.id }, include: { startup: true } })
    if (!['Draft', 'Clarification Required'].includes(current.status)) throw httpError(403, 'Only draft or query-raised applications can be updated.')
    const details = req.body.startupDetails || {}
    const founders = parseFounders(req.body.founders)
    const regulatory = plainObject(req.body.regulatoryInfo, 'regulatoryInfo')
    const business = plainObject(req.body.businessInfo, 'businessInfo')
    const categoryCode = req.body.categoryCode
    if (categoryCode !== undefined) {
        requireFields({ categoryCode }, ['categoryCode'])
        const category = await prisma.ayushCategory.findUnique({ where: { code: categoryCode } })
        if (!category || !category.isActive) throw httpError(422, 'Unknown or inactive AYUSH category code.', { categoryCode: 'Choose an active AYUSH category code.' })
    }
    const startupData = parseStartupInput({ ...details, ...(req.body.state !== undefined ? { state: req.body.state } : {}) })
    const updated = await prisma.$transaction(async tx => {
        if (Object.keys(startupData).length) await tx.startup.update({ where: { id: current.startupId }, data: startupData })
        await saveFounders(tx, current.startupId, founders)
        return tx.application.update({ where: { id: current.id }, data: {
            ...(categoryCode ? { ayushDomain: categoryCode } : {}),
            ...(req.body.state ? { state: req.body.state } : {}),
            ...(regulatory !== undefined ? { regulatoryDetails: regulatory } : {}),
            ...(business !== undefined ? { businessDetailsSnapshot: business } : {}),
            lastUpdated: new Date(),
        }, include: includeApplication })
    })
    await recordAudit({ actor: req.user, action: 'APPLICATION_DRAFT_UPDATED', targetEntity: 'Application', targetId: updated.id })
    return res.json({ success: true, data: applicationDto(updated) })
}))

router.post('/:id/submit', authenticate, allowRoles('startup'), asyncHandler(async (req, res) => {
    const access = await assertApplicationAccess(req.params.id, req.user)
    const application = await prisma.application.findUnique({ where: { id: access.id }, include: { startup: { include: { founders: true } } } })
    if (!['Draft', 'Clarification Required'].includes(application.status)) throw httpError(403, 'This application cannot be submitted in its current status.')
    if (!application.startup.legalName || !application.startup.brandName || !application.startup.state || !application.startup.founders.length) {
        throw httpError(422, 'Complete the startup profile and add at least one founder before submitting.')
    }
    const nextStatus = application.status === 'Draft' ? 'Submitted' : 'Resubmitted'
    const saved = await prisma.$transaction(async tx => {
        const updated = await tx.application.update({ where: { id: application.id }, data: { status: nextStatus, submittedAt: new Date(), lastUpdated: new Date() } })
        await tx.applicationStatusHistory.create({ data: { applicationId: application.id, previousStatus: application.status, status: nextStatus, remark: 'Application submitted by startup', actorId: req.user.id } })
        await tx.notification.create({ data: { userId: req.user.id, applicationId: application.id, title: 'Application Submitted', message: `Application ${application.id} was submitted for review.`, type: 'status_update' } })
        return updated
    })
    await recordAudit({ actor: req.user, action: 'APPLICATION_SUBMITTED', targetEntity: 'Application', targetId: application.id })
    return res.json({ success: true, data: { id: saved.id, trackingNumber: saved.id, status: STATUS_TO_API[saved.status], submittedAt: saved.submittedAt } })
}))

module.exports = router
