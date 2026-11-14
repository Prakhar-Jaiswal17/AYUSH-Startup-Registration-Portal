const jwt = require('jsonwebtoken')
const { prisma } = require('../db/prisma')
const { httpError } = require('../utils/http')

const API_ROLES = { startup: 'STARTUP', officer: 'OFFICER', admin: 'ADMIN' }

function signToken(user) {
    const secret = process.env.JWT_SECRET
    if (!secret || Buffer.byteLength(secret) < 32) throw httpError(500, 'JWT_SECRET must contain at least 32 bytes.')
    return jwt.sign({ id: user.id, email: user.email, role: API_ROLES[user.role], name: user.fullName }, secret, {
        expiresIn: '30d',
        issuer: 'ayush-startup-portal',
        audience: 'ayush-portal-client',
    })
}

function authenticate(req, res, next) {
    let payload
    try {
        const match = (req.get('authorization') || '').match(/^Bearer\s+([^\s]+)$/i)
        if (!match) throw httpError(401, 'Authentication required.')
        const secret = process.env.JWT_SECRET
        if (!secret || Buffer.byteLength(secret) < 32) throw httpError(500, 'JWT_SECRET must contain at least 32 bytes.')
        payload = jwt.verify(match[1], secret, {
            algorithms: ['HS256'], issuer: 'ayush-startup-portal', audience: 'ayush-portal-client',
        })
    } catch (error) {
        return next(error.status ? error : httpError(401, 'Invalid or expired token.'))
    }

    if (!payload.id) return next(httpError(401, 'Invalid or expired token.'))
    return prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, email: true, fullName: true, role: true },
    }).then((user) => {
        const role = user && API_ROLES[user.role] ? user.role : null
        if (!user || !role) return next(httpError(401, 'Account no longer exists or has an invalid role.'))
        req.user = { id: user.id, email: user.email, name: user.fullName, role }
        return next()
    }).catch(next)
}

function allowRoles(...roles) {
    return (req, res, next) => req.user && roles.includes(req.user.role)
        ? next()
        : next(httpError(403, 'You do not have permission to perform this action.'))
}

module.exports = { authenticate, allowRoles, API_ROLES, signToken }
