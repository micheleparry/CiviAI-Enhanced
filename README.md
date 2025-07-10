# CiviAI Enhanced 🌲

**AI-Powered Planning & Permitting Management for Rural Communities with Oregon MCP Integration**

[![CI/CD](https://github.com/micheleparry/CiviAI-Enhanced/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/micheleparry/CiviAI-Enhanced/actions)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-blue)](https://micheleparry.github.io/CiviAI-Enhanced/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Live Demos

- **[Interactive Demo](https://micheleparry.github.io/CiviAI-Enhanced/)** - Full CiviAI Enhanced experience
- **[Oregon MCP Dashboard](https://micheleparry.github.io/CiviAI-Enhanced/index.html)** - Real-time Oregon planning data
- **[Component Testing](https://micheleparry.github.io/CiviAI-Enhanced/components.html)** - UI component showcase
- **[Landing Page](https://micheleparry.github.io/CiviAI-Enhanced/landing.html)** - Main application landing

## 📋 Overview

CiviAI Enhanced is a comprehensive AI-powered platform designed specifically for rural communities to manage planning and permitting processes. The system integrates with Oregon's Model Context Protocol (MCP) to provide real-time access to statewide planning goals, DLCD updates, and compliance monitoring.

### 🌟 Key Features

- **🤖 AI-Powered Document Analysis** - Intelligent compliance checking and missing information detection
- **🌲 Oregon MCP Integration** - Real-time access to Oregon DLCD planning data
- **📊 Interactive Dashboard** - Comprehensive overview of applications and compliance status
- **💬 Conversational AI Assistant** - 24/7 support for citizens and planning staff
- **🔔 Automated Notifications** - Real-time alerts for updates and compliance issues
- **🔐 VPN Integration** - Secure access to government resources
- **📱 Responsive Design** - Works on desktop, tablet, and mobile devices

## 🏗️ Architecture

```
CiviAI Enhanced/
├── 📁 Frontend (React + TypeScript)
│   ├── Dashboard components
│   ├── Oregon MCP integration
│   ├── Document analysis interface
│   └── AI assistant chat
├── 📁 Backend (Node.js + Express)
│   ├── API routes and services
│   ├── Oregon MCP monitoring
│   ├── Document processing
│   └── Database management
├── 📁 AI Services (Python)
│   ├── Document analysis engine
│   ├── Compliance checking
│   └── Natural language processing
└── 📁 Documentation
    ├── Setup guides
    ├── API documentation
    └── Integration guides
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Python 3.9+
- PostgreSQL (for production)
- VPN connection for Oregon government access

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/micheleparry/CiviAI-Enhanced.git
   cd CiviAI-Enhanced
   ```

2. **Install dependencies**
   ```bash
   # Install Node.js dependencies
   npm install
   
   # Install Python dependencies
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   # Copy environment template
   cp env.example .env
   
   # Configure Oregon MCP settings
   cp env.oregon.example .env.oregon
   ```

4. **Set up database**
   ```bash
   # Run Oregon MCP database setup
   psql -f src/server/mcp/oregon-database.sql
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

## 🌲 Oregon MCP Integration

The Oregon MCP integration provides real-time access to:

- **Statewide Planning Goals** - All 19 Oregon planning goals
- **DLCD Updates** - Real-time monitoring of Oregon Department of Land Conservation and Development
- **Compliance Monitoring** - Automated checking against current regulations
- **Document Analysis** - AI-powered review of planning documents

### Configuration

```bash
# Set up Oregon MCP monitoring
./setup-oregon-mcp.sh

# Configure update frequency
export OREGON_UPDATE_FREQUENCY=15m
export OREGON_NOTIFICATION_EMAIL=your-email@example.com
```

## 📊 Dashboard Features

- **Real-time Statistics** - Application counts, completion rates, pending reviews
- **Oregon Data Integration** - Live DLCD updates and compliance metrics
- **Document Analysis** - AI-powered compliance checking
- **Activity Feed** - Recent actions and system updates
- **Quick Actions** - One-click document analysis and data updates

## 🔧 Development

### Project Structure

```
src/
├── client/                 # React frontend
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utility libraries
├── server/               # Node.js backend
│   ├── mcp/              # Oregon MCP integration
│   ├── routes/           # API endpoints
│   └── services/         # Business logic
└── shared/               # Shared types and utilities
```

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm run test             # Run test suite
npm run test:watch       # Run tests in watch mode
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript checks

# Oregon MCP
npm run oregon:setup     # Set up Oregon MCP
npm run oregon:monitor   # Start monitoring service
npm run oregon:test      # Test Oregon MCP connection
```

## 🧪 Testing

### Automated Testing

The project includes comprehensive testing:

- **Unit Tests** - Component and service testing
- **Integration Tests** - API endpoint testing
- **E2E Tests** - Full application workflow testing
- **Security Tests** - Vulnerability scanning and audit

### Manual Testing

```bash
# Test Oregon MCP connection
python test-python.py

# Test component rendering
open test-components.html

# Test enhanced demo
open enhanced-demo.html
```

## 📚 Documentation

- **[Setup Guide](setup.md)** - Complete installation instructions
- **[Oregon MCP Setup](OREGON_MCP_SETUP_GUIDE.md)** - Oregon integration guide
- **[Testing Guide](TESTING_GUIDE.md)** - Testing procedures and examples
- **[API Documentation](API_DOCUMENTATION.md)** - Backend API reference
- **[Troubleshooting](OREGON_MCP_DEBUGGING_GUIDE.md)** - Common issues and solutions

## 🔐 Security

- **VPN Integration** - Secure access to government resources
- **Environment Variables** - Secure configuration management
- **Input Validation** - Comprehensive data validation
- **Security Audits** - Automated vulnerability scanning
- **HTTPS Enforcement** - Secure communication protocols

## 🌐 Deployment

### GitHub Pages (Demo)

The project automatically deploys demos to GitHub Pages:

- **Live Demo**: https://micheleparry.github.io/CiviAI-Enhanced/
- **Auto-deployment** on every push to master
- **Multiple demo environments** for different features

### Production Deployment

```bash
# Build for production
npm run build

# Deploy to your preferred platform
# - Vercel
# - Netlify
# - AWS
# - Azure
# - Google Cloud
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Oregon DLCD** - For providing access to planning data
- **Model Context Protocol** - For enabling real-time data integration
- **Rural Communities** - For inspiring this solution
- **Open Source Community** - For the amazing tools and libraries

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/micheleparry/CiviAI-Enhanced/wiki)
- **Issues**: [GitHub Issues](https://github.com/micheleparry/CiviAI-Enhanced/issues)
- **Discussions**: [GitHub Discussions](https://github.com/micheleparry/CiviAI-Enhanced/discussions)
- **Email**: mparry@shadycove.org

---

**Built with ❤️ for rural communities and sustainable development** 