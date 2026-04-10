import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    console.log('GOTO START');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('GOTO DONE');
    
    await new Promise(r => setTimeout(r, 2000));
    console.log('WAIT DONE');
    
    const html = await page.content();
    fs.writeFileSync('page-html.txt', html);
    console.log('HTML written to page-html.txt');
    
    await browser.close();
  } catch (e) {
    console.log('SCRIPT ERROR:', e.message);
    process.exit(1);
  }
})();
