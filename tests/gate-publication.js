import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSite } from '../scripts/build-site.js';

export const tests = [
  { name: 'Publicatie: versiegebonden CSS en alle transitieve modules inclusief motorcatalogus', fn() {
    const temp = mkdtempSync(join(tmpdir(), 'shpnhyd-publication-'));
    try {
      const out = join(temp, 'site');
      const { version } = buildSite(out);
      const html = readFileSync(join(out, 'index.html'), 'utf8');
      assert(html.includes(`assets/${version}/styles.css`));
      assert(html.includes(`assets/${version}/src/main.js`));
      assert(html.includes(`Licht atelier · v${version}`));
      assert(html.includes('data-domain="motor"'));
      const src = join(out, 'assets', version, 'src');
      const catalog = readFileSync(join(src, 'catalog.js'), 'utf8');
      assert(catalog.includes('...INDUSTRIAL_CATALOG'));
      for (const name of readdirSync(src).filter(n => n.endsWith('.js'))) {
        const code = readFileSync(join(src, name), 'utf8');
        for (const match of code.matchAll(/\bfrom\s+['"](.+?)['"]/g)) {
          if (match[1].startsWith('./')) assert(existsSync(join(src, match[1])), `${name}: ${match[1]}`);
        }
      }
      const lessons = readFileSync(join(out, 'lessen.html'), 'utf8');
      assert(lessons.includes(`index.html?v=${version}&amp;example=motorDirect`));
      for (const name of ['motor-direct', 'motor-omkeersturing', 'motor-transportband-24v']) {
        assert(existsSync(join(out, 'examples', `${name}.json`)));
      }
      assert(existsSync(join(out, '.nojekyll')));
      assert(existsSync(join(out, 'LICENSE')));
      assert.equal(JSON.parse(readFileSync(join(out, 'version.json'), 'utf8')).version, version);
      assert.throws(() => buildSite(out), /leeg/);
      const other = buildSite(join(temp, 'second'));
      assert.equal(other.version, version, 'Gelijke inhoud moet dezelfde versie opleveren');
    } finally { rmSync(temp, { recursive: true, force: true }); }
  } },
];
