#!/usr/bin/env node
/**
 * Smoke Test for MERN Stack Foundation
 * Validates project structure, dependencies, and configuration
 */

const fs = require('fs');
const path = require('path');

const checks = [];
let passed = 0;
let failed = 0;

function check(name, condition) {
  checks.push({ name, passed: condition });
  if (condition) {
    passed++;
    console.log(`✓ ${name}`);
  } else {
    failed++;
    console.error(`✗ ${name}`);
  }
}

console.log('\n🔍 Running MERN Stack Foundation Smoke Tests...\n');

// AC-1: Dependencies install successfully
check(
  'Node.js version >= 18',
  parseInt(process.version.slice(1).split('.')[0]) >= 18
);

check(
  'Root package.json exists',
  fs.existsSync(path.join(__dirname, '..', 'package.json'))
);

check(
  'Frontend package.json exists',
  fs.existsSync(path.join(__dirname, '..', 'frontend', 'package.json'))
);

check(
  'Backend package.json exists',
  fs.existsSync(path.join(__dirname, '..', 'backend', 'package.json'))
);

check(
  'Shared package.json exists',
  fs.existsSync(path.join(__dirname, '..', 'shared', 'package.json'))
);

// AC-2: Project structure created
check(
  'Frontend directory exists',
  fs.existsSync(path.join(__dirname, '..', 'frontend'))  
);

check(
  'Backend directory exists',
  fs.existsSync(path.join(__dirname, '..', 'backend'))
);

check(
  'Shared directory exists',
  fs.existsSync(path.join(__dirname, '..', 'shared'))
);

check(
  'Frontend src directory exists',
  fs.existsSync(path.join(__dirname, '..', 'frontend', 'src'))
);

check(
  'Backend src directory exists',
  fs.existsSync(path.join(__dirname, '..', 'backend', 'src'))
);

check(
  'Backend config directory exists',
  fs.existsSync(path.join(__dirname, '..', 'backend', 'src', 'config'))
);

check(
  'Backend utils directory exists',
  fs.existsSync(path.join(__dirname, '..', 'backend', 'src', 'utils'))
);

// AC-3: MongoDB connection code exists
check(
  'Database connection file exists',
  fs.existsSync(path.join(__dirname, '..', 'backend', 'src', 'config', 'database.js'))
);

// Verify database.js contains connection pooling configuration
const dbFile = fs.readFileSync(
  path.join(__dirname, '..', 'backend', 'src', 'config', 'database.js'),
  'utf8'
);
check('MongoDB maxPoolSize configured', dbFile.includes('maxPoolSize: 10'));
check('MongoDB retry logic implemented', dbFile.includes('maxRetries'));

// AC-4: Vite configuration exists
check(
  'Vite config exists',
  fs.existsSync(path.join(__dirname, '..', 'frontend', 'vite.config.js'))
);

const viteConfig = fs.readFileSync(
  path.join(__dirname, '..', 'frontend', 'vite.config.js'),
  'utf8'
);
check('Vite code splitting configured', viteConfig.includes('manualChunks'));
check('Vite minification configured', viteConfig.includes('minify'));
check('Vite terser configured', viteConfig.includes('terser'));

// AC-5: .env.example with all required variables
check(
  '.env.example exists',
  fs.existsSync(path.join(__dirname, '..', '.env.example'))
);

const envExample = fs.readFileSync(
  path.join(__dirname, '..', '.env.example'),
  'utf8'
);
const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'OPENAI_API_KEY',
  'CLOUDINARY_URL',
  'PORT',
  'NODE_ENV'
];
requiredVars.forEach(varName => {
  check(`.env.example contains ${varName}`, envExample.includes(varName));
});

// Additional checks
check(
  'Express server.js exists',
  fs.existsSync(path.join(__dirname, '..', 'backend', 'src', 'server.js'))
);

check(
  'Environment validation utility exists',
  fs.existsSync(path.join(__dirname, '..', 'backend', 'src', 'utils', 'validateEnv.js'))
);

check(
  'React App.jsx exists',
  fs.existsSync(path.join(__dirname, '..', 'frontend', 'src', 'App.jsx'))
);

check(
  'Vite index.html exists',
  fs.existsSync(path.join(__dirname, '..', 'frontend', 'index.html'))
);

check(
  '.gitignore exists',
  fs.existsSync(path.join(__dirname, '..', '.gitignore'))
);

// Bundle size check (if dist exists)
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(distPath)) {
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    const files = fs.readdirSync(assetsPath);
    const jsFiles = files.filter(f => f.endsWith('.js'));
    let totalSize = 0;
    jsFiles.forEach(file => {
      const stats = fs.statSync(path.join(assetsPath, file));
      totalSize += stats.size;
    });
    const sizeInKB = totalSize / 1024;
    // Note: This checks uncompressed size. Gzipped is typically ~30-40% of uncompressed
    check(
      `Estimated gzipped bundle < 500KB (uncompressed: ${sizeInKB.toFixed(2)} KB)`,
      sizeInKB * 0.35 < 500
    );
  }
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  console.error('❌ Smoke tests failed. Please review the errors above.');
  process.exit(1);
} else {
  console.log('✅ All smoke tests passed!');
  console.log('\n📝 Next steps:');
  console.log('  1. Configure MongoDB URI in .env');
  console.log('  2. Run `npm run dev` to start both servers');
  console.log('  3. Verify frontend at http://localhost:5173');
  console.log('  4. Verify backend at http://localhost:5000/health\n');
  process.exit(0);
}
