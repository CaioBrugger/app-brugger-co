import { chromium } from 'playwright';

const pages = [
  { name: 'Agents',    url: 'http://localhost:3000/agents',    expectCards: true,  expectedSelector: '.agent-card-v2', expectedCount: 20 },
  { name: 'Skills',    url: 'http://localhost:3000/skills',    expectCards: true,  expectedSelector: '.agent-card-v2', expectedCount: 37 },
  { name: 'Workflows', url: 'http://localhost:3000/workflows', expectCards: true,  expectedSelector: '.agent-card-v2', expectedCount: 11 },
  { name: 'Extractor', url: 'http://localhost:3000/extractor', expectCards: false, expectedSelector: null,             expectedCount: 0 },
];

const screenshotDir = 'test-screenshots';

async function warmupHome(context) {
  console.log('Aquecendo Vite: navegando para http://localhost:3000/ ...');
  const page = await context.newPage();
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  console.log('  Aguardando 5s para Vite otimizar deps...');
  await page.waitForTimeout(5000);
  await page.close();
  console.log('  Home aquecida.\n');
}

async function testPage(context, info) {
  const page = await context.newPage();
  const consoleErrors = [];
  const consoleWarnings = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    if (msg.type() === 'warning') consoleWarnings.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(`PAGE ERROR: ${err.message}`));

  try {
    console.log(`\nTestando: ${info.name} (${info.url})`);

    await page.goto(info.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    console.log('  Aguardando 5s...');
    await page.waitForTimeout(5000);

    // Verificar se a página ficou em branco (possível reload do Vite)
    const bodyText1 = await page.locator('body').innerText().catch(() => '');
    if (bodyText1.trim().length < 10) {
      console.log('  Página parece em branco, aguardando mais 5s (possível reload do Vite)...');
      await page.waitForTimeout(5000);
    }

    // Screenshot
    const screenshotPath = `${screenshotDir}/${info.name.toLowerCase()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`  Screenshot salvo: ${screenshotPath}`);

    // Contar cards com o seletor principal
    const agentCardCount = await page.locator('.agent-card-v2').count();

    // Seletores adicionais para diagnóstico
    const selectors = [
      '.agent-card-v2',
      '[class*="agent-card"]',
      '[class*="skill-card"]',
      '[class*="workflow-card"]',
      '[class*="card"]',
    ];

    const cardCounts = {};
    for (const sel of selectors) {
      const count = await page.locator(sel).count();
      if (count > 0) cardCounts[sel] = count;
    }

    // Para página Extractor: verificar input URL e botão
    let extractorInfo = null;
    if (info.name === 'Extractor') {
      const urlInputCount = await page.locator('input[type="url"], input[placeholder*="url" i], input[placeholder*="URL"], input[name*="url" i]').count();
      const buttonCount = await page.locator('button').count();
      const buttons = await page.locator('button').allTextContents();
      extractorInfo = { urlInputCount, buttonCount, buttons };
    }

    // Título/heading da página
    const headings = await page.locator('h1, h2').allTextContents();

    // Erros visíveis na página
    const errorTexts = await page.locator(
      '[class*="error"], [class*="Error"], .alert, [role="alert"]'
    ).allTextContents();

    // Texto do body para diagnóstico
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const has404     = bodyText.includes('404') || bodyText.toLowerCase().includes('not found');
    const hasLoading = bodyText.toLowerCase().includes('loading') || bodyText.toLowerCase().includes('carregando');

    // Avaliação do resultado esperado
    let passed = false;
    if (info.expectCards) {
      passed = agentCardCount >= info.expectedCount * 0.8; // tolera 80% do esperado
    } else {
      // Extractor: deve ter input de URL e botão
      passed = extractorInfo && (extractorInfo.urlInputCount > 0 || extractorInfo.buttonCount > 0);
    }

    return {
      status: 'OK',
      passed,
      name: info.name,
      url: info.url,
      screenshot: screenshotPath,
      agentCardCount,
      cardCounts,
      headings,
      errorTexts: errorTexts.filter(t => t.trim()),
      consoleErrors,
      consoleWarnings: consoleWarnings.slice(0, 5),
      has404,
      hasLoading,
      extractorInfo,
      bodySnippet: bodyText.slice(0, 600).replace(/\n+/g, ' '),
    };
  } finally {
    await page.close();
  }
}

(async () => {
  const { mkdirSync } = await import('fs');
  mkdirSync(screenshotDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  // Estratégia: aquece home primeiro para Vite otimizar deps
  await warmupHome(context);

  const results = [];

  for (const info of pages) {
    try {
      const result = await testPage(context, info);
      results.push(result);
      console.log(`  Status: OK | .agent-card-v2: ${result.agentCardCount} | Headings: ${JSON.stringify(result.headings)}`);
      if (result.consoleErrors.length) console.log(`  Console errors (${result.consoleErrors.length}):`, result.consoleErrors.slice(0, 3));
    } catch (err) {
      results.push({ status: 'ERRO', passed: false, name: info.name, url: info.url, error: err.message });
      console.log(`  Status: ERRO - ${err.message}`);
    }
  }

  await browser.close();

  // Relatório final
  console.log('\n\n========================================');
  console.log('           RELATÓRIO FINAL');
  console.log('========================================\n');

  for (const r of results) {
    console.log(`--- ${r.name} (${r.url}) ---`);
    console.log(`Status: ${r.status} | Passou: ${r.passed ? 'SIM' : 'NAO'}`);
    if (r.status === 'ERRO') {
      console.log(`Erro: ${r.error}`);
    } else {
      console.log(`Headings: ${JSON.stringify(r.headings)}`);
      console.log(`Cards .agent-card-v2: ${r.agentCardCount}`);
      console.log(`Todos seletores com resultado: ${JSON.stringify(r.cardCounts)}`);
      if (r.extractorInfo) console.log(`Extractor - inputs/buttons: ${JSON.stringify(r.extractorInfo)}`);
      if (r.errorTexts.length) console.log(`Erros visíveis: ${JSON.stringify(r.errorTexts)}`);
      if (r.consoleErrors.length) console.log(`Console errors: ${JSON.stringify(r.consoleErrors)}`);
      if (r.has404) console.log('AVISO: Parece 404 / Not Found');
      if (r.hasLoading) console.log('AVISO: Parece estar em loading');
      console.log(`Trecho: ${r.bodySnippet}`);
      console.log(`Screenshot: ${r.screenshot}`);
    }
    console.log();
  }

  console.log('========================================');
  console.log('             SUMÁRIO EXECUTIVO');
  console.log('========================================');
  for (const r of results) {
    const cards = r.agentCardCount ?? '-';
    const passou = r.passed ? 'PASSOU' : 'FALHOU';
    const erros = r.consoleErrors ? r.consoleErrors.length : '-';
    console.log(`[${r.status === 'OK' ? 'OK  ' : 'ERRO'}] ${r.name.padEnd(12)} | .agent-card-v2: ${String(cards).padStart(3)} | Console errors: ${erros} | ${passou}`);
  }
})();
