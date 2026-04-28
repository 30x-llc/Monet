import puppeteerCore from "puppeteer-core";
import { execSync } from "node:child_process";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const browser = await puppeteerCore.launch({
    executablePath: CHROME,
    headless: true,
    defaultViewport: { width: 1680, height: 1100, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
await page.setCookie({
    name: "30x_identity",
    value:
        "eyJuYW1lIjoiSnVhbiBEaWVnbyIsImVtYWlsIjoianVhbmRlbGFvc3NhQDMweC5jb20ifQ%3D%3D.Ktpkn_Y_IyNMp3BjDmxkEtaM6NscKAPUuNuxjjZ75xc",
    domain: "localhost",
    path: "/",
});
await page.goto("http://localhost:3000/preview/prototype", { waitUntil: "networkidle0", timeout: 30000 });
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: "/tmp/prototype-preview.png", fullPage: false });
await browser.close();
console.log("done");
