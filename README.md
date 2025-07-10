# CiviAI Enhanced - AI-Powered Planning & Permitting Management

**Version:** 2.0.0  
**Author:** Manus AI  
**Date:** January 2025

## 🚀 Project Overview

CiviAI Enhanced is a revolutionary AI-powered planning and permitting solution specifically designed for rural communities. This platform combines advanced document analysis, intelligent missing information detection, conversational AI assistance, and Model Context Protocol (MCP) integration to create a comprehensive solution that addresses the unique challenges facing rural planning departments.

### 🌟 Key Features

- **Advanced Document Analysis**: AI-powered analysis of planning documents with compliance scoring
- **Missing Information Detection**: Intelligent identification of gaps in applications with specific guidance
- **Conversational AI Assistant**: 24/7 support for citizens and planning staff
- **Real-time Compliance Monitoring**: Continuous analysis against current regulations
- **Rural Community Focus**: Designed specifically for small communities with limited resources
- **Cloud-First Architecture**: No local server infrastructure required

### 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **AI Processing**: Python with NLP and document analysis
- **Database**: PostgreSQL (configurable for different environments)
- **Deployment**: Replit-ready with cloud-first design

## 📋 Prerequisites

- Node.js 18+ 
- Python 3.9+
- npm or yarn
- Git

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CiviAI_Enhanced_Complete_Package
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (for production)
DATABASE_URL=your_database_url_here

# AI Services (optional)
OPENAI_API_KEY=your_openai_key_here

# Replit Configuration
REPLIT_DOMAIN=your-replit-domain.replit.co
```

### 4. Development Setup

```bash
# Start development servers (frontend + backend)
npm run dev

# Or start individually:
npm run dev:frontend  # Frontend on http://localhost:3000
npm run dev:backend   # Backend on http://localhost:5000
```

### 5. Build for Production

```bash
# Build both frontend and backend
npm run build

# Start production server
npm start
```

## 🚀 Replit Deployment

### 1. Upload to Replit

1. Create a new Replit project
2. Upload all project files
3. Replit will automatically detect the Node.js environment

### 2. Configure Replit

The project includes Replit-specific configuration files:
- `.replit`: Defines run command and environment
- `replit.nix`: Specifies required system dependencies

### 3. Install Dependencies

In the Replit shell:

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt
```

### 4. Run the Application

Click the "Run" button or use the command:

```bash
npm run dev
```

The application will be available at your Replit URL.

## 📁 Project Structure

```
CiviAI_Enhanced_Complete_Package/
├── src/
│   ├── client/                 # React frontend
│   │   ├── components/         # React components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utility functions
│   │   ├── App.tsx            # Main app component
│   │   └── main.tsx           # React entry point
│   ├── server/                # Node.js backend
│   │   ├── enhanced_routes.ts # API routes
│   │   ├── enhanced_document_analyzer.py # Python AI processor
│   │   └── index.ts           # Server entry point
│   └── shared/                # Shared types and utilities
├── docs/                      # Documentation
├── uploads/                   # File upload directory
├── dist/                      # Build output
├── package.json               # Node.js dependencies
├── requirements.txt           # Python dependencies
├── .replit                    # Replit configuration
├── replit.nix                 # Replit system dependencies
└── README.md                  # This file
```

## 🔧 Configuration

### Frontend Configuration

The frontend uses Vite with the following key configurations:

- **Port**: 3000 (development)
- **API Proxy**: Automatically proxies `/api` requests to backend
- **Build Output**: `dist/client/`

### Backend Configuration

The backend uses Express with the following features:

- **Port**: 5000 (configurable via PORT env var)
- **CORS**: Configured for development and production
- **File Uploads**: 10MB limit, supports PDF, DOC, DOCX, TXT, JPG, PNG
- **Static Files**: Serves uploaded files from `/uploads` directory

### AI Processing Configuration

The Python document analyzer supports:

- **Document Types**: PDF, DOCX, TXT, Images (with OCR)
- **Analysis Features**: Text extraction, compliance checking, missing info detection
- **NLP Models**: Lightweight alternatives compatible with Replit constraints

## 🧪 Testing

```bash
# Run tests
npm test

# Run type checking
npm run type-check

# Run linting
npm run lint
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - List user documents
- `GET /api/documents/:id` - Get document details
- `POST /api/documents/analyze-missing` - Analyze missing information
- `POST /api/documents/submit-missing` - Submit missing information

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Chat
- `POST /api/chat/message` - Send chat message

## 🔒 Security Features

- **Authentication**: Session-based authentication
- **File Validation**: Type and size validation for uploads
- **CORS**: Configured for specific origins
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses

## 🚀 Performance Optimizations

- **Caching**: Intelligent caching for AI analysis results
- **Compression**: Automatic response compression
- **Lazy Loading**: Component and route lazy loading
- **Image Optimization**: Automatic image optimization
- **Bundle Splitting**: Efficient code splitting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- **Documentation**: Check the docs/ directory
- **Issues**: Create an issue in the repository
- **Email**: Contact the development team

## 🔄 Version History

- **v2.0.0** (Current): Enhanced AI capabilities, MCP integration, improved UI
- **v1.0.0**: Initial release with basic document analysis

## 🎯 Roadmap

- [ ] Advanced MCP integration
- [ ] Mobile app development
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Integration with external planning systems
- [ ] Machine learning model improvements

---

**Built with ❤️ for rural communities** 