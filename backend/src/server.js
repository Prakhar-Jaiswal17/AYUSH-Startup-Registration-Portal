const express = require('express')
const cors = require('cors')
require('dotenv').config()

const resourceRoutes = require('./routes/resources')
const authRoutes = require('./routes/auth')
const startupRoutes = require('./routes/startups').router
const applicationRoutes = require('./routes/applications')
const officerRoutes = require('./routes/officer')
const queryRoutes = require('./routes/queries')
const notificationRoutes = require('./routes/notifications')
const { sendError, httpError } = require('./utils/http')

const app = express()
const port = Number(process.env.PORT) || 3005
const configuredOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

app.use(cors({
    origin: [...new Set([configuredOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'])],
}))
app.use(express.json({ limit: '1mb' }))
app.use('/api/auth', authRoutes)
app.use('/api/startups', startupRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api', queryRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/officer', officerRoutes)
app.use('/api/resources', resourceRoutes)

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' })
})

app.use((req, res, next) => next(httpError(404, 'API endpoint not found.')))
app.use((error, req, res, next) => sendError(res, error))

app.listen(port, () => {
    console.log(`Server started on port ${port}`)
})
