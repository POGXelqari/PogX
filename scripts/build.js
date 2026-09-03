/**
 * PogX Production Build Pipeline
 * Bundles, minifies, and obfuscates all frontend assets into /dist
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JavaScriptObfuscator from 'javascript-obfuscator';
import CleanCSS from 'clean-css';
import { minify as minifyHtml } from 'html-minifier-terser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');

console.log('🚀 Starting PogX Production Build...\n');

// 1. Clean & Prepare /dist
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2) + ' KB';
}

async function build() {
  const startTime = Date.now();

  // -------------------------------------------------------------
  // A. JavaScript Obfuscation & Minification
  // -------------------------------------------------------------
  console.log('📦 Obfuscating & Minifying JavaScript (app.js)...');
  const rawJs = fs.readFileSync(path.join(ROOT_DIR, 'app.js'), 'utf-8');
  
  const obfuscated = JavaScriptObfuscator.obfuscate(rawJs, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    rotateStringArray: true,
    selfDefending: false,
    simplify: true,
    splitStrings: true,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 2,
    stringArrayWrappersType: 'variable',
    stringArrayThreshold: 0.8,
    unicodeEscapeSequence: false
  });

  const obfuscatedJs = obfuscated.getObfuscatedCode();
  fs.writeFileSync(path.join(DIST_DIR, 'app.js'), obfuscatedJs, 'utf-8');
  console.log(`   └─ app.js: ${formatBytes(Buffer.byteLength(rawJs))} ➔ ${formatBytes(Buffer.byteLength(obfuscatedJs))} (Obfuscated & Encoded)`);

  // -------------------------------------------------------------
  // B. CSS Minification
  // -------------------------------------------------------------
  console.log('🎨 Minifying Stylesheet (index.css)...');
  const rawCss = fs.readFileSync(path.join(ROOT_DIR, 'index.css'), 'utf-8');
  const cleanCssOutput = new CleanCSS({
    level: 1,
    compatibility: '*'
  }).minify(rawCss);

  if (cleanCssOutput.errors.length) {
    throw new Error('CleanCSS Errors: ' + cleanCssOutput.errors.join(', '));
  }
  fs.writeFileSync(path.join(DIST_DIR, 'index.css'), cleanCssOutput.styles, 'utf-8');
  const cssSavings = ((1 - cleanCssOutput.styles.length / rawCss.length) * 100).toFixed(1);
  console.log(`   └─ index.css: ${formatBytes(Buffer.byteLength(rawCss))} ➔ ${formatBytes(Buffer.byteLength(cleanCssOutput.styles))} (${cssSavings}% reduction)`);

  // -------------------------------------------------------------
  // C. HTML Minification
  // -------------------------------------------------------------
  console.log('📄 Minifying HTML (index.html)...');
  const rawHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf-8');
  const minifiedHtml = await minifyHtml(rawHtml, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true,
    minifyCSS: true,
    minifyJS: true
  });
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), minifiedHtml, 'utf-8');
  const htmlSavings = ((1 - minifiedHtml.length / rawHtml.length) * 100).toFixed(1);
  console.log(`   └─ index.html: ${formatBytes(Buffer.byteLength(rawHtml))} ➔ ${formatBytes(Buffer.byteLength(minifiedHtml))} (${htmlSavings}% reduction)`);

  // -------------------------------------------------------------
  // D. Copy Static Media / Branding Assets
  // -------------------------------------------------------------
  console.log('🖼️ Copying Brand Assets...');
  const assetFiles = ['pogx-logo.png', 'pogx-logo.ico'];
  for (const asset of assetFiles) {
    const src = path.join(ROOT_DIR, asset);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(DIST_DIR, asset));
      console.log(`   └─ Copied ${asset}`);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✨ Build completed successfully in ${duration}s! Output directory: dist/\n`);
}

build().catch((err) => {
  console.error('\n❌ Build failed:', err);
  process.exit(1);
});
