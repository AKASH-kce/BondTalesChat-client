#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying deployment configuration...\n');

// Check if required files exist
const requiredFiles = [
  'package.json',
  'angular.json',
  'src/environments/environment.prod.ts',
  'server.js',
  'render.yaml',
  '.gitignore'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

// Check package.json scripts
console.log('\n📦 Checking package.json scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const requiredScripts = ['start', 'build', 'dev'];
requiredScripts.forEach(script => {
  if (packageJson.scripts[script]) {
    console.log(`✅ Script '${script}' exists: ${packageJson.scripts[script]}`);
  } else {
    console.log(`❌ Script '${script}' missing`);
    allFilesExist = false;
  }
});

// Check environment configuration
console.log('\n🌍 Checking environment configuration...');
const envProd = fs.readFileSync('src/environments/environment.prod.ts', 'utf8');
if (envProd.includes('https://bondtaleschat-server.onrender.com')) {
  console.log('✅ Production environment configured with correct backend URL');
} else {
  console.log('❌ Production environment not configured correctly');
  allFilesExist = false;
}

// Check angular.json configuration
console.log('\n⚙️ Checking Angular configuration...');
const angularJson = JSON.parse(fs.readFileSync('angular.json', 'utf8'));
const prodConfig = angularJson.projects.BondTalechatClient.architect.build.configurations.production;

if (prodConfig.fileReplacements && prodConfig.fileReplacements.length > 0) {
  console.log('✅ Production build configured with environment file replacement');
} else {
  console.log('❌ Production build not configured with environment file replacement');
  allFilesExist = false;
}

console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('🎉 All deployment configurations are correct!');
  console.log('\n📋 Next steps:');
  console.log('1. Push your code to a Git repository');
  console.log('2. Connect the repository to Render.com');
  console.log('3. Set build command: npm ci && npm run build');
  console.log('4. Set start command: npm start');
  console.log('5. Deploy! 🚀');
} else {
  console.log('❌ Some configurations are missing or incorrect.');
  console.log('Please fix the issues above before deploying.');
}
console.log('='.repeat(50));
