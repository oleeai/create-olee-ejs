#!/usr/bin/env node
'use strict';

const { execSync, execFileSync } = require('child_process');
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

const rl  = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, a => resolve(a.trim())));

async function main() {
  console.log('');
  console.log(`  ${c.blue}${c.bold}olee.ai${c.reset} ${c.dim}|${c.reset} ${c.bold}${c.white}olee-ejs${c.reset}`);
  console.log('');

  // Project name — from argv or prompt
  let projectName = process.argv[2];
  if (!projectName) {
    projectName = await ask(`  ${c.cyan}?${c.reset}  Project name: ${c.reset}`);
    if (!projectName) {
      console.log('');
      console.log(`  ${c.red}✗${c.reset}  project name is required`);
      console.log('');
      rl.close();
      process.exit(1);
    }
  }

  const dest = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(dest)) {
    console.log('');
    console.log(`  ${c.red}✗${c.reset}  folder ${c.yellow}${projectName}${c.reset} already exists`);
    console.log('');
    rl.close();
    process.exit(1);
  }

  const supabaseAnswer = await ask(`  ${c.cyan}?${c.reset}  Add Supabase? ${c.dim}(y/N)${c.reset}  `);
  const useSupabase    = supabaseAnswer.toLowerCase() === 'y';

  const vscodeAnswer = await ask(`  ${c.cyan}?${c.reset}  Open in VS Code? ${c.dim}(y/N)${c.reset}  `);
  const openVscode   = vscodeAnswer.toLowerCase() === 'y';

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

  // Install dependencies
  process.stdout.write(`  ${c.dim}…${c.reset}  installing dependencies\r`);
  try {
    execSync('npm install', { cwd: dest, stdio: 'pipe' });
    console.log(`  ${c.green}✓${c.reset}  installed dependencies`);
  } catch {
    console.log(`  ${c.yellow}!${c.reset}  npm install failed — run it manually`);
  }

  // Open in VS Code
  if (openVscode) {
    try {
      const cmd = process.platform === 'win32' ? 'code.cmd' : 'code';
      execFileSync(cmd, ['.'], { cwd: dest, stdio: 'ignore' });
      console.log(`  ${c.green}✓${c.reset}  opened    ${c.dim}VS Code${c.reset}`);
    } catch {
      console.log(`  ${c.yellow}!${c.reset}  could not open VS Code — make sure the ${c.dim}code${c.reset} command is installed`);
    }
  }

  console.log('');
  console.log(`  ${c.bold}get started:${c.reset}`);
  console.log('');
  console.log(`    ${c.cyan}cd ${projectName}${c.reset}`);
  if (useSupabase) {
    console.log(`    ${c.dim}# fill in .env.example with your Supabase credentials${c.reset}`);
  }
  console.log(`    ${c.cyan}npm run dev${c.reset}`);
  console.log('');
}

main();
