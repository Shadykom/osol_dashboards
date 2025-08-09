const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '../src');
const EN_FILE = path.resolve(__dirname, '../public/locales/en/translation.json');
const AR_FILE = path.resolve(__dirname, '../public/locales/ar/translation.json');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function listFiles(dir, exts, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listFiles(full, exts, files);
    else if (exts.includes(path.extname(entry.name))) files.push(full);
  }
  return files;
}

function extractKeys(content) {
  const keys = new Set();
  const regex = /\bt\(\s*['"]([^'"\)]+)['"]/g;
  let m;
  while ((m = regex.exec(content))) {
    keys.add(m[1]);
  }
  return keys;
}

function has(obj, key) {
  return key.split('.').reduce((o, k) => (o && Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined), obj) !== undefined;
}

function main() {
  const files = listFiles(SRC_DIR, ['.js', '.jsx', '.ts', '.tsx']);
  const allKeys = new Set();
  for (const f of files) {
    try {
      const content = fs.readFileSync(f, 'utf8');
      for (const k of extractKeys(content)) allKeys.add(k);
    } catch {}
  }
  const en = readJson(EN_FILE);
  const ar = readJson(AR_FILE);

  const missingEn = [];
  const missingAr = [];
  for (const k of allKeys) {
    if (!has(en, k)) missingEn.push(k);
    if (!has(ar, k)) missingAr.push(k);
  }

  missingEn.sort();
  missingAr.sort();

  console.log('Total keys found in code:', allKeys.size);
  console.log('Missing in EN:', missingEn.length);
  console.log(missingEn.join('\n'));
  console.log('---');
  console.log('Missing in AR:', missingAr.length);
  console.log(missingAr.join('\n'));
}

main();