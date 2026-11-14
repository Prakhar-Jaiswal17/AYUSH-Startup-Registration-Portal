const express = require('express')
const bcrypt = require('bcryptjs')
const { prisma } = require('../db/prisma')
const { authenticate, allowRoles } = require('../middleware/auth')
const { asyncHandler, httpError, requireFields, requireObjectBody } = require('../utils/http')
const { STATUS_TO_API } = require('../utils/serializers')
const { recordAudit } = require('../utils/audit')

const router = express.Router()
const API_TO_DB_ROLE = { STARTUP: 'startup', OFFICER: 'officer', ADMIN: 'admin' }
const DB_TO_API_ROLE = { startup: 'STARTUP', officer: 'OFFICER', admin: 'ADMIN', system: 'SYSTEM' }
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function validateAccountFields(body, { create = false } = {}) {
    requireObjectBody(body)
    if (create) requireFields(body, ['name', 'email', 'password', 'role'])

    const fields = {}
    const data = {}
    const textFields = { name: ['fullName', 255], email: ['email', 255], phone: ['phone', 50], designation: ['designation', 255], department: ['department', 255] }
    for (const [inputName, [columnName, maxLength]] of Object.entries(textFields)) {
        if (body[inputName] === undefined) continue
        if (typeof body[inputName] !== 'string') {
            fields[inputName] = 'Must be a string.'
            continue
        }
        const value = body[inputName].trim()
        if ((inputName === 'name' || inputName === 'email') && !value) fields[inputName] = 'This field is required.'
        else if (value.length > maxLength) fields[inputName] = `Must be ${maxLength} characters or fewer.`
        else if (inputName === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) fields.email = 'Enter a valid email address.'
        else data[columnName] = inputName === 'email' ? value.toLowerCase() : (value || null)
    }

    if (body.role !== undefined) {
        if (typeof body.role !== 'string' || !API_TO_DB_ROLE[body.role.toUpperCase()]) fields.role = 'Choose STARTUP, OFFICER, or ADMIN.'
        else data.role = API_TO_DB_ROLE[body.role.toUpperCase()]
    }
    if (body.assignedStates !== undefined) {
        if (!Array.isArray(body.assignedStates) || body.assignedStates.some((state) => typeof state !== 'string' || state.trim().length > 100)) {
            fields.assignedStates = 'Must be a list of state names (up to 100 characters each).'
        } else data.assignedStates = [...new Set(body.assignedStates.map((state) => state.trim()).filter(Boolean))]
    }
    if (body.password !== undefined) {
        if (typeof body.password !== 'string' || body.password.length < 8 || Buffer.byteLength(body.password, 'utf8') > 72) {
            fields.password = 'Must be at least 8 characters and no more than 72 UTF-8 bytes.'
        }
    } else if (create) fields.password = 'This field is required.'

    if (create && !data.role) fields.role = 'Choose STARTUP, OFFICER, or ADMIN.'
    if (!create && Object.keys(data).length === 0) fields.body = 'Provide at least one supported account field to update.'
    if (Object.keys(fields).length) throw httpError(422, 'Validation failed', fields)
    return data
}

function parsePage(query) {
    const parse = (value, fallback) => {
        if (value === undefined) return fallback
        if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null
        const parsed = Number(value)
        return Number.isSafeInteger(parsed) ? parsed : null
    }
    const page = parse(query.page, 1)
    const limit = parse(query.limit, 10)
    if (page === null || limit === null || limit > 50) {
        throw httpError(400, 'page must be a positive integer and limit must be between 1 and 50.')
    }
    return { page, limit }
}

function optionalText(query, field, maxLength) {
    const value = query[field]
    if (value === undefined) return undefined
    if (typeof value !== 'string' || value.trim().length > maxLength) {
        throw httpError(400, `${field} must be a string of ${maxLength} characters or fewer.`)
    }
    return value.trim() || undefined
}

function apiStatusForDb(status) {
    return STATUS_TO_API[status] || status
}

router.use(authenticate, allowRoles('admin'))

router.get('/analytics', asyncHandler(async (req, res) => {
    const [totalStartups, totalApplications, totalOfficers, statusGroups, categoryGroups, stateGroups, recentApplications, registrationTrend] = await Promise.all([
        prisma.startup.count(),
        prisma.application.count(),
        prisma.user.count({ where: { role: 'officer' } }),
        prisma.application.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.application.groupBy({ by: ['ayushDomain'], _count: { _all: true } }),
        prisma.startup.groupBy({ by: ['state'], _count: { _all: true } }),
        prisma.application.findMany({
            take: 5,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            select: {
                id: true,
                status: true,
                state: true,
                createdAt: true,
                category: { select: { code: true, name: true } },
                startup: { select: { legalName: true, brandName: true } },
            },
        }),
        prisma.$queryRaw`
            WITH months AS (
                SELECT generate_series(
                    date_trunc('month', CURRENT_DATE) - interval '11 months',
                    date_trunc('month', CURRENT_DATE),
                    interval '1 month'
                ) AS month_start
            ), startup_counts AS (
                SELECT date_trunc('month', created_at) AS month_start, count(*)::int AS total
                FROM startups
                GROUP BY 1
            ), application_counts AS (
                SELECT date_trunc('month', created_at) AS month_start, count(*)::int AS total
                FROM applications
                GROUP BY 1
            )
            SELECT
                to_char(months.month_start, 'Mon') AS month,
                COALESCE(startup_counts.total, 0)::int AS startups,
                COALESCE(application_counts.total, 0)::int AS applications
            FROM months
            LEFT JOIN startup_counts USING (month_start)
            LEFT JOIN application_counts USING (month_start)
            ORDER BY months.month_start
        `,
    ])

    const categoryCodes = categoryGroups.map((group) => group.ayushDomain)
    const categories = categoryCodes.length
        ? await prisma.ayushCategory.findMany({ where: { code: { in: categoryCodes } }, select: { code: true, name: true } })
        : []
    const categoryNames = new Map(categories.map((category) => [category.code, category.name]))
    const statusCounts = new Map(statusGroups.map((group) => [group.status, group._count._all]))
    const byStatus = Object.fromEntries(
        Object.entries(STATUS_TO_API).map(([databaseStatus, apiStatus]) => [apiStatus, statusCounts.get(databaseStatus) || 0]),
    )

    return res.json({
        success: true,
        data: {
            totalStartups,
            totalApplications,
            totalOfficers,
            byStatus,
            byCategory: categoryGroups
                .map((group) => ({ categoryName: categoryNames.get(group.ayushDomain) || group.ayushDomain, count: group._count._all }))
                .sort((a, b) => b.count - a.count),
            byState: stateGroups
                .map((group) => ({ state: group.state, count: group._count._all }))
                .sort((a, b) => b.count - a.count),
            registrationTrend,
            recentApplications: recentApplications.map((application) => ({
                id: application.id,
                trackingNumber: application.id,
                status: apiStatusForDb(application.status),
                legalName: application.startup.legalName,
                brandName: application.startup.brandName,
                categoryCode: application.category.code,
                categoryName: application.category.name,
                state: application.state,
                createdAt: application.createdAt,
            })),
        },
    })
}))

router.get('/users', asyncHandler(async (req, res) => {
    const { page, limit } = parsePage(req.query)
    const roleValue = optionalText(req.query, 'role', 20)?.toUpperCase()
    const search = optionalText(req.query, 'search', 100)
    if (roleValue && !API_TO_DB_ROLE[roleValue]) throw httpError(400, 'role must be STARTUP, OFFICER, or ADMIN.')

    const where = {
        ...(roleValue ? { role: API_TO_DB_ROLE[roleValue] } : {}),
        ...(search ? {
            OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { startup: { is: { OR: [
                    { brandName: { contains: search, mode: 'insensitive' } },
                    { legalName: { contains: search, mode: 'insensitive' } },
                ] } } },
            ],
        } : {}),
    }

    const [total, users] = await prisma.$transaction([
        prisma.user.count({ where }),
        prisma.user.findMany({
            where,
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                phone: true,
                createdAt: true,
                startup: { select: { id: true, legalName: true, brandName: true } },
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (page - 1) * limit,
            take: limit,
        }),
    ])

    return res.json({
        success: true,
        data: {
            items: users.map((user) => ({
                id: user.id,
                name: user.fullName,
                email: user.email,
                role: DB_TO_API_ROLE[user.role] || user.role.toUpperCase(),
                phone: user.phone,
                createdAt: user.createdAt,
                startup: user.startup,
            })),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
    })
}))

router.post('/users', asyncHandler(async (req, res) => {
    const data = validateAccountFields(req.body, { create: true })
    data.passwordHash = await bcrypt.hash(req.body.password, 12)
    const user = await prisma.user.create({
        data,
        select: { id: true, fullName: true, email: true, role: true, phone: true, designation: true, department: true, assignedStates: true, createdAt: true },
    })
    await recordAudit({ actor: req.user, action: 'ADMIN_USER_CREATED', targetEntity: 'User', targetId: user.id, details: `Created ${user.role} account ${user.email}.` })
    return res.status(201).json({ success: true, data: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: DB_TO_API_ROLE[user.role],
        phone: user.phone,
        designation: user.designation,
        department: user.department,
        assignedStates: user.assignedStates,
        createdAt: user.createdAt,
    } })
}))

router.patch('/users/:id', asyncHandler(async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw httpError(400, 'User id must be a valid UUID.')
    const data = validateAccountFields(req.body)
    const user = await prisma.$transaction(async (tx) => {
        const target = await tx.user.findUnique({ where: { id: req.params.id }, select: { id: true, role: true } })
        if (!target) throw httpError(404, 'User not found.')
        if (target.id === req.user.id && data.role && data.role !== 'admin') throw httpError(409, 'You cannot remove your own administrator access.')
        if (target.role === 'admin' && data.role && data.role !== 'admin') {
            const adminCount = await tx.user.count({ where: { role: 'admin' } })
            if (adminCount <= 1) throw httpError(409, 'The last administrator account cannot be demoted.')
        }
        return tx.user.update({
            where: { id: target.id },
            data,
            select: { id: true, fullName: true, email: true, role: true, phone: true, designation: true, department: true, assignedStates: true, createdAt: true },
        })
    }, { isolationLevel: 'Serializable' })
    await recordAudit({ actor: req.user, action: 'ADMIN_USER_UPDATED', targetEntity: 'User', targetId: user.id, details: `Updated account ${user.email}; role is ${user.role}.` })
    return res.json({ success: true, data: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: DB_TO_API_ROLE[user.role],
        phone: user.phone,
        designation: user.designation,
        department: user.department,
        assignedStates: user.assignedStates,
        createdAt: user.createdAt,
    } })
}))

router.delete('/users/:id', asyncHandler(async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw httpError(400, 'User id must be a valid UUID.')
    if (req.params.id === req.user.id) throw httpError(409, 'You cannot delete the administrator account you are currently using.')

    const deletedUser = await prisma.$transaction(async (tx) => {
        const target = await tx.user.findUnique({ where: { id: req.params.id }, select: { id: true, role: true, fullName: true, email: true } })
        if (!target) throw httpError(404, 'User not found.')
        if (target.role === 'admin') {
            const adminCount = await tx.user.count({ where: { role: 'admin' } })
            if (adminCount <= 1) throw httpError(409, 'The last administrator account cannot be deleted.')
        }
        await tx.user.delete({ where: { id: target.id } })
        return target
    }, { isolationLevel: 'Serializable' })

    await recordAudit({ actor: req.user, action: 'ADMIN_USER_DELETED', targetEntity: 'User', targetId: deletedUser.id, details: `Deleted ${deletedUser.role} account ${deletedUser.email}.` })
    return res.json({ success: true, data: { id: deletedUser.id, message: 'Account deleted.' } })
}))

router.get('/audit-logs', asyncHandler(async (req, res) => {
    const { page, limit } = parsePage(req.query)
    const actorId = optionalText(req.query, 'actorId', 36)
    if (actorId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actorId)) {
        throw httpError(400, 'actorId must be a valid UUID.')
    }
    const entityType = optionalText(req.query, 'entityType', 100)
    const action = optionalText(req.query, 'action', 255)
    const search = optionalText(req.query, 'search', 100)
    const actorRoleValue = optionalText(req.query, 'actorRole', 20)?.toUpperCase()
    if (actorRoleValue && !DB_TO_API_ROLE[actorRoleValue.toLowerCase()]) {
        throw httpError(400, 'actorRole must be STARTUP, OFFICER, ADMIN, or SYSTEM.')
    }

    const where = {
        ...(actorId ? { actorId } : {}),
        ...(entityType ? { targetEntity: entityType } : {}),
        ...(action ? { action: { contains: action, mode: 'insensitive' } } : {}),
        ...(actorRoleValue ? { actorRole: actorRoleValue.toLowerCase() } : {}),
        ...(search ? {
            OR: [
                { actorName: { contains: search, mode: 'insensitive' } },
                { action: { contains: search, mode: 'insensitive' } },
                { targetEntity: { contains: search, mode: 'insensitive' } },
                { targetId: { contains: search, mode: 'insensitive' } },
                { details: { contains: search, mode: 'insensitive' } },
            ],
        } : {}),
    }

    const [total, logs] = await prisma.$transaction([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
            where,
            select: {
                id: true,
                actorId: true,
                actorName: true,
                actorRole: true,
                action: true,
                targetEntity: true,
                targetId: true,
                details: true,
                ipAddress: true,
                createdAt: true,
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip: (page - 1) * limit,
            take: limit,
        }),
    ])

    return res.json({
        success: true,
        data: {
            items: logs.map((log) => ({ ...log, actorRole: DB_TO_API_ROLE[log.actorRole.toLowerCase()] || log.actorRole.toUpperCase() })),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
    })
}))

module.exports = router
