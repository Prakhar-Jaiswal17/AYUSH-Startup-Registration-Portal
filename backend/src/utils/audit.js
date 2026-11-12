const { prisma } = require('../db/prisma')

async function recordAudit({ actor, action, targetEntity, targetId, details = '' }) {
    try {
        await prisma.auditLog.create({ data: {
            actorId: actor?.id || null,
            actorName: actor?.name || 'System',
            actorRole: actor?.role || 'system',
            action,
            targetEntity,
            targetId: String(targetId),
            details,
        } })
    } catch (error) {
        console.error('Audit event could not be recorded:', error.message)
    }
}

module.exports = { recordAudit }
