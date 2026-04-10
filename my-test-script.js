import puppeteer from 'puppeteer';

console.log('STARTING SCRIPT');

(async () => {
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log('BAD RESPONSE:', response.status(), response.url());
      }
    });

    console.log('GOTO START');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('GOTO DONE');
    
    await browser.close();
    console.log('DONE');
  } catch (e) {
    console.log('SCRIPT ERROR:', e.message);
  }
})();
