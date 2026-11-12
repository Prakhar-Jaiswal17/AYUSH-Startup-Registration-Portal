const express = require('express')
const bcrypt = require('bcryptjs')
const { prisma } = require('../db/prisma')
const { authenticate, signToken } = require('../middleware/auth')
const { asyncHandler, httpError, requireFields } = require('../utils/http')
const { userDto } = require('../utils/serializers')
const { recordAudit } = require('../utils/audit')

const router = express.Router()

router.post('/register', asyncHandler(async (req, res) => {
    requireFields(req.body, ['name', 'email', 'password'])
    const name = req.body.name.trim()
    const email = req.body.email.trim().toLowerCase()
    const password = req.body.password
    const phone = typeof req.body.phone === 'string' && req.body.phone.trim() ? req.body.phone.trim() : null
    const fields = {}
    if (name.length > 255) fields.name = 'Must be 255 characters or fewer.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) fields.email = 'Enter a valid email address.'
    if (password.length < 8 || password.length > 72) fields.password = 'Must be between 8 and 72 characters.'
    if (Object.keys(fields).length) throw httpError(422, 'Validation failed', fields)

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({ data: { fullName: name, email, passwordHash, phone, role: 'startup' } })
    const token = signToken(user)
    await recordAudit({ actor: { id: user.id, name: user.fullName, role: user.role }, action: 'USER_REGISTERED', targetEntity: 'User', targetId: user.id })
    return res.status(201).json({ success: true, data: { token, user: userDto(user) } })
}))

router.post('/login', asyncHandler(async (req, res) => {
    requireFields(req.body, ['email', 'password'])
    const email = req.body.email.trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) throw httpError(401, 'Invalid email or password.')
    const token = signToken(user)
    return res.json({ success: true, data: { token, user: userDto(user) } })
}))

router.get('/profile', authenticate, asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user) throw httpError(401, 'Account no longer exists.')
    return res.json({ success: true, data: userDto(user) })
}))

router.post('/logout', authenticate, asyncHandler(async (req, res) => {
    await recordAudit({ actor: req.user, action: 'USER_LOGGED_OUT', targetEntity: 'User', targetId: req.user.id })
    return res.json({ success: true, data: { message: 'Logged out successfully' } })
}))

module.exports = router
