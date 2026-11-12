require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const categories = [
    { code: 'AYURVEDA', name: 'Ayurveda', description: 'AYUSH application category: Ayurveda.' },
    { code: 'YOGA_NATUROPATHY', name: 'Yoga & Naturopathy', description: 'AYUSH application category: Yoga & Naturopathy.' },
    { code: 'UNANI', name: 'Unani', description: 'AYUSH application category: Unani.' },
    { code: 'SIDDHA', name: 'Siddha', description: 'AYUSH application category: Siddha.' },
    { code: 'HOMOEOPATHY', name: 'Homoeopathy', description: 'AYUSH application category: Homoeopathy.' },
]

async function main() {
    const result = await prisma.ayushCategory.createMany({ data: categories, skipDuplicates: true })
    console.log(`Inserted ${result.count} missing AYUSH categories; existing rows were preserved.`)
}

main()
    .catch(error => { console.error('Database seed failed:', error.message); process.exitCode = 1 })
    .finally(async () => { await prisma.$disconnect(); await pool.end() })
