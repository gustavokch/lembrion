// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { VersionManager, VERSION_FILES, main } from './version-manager.js';

const PACKAGE_JSON = JSON.stringify({ name: 'fixture', version: '2.6.3', scripts: { dev: 'vite' } }, null, 2) + '\n';
const SW_JS = "// sw\nconst CACHE_NAME = 'studorama-v2.6.3';\nself.addEventListener('install', () => caches.open(CACHE_NAME));\n";
const INDEX_HTML = [
  '<script type="application/ld+json">',
  '{ "@type": "WebApplication", "softwareVersion": "2.6.3" }',
  '</script>',
  '<script type="application/ld+json">',
  '{ "@type": "SoftwareApplication", "softwareVersion": "2.6.3" }',
  '</script>',
  ''
].join('\n');

let root;

function writeFixture(files = {}) {
  const contents = { 'package.json': PACKAGE_JSON, 'public/sw.js': SW_JS, 'index.html': INDEX_HTML, ...files };
  for (const [name, content] of Object.entries(contents)) {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), content);
  }
}

function snapshot() {
  const entries = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else entries.push([path.relative(root, full), fs.readFileSync(full, 'utf8')]);
    }
  };
  walk(root);
  return Object.fromEntries(entries.sort());
}

const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'studorama-vm-'));
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('VersionManager.bump', () => {
  it('updates package.json, sw.js and every index.html softwareVersion to the same version', () => {
    writeFixture();

    expect(main(['patch'], root)).toBe(0);

    expect(read('package.json')).toBe(PACKAGE_JSON.replace('"2.6.3"', '"2.6.4"'));
    expect(read('public/sw.js')).toBe(SW_JS.replace('studorama-v2.6.3', 'studorama-v2.6.4'));
    expect(read('index.html')).toBe(INDEX_HTML.split('"2.6.3"').join('"2.6.4"'));
    expect(Object.keys(snapshot())).toEqual([...VERSION_FILES].sort());
  });

  it.each([
    ['major', '3.0.0'],
    ['minor', '2.7.0'],
    ['patch', '2.6.4']
  ])('computes the %s bump', (type, expected) => {
    writeFixture();
    expect(new VersionManager(root).bump(type)).toBe(expected);
    expect(JSON.parse(read('package.json')).version).toBe(expected);
  });

  it.each([
    ['sw.js without CACHE_NAME', { 'public/sw.js': "const CACHE = 'other';\n" }],
    ['sw.js with two CACHE_NAME lines', { 'public/sw.js': SW_JS + SW_JS }],
    ['index.html without softwareVersion', { 'index.html': '<html></html>\n' }],
    ['index.html with a softwareVersion in another shape', { 'index.html': INDEX_HTML + '{"softwareVersion":"2.6.3"}\n' }]
  ])('fails with exit 1 and leaves every file byte-identical: %s', (_label, overrides) => {
    writeFixture(overrides);
    const before = snapshot();

    expect(() => new VersionManager(root).bump('patch')).toThrow();
    expect(main(['patch'], root)).toBe(1);

    expect(snapshot()).toEqual(before);
  });

  it('rejects an invalid bump type without writing', () => {
    writeFixture();
    const before = snapshot();

    expect(() => new VersionManager(root).bump('minr')).toThrow(/Invalid bump type/);
    expect(() => new VersionManager(root).bump('build')).toThrow(/Invalid bump type/);
    expect(main(['bump', 'minr'], root)).toBe(1);

    expect(snapshot()).toEqual(before);
  });

  it.each([
    ['missing package.json', null, /Cannot read package\.json/],
    ['malformed package.json', '{ "version": ', /not valid JSON/],
    ['package.json without version', '{ "name": "x" }\n', /Invalid version format/],
    ['non-semver version', '{ "version": "2.6" }\n', /Invalid version format/]
  ])('fails loudly on %s', (_label, packageJson, message) => {
    writeFixture(packageJson === null ? {} : { 'package.json': packageJson });
    if (packageJson === null) fs.rmSync(path.join(root, 'package.json'));
    const before = snapshot();

    expect(() => new VersionManager(root).getCurrentVersion()).toThrow(message);
    expect(() => new VersionManager(root).bump('patch')).toThrow(message);
    expect(main(['info'], root)).toBe(1);
    expect(main(['patch'], root)).toBe(1);

    expect(snapshot()).toEqual(before);
  });
});
