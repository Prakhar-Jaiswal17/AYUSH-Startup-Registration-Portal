const express = require('express')
const { prisma } = require('../db/prisma')
const { authenticate, allowRoles } = require('../middleware/auth')
const { asyncHandler, httpError, requireFields } = require('../utils/http')
const { recordAudit } = require('../utils/audit')
const { queryDto } = require('../utils/serializers')

const router = express.Router()
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parseQueryId(value) {
    if (!UUID_PATTERN.test(value)) throw httpError(400, 'Query ID must be a valid UUID.')
    return value
}

async function findApplication(tx, applicationId) {
    const application = await tx.application.findUnique({
        where: { id: applicationId },
        select: {
            id: true,
            status: true,
            assignedOfficerId: true,
            startup: { select: { userId: true } },
        },
    })
    if (!application) throw httpError(404, 'Application not found.')
    return application
}

function assertApplicationAccess(application, user) {
    if (user.role === 'startup' && application.startup.userId !== user.id) {
        throw httpError(403, 'You may only access queries for your own applications.')
    }
    if (user.role === 'officer' && application.assignedOfficerId !== user.id) {
        throw httpError(403, 'This application is not assigned to you.')
    }
}

async function findQuery(tx, queryId) {
    const query = await tx.clarificationQuery.findUnique({
        where: { id: queryId },
        include: {
            application: {
                select: { id: true, status: true, assignedOfficerId: true, startup: { select: { userId: true } } },
            },
        },
    })
    if (!query) throw httpError(404, 'Clarification query not found.')
    return query
}

router.post('/applications/:id/queries', authenticate, allowRoles('officer', 'admin'), asyncHandler(async (req, res) => {
    requireFields(req.body, ['queryText'])
    const queryText = req.body.queryText.trim()
    if (queryText.length > 4000) {
        throw httpError(422, 'Validation failed', { queryText: 'Must be 4000 characters or fewer.' })
    }

    const result = await prisma.$transaction(async (tx) => {
        const application = await findApplication(tx, req.params.id)
        assertApplicationAccess(application, req.user)
        if (application.status !== 'Under Review') {
            throw httpError(409, 'A clarification query can only be raised while an application is under review.')
        }

        const now = new Date()
        const transition = await tx.application.updateMany({
            where: {
                id: application.id,
                status: 'Under Review',
                ...(req.user.role === 'officer' ? { assignedOfficerId: req.user.id } : {}),
            },
            data: { status: 'Clarification Required', lastUpdated: now },
        })
        if (transition.count !== 1) {
            throw httpError(409, 'The application status or assignment changed. Refresh the review and try again.')
        }

        const query = await tx.clarificationQuery.create({
            data: {
                applicationId: application.id,
                officerId: req.user.id,
                queryText,
                status: 'Pending',
            },
        })
        await tx.applicationStatusHistory.create({
            data: {
                applicationId: application.id,
                previousStatus: application.status,
                status: 'Clarification Required',
                remark: `Clarification requested: ${queryText}`,
                actorId: req.user.id,
            },
        })
        await tx.notification.create({
            data: {
                userId: application.startup.userId,
                applicationId: application.id,
                title: 'Clarification Requested',
                message: `Please review and respond to the clarification request for application ${application.id}.`,
                type: 'status_update',
            },
        })

        return query
    })

    await recordAudit({
        actor: req.user,
        action: 'APPLICATION_QUERY_RAISED',
        targetEntity: 'ClarificationQuery',
        targetId: result.id,
        details: `${result.applicationId}: ${queryText}`,
    })
    return res.status(201).json({ success: true, data: queryDto(result) })
}))

router.get('/applications/:id/queries', authenticate, allowRoles('startup', 'officer', 'admin'), asyncHandler(async (req, res) => {
    const application = await findApplication(prisma, req.params.id)
    assertApplicationAccess(application, req.user)
    const queries = await prisma.clarificationQuery.findMany({
        where: { applicationId: application.id },
        orderBy: { createdAt: 'asc' },
    })
    return res.json({ success: true, data: queries.map(queryDto) })
}))

router.patch('/queries/:id/respond', authenticate, allowRoles('startup'), asyncHandler(async (req, res) => {
    const queryId = parseQueryId(req.params.id)
    requireFields(req.body, ['applicantResponse'])
    const applicantResponse = req.body.applicantResponse.trim()
    if (applicantResponse.length > 4000) {
        throw httpError(422, 'Validation failed', { applicantResponse: 'Must be 4000 characters or fewer.' })
    }

    const result = await prisma.$transaction(async (tx) => {
        const query = await findQuery(tx, queryId)
        assertApplicationAccess(query.application, req.user)
        if (query.status !== 'Pending') throw httpError(409, 'This clarification query is already resolved.')
        if (query.application.status !== 'Clarification Required') {
            throw httpError(409, 'A response can only be submitted while the application requires clarification.')
        }

        const now = new Date()
        const applicationUpdated = await tx.application.updateMany({
            where: { id: query.application.id, status: 'Clarification Required' },
            data: { lastUpdated: now },
        })
        if (applicationUpdated.count !== 1) {
            throw httpError(409, 'The application status changed. Refresh and try again.')
        }

        const updated = await tx.clarificationQuery.updateMany({
            where: {
                id: query.id,
                status: 'Pending',
                responseText: query.responseText,
                application: {
                    is: {
                        status: 'Clarification Required',
                        startup: { is: { userId: req.user.id } },
                    },
                },
            },
            data: { responseText: applicantResponse },
        })
        if (updated.count !== 1) {
            throw httpError(409, 'The query or application changed. Refresh and try again.')
        }
        return tx.clarificationQuery.findUnique({ where: { id: query.id } })
    })

    await recordAudit({
        actor: req.user,
        action: 'APPLICATION_QUERY_RESPONDED',
        targetEntity: 'ClarificationQuery',
        targetId: result.id,
        details: result.applicationId,
    })
    return res.json({ success: true, data: queryDto(result) })
}))

router.patch('/queries/:id/resolve', authenticate, allowRoles('officer', 'admin'), asyncHandler(async (req, res) => {
    const queryId = parseQueryId(req.params.id)
    const result = await prisma.$transaction(async (tx) => {
        const query = await findQuery(tx, queryId)
        assertApplicationAccess(query.application, req.user)
        if (query.status !== 'Pending') throw httpError(409, 'This clarification query is already resolved.')

        const resolvedAt = new Date()
        await tx.application.update({
            where: { id: query.application.id },
            data: { lastUpdated: resolvedAt },
        })
        const resolved = await tx.clarificationQuery.updateMany({
            where: {
                id: query.id,
                status: 'Pending',
                ...(req.user.role === 'officer' ? {
                    application: { is: { assignedOfficerId: req.user.id } },
                } : {}),
            },
            data: { status: 'Resolved', resolvedAt },
        })
        if (resolved.count !== 1) {
            throw httpError(409, 'The query or assignment changed. Refresh and try again.')
        }
        return tx.clarificationQuery.findUnique({ where: { id: query.id } })
    })

    await recordAudit({
        actor: req.user,
        action: 'APPLICATION_QUERY_RESOLVED',
        targetEntity: 'ClarificationQuery',
        targetId: result.id,
        details: result.applicationId,
    })
    return res.json({ success: true, data: queryDto(result) })
}))

module.exports = router
