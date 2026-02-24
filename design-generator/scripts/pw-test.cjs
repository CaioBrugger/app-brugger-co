const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const screenshotDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

const pages = [
  { url: 'http://localhost:3000/agents',    label: 'Agentes IA',  file: 'agents.png' },
  { url: 'http://localhost:3000/skills',    label: 'Skills',      file: 'skills.png' },
  { url: 'http://localhost:3000/workflows', label: 'Workflows',   file: 'workflows.png' },
  { url: 'http://localhost:3000/extractor', label: 'Extrator DS', file: 'extractor.png' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const p of pages) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const consoleErrors = [];

    const page = await context.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    try {
      await page.goto(p.url, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(3000);

      const screenshotPath = path.join(screenshotDir, p.file);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      const info = await page.evaluate(() => {
        const cards    = document.querySelectorAll('[class*="card"], .card, [class*="agent-card"], [class*="skill-card"], [class*="workflow-card"]');
        const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4')).map(h => h.innerText.trim()).filter(Boolean);
        const bodyText = document.body.innerText.trim().substring(0, 800);
        const hasVisible404 = document.body.innerText.includes('404') || document.body.innerText.includes('Not Found');
        return { cardCount: cards.length, headings, bodyText, hasVisible404 };
      });

      results.push({ label: p.label, url: p.url, screenshot: screenshotPath, status: 'ok', ...info, consoleErrors });
    } catch (err) {
      results.push({ label: p.label, url: p.url, status: 'error', error: err.message, consoleErrors });
    }

    await context.close();
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})();
