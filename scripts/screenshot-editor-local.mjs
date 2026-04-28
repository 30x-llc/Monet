// Screenshot the local dev editor with a real deck loaded.
// Hits the dev server's deep-link path to skip the home form.
import puppeteerCore from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const browser = await puppeteerCore.launch({
    executablePath: CHROME,
    headless: true,
    defaultViewport: { width: 1680, height: 1100, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
await page.setCacheEnabled(false);

await page.setCookie({
    name: "30x_identity",
    value:
        "eyJuYW1lIjoiSnVhbiBEaWVnbyIsImVtYWlsIjoianVhbmRlbGFvc3NhQDMweC5jb20ifQ%3D%3D.Ktpkn_Y_IyNMp3BjDmxkEtaM6NscKAPUuNuxjjZ75xc",
    domain: "localhost",
    path: "/",
});

await page.goto("http://localhost:3000/?open=uyh1ckace6jmoj6cbsj", {
    waitUntil: "networkidle0",
    timeout: 30000,
});
await new Promise((r) => setTimeout(r, 2500));
await page.screenshot({ path: "/tmp/editor-local.png" });
console.log("done");
await browser.close();
