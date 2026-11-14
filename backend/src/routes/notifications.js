const express = require('express')
const { prisma } = require('../db/prisma')
const { authenticate } = require('../middleware/auth')
const { asyncHandler, httpError } = require('../utils/http')

const router = express.Router()
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

router.get('/', authenticate, asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
        where: { userId: req.user.id },
        select: {
            id: true,
            title: true,
            message: true,
            type: true,
            isRead: true,
            applicationId: true,
            createdAt: true,
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    })

    return res.json({ success: true, data: notifications })
}))

router.patch('/read-all', authenticate, asyncHandler(async (req, res) => {
    const result = await prisma.notification.updateMany({
        where: { userId: req.user.id, isRead: false },
        data: { isRead: true },
    })

    return res.json({ success: true, data: { updatedCount: result.count } })
}))

router.patch('/:id/read', authenticate, asyncHandler(async (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) throw httpError(400, 'Notification ID must be a valid UUID.')

    const result = await prisma.notification.updateMany({
        where: { id: req.params.id, userId: req.user.id },
        data: { isRead: true },
    })
    if (result.count !== 1) throw httpError(404, 'Notification not found.')

    return res.json({ success: true, data: { id: req.params.id, isRead: true } })
}))

module.exports = router
