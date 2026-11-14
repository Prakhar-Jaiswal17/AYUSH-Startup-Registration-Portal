const express = require('express')

const router = express.Router()

// Static content is used because the current PostgreSQL schema has no Resource model.
const resources = [
    {
        id: 'res_001',
        title: 'Ministry of AYUSH — Official Portal',
        category: 'Government Portal',
        summary: 'Access official guidelines, policies, and notifications from the Ministry of AYUSH, Government of India.',
        description: 'Access official guidelines, policies, and notifications from the Ministry of AYUSH, Government of India.',
        url: 'https://ayush.gov.in',
        type: 'official',
        isAvailable: true,
        publishedAt: null,
    },
    {
        id: 'res_002',
        title: 'Startup India Portal',
        category: 'Startup Support',
        summary: 'Register your startup, access funding support, tax exemptions, and connect with the startup ecosystem.',
        description: 'Register your startup, access funding support, tax exemptions, and connect with the startup ecosystem.',
        url: 'https://www.startupindia.gov.in',
        type: 'official',
        isAvailable: true,
        publishedAt: null,
    },
    {
        id: 'res_003',
        title: 'AYUSH Research Portal',
        category: 'Research',
        summary: 'Explore research publications, clinical trials, and evidence-based studies in AYUSH medicine systems.',
        description: 'Explore research publications, clinical trials, and evidence-based studies in AYUSH medicine systems.',
        url: 'https://ayushportal.nic.in',
        type: 'official',
        isAvailable: true,
        publishedAt: null,
    },
    {
        id: 'res_004',
        title: 'National AYUSH Mission',
        category: 'Government Scheme',
        summary: 'Learn about the National AYUSH Mission for promoting AYUSH systems of medicine through cost-effective services.',
        description: 'Learn about the National AYUSH Mission for promoting AYUSH systems of medicine through cost-effective services.',
        url: 'https://nam.ayush.gov.in',
        type: 'official',
        isAvailable: true,
        publishedAt: null,
    },
    {
        id: 'res_005',
        title: 'DPIIT Recognition Guidelines',
        category: 'Startup Support',
        summary: 'Understand the process and eligibility criteria for DPIIT startup recognition and its benefits.',
        description: 'Understand the process and eligibility criteria for DPIIT startup recognition and its benefits.',
        url: 'https://www.startupindia.gov.in',
        type: 'official',
        isAvailable: true,
        publishedAt: null,
    },
    {
        id: 'res_006',
        title: 'Central Council for Research in Ayurvedic Sciences',
        category: 'Research',
        summary: 'Research body for Ayurveda under the Ministry of AYUSH, conducting scientific research and clinical studies.',
        description: 'Research body for Ayurveda under the Ministry of AYUSH, conducting scientific research and clinical studies.',
        url: 'https://ccras.nic.in',
        type: 'official',
        isAvailable: true,
        publishedAt: null,
    },
    {
        id: 'res_007',
        title: 'AYUSH Startup Registration Guide',
        category: 'Guide',
        summary: 'A comprehensive step-by-step walkthrough covering registration wizard steps, document requirements, and verification workflows on the AYUSH portal.',
        description: 'A comprehensive step-by-step walkthrough covering registration wizard steps, document requirements, and verification workflows on the AYUSH portal.',
        url: '/how-it-works',
        type: 'internal',
        isAvailable: true,
        publishedAt: null,
    },
    {
        id: 'res_008',
        title: 'FSSAI Licensing for AYUSH Products',
        category: 'Regulatory',
        summary: 'Information and compliance guidelines for food and dietary supplement manufacturing licensing via FoSCoS.',
        description: 'Information and compliance guidelines for food and dietary supplement manufacturing licensing via FoSCoS.',
        url: 'https://foscos.fssai.gov.in',
        type: 'official',
        isAvailable: true,
        publishedAt: null,
    },
    {
        id: 'res_009',
        title: 'GMP Guidelines for AYUSH Manufacturing',
        category: 'Regulatory',
        summary: 'Good Manufacturing Practice standards (Schedule T) and electronic licensing procedures for Ayurvedic, Siddha, and Unani drugs via e-Aushadhi.',
        description: 'Good Manufacturing Practice standards (Schedule T) and electronic licensing procedures for Ayurvedic, Siddha, and Unani drugs via e-Aushadhi.',
        url: 'https://e-aushadhi.gov.in',
        type: 'official',
        isAvailable: true,
        publishedAt: null,
    },
    {
        id: 'res_010',
        title: 'AYUSH Export Promotion Council',
        category: 'Startup Support',
        summary: 'Support, international compliance guidance, and global market promotion for AYUSH startups via AYUSHEXCIL.',
        description: 'Support, international compliance guidance, and global market promotion for AYUSH startups via AYUSHEXCIL.',
        url: 'https://ayushexcil.in',
        type: 'official',
        isAvailable: true,
        publishedAt: null,
    },
    {
        id: 'res_011',
        title: 'Clinical Trial Registry — India (CTRI) AYUSH Guidelines',
        category: 'Research',
        summary: 'Protocols and regulatory requirements for clinical trials in traditional Indian medicine. Detailed documentation is currently under review.',
        description: 'Protocols and regulatory requirements for clinical trials in traditional Indian medicine. Detailed documentation is currently under review.',
        url: null,
        type: 'official',
        isAvailable: false,
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
    const { category, search, sortBy, order } = req.query

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

    if (sortBy !== undefined && !['title', 'category'].includes(sortBy.toLowerCase())) {
        return res.status(400).json({
            success: false,
            error: 'sortBy must be either "title" or "category".',
        })
    }

    const normalizedCategory = category?.trim().toLocaleLowerCase()
    const normalizedSearch = search?.trim().toLocaleLowerCase()

    const filteredResources = resources.filter((resource) => {
        const matchesCategory = !normalizedCategory
            || normalizedCategory === 'all'
            || resource.category.toLocaleLowerCase() === normalizedCategory
        const searchableText = `${resource.title} ${resource.category} ${resource.summary} ${resource.description || ''}`.toLocaleLowerCase()
        const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch)

        return matchesCategory && matchesSearch
    })

    let sortedResources = [...filteredResources]
    if (sortBy) {
        const field = sortBy.toLowerCase()
        const isDesc = order?.toLowerCase() === 'desc'
        sortedResources.sort((a, b) => {
            const comparison = a[field].localeCompare(b[field])
            return isDesc ? -comparison : comparison
        })
    }

    const total = sortedResources.length
    const startIndex = (page - 1) * limit

    return res.json({
        success: true,
        data: {
            items: sortedResources.slice(startIndex, startIndex + limit),
            pagination: {
                page,
                limit,
                total,
                totalPages: total === 0 ? 0 : Math.ceil(total / limit),
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
