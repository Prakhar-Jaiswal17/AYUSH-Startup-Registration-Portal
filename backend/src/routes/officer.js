const express = require('express')
const { prisma } = require('../db/prisma')
const { authenticate, allowRoles } = require('../middleware/auth')
const { asyncHandler, httpError } = require('../utils/http')
const { STATUS_TO_API } = require('../utils/serializers')

const router = express.Router()

function parsePage(query) {
    const parse = (value, fallback) => value === undefined
        ? fallback
        : (/^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : null)
    const page = parse(query.page, 1)
    const limit = parse(query.limit, 10)
    if (page === null || limit === null || limit > 50) {
        throw httpError(400, 'page must be a positive integer and limit must be between 1 and 50.')
    }
    return { page, limit }
}

function apiStatusToDb(status) {
    return Object.entries(STATUS_TO_API).find(([, apiStatus]) => apiStatus === status)?.[0]
}

router.get('/applications', authenticate, allowRoles('officer', 'admin'), asyncHandler(async (req, res) => {
    const { page, limit } = parsePage(req.query)
    const where = {
        status: { not: 'Draft' },
        ...(req.user.role === 'officer' ? { assignedOfficerId: req.user.id } : {}),
    }

    if (req.query.status !== undefined) {
        if (typeof req.query.status !== 'string') throw httpError(400, 'status must be a single API status value.')
        const status = apiStatusToDb(req.query.status)
        if (!status) throw httpError(400, 'Unsupported application status.')
        if (status === 'Draft') {
            throw httpError(400, 'Draft applications are not part of the review queue.')
        }
        where.status = status
    }

    if (req.query.categoryCode !== undefined) {
        if (typeof req.query.categoryCode !== 'string' || !req.query.categoryCode.trim() || req.query.categoryCode.length > 50) {
            throw httpError(400, 'categoryCode must be a non-empty string of 50 characters or fewer.')
        }
        where.ayushDomain = req.query.categoryCode.trim()
    }

    if (req.query.search !== undefined) {
        if (typeof req.query.search !== 'string' || req.query.search.trim().length > 100) {
            throw httpError(400, 'search must be a string of 100 characters or fewer.')
        }
        const search = req.query.search.trim()
        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { startup: { is: { legalName: { contains: search, mode: 'insensitive' } } } },
            ]
        }
    }

    const [total, applications] = await prisma.$transaction([
        prisma.application.count({ where }),
        prisma.application.findMany({
            where,
            include: {
                category: true,
                startup: { select: { legalName: true, brandName: true } },
                assignedOfficer: { select: { id: true, fullName: true } },
            },
            orderBy: [{ lastUpdated: 'desc' }, { createdAt: 'desc' }],
            skip: (page - 1) * limit,
            take: limit,
        }),
    ])

    const items = applications.map((application) => ({
        id: application.id,
        trackingNumber: application.id,
        status: STATUS_TO_API[application.status] || application.status,
        legalName: application.startup.legalName,
        startupName: application.startup.legalName,
        brandName: application.startup.brandName,
        categoryCode: application.ayushDomain,
        categoryName: application.category.name,
        state: application.state,
        assignedOfficer: application.assignedOfficer
            ? { id: application.assignedOfficer.id, name: application.assignedOfficer.fullName }
            : null,
        submittedAt: application.submittedAt,
        lastUpdated: application.lastUpdated,
        createdAt: application.createdAt,
    }))

    return res.json({
        success: true,
        data: { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    })
}))

router.get('/officers', authenticate, allowRoles('admin'), asyncHandler(async (req, res) => {
    const officers = await prisma.user.findMany({
        where: { role: 'officer' },
        select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            designation: true,
            department: true,
            assignedStates: true,
            createdAt: true,
        },
        orderBy: { fullName: 'asc' },
    })

    return res.json({
        success: true,
        data: officers.map((officer) => ({
            id: officer.id,
            name: officer.fullName,
            email: officer.email,
            phone: officer.phone,
            designation: officer.designation,
            department: officer.department,
            assignedStates: officer.assignedStates,
            createdAt: officer.createdAt,
        })),
    })
}))

module.exports = router
