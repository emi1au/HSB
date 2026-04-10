import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    
    const html = await page.content();
    console.log('HTML:', html.substring(0, 500));
    
    const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML);
    console.log('ROOT HTML:', rootHtml?.substring(0, 500));
    
    await browser.close();
  } catch (e) {
    console.log('SCRIPT ERROR:', e.message);
  }
})();
