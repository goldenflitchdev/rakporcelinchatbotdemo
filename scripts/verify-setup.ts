#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { getConfig } from '../lib/config';

console.log('🔍 Verifying RAK Porcelain Chatbot Setup...\n');

let hasErrors = false;

// Check 1: Environment variables
console.log('1️⃣  Checking environment variables...');
try {
  const config = getConfig();
  console.log('   ✅ OPENAI_API_KEY is set');
  console.log(`   ✅ RAK_BASE: ${config.rakBase}`);
  console.log(`   ✅ CRAWL_MAX_PAGES: ${config.crawlMaxPages}`);
  console.log(`   ✅ CRAWL_CONCURRENCY: ${config.crawlConcurrency}`);
} catch (error) {
  console.log('   ❌ Environment configuration error');
  console.log(`      ${error instanceof Error ? error.message : 'Unknown error'}`);
  hasErrors = true;
}

console.log();

// Check 2: Data directory
console.log('2️⃣  Checking data directory...');
const dataDir = path.join(process.cwd(), 'data');
if (fs.existsSync(dataDir)) {
  console.log('   ✅ Data directory exists');
  
  const chromaDir = path.join(dataDir, 'chroma');
  if (fs.existsSync(chromaDir)) {
    console.log('   ✅ ChromaDB directory exists');
  } else {
    console.log('   ⚠️  ChromaDB directory not found (run npm run index)');
  }
  
  const reportPath = path.join(dataDir, 'index-report.json');
  if (fs.existsSync(reportPath)) {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    console.log('   ✅ Index report found');
    console.log(`      Pages indexed: ${report.successfulPages}`);
    console.log(`      Total chunks: ${report.totalChunks}`);
    console.log(`      Last indexed: ${new Date(report.timestamp).toLocaleString()}`);
  } else {
    console.log('   ⚠️  Index report not found (run npm run index)');
  }
} else {
  console.log('   ⚠️  Data directory not found (will be created on first index)');
}

console.log();

// Check 3: Dependencies
console.log('3️⃣  Checking dependencies...');
const requiredDeps = [
  'next',
  'react',
  'openai',
  'chromadb',
  'better-sqlite3',
  'cheerio',
  'zod',
];

const packageJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
);

let missingDeps = 0;
for (const dep of requiredDeps) {
  if (packageJson.dependencies[dep]) {
    console.log(`   ✅ ${dep}`);
  } else {
    console.log(`   ❌ ${dep} is missing`);
    missingDeps++;
  }
}

if (missingDeps > 0) {
  console.log('   ⚠️  Run: npm install');
  hasErrors = true;
}

console.log();

// Check 4: Key files
console.log('4️⃣  Checking key files...');
const keyFiles = [
  'lib/config.ts',
  'lib/openai.ts',
  'lib/chroma.ts',
  'lib/chunker.ts',
  'scripts/crawl-and-index.ts',
  'app/api/chat/route.ts',
  'app/page.tsx',
];

for (const file of keyFiles) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} is missing`);
    hasErrors = true;
  }
}

console.log();

// Summary
if (hasErrors) {
  console.log('❌ Setup has errors. Please fix the issues above.\n');
  process.exit(1);
} else {
  console.log('✅ Setup verification complete! Ready to run.\n');
  console.log('Next steps:');
  console.log('  1. npm run index     (if not done yet)');
  console.log('  2. npm run dev');
  console.log('  3. Open http://localhost:3000\n');
}

