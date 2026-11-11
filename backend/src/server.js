const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
const port = Number(process.env.PORT) || 3005

app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
}))
app.use(express.json())

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' })
})

app.listen(port, () => {
    console.log(`Server started on port ${port}`)
})
