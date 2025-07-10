# CiviAI Enhanced Setup Guide

## Prerequisites Installation

### 1. Install Node.js

**Windows:**
1. Download Node.js from https://nodejs.org/
2. Choose the LTS version (18.x or higher)
3. Run the installer and follow the prompts
4. Verify installation: `node --version` and `npm --version`

**macOS:**
```bash
# Using Homebrew
brew install node

# Or download from https://nodejs.org/
```

**Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

### 2. Install Python

**Windows:**
1. Download Python from https://python.org/
2. Choose Python 3.9 or higher
3. Run installer with "Add to PATH" checked
4. Verify: `python --version`

**macOS:**
```bash
# Using Homebrew
brew install python@3.9

# Or download from https://python.org/
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install python3.9 python3-pip

# CentOS/RHEL
sudo yum install python39 python39-pip
```

## Project Setup

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Create Environment File

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

### 3. Create Required Directories

```bash
# Create uploads directory
mkdir uploads

# Create dist directory
mkdir dist
```

### 4. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or start individually:
npm run dev:frontend  # Frontend on http://localhost:3000
npm run dev:backend   # Backend on http://localhost:5000
```

## Replit Deployment

### 1. Upload to Replit

1. Go to https://replit.com/
2. Create a new project
3. Choose "Node.js" as the template
4. Upload all project files
5. Replit will automatically detect the configuration

### 2. Install Dependencies in Replit

In the Replit shell:

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

In Replit:
1. Go to "Tools" → "Secrets"
2. Add the following secrets:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `REPLIT_DOMAIN`: Your Replit domain

### 4. Run the Application

Click the "Run" button or use:

```bash
npm run dev
```

## Troubleshooting

### Common Issues

**1. Node.js not found**
- Ensure Node.js is installed and in PATH
- Restart terminal/command prompt after installation

**2. Python not found**
- Ensure Python is installed and in PATH
- Use `python3` instead of `python` on some systems

**3. Permission errors**
- Use `sudo` on Linux/macOS for global installations
- Run as administrator on Windows

**4. Port already in use**
- Change PORT in .env file
- Kill existing processes using the port

**5. Module not found errors**
- Run `npm install` again
- Clear npm cache: `npm cache clean --force`

### Replit-Specific Issues

**1. Python packages not installing**
- Use `pip3` instead of `pip`
- Install packages one by one if needed

**2. File upload issues**
- Ensure uploads directory exists
- Check file permissions

**3. CORS errors**
- Update CORS configuration in server/index.ts
- Add your Replit domain to allowed origins

## Verification

After setup, verify the installation:

1. **Frontend**: Visit http://localhost:3000
2. **Backend**: Visit http://localhost:5000/api
3. **Upload Test**: Try uploading a document
4. **AI Analysis**: Check if document analysis works

## Next Steps

1. Review the documentation in the `docs/` directory
2. Explore the API endpoints
3. Customize the configuration for your needs
4. Deploy to production when ready

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the README.md file
3. Check the console/logs for error messages
4. Create an issue in the repository 