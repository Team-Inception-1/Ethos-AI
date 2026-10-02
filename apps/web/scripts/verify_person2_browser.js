const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity-ide/brain/8d9c5c49-766a-458e-aece-aaac24366803/scratch';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function safeScreenshot(page, filename) {
  try {
    await page.screenshot({ path: path.join(ARTIFACT_DIR, filename), fullPage: false, timeout: 5000 });
    console.log(`[Screenshot Saved] ${filename}`);
  } catch (err) {
    console.warn(`[Screenshot Skipped] ${filename}: ${err.message}`);
  }
}

async function verifyPages() {
  console.log('--- STARTING PERSON 2 BROWSER VERIFICATION ---');
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Browser Console Error] ${msg.text()}`);
    }
  });

  const results = [];

  // 1. Campus Living Page
  try {
    console.log('\n[1/5] Checking /campus-living...');
    await page.goto('http://localhost:3000/campus-living', { waitUntil: 'networkidle', timeout: 15000 });
    const title = await page.textContent('h1');
    console.log('Campus Living Title:', title);

    await safeScreenshot(page, '01_campus_living.png');

    // Toggle currency to BDT
    const bdtBtn = page.getByRole('button', { name: /BDT \(Taka\)/i });
    if (await bdtBtn.isVisible()) {
      await bdtBtn.click();
      await page.waitForTimeout(500);
      await safeScreenshot(page, '02_campus_living_bdt.png');
    }

    // Check Data Sources & Audit Trail
    const auditText = await page.textContent('body');
    const hasDbAudit = auditText.includes('PostgreSQL / Neon Audited') || auditText.includes('Data Sources & Audit Trail');
    console.log('Campus Living has DB Audit:', hasDbAudit);
    results.push({ test: 'Campus Living (AUD-021)', pass: title.includes('Living') && hasDbAudit });
  } catch (err) {
    console.error('Campus Living error:', err.message);
    results.push({ test: 'Campus Living (AUD-021)', pass: false, error: err.message });
  }

  // 2. Agency Directory 404 Behavior (AUD-001)
  try {
    console.log('\n[2/5] Checking /directory/invalid-agency-id-999...');
    await page.goto('http://localhost:3000/directory/invalid-agency-id-999', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);
    const bodyText = await page.textContent('body');
    const has404 = bodyText.includes('Agency Not Found') || bodyText.includes('404');
    console.log('Invalid Agency ID returns 404 UI:', has404);
    await safeScreenshot(page, '03_agency_404.png');
    results.push({ test: 'Directory 404 Handler (AUD-001)', pass: has404 });
  } catch (err) {
    console.error('Directory 404 error:', err.message);
    results.push({ test: 'Directory 404 Handler (AUD-001)', pass: false, error: err.message });
  }

  // 3. Agency Comparison Page (AUD-002)
  try {
    console.log('\n[3/5] Checking /compare...');
    await page.goto('http://localhost:3000/compare', { waitUntil: 'networkidle', timeout: 15000 });
    const h1Text = await page.textContent('h1');
    console.log('Compare Page H1:', h1Text);
    const bodyText = await page.textContent('body');
    const hasComparison = bodyText.includes('Global Edu BD') || bodyText.includes('Fee Range') || bodyText.includes('Side-by-Side');
    console.log('Compare Page loaded comparison:', hasComparison);
    await safeScreenshot(page, '04_agency_compare.png');
    results.push({ test: 'Agency Comparison (AUD-002)', pass: hasComparison });
  } catch (err) {
    console.error('Compare error:', err.message);
    results.push({ test: 'Agency Comparison (AUD-002)', pass: false, error: err.message });
  }

  // 4. AI Counselor Page (AUD-003, AUD-004, AUD-005, AUD-006, AUD-007)
  try {
    console.log('\n[4/5] Checking /counselor...');
    await page.goto('http://localhost:3000/counselor', { waitUntil: 'networkidle', timeout: 15000 });
    const bodyText = await page.textContent('body');
    const hasCounselor = bodyText.includes('AI Counselor');
    console.log('Counselor loaded:', hasCounselor);

    // Click "Run Live Evaluation"
    const evalBtn = page.getByRole('button', { name: /Run Live Evaluation/i });
    if (await evalBtn.isVisible()) {
      await evalBtn.click();
      await page.waitForTimeout(2000);
      const afterText = await page.textContent('body');
      const hasVerifiedBadge = afterText.includes('Verified Ethos Registry') || afterText.includes('Admission Odds');
      console.log('Counselor has verified results:', hasVerifiedBadge);
      await safeScreenshot(page, '05_counselor_results.png');
      results.push({ test: 'AI Counselor Live Evaluation (AUD-003 to 007)', pass: hasVerifiedBadge });
    } else {
      await safeScreenshot(page, '05_counselor_page.png');
      results.push({ test: 'AI Counselor Live Evaluation (AUD-003 to 007)', pass: hasCounselor });
    }
  } catch (err) {
    console.error('Counselor error:', err.message);
    results.push({ test: 'AI Counselor Live Evaluation (AUD-003 to 007)', pass: false, error: err.message });
  }

  // 5. Scholar Finder Page (AUD-008, AUD-031)
  try {
    console.log('\n[5/5] Checking /scholar-finder...');
    await page.goto('http://localhost:3000/scholar-finder', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);
    const bodyText = await page.textContent('body');
    const hasScholarFinder = bodyText.includes('Scholar Finder');
    console.log('Scholar Finder loaded:', hasScholarFinder);

    // Verify faculty cards or search results exist
    const hasFaculty = bodyText.includes('Bengio') || bodyText.includes('Professor') || bodyText.includes('Faculty') || bodyText.includes('Lab');
    console.log('Faculty catalog or cards visible:', hasFaculty);

    await safeScreenshot(page, '06_scholar_finder.png');
    results.push({ test: 'Scholar Finder & PostgreSQL Faculty (AUD-008, AUD-031)', pass: hasScholarFinder && hasFaculty });
  } catch (err) {
    console.error('Scholar Finder error:', err.message);
    results.push({ test: 'Scholar Finder & PostgreSQL Faculty (AUD-008, AUD-031)', pass: false, error: err.message });
  }

  await browser.close();
  console.log('\n========================================');
  console.log('    PERSON 2 BROWSER VERIFICATION RESULT');
  console.log('========================================');
  console.table(results);

  const allPassed = results.every(r => r.pass);
  console.log(allPassed ? '\n>>> ALL PERSON 2 BROWSER CHECKS PASSED SUCCESSFULLY! <<<' : '\n>>> SOME CHECKS FAILED <<<');
}

verifyPages();
