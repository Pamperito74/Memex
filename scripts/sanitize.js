'use strict';
const path = require('path');

function sanitizePath(str) {
  if (typeof str !== 'string') return '';
  const cleaned = str.replace(/\.\.(\/|\\)/g, '').replace(/\0/g, '');
  // Strip bare `..` segments (at boundaries)
  return cleaned.replace(/(^|\/|\\)\.\.($|\/|\\)/g, '$1$2');
}

function sanitizeProject(name) {
  if (typeof name !== 'string' || !name.trim()) return '';
  return sanitizePath(name).replace(/[^a-zA-Z0-9._-]/g, '');
}

function clampLimit(value, defaultVal, max) {
  const n = parseInt(value, 10);
  if (!Number.isInteger(n) || n < 1) return defaultVal;
  return Math.min(n, max);
}

function truncateString(str, maxLen) {
  if (typeof str !== 'string') return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen);
}

function isValidId(str) {
  if (typeof str !== 'string' || !str) return false;
  return /^[a-zA-Z0-9_-]+$/.test(str);
}

function getBackupPath(engramPath) {
  const backupDir = path.join(engramPath, '.cache', 'backups');
  return { backupDir, timestamp: Date.now() };
}

function createDbBackup(engramPath, dbPath) {
  const fs = require('fs');
  const { backupDir, timestamp } = getBackupPath(engramPath);
  fs.mkdirSync(backupDir, { recursive: true });
  if (!fs.existsSync(dbPath)) return null;
  const backupFile = path.join(backupDir, `engram.db.${timestamp}.bak`);
  fs.copyFileSync(dbPath, backupFile);
  return backupFile;
}

function checkDiskUsage(dirPath, softLimit, hardLimit) {
  const fs = require('fs');
  const { execFileSync } = require('child_process');
  try {
    if (process.platform === 'darwin' || process.platform === 'linux') {
      const out = execFileSync('du', ['-sk', dirPath], { encoding: 'utf8', timeout: 5000 });
      const kb = parseInt(out.split('\t')[0], 10);
      if (isNaN(kb)) return { ok: true };
      const mb = kb / 1024;
      const warnings = [];
      const errors = [];
      if (mb > hardLimit) {
        errors.push(`Disk usage ${mb.toFixed(0)}MB exceeds hard limit ${hardLimit}MB`);
        return { ok: false, mb, warnings, errors };
      }
      if (mb > softLimit) {
        warnings.push(`Disk usage ${mb.toFixed(0)}MB exceeds soft limit ${softLimit}MB`);
      }
      return { ok: true, mb, warnings, errors };
    }
  } catch { /* du not available */ }
  return { ok: true };
}

module.exports = {
  sanitizePath,
  sanitizeProject,
  clampLimit,
  truncateString,
  isValidId,
  createDbBackup,
  checkDiskUsage,
};
