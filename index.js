#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const fs       = require('fs');
const path     = require('path');
const readline = require('readline');

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

const rl  = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, a => resolve(a.trim())));

async function main() {
  console.log('');
  console.log(`  ${c.blue}${c.bold}olee.ai${c.reset} ${c.dim}|${c.reset} ${c.bold}${c.white}olee-ejs${c.reset}`);
  console.log('');

  const supabaseAnswer = await ask(`  ${c.cyan}?${c.reset}  Add Supabase? ${c.dim}(y/N)${c.reset}  `);
  const useSupabase    = supabaseAnswer.toLowerCase() === 'y';

  rl.close();
  console.log('');

  // Clone template
  try {
    execSync(`git clone --depth=1 --quiet https://github.com/oleeai/ejs.git "${dest}"`, { stdio: 'inherit' });
  } catch {
    console.log(`  ${c.red}✗${c.reset}  could not clone — make sure you have access to oleeai/ejs`);
    console.log('');
    process.exit(1);
  }

  // Strip template git history
  fs.rmSync(path.join(dest, '.git'), { recursive: true, force: true });
  console.log(`  ${c.green}✓${c.reset}  cloned    ${c.dim}${projectName}${c.reset}`);

  // Remove template-only root scripts
  for (const file of ['create.js', 'dev.js']) {
    const p = path.join(dest, file);
    if (fs.existsSync(p)) fs.rmSync(p);
  }

  // Patch package.json
  const pkgPath = path.join(dest, 'package.json');
  const pkg     = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  if (!useSupabase) {
    if (pkg.dependencies) delete pkg.dependencies['@supabase/supabase-js'];

    // Strip Supabase vars from .env.example
    const envExPath = path.join(dest, '.env.example');
    if (fs.existsSync(envExPath)) {
      const stripped = fs.readFileSync(envExPath, 'utf8')
        .split('\n')
        .filter(l => !l.startsWith('SUPABASE_'))
        .join('\n');
      fs.writeFileSync(envExPath, stripped);
    }

    console.log(`  ${c.dim}–${c.reset}  skipped   ${c.dim}Supabase${c.reset}`);
  } else {
    console.log(`  ${c.green}✓${c.reset}  added     ${c.dim}Supabase${c.reset}`);
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  console.log('');
  console.log(`  ${c.bold}get started:${c.reset}`);
  console.log('');
  console.log(`    ${c.cyan}cd ${projectName}${c.reset}`);
  if (useSupabase) {
    console.log(`    ${c.dim}# fill in .env.example with your Supabase credentials${c.reset}`);
  }
  console.log(`    ${c.cyan}npm install${c.reset}`);
  console.log(`    ${c.cyan}npm run dev${c.reset}`);
  console.log('');
}

main();
