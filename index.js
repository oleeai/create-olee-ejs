#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[92m',
  cyan:   '\x1b[96m',
  blue:   '\x1b[94m',
  yellow: '\x1b[33m',
  white:  '\x1b[97m',
  red:    '\x1b[91m',
};

const projectName = process.argv[2];

if (!projectName) {
  console.log('');
  console.log(`  ${c.red}✗${c.reset}  please provide a project name`);
  console.log('');
  console.log(`     ${c.dim}npx create-olee-ejs${c.reset} ${c.cyan}my-project${c.reset}`);
  console.log('');
  process.exit(1);
}

const dest = path.resolve(process.cwd(), projectName);

if (fs.existsSync(dest)) {
  console.log('');
  console.log(`  ${c.red}✗${c.reset}  folder ${c.yellow}${projectName}${c.reset} already exists`);
  console.log('');
  process.exit(1);
}

console.log('');
console.log(`  ${c.blue}${c.bold}olee.ai${c.reset} ${c.dim}|${c.reset} ${c.bold}${c.white}olee-ejs${c.reset}  ${c.dim}scaffolding...${c.reset}`);
console.log('');

// Clone private template
try {
  execSync(`gh repo clone oleeai/ejs "${dest}" -- --depth=1 --quiet`, { stdio: 'inherit' });
} catch {
  console.log(`  ${c.red}✗${c.reset}  could not clone — run ${c.cyan}gh auth login${c.reset} first`);
  console.log('');
  process.exit(1);
}

// Strip template git history
fs.rmSync(path.join(dest, '.git'), { recursive: true, force: true });
console.log(`  ${c.green}✓${c.reset}  cloned    ${c.dim}${projectName}${c.reset}`);

// Copy .env.example → .env
const envSrc  = path.join(dest, '.env.example');
const envDest = path.join(dest, '.env');
if (fs.existsSync(envSrc)) {
  fs.copyFileSync(envSrc, envDest);
  console.log(`  ${c.green}✓${c.reset}  created   ${c.dim}.env${c.reset}`);
}

console.log('');
console.log(`  ${c.bold}get started:${c.reset}`);
console.log('');
console.log(`    ${c.cyan}cd ${projectName}${c.reset}`);
console.log(`    ${c.dim}# fill in .env with your Supabase credentials${c.reset}`);
console.log(`    ${c.cyan}npm install${c.reset}`);
console.log(`    ${c.cyan}npm run dev${c.reset}`);
console.log('');
