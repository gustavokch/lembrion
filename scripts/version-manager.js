#!/usr/bin/env node

/**
 * Version Manager for lembrion
 *
 * Bumps the version in package.json, public/sw.js (CACHE_NAME) and index.html
 * (JSON-LD "softwareVersion"). Every new file content is computed and checked
 * in memory first; files are written only when all checks pass.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const BUMP_TYPES = ['major', 'minor', 'patch'];

/** Files the version manager rewrites, relative to the project root. */
export const VERSION_FILES = ['package.json', 'public/sw.js', 'index.html'];

const SEMVER_PATTERN = '(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)';
const SEMVER = new RegExp(`^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$`);
const CACHE_NAME_RE = new RegExp(`const CACHE_NAME = 'lembrion-v${SEMVER_PATTERN}';`, 'g');
const SOFTWARE_VERSION_RE = new RegExp(`"softwareVersion": "${SEMVER_PATTERN}"`, 'g');

function countMatches(content, regex) {
  return (content.match(regex) || []).length;
}

export class VersionManager {
  constructor(projectRoot = DEFAULT_PROJECT_ROOT) {
    this.projectRoot = projectRoot;
    this.packageJsonPath = path.join(projectRoot, 'package.json');
    this.swPath = path.join(projectRoot, 'public/sw.js');
    this.indexHtmlPath = path.join(projectRoot, 'index.html');
  }

  parseVersion(versionString) {
    const match = typeof versionString === 'string' ? versionString.match(SEMVER) : null;
    if (!match) {
      throw new Error(`Invalid version format: ${JSON.stringify(versionString)} (expected MAJOR.MINOR.PATCH)`);
    }
    return {
      major: Number(match[1]),
      minor: Number(match[2]),
      patch: Number(match[3])
    };
  }

  incrementVersion(currentVersion, type) {
    if (!BUMP_TYPES.includes(type)) {
      throw new Error(`Invalid bump type: ${JSON.stringify(type)} (expected one of: ${BUMP_TYPES.join(', ')})`);
    }
    const { major, minor, patch } = this.parseVersion(currentVersion);
    if (type === 'major') return `${major + 1}.0.0`;
    if (type === 'minor') return `${major}.${minor + 1}.0`;
    return `${major}.${minor}.${patch + 1}`;
  }

  readFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      throw new Error(`Cannot read ${path.relative(this.projectRoot, filePath)}: ${error.message}`);
    }
  }

  readPackageJson() {
    const text = this.readFile(this.packageJsonPath);
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error(`package.json is not valid JSON: ${error.message}`);
    }
  }

  getCurrentVersion() {
    const { version } = this.readPackageJson();
    this.parseVersion(version);
    return version;
  }

  /**
   * Compute the new content of every version file without writing anything.
   * Throws if the current version is invalid or any expected version string is missing.
   */
  planBump(type) {
    const packageJson = this.readPackageJson();
    const currentVersion = packageJson.version;
    const newVersion = this.incrementVersion(currentVersion, type);

    packageJson.version = newVersion;
    const packageJsonContent = JSON.stringify(packageJson, null, 2) + '\n';

    const swContent = this.readFile(this.swPath);
    const cacheNameCount = countMatches(swContent, CACHE_NAME_RE);
    if (cacheNameCount !== 1) {
      throw new Error(
        `public/sw.js: expected exactly one "const CACHE_NAME = 'lembrion-v<semver>';", found ${cacheNameCount}`
      );
    }

    const indexHtmlContent = this.readFile(this.indexHtmlPath);
    const softwareVersionCount = countMatches(indexHtmlContent, SOFTWARE_VERSION_RE);
    const softwareVersionKeyCount = countMatches(indexHtmlContent, /"softwareVersion"/g);
    if (softwareVersionCount === 0) {
      throw new Error('index.html: no "softwareVersion": "<semver>" entry found');
    }
    if (softwareVersionKeyCount !== softwareVersionCount) {
      throw new Error(
        `index.html: ${softwareVersionKeyCount} "softwareVersion" keys but only ${softwareVersionCount} in the shape "softwareVersion": "<semver>"`
      );
    }

    return {
      currentVersion,
      newVersion,
      files: [
        { path: this.packageJsonPath, content: packageJsonContent },
        { path: this.swPath, content: swContent.replace(CACHE_NAME_RE, `const CACHE_NAME = 'lembrion-v${newVersion}';`) },
        { path: this.indexHtmlPath, content: indexHtmlContent.replace(SOFTWARE_VERSION_RE, `"softwareVersion": "${newVersion}"`) }
      ]
    };
  }

  /**
   * Write every planned file through a temp file + rename, so a failed write
   * leaves the originals untouched.
   */
  writeFiles(files) {
    const tempPaths = [];
    try {
      for (const file of files) {
        const tempPath = `${file.path}.version-manager.tmp`;
        tempPaths.push(tempPath);
        fs.writeFileSync(tempPath, file.content);
      }
    } catch (error) {
      for (const tempPath of tempPaths) fs.rmSync(tempPath, { force: true });
      throw new Error(`Failed to write version files: ${error.message}`);
    }
    files.forEach((file, index) => {
      try {
        fs.renameSync(tempPaths[index], file.path);
      } catch (error) {
        const written = files.slice(0, index).map((f) => path.relative(this.projectRoot, f.path));
        const partial = new Error(
          `Failed to replace ${path.relative(this.projectRoot, file.path)}: ${error.message}. ` +
            `Already updated: ${written.join(', ') || 'none'}. Restore them with: git checkout -- ${VERSION_FILES.join(' ')}`
        );
        partial.partialWrite = true;
        throw partial;
      }
    });
  }

  bump(type) {
    const plan = this.planBump(type);
    this.writeFiles(plan.files);
    console.log(`✓ Bumped version ${plan.currentVersion} → ${plan.newVersion} (${type})`);
    for (const file of plan.files) {
      console.log(`  updated ${path.relative(this.projectRoot, file.path)}`);
    }
    return plan.newVersion;
  }

  info() {
    const currentVersion = this.getCurrentVersion();
    const { major, minor, patch } = this.parseVersion(currentVersion);
    console.log(`📦 Current version: ${currentVersion}`);
    console.log(`   Major: ${major}`);
    console.log(`   Minor: ${minor}`);
    console.log(`   Patch: ${patch}`);
    return currentVersion;
  }
}

const USAGE = `
📦 lembrion Version Manager

Usage:
  node scripts/version-manager.js <command>

Commands:
  bump [type]    Bump version by type: ${BUMP_TYPES.join(', ')} (default: patch)
  major          Bump major version (breaking changes)
  minor          Bump minor version (new features)
  patch          Bump patch version (bug fixes)
  info           Show current version info (read-only)

Updates: ${VERSION_FILES.join(', ')}
`;

/**
 * CLI entry point. Returns the process exit code.
 */
export function main(args = process.argv.slice(2), projectRoot = DEFAULT_PROJECT_ROOT) {
  const [command, type] = args;
  const versionManager = new VersionManager(projectRoot);

  try {
    switch (command) {
      case 'bump':
        versionManager.bump(type === undefined ? 'patch' : type);
        return 0;
      case 'major':
      case 'minor':
      case 'patch':
        versionManager.bump(command);
        return 0;
      case 'info':
        versionManager.info();
        return 0;
      case undefined:
      case 'help':
      case '--help':
        console.log(USAGE);
        return 0;
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log(USAGE);
        return 1;
    }
  } catch (error) {
    console.error(`❌ ${error.message}`);
    if (!error.partialWrite) console.error('No files were changed.');
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main();
}

export default VersionManager;
