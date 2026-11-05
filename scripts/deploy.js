#!/usr/bin/env node

/**
 * Release script: checks, version bump, commit, tag, push.
 *
 * Order: preflight (branch, clean tree, next tag free) → npm run lint/typecheck/build
 * → bump the version files → commit only those files → annotated tag → push branch and tag.
 * A failure before the commit restores the version files; a failed push keeps the local
 * commit and tag and prints the recovery commands. Any failure exits non-zero.
 */

import { execFileSync } from 'child_process';
import readline from 'node:readline/promises';
import { pathToFileURL } from 'url';
import VersionManager, { BUMP_TYPES, VERSION_FILES } from './version-manager.js';

const RELEASE_BRANCH = 'main';
const REMOTE = 'origin';
const CHECK_SCRIPTS = ['lint', 'typecheck', 'build'];

export class DeployManager {
  constructor(projectRoot) {
    this.versionManager = new VersionManager(projectRoot);
    this.cwd = this.versionManager.projectRoot;
  }

  /**
   * Run a command without a shell. Throws on a non-zero exit.
   * With `capture`, returns trimmed stdout instead of streaming it.
   */
  exec(file, args, { capture = false } = {}) {
    if (!capture) console.log(`🔧 Running: ${file} ${args.join(' ')}`);
    const output = execFileSync(file, args, {
      cwd: this.cwd,
      encoding: 'utf8',
      stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
      // npm is a .cmd shim on Windows and needs a shell there.
      shell: file === 'npm' && process.platform === 'win32'
    });
    return capture ? output.trim() : output;
  }

  git(...args) {
    return this.exec('git', args, { capture: true });
  }

  async confirm(question) {
    if (!process.stdin.isTTY) return false;
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
      const answer = await rl.question(question);
      return /^y(es)?$/i.test(answer.trim());
    } finally {
      rl.close();
    }
  }

  /**
   * Validate the repository state before anything runs or changes.
   * Returns the version the release will produce.
   */
  async preflight(versionType) {
    console.log('🔍 Running pre-deployment checks...');

    try {
      this.git('rev-parse', '--is-inside-work-tree');
    } catch {
      throw new Error(`Not a git repository: ${this.cwd}`);
    }

    let branch;
    try {
      branch = this.git('symbolic-ref', '--short', 'HEAD');
    } catch {
      throw new Error(`HEAD is detached; check out "${RELEASE_BRANCH}" to deploy`);
    }
    if (branch !== RELEASE_BRANCH) {
      throw new Error(`Current branch is "${branch}"; deploy only runs on "${RELEASE_BRANCH}"`);
    }

    const dirtyVersionFiles = this.git('status', '--porcelain', '--', ...VERSION_FILES);
    if (dirtyVersionFiles) {
      throw new Error(
        `Version files have uncommitted changes; commit or revert them first:\n${dirtyVersionFiles}`
      );
    }

    const status = this.git('status', '--porcelain');
    if (status) {
      console.warn(`⚠️  You have uncommitted changes:\n${status}`);
      console.warn(`   They will not be committed; the release commit contains only: ${VERSION_FILES.join(', ')}`);
      if (!process.stdin.isTTY) {
        throw new Error('Working tree is dirty and no terminal is attached to confirm; aborting');
      }
      if (!(await this.confirm('Continue with deployment? (y/N): '))) {
        throw new Error('Deployment cancelled');
      }
    }

    // Validates the current version and every version string before the slow checks run.
    const { newVersion } = this.versionManager.planBump(versionType);
    const tag = `v${newVersion}`;
    let tagExists = true;
    try {
      this.git('rev-parse', '--quiet', '--verify', `refs/tags/${tag}`);
    } catch {
      tagExists = false;
    }
    if (tagExists) {
      throw new Error(`Tag ${tag} already exists`);
    }

    console.log('✅ Pre-deployment checks passed');
    return newVersion;
  }

  runChecks() {
    for (const script of CHECK_SCRIPTS) {
      try {
        this.exec('npm', ['run', script]);
      } catch {
        throw new Error(`npm run ${script} failed; nothing was changed`);
      }
    }
    console.log('✅ Lint, typecheck and build passed');
  }

  restoreVersionFiles() {
    try {
      this.git('checkout', '--', ...VERSION_FILES);
      console.error(`↩️  Restored ${VERSION_FILES.join(', ')}`);
    } catch (error) {
      console.error(`❌ Could not restore the version files (${error.message.trim()}). Run:`);
      console.error(`   git checkout -- ${VERSION_FILES.join(' ')}`);
    }
  }

  async deploy(versionType) {
    console.log(`🚀 Starting ${versionType} release...`);

    await this.preflight(versionType);
    this.runChecks();

    let newVersion;
    try {
      newVersion = this.versionManager.bump(versionType);
      this.exec('git', ['commit', '--only', '-m', `chore: bump version to ${newVersion}`, '--', ...VERSION_FILES]);
    } catch (error) {
      this.restoreVersionFiles();
      throw new Error(`Version bump or commit failed: ${error.message}`);
    }

    const tag = `v${newVersion}`;
    try {
      this.exec('git', ['tag', '-a', tag, '-m', `Release version ${newVersion}`]);
    } catch {
      throw new Error(
        `Created the release commit but could not create tag ${tag}. Either tag and push it:\n` +
          `   git tag -a ${tag} -m "Release version ${newVersion}" && git push --atomic ${REMOTE} ${RELEASE_BRANCH} refs/tags/${tag}\n` +
          'or undo the release commit:\n' +
          '   git reset --keep HEAD~1'
      );
    }

    try {
      this.exec('git', ['push', '--atomic', REMOTE, RELEASE_BRANCH, `refs/tags/${tag}`]);
    } catch {
      throw new Error(
        `Push failed. The release commit and tag ${tag} exist locally only. Retry with:\n` +
          `   git push --atomic ${REMOTE} ${RELEASE_BRANCH} refs/tags/${tag}\n` +
          'or undo the local release:\n' +
          `   git tag -d ${tag} && git reset --keep HEAD~1`
      );
    }

    console.log(`🎉 Released ${tag}: pushed ${RELEASE_BRANCH} and ${tag} to ${REMOTE}`);
    return newVersion;
  }
}

const USAGE = `
🚀 Studorama Deploy Manager

Usage:
  node scripts/deploy.js deploy [type]

Commands:
  deploy [type]   Release on "${RELEASE_BRANCH}": npm run ${CHECK_SCRIPTS.join('/')}, bump the version
                  (type: ${BUMP_TYPES.join(', ')}; default: patch), commit ${VERSION_FILES.join(', ')},
                  tag v<version>, push the branch and the tag to ${REMOTE}

Examples:
  node scripts/deploy.js deploy patch
  node scripts/deploy.js deploy minor
`;

/**
 * CLI entry point. Resolves to the process exit code.
 */
export async function main(args = process.argv.slice(2)) {
  const [command, versionType = 'patch', ...extra] = args;

  if (command === undefined || command === 'help' || command === '--help') {
    console.log(USAGE);
    return 0;
  }
  if (command !== 'deploy' || extra.length > 0) {
    console.error(`❌ Unknown arguments: ${args.join(' ')}`);
    console.log(USAGE);
    return 1;
  }
  if (!BUMP_TYPES.includes(versionType)) {
    console.error(`❌ Invalid version type: ${versionType} (expected one of: ${BUMP_TYPES.join(', ')})`);
    return 1;
  }

  try {
    await new DeployManager().deploy(versionType);
    return 0;
  } catch (error) {
    console.error(`❌ ${error.message}`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main();
}

export default DeployManager;
