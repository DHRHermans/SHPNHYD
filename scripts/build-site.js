// Publish immutable asset paths so browser caches cannot mix different releases.
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const entries = ['index.html', 'lessen.html', 'styles.css', '.nojekyll', 'LICENSE', 'THIRD-PARTY-NOTICES.md', 'src', 'docs', 'examples'];

export function buildSite(outputDirectory) {
  const output = resolve(outputDirectory);
  const withinProject = relative(project, output);
  if (!withinProject.startsWith('..')) throw new Error('Kies een uitvoermap buiten de repository.');
  if (existsSync(output) && readdirSync(output).length) throw new Error('De uitvoermap moet leeg zijn.');
  const hash = createHash('sha256');
  const digest = path => {
    const absolute = join(project, path);
    const children = readdirIfDirectory(absolute);
    if (children) for (const name of children.sort()) digest(`${path}/${name}`);
    else { hash.update(path); hash.update('\0'); hash.update(readFileSync(absolute)); hash.update('\0'); }
  };
  for (const entry of entries) digest(entry);
  const version = hash.digest('hex').slice(0, 16);
  const assetPath = `assets/${version}`;
  mkdirSync(join(output, assetPath), { recursive: true });
  cpSync(join(project, 'src'), join(output, assetPath, 'src'), { recursive: true });
  cpSync(join(project, 'styles.css'), join(output, assetPath, 'styles.css'));
  for (const entry of entries.filter(e => !['src', 'styles.css', 'index.html', 'lessen.html'].includes(e))) {
    cpSync(join(project, entry), join(output, entry), { recursive: true });
  }
  const html = readFileSync(join(project, 'index.html'), 'utf8')
    .replace('href="styles.css"', `href="${assetPath}/styles.css"`)
    .replace('src="src/main.js"', `src="${assetPath}/src/main.js"`)
    .replace('Ontwikkelversie · Licht atelier', `Licht atelier · v${version}`)
    .replace('href="lessen.html"', `href="lessen.html?v=${version}"`)
    .replace('</head>', `<meta name="shpnhyd-version" content="${version}">\n</head>`);
  writeFileSync(join(output, 'index.html'), html);
  const lessons = readFileSync(join(project, 'lessen.html'), 'utf8')
    .replaceAll('href="index.html?example=', `href="index.html?v=${version}&amp;example=`)
    .replaceAll('href="index.html"', `href="index.html?v=${version}"`);
  writeFileSync(join(output, 'lessen.html'), lessons);
  writeFileSync(join(output, 'version.json'), JSON.stringify({ version, assets: assetPath }, null, 2) + '\n');
  return { version, output };
}

function readdirIfDirectory(path) {
  // Only ENOTDIR is an expected leaf; missing/unreadable files must fail the build.
  try { return readdirSync(path); } catch (error) { if (error.code === 'ENOTDIR') return null; throw error; }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error('Gebruik: node scripts/build-site.js /pad/naar/lege-uitvoermap');
  console.log(JSON.stringify(buildSite(process.argv[2])));
}
