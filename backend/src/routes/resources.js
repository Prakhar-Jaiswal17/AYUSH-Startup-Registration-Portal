const express = require('express')

const router = express.Router()

// Static content is used because the current PostgreSQL schema has no Resource model.
const resources = [
    {
        id: 'res_001',
        title: 'Ministry of AYUSH — Official Portal',
        category: 'Government Portal',
        summary: 'Access official guidelines, policies, and notifications from the Ministry of AYUSH, Government of India.',
        url: 'https://ayush.gov.in',
        publishedAt: null,
    },
    {
        id: 'res_002',
        title: 'Startup India Portal',
        category: 'Startup Support',
        summary: 'Register your startup, access funding support, tax exemptions, and connect with the startup ecosystem.',
        url: 'https://www.startupindia.gov.in',
        publishedAt: null,
    },
    {
        id: 'res_003',
        title: 'AYUSH Research Portal',
        category: 'Research',
        summary: 'Explore research publications, clinical trials, and evidence-based studies in AYUSH medicine systems.',
        url: 'https://ayushresearchportal.com',
        publishedAt: null,
    },
    {
        id: 'res_004',
        title: 'National AYUSH Mission',
        category: 'Government Scheme',
        summary: 'Learn about the National AYUSH Mission for promoting AYUSH systems of medicine through cost-effective services.',
        url: 'https://nam.ayush.gov.in',
        publishedAt: null,
    },
    {
        id: 'res_005',
        title: 'DPIIT Recognition Guidelines',
        category: 'Startup Support',
        summary: 'Understand the process and eligibility criteria for DPIIT startup recognition and its benefits.',
        url: 'https://dpiit.gov.in',
        publishedAt: null,
    },
    {
        id: 'res_006',
        title: 'Central Council for Research in Ayurvedic Sciences',
        category: 'Research',
        summary: 'Research body for Ayurveda under the Ministry of AYUSH, conducting scientific research and clinical studies.',
        url: 'https://ccras.nic.in',
        publishedAt: null,
    },
    {
        id: 'res_007',
        title: 'AYUSH Startup Registration Guide',
        category: 'Guide',
        summary: 'A comprehensive guide covering all steps required for registering an AYUSH startup on the AYUSH Setu platform.',
        url: '#',
        publishedAt: null,
    },
    {
        id: 'res_008',
        title: 'FSSAI Licensing for AYUSH Products',
        category: 'Regulatory',
        summary: 'Information about FSSAI licensing requirements for AYUSH food and supplement products.',
        url: 'https://fssai.gov.in',
        publishedAt: null,
    },
    {
        id: 'res_009',
        title: 'GMP Guidelines for AYUSH Manufacturing',
        category: 'Regulatory',
        summary: 'Good Manufacturing Practice guidelines applicable to AYUSH drug manufacturing units.',
        url: '#',
        publishedAt: null,
    },
    {
        id: 'res_010',
        title: 'AYUSH Export Promotion Council',
        category: 'Startup Support',
        summary: 'Support and guidance for AYUSH startups looking to export products and services internationally.',
        url: '#',
        publishedAt: null,
    },
]

function parsePositiveInteger(value, fallback) {
    if (value === undefined) return fallback
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null

    const parsed = Number(value)
    return Number.isSafeInteger(parsed) ? parsed : null
}

router.get('/', (req, res) => {
    const page = parsePositiveInteger(req.query.page, 1)
    const limit = parsePositiveInteger(req.query.limit, 10)
    const { category, search } = req.query

    if (page === null || limit === null || limit > 50) {
        return res.status(400).json({
            success: false,
            error: 'page must be a positive integer and limit must be between 1 and 50.',
        })
    }

    if ((category !== undefined && typeof category !== 'string')
        || (search !== undefined && typeof search !== 'string')) {
        return res.status(400).json({
            success: false,
            error: 'category and search must be single text values.',
        })
    }

    const normalizedCategory = category?.trim().toLocaleLowerCase()
    const normalizedSearch = search?.trim().toLocaleLowerCase()

    const filteredResources = resources.filter((resource) => {
        const matchesCategory = !normalizedCategory
            || resource.category.toLocaleLowerCase() === normalizedCategory
        const searchableText = `${resource.title} ${resource.category} ${resource.summary}`.toLocaleLowerCase()
        const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch)

        return matchesCategory && matchesSearch
    })

    const total = filteredResources.length
    const startIndex = (page - 1) * limit

    return res.json({
        success: true,
        data: {
            items: filteredResources.slice(startIndex, startIndex + limit),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        },
    })
})

router.get('/:id', (req, res) => {
    const resource = resources.find((item) => item.id === req.params.id)

    if (!resource) {
        return res.status(404).json({
            success: false,
            error: 'Resource not found.',
        })
    }

    return res.json({ success: true, data: resource })
})

module.exports = router
