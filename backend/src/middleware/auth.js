const jwt = require('jsonwebtoken')
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
    try {
        const match = (req.get('authorization') || '').match(/^Bearer\s+([^\s]+)$/i)
        if (!match) throw httpError(401, 'Authentication required.')
        const secret = process.env.JWT_SECRET
        if (!secret || Buffer.byteLength(secret) < 32) throw httpError(500, 'JWT_SECRET must contain at least 32 bytes.')
        const payload = jwt.verify(match[1], secret, {
            algorithms: ['HS256'], issuer: 'ayush-startup-portal', audience: 'ayush-portal-client',
        })
        const role = Object.keys(API_ROLES).find(key => API_ROLES[key] === payload.role)
        if (!payload.id || !role) throw httpError(401, 'Invalid or expired token.')
        req.user = { id: payload.id, email: payload.email, name: payload.name, role }
        return next()
    } catch (error) {
        return next(error.status ? error : httpError(401, 'Invalid or expired token.'))
    }
}

function allowRoles(...roles) {
    return (req, res, next) => req.user && roles.includes(req.user.role)
        ? next()
        : next(httpError(403, 'You do not have permission to perform this action.'))
}

module.exports = { authenticate, allowRoles, API_ROLES, signToken }
