import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, 'src');
const LOCALE_FILE = path.join(__dirname, 'src/locales/en.json'); // à adapter pour en.json

function getAllFiles(dir, exts = ['.js', '.jsx', '.ts', '.tsx']) {
  let files = [];
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.includes(path.extname(fullPath))) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractUsedKeys(files) {
  const keyRegex = /t\(['"`]([^'"`]+)['"`]/g;
  const usedKeys = new Set();
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = keyRegex.exec(content))) {
      usedKeys.add(match[1]);
    }
  }
  return usedKeys;
}

function flattenKeys(obj, prefix = '') {
  let keys = [];
  for (const k in obj) {
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      keys = keys.concat(flattenKeys(obj[k], prefix ? `${prefix}.${k}` : k));
    } else {
      keys.push(prefix ? `${prefix}.${k}` : k);
    }
  }
  return keys;
}

// Supprime les clés non utilisées d'un objet de traduction
function pruneKeys(obj, usedKeys, prefix = '') {
  let result = Array.isArray(obj) ? [] : {};
  for (const k in obj) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      const pruned = pruneKeys(obj[k], usedKeys, fullKey);
      // Ne garde que les objets non vides
      if (Object.keys(pruned).length > 0 || Array.isArray(pruned)) {
        result[k] = pruned;
      }
    } else {
      if (usedKeys.has(fullKey)) {
        result[k] = obj[k];
      }
    }
  }
  return result;
}

function main() {
  const files = getAllFiles(SRC_DIR);
  const usedKeys = extractUsedKeys(files);

  const localeData = JSON.parse(fs.readFileSync(LOCALE_FILE, 'utf8'));
  const allKeys = flattenKeys(localeData);

  const unusedKeys = allKeys.filter((key) => !usedKeys.has(key));

  // console.log('Clés non utilisées :');
  // unusedKeys.forEach((key) => console.log(key));

  // ignorer toutes les clés endgame, progress.objects.*, accessories.* et terminal.mails.*
  const filteredUnusedKeys = unusedKeys.filter(
    (key) => !key.startsWith('endgame') && !key.startsWith('progress.objects.') && !key.startsWith('accessories.') && !key.startsWith('terminal.mails.')
  );
  filteredUnusedKeys.length > 0
    ? console.log('Clés non utilisées (après filtrage des clés) :')
    : console.log(
        'Aucune clé non utilisée (après filtrage des clés) trouvée.'
      );
  filteredUnusedKeys.forEach((key) => console.log(key));

  // // Nettoyage automatique
  // const cleaned = pruneKeys(localeData, usedKeys);
  // fs.writeFileSync(LOCALE_FILE, JSON.stringify(cleaned, null, 2), 'utf8');
  // console.log(`Fichier nettoyé sauvegardé dans : ${LOCALE_FILE}`);
}

main();
