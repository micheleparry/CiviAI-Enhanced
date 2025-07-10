#!/usr/bin/env node

/**
 * CiviAI Enhanced Setup Test Script
 * This script tests the basic project structure and configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing CiviAI Enhanced Setup...\n');

// Test 1: Check if required files exist
const requiredFiles = [
  'package.json',
  'requirements.txt',
  'vite.config.ts',
  'tsconfig.json',
  'tailwind.config.js',
  'src/client/main.tsx',
  'src/client/App.tsx',
  'src/server/index.ts',
  'src/server/enhanced_routes.ts',
  'src/server/enhanced_document_analyzer.py',
  'src/shared/schema.ts',
  '.replit',
  'replit.nix'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

// Test 2: Check if required directories exist
const requiredDirs = [
  'src',
  'src/client',
  'src/client/components',
  'src/client/pages',
  'src/client/hooks',
  'src/client/lib',
  'src/server',
  'src/shared',
  'uploads',
  'dist'
];

console.log('\n📂 Checking required directories...');
let allDirsExist = true;

requiredDirs.forEach(dir => {
  const exists = fs.existsSync(dir);
  console.log(`  ${exists ? '✅' : '❌'} ${dir}/`);
  if (!exists) allDirsExist = false;
});

// Test 3: Check package.json structure
console.log('\n📦 Checking package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const hasRequiredScripts = packageJson.scripts && 
    packageJson.scripts.dev && 
    packageJson.scripts.build;
  
  console.log(`  ${hasRequiredScripts ? '✅' : '❌'} Required scripts found`);
  console.log(`  📋 Project name: ${packageJson.name}`);
  console.log(`  📋 Version: ${packageJson.version}`);
  
  if (!hasRequiredScripts) allFilesExist = false;
} catch (error) {
  console.log('  ❌ Error reading package.json');
  allFilesExist = false;
}

// Test 4: Check Python requirements
console.log('\n🐍 Checking Python requirements...');
try {
  const requirements = fs.readFileSync('requirements.txt', 'utf8');
  const hasCoreDeps = requirements.includes('PyPDF2') && 
    requirements.includes('python-docx') && 
    requirements.includes('nltk');
  
  console.log(`  ${hasCoreDeps ? '✅' : '❌'} Core Python dependencies found`);
} catch (error) {
  console.log('  ❌ Error reading requirements.txt');
  allFilesExist = false;
}

// Test 5: Check Replit configuration
console.log('\n🚀 Checking Replit configuration...');
const replitExists = fs.existsSync('.replit');
const replitNixExists = fs.existsSync('replit.nix');

console.log(`  ${replitExists ? '✅' : '❌'} .replit configuration`);
console.log(`  ${replitNixExists ? '✅' : '❌'} replit.nix dependencies`);

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 SETUP TEST SUMMARY');
console.log('='.repeat(50));

if (allFilesExist && allDirsExist) {
  console.log('🎉 All tests passed! Your CiviAI Enhanced project is ready.');
  console.log('\n📋 Next steps:');
  console.log('  1. Install Node.js dependencies: npm install');
  console.log('  2. Install Python dependencies: pip install -r requirements.txt');
  console.log('  3. Create .env file from env.example');
  console.log('  4. Start development: npm run dev');
  console.log('\n🚀 For Replit deployment:');
  console.log('  1. Upload all files to Replit');
  console.log('  2. Install dependencies in Replit shell');
  console.log('  3. Configure environment variables');
  console.log('  4. Click Run button');
} else {
  console.log('❌ Some tests failed. Please check the missing files/directories above.');
  console.log('\n🔧 To fix:');
  console.log('  1. Ensure all required files are present');
  console.log('  2. Check file permissions');
  console.log('  3. Verify project structure');
}

console.log('\n📚 For detailed setup instructions, see:');
console.log('  - README.md');
console.log('  - setup.md');
console.log('  - env.example');

console.log('\n' + '='.repeat(50)); 