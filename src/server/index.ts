import express from 'express'
import cors from 'cors'
import path from 'path'
import { registerRoutes } from './enhanced_routes'
import oregonRoutes from './mcp/oregon-routes'
import { OregonMonitoringService } from './mcp/oregon-monitoring.service'

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-replit-domain.replit.co'] 
    : ['http://localhost:3000'],
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// Register API routes
const server = await registerRoutes(app)

// Register Oregon MCP routes
app.use('/api/oregon', oregonRoutes)

// Initialize Oregon monitoring service
const oregonMonitoring = new OregonMonitoringService()
oregonMonitoring.startMonitoring()

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(process.cwd(), 'dist/client')))
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist/client', 'index.html'))
  })
}

// Start server
server.listen(PORT, () => {
  console.log(`🚀 CiviAI Enhanced Server running on port ${PORT}`)
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`)
  console.log(`🔧 API: http://localhost:${PORT}/api`)
})

export default app 