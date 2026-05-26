#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function hasIndexFiles(dir) {
  return (
    fs.existsSync(path.join(dir, 'index.json')) ||
    fs.existsSync(path.join(dir, 'index.json.gz')) ||
    fs.existsSync(path.join(dir, 'index.msgpack'))
  );
}

function findEngramRoot(startDir) {
  let current = path.resolve(startDir);
  while (true) {
    if (hasIndexFiles(current)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

const USER_DATA_DIR = path.join(require('os').homedir(), '.engram');

function isGlobalInstall(dir) {
  return dir.includes(`${path.sep}node_modules${path.sep}`);
}

function resolveEngramPath(fromDir = __dirname) {
  if (process.env.ENGRAM_PATH) {
    return path.resolve(process.env.ENGRAM_PATH);
  }
  // Prefer ~/.engram if it exists
  if (fs.existsSync(USER_DATA_DIR)) {
    return USER_DATA_DIR;
  }
  // Otherwise check if we are in a repo that already has Engram data
  const found = findEngramRoot(fromDir);
  if (found) return found;

  // Global npm install: data lives in ~/.engram
  if (isGlobalInstall(fromDir)) {
    return USER_DATA_DIR;
  }

  // Fallback to project root if we are in source dev, but prefer USER_DATA_DIR
  // if it's not a local dev environment (heuristic: no index.json in parent)
  const root = path.resolve(fromDir, '..');
  if (hasIndexFiles(root)) return root;

  return USER_DATA_DIR;
}

function resolveReposRoot(engramPath) {
  if (process.env.ENGRAM_REPOS_ROOT) {
    return path.resolve(process.env.ENGRAM_REPOS_ROOT);
  }
  return path.resolve(engramPath, '..');
}

function normalizeProjectSlug(projectName) {
  return String(projectName || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function listProjectDirectories(engramPath) {
  const projectsDir = path.join(engramPath, 'summaries', 'projects');
  if (!fs.existsSync(projectsDir)) return [];

  try {
    return fs.readdirSync(projectsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

function resolveProjectDirName(engramPath, projectName) {
  const slug = normalizeProjectSlug(projectName);
  if (!slug) return '';
  const projectsDir = listProjectDirectories(engramPath);

  // Exact slug match first.
  if (projectsDir.includes(slug)) {
    return slug;
  }

  // Fall back to any directory that normalizes to the same slug (legacy compat).
  for (const dirName of projectsDir) {
    if (normalizeProjectSlug(dirName) === slug) {
      return dirName;
    }
  }

  return slug;
}

module.exports = {
  resolveEngramPath,
  resolveReposRoot,
  normalizeProjectSlug,
  resolveProjectDirName,
  listProjectDirectories
};
