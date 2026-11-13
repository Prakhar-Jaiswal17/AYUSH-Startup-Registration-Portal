const express = require('express')
const { prisma } = require('../db/prisma')
const { authenticate, allowRoles } = require('../middleware/auth')
const { asyncHandler, httpError, requireFields, requireObjectBody } = require('../utils/http')
const { startupDto } = require('../utils/serializers')
const { recordAudit } = require('../utils/audit')

const router = express.Router()
const startupInclude = { founders: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] } }
const optionalStrings = ['legalName', 'brandName', 'incorporationType', 'registrationNumber', 'officialEmail', 'website', 'description', 'products', 'businessStage', 'targetMarket', 'operationalStatus', 'state', 'city', 'dpiitNumber']
const stringArrays = ['businessActivities', 'existingLicences']

function parseStartupInput(body, current = null, isCreate = false) {
    const data = {}
    for (const key of optionalStrings) {
        if (body[key] !== undefined) {
            if (typeof body[key] !== 'string' || !body[key].trim()) throw httpError(422, 'Validation failed', { [key]: 'Must be a non-empty string.' })
            data[key] = body[key].trim()
        }
    }
    for (const key of stringArrays) {
        if (body[key] !== undefined) {
            if (!Array.isArray(body[key]) || body[key].some(value => typeof value !== 'string')) throw httpError(422, 'Validation failed', { [key]: 'Must be an array of strings.' })
            data[key] = body[key].map(value => value.trim()).filter(Boolean)
        }
    }
    if (body.dpiitRecognized !== undefined) {
        if (typeof body.dpiitRecognized !== 'boolean') throw httpError(422, 'Validation failed', { dpiitRecognized: 'Must be true or false.' })
        data.dpiitRecognized = body.dpiitRecognized
    }
    if (body.incorporationDate !== undefined) {
        if (body.incorporationDate === null || body.incorporationDate === '') data.incorporationDate = null
        else {
            const date = new Date(body.incorporationDate)
            if (Number.isNaN(date.getTime())) throw httpError(422, 'Validation failed', { incorporationDate: 'Enter a valid date.' })
            data.incorporationDate = date
        }
    }
    const domain = body.ayushDomain ?? body.categoryCode
    if (domain !== undefined) data.ayushDomain = domain
    if (isCreate) {
        if (!current) requireFields(data, ['legalName', 'brandName', 'ayushDomain', 'state'])
        else {
            for (const field of ['legalName', 'brandName', 'ayushDomain', 'state']) if (data[field] === undefined) data[field] = current[field]
            requireFields(data, ['legalName', 'brandName', 'ayushDomain', 'state'])
        }
    }
    return data
}

function parseFounders(founders) {
    if (founders === undefined) return undefined
    if (!Array.isArray(founders)) throw httpError(422, 'Validation failed', { founders: 'Must be an array.' })
    if (founders.length > 20) throw httpError(422, 'Validation failed', { founders: 'A maximum of 20 founders is allowed.' })
    return founders.map((founder, index) => {
        if (!founder || typeof founder !== 'object' || Array.isArray(founder)) throw httpError(422, 'Validation failed', { [`founders.${index}`]: 'Must be an object.' })
        const fields = {}
        for (const key of ['name', 'designation', 'email', 'phone', 'qualification']) {
            if (typeof founder[key] !== 'string' || !founder[key].trim()) fields[`founders.${index}.${key}`] = 'This field is required.'
        }
        if (Object.keys(fields).length) throw httpError(422, 'Validation failed', fields)
        return { name: founder.name.trim(), designation: founder.designation.trim(), email: founder.email.trim().toLowerCase(), phone: founder.phone.trim(), qualification: founder.qualification.trim(), isPrimary: founder.isPrimary === true }
    })
}

async function findOwnedStartup(userId) {
    return prisma.startup.findUnique({ where: { userId }, include: startupInclude })
}

async function saveFounders(tx, startupId, founders) {
    if (founders === undefined) return
    await tx.founder.deleteMany({ where: { startupId } })
    if (founders.length) await tx.founder.createMany({ data: founders.map(founder => ({ ...founder, startupId })) })
}

router.get('/me', authenticate, allowRoles('startup'), asyncHandler(async (req, res) => {
    const startup = await findOwnedStartup(req.user.id)
    if (!startup) throw httpError(404, 'Startup profile has not been created yet.')
    return res.json({ success: true, data: startupDto(startup) })
}))

router.put('/me', authenticate, allowRoles('startup'), asyncHandler(async (req, res) => {
    requireObjectBody(req.body)
    const founders = parseFounders(req.body.founders)
    const existing = await prisma.startup.findUnique({ where: { userId: req.user.id } })
    const data = parseStartupInput(req.body, existing, true)
    if (data.ayushDomain) {
        const category = await prisma.ayushCategory.findUnique({ where: { code: data.ayushDomain } })
        if (!category || !category.isActive) throw httpError(422, 'Unknown or inactive AYUSH category code.', { ayushDomain: 'Choose an active AYUSH category code.' })
    }
    const startup = await prisma.$transaction(async tx => {
        const saved = existing
            ? await tx.startup.update({ where: { id: existing.id }, data })
            : await tx.startup.create({ data: { ...data, userId: req.user.id } })
        await saveFounders(tx, saved.id, founders)
        return tx.startup.findUnique({ where: { id: saved.id }, include: startupInclude })
    })
    await recordAudit({ actor: req.user, action: existing ? 'STARTUP_PROFILE_UPDATED' : 'STARTUP_PROFILE_CREATED', targetEntity: 'Startup', targetId: startup.id })
    return res.json({ success: true, data: startupDto(startup) })
}))

router.get('/:id', authenticate, asyncHandler(async (req, res) => {
    const startup = await prisma.startup.findUnique({ where: { id: req.params.id }, include: startupInclude })
    if (!startup) throw httpError(404, 'Startup profile not found.')
    if (req.user.role === 'startup' && startup.userId !== req.user.id) throw httpError(403, 'You may only view your own startup profile.')
    if (!['startup', 'officer', 'admin'].includes(req.user.role)) throw httpError(403, 'You do not have permission to view this profile.')
    return res.json({ success: true, data: startupDto(startup) })
}))

router.put('/:id', authenticate, allowRoles('startup'), asyncHandler(async (req, res) => {
    requireObjectBody(req.body)
    const existing = await prisma.startup.findUnique({ where: { id: req.params.id } })
    if (!existing) throw httpError(404, 'Startup profile not found.')
    if (existing.userId !== req.user.id) throw httpError(403, 'You may only update your own startup profile.')
    const founders = parseFounders(req.body.founders)
    const data = parseStartupInput(req.body)
    if (data.ayushDomain) {
        const category = await prisma.ayushCategory.findUnique({ where: { code: data.ayushDomain } })
        if (!category || !category.isActive) throw httpError(422, 'Unknown or inactive AYUSH category code.', { ayushDomain: 'Choose an active AYUSH category code.' })
    }
    const startup = await prisma.$transaction(async tx => {
        await tx.startup.update({ where: { id: existing.id }, data })
        await saveFounders(tx, existing.id, founders)
        return tx.startup.findUnique({ where: { id: existing.id }, include: startupInclude })
    })
    await recordAudit({ actor: req.user, action: 'STARTUP_PROFILE_UPDATED', targetEntity: 'Startup', targetId: startup.id })
    return res.json({ success: true, data: startupDto(startup) })
}))

module.exports = { router, parseStartupInput, parseFounders, saveFounders, startupInclude }
