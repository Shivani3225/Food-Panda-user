/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const srcRoot = path.join(projectRoot, 'src');
const exts = new Set(['.js', '.jsx', '.ts', '.tsx']);

const packages = new Map(); // name -> Set(files)
const filesScanned = [];

function addPackage(name, file) {
  if (!packages.has(name)) packages.set(name, new Set());
  packages.get(name).add(path.relative(projectRoot, file));
}

function normalizePackage(specifier) {
  if (!specifier) return null;
  if (
    specifier.startsWith('.') ||
    specifier.startsWith('/') ||
    specifier.startsWith('..')
  )
    return null;
  if (specifier === 'react' || specifier === 'react-native') return specifier;
  if (specifier.startsWith('react-native/')) return null;

  if (specifier.startsWith('@')) {
    const parts = specifier.split('/');
    if (parts.length >= 2) return parts.slice(0, 2).join('/');
    return specifier;
  }

  return specifier.split('/')[0];
}

function scanFile(filePath) {
  filesScanned.push(filePath);
  const text = fs.readFileSync(filePath, 'utf8');

  const importRe = /\bimport\s+(?:type\s+)?[^;\n]*?from\s*['\"]([^'\"]+)['\"]/g;
  const requireRe = /\brequire\(\s*['\"]([^'\"]+)['\"]\s*\)/g;

  let match;
  while ((match = importRe.exec(text))) {
    const pkg = normalizePackage(match[1]);
    if (pkg) addPackage(pkg, filePath);
  }
  while ((match = requireRe.exec(text))) {
    const pkg = normalizePackage(match[1]);
    if (pkg) addPackage(pkg, filePath);
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (exts.has(path.extname(entry.name))) scanFile(p);
  }
}

if (!fs.existsSync(srcRoot)) {
  console.error('No src/ folder found at', srcRoot);
  process.exit(1);
}

walk(srcRoot);

const sorted = [...packages.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([pkg, files]) => ({ pkg, files: [...files].sort() }));

console.log(
  JSON.stringify(
    { filesScanned: filesScanned.length, packages: sorted },
    null,
    2,
  ),
);
