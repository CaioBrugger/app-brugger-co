const { chromium } = require('playwright');
const { mkdirSync, existsSync } = require('fs');
const path = require('path');

const pages = [
  { name: 'Agents',    url: 'http://localhost:3000/agents' },
  { name: 'Skills',    url: 'http://localhost:3000/skills' },
  { name: 'Workflows', url: 'http://localhost:3000/workflows' },
  { name: 'Extractor', url: 'http://localhost:3000/extractor' },
];

const WAIT_MS = 3000;
const screenshotDir = path.join(__dirname, 'test-screenshots');

async function testPage(page, info) {
  const consoleErrors = [];
  const consoleWarnings = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    if (msg.type() === 'warning') consoleWarnings.push(msg.text());
  });

  page.on('pageerror', err => consoleErrors.push('PAGE ERROR: ' + err.message));

  await page.goto(info.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(WAIT_MS);

  // Screenshot
  const screenshotPath = path.join(screenshotDir, info.name.toLowerCase() + '.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });

  // Seletores para contar cards/itens
  const selectors = [
    '.agent-card-v2',
    '[class*="agent-card"]',
    '[class*="skill-card"]',
    '[class*="workflow-card"]',
    '[class*="card"]',
    '.agents-grid > *',
    '.grid > div',
    '[data-testid*="card"]',
    'ul > li',
    'table tbody tr',
  ];

  const cardCounts = {};
  for (const sel of selectors) {
    const count = await page.locator(sel).count();
    if (count > 0) cardCounts[sel] = count;
  }

  // Erros visíveis na UI
  const errorTexts = await page.locator(
    '[class*="error"], [class*="Error"], .alert, [role="alert"], [class*="empty"]'
  ).allTextContents();

  // Headings
  const headings = await page.locator('h1, h2, h3').allTextContents();

  // Texto do body
  const bodyText = await page.locator('body').innerText().catch(() => '');

  const has404     = bodyText.includes('404') || bodyText.toLowerCase().includes('not found');
  const hasLoading = bodyText.toLowerCase().includes('loading') || bodyText.toLowerCase().includes('carregando');
  const hasEmpty   = bodyText.toLowerCase().includes('nenhum') || bodyText.toLowerCase().includes('no items') || bodyText.toLowerCase().includes('empty');

  return {
    name: info.name,
    url: info.url,
    screenshot: screenshotPath,
    cardCounts,
    headings: headings.slice(0, 10),
    errorTexts: errorTexts.filter(t => t.trim()).slice(0, 5),
    consoleErrors,
    consoleWarnings: consoleWarnings.slice(0, 5),
    has404,
    hasLoading,
    hasEmpty,
    bodySnippet: bodyText.slice(0, 600).replace(/\n+/g, ' | '),
  };
}

(async () => {
  mkdirSync(screenshotDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  const results = [];

  for (const info of pages) {
    const page = await context.newPage();
    try {
      console.log('\nTestando: ' + info.name + ' (' + info.url + ')');
      const result = await testPage(page, info);
      results.push(Object.assign({ status: 'OK' }, result));
      console.log('  Status: OK');
      console.log('  Headings:', result.headings);
      console.log('  Cards encontrados:', JSON.stringify(result.cardCounts, null, 2));
      console.log('  Console errors (' + result.consoleErrors.length + '):', result.consoleErrors.slice(0, 3));
      if (result.errorTexts.length) console.log('  Erros UI:', result.errorTexts);
      if (result.has404) console.log('  AVISO: Parece 404');
      if (result.hasLoading) console.log('  AVISO: Parece em loading');
      if (result.hasEmpty) console.log('  AVISO: Estado vazio detectado');
      console.log('  Trecho body:', result.bodySnippet);
    } catch (err) {
      results.push({ status: 'ERRO', name: info.name, url: info.url, error: err.message });
      console.log('  Status: ERRO - ' + err.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  console.log('\n\n========================================');
  console.log('           RELATÓRIO FINAL');
  console.log('========================================\n');

  for (const r of results) {
    console.log('--- ' + r.name + ' (' + r.url + ') ---');
    console.log('Status: ' + r.status);
    if (r.status === 'ERRO') {
      console.log('Erro fatal: ' + r.error);
    } else {
      const maxCards = Object.values(r.cardCounts || {}).reduce((a, b) => Math.max(a, b), 0);
      console.log('Headings visíveis: ' + JSON.stringify(r.headings));
      console.log('Quantidade máxima de itens/cards: ' + maxCards);
      console.log('Detalhes seletores: ' + JSON.stringify(r.cardCounts));
      if (r.errorTexts.length) console.log('Erros visíveis na UI: ' + JSON.stringify(r.errorTexts));
      if (r.consoleErrors.length) console.log('Erros no console browser: ' + JSON.stringify(r.consoleErrors));
      const alertas = [];
      if (r.has404) alertas.push('PÁGINA 404/NOT FOUND');
      if (r.hasLoading) alertas.push('ESTADO DE LOADING');
      if (r.hasEmpty) alertas.push('ESTADO VAZIO');
      if (alertas.length) console.log('Alertas: ' + alertas.join(', '));
      console.log('Screenshot: ' + r.screenshot);
    }
    console.log();
  }

  console.log('========================================');
  console.log('             SUMÁRIO EXECUTIVO');
  console.log('========================================');
  for (const r of results) {
    const cards = r.cardCounts ? Object.values(r.cardCounts).reduce((a, b) => Math.max(a, b), 0) : 0;
    const erros = (r.consoleErrors || []).length;
    const flags = [];
    if (r.has404) flags.push('404');
    if (r.hasEmpty) flags.push('VAZIO');
    if (r.hasLoading) flags.push('LOADING');
    const flagStr = flags.length ? ' | Flags: ' + flags.join(', ') : '';
    console.log((r.status === 'OK' ? '[OK]   ' : '[ERRO] ') +
      r.name.padEnd(12) + ' | Cards: ' + String(cards).padStart(3) +
      ' | Console errors: ' + erros + flagStr);
  }
})();
