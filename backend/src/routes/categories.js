const express = require('express')
const { prisma } = require('../db/prisma')
const { asyncHandler } = require('../utils/http')

const router = express.Router()

router.get('/', asyncHandler(async (req, res) => {
    const categories = await prisma.ayushCategory.findMany({
        where: { isActive: true },
        select: { code: true, name: true, description: true },
        orderBy: { name: 'asc' },
    })

    return res.json({ success: true, data: categories })
}))

module.exports = router
