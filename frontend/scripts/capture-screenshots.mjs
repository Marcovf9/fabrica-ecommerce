// Captura las imágenes del README desde el sitio en producción (o cualquier BASE_URL).
//
//   npm i --no-save playwright && npx playwright install chromium   # solo la primera vez
//   npm run screenshots
//   ADMIN_USER=... ADMIN_PASS=... npm run screenshots   # incluye el panel de administración
//
// Las imágenes se guardan en docs/screenshots/ en la raíz del repo.
import { chromium, devices } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BASE_URL = (process.env.BASE_URL ?? 'https://ritualespacios.com').replace(/\/$/, '');
const OUT_DIR = fileURLToPath(new URL('../../docs/screenshots/', import.meta.url));
const { ADMIN_USER, ADMIN_PASS, CHROMIUM_PATH } = process.env;

await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch(CHROMIUM_PATH ? { executablePath: CHROMIUM_PATH } : {});

async function shoot(page, path, file, { fullPage = false } = {}) {
  await page.goto(BASE_URL + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500); // animaciones e imágenes lazy
  await page.screenshot({ path: OUT_DIR + file, fullPage });
  console.log(`✔ ${file}`);
}

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await shoot(desktop, '/', 'home.png');
  await shoot(desktop, '/productos', 'catalogo.png');

  const firstProduct = desktop.locator('a[href^="/producto/"]').first();
  if (await firstProduct.count()) {
    await shoot(desktop, await firstProduct.getAttribute('href'), 'producto.png');
  }

  const mobileContext = await browser.newContext({ ...devices['iPhone 13'] });
  await shoot(await mobileContext.newPage(), '/', 'mobile.png');

  if (ADMIN_USER && ADMIN_PASS) {
    await desktop.goto(BASE_URL + '/admin', { waitUntil: 'networkidle' });
    await desktop.fill('input[placeholder="Usuario"]', ADMIN_USER);
    await desktop.fill('input[placeholder="Contraseña"]', ADMIN_PASS);
    await desktop.keyboard.press('Enter');
    await desktop.waitForLoadState('networkidle');
    await desktop.waitForTimeout(2000);
    await desktop.screenshot({ path: OUT_DIR + 'admin.png' });
    console.log('✔ admin.png');
  } else {
    console.log('↷ admin.png omitida (definí ADMIN_USER y ADMIN_PASS)');
  }
} finally {
  await browser.close();
}
