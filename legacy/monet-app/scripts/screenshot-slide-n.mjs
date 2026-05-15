// Screenshot a specific slide by index. Usage: SLIDE=4 node scripts/screenshot-slide-n.mjs
import puppeteerCore from "puppeteer-core";
const SLIDE = Number(process.env.SLIDE ?? 4) - 1;
const ID = process.env.ID ?? "uyh1ckace6jmoj6cbsj";
const HOST = process.env.HOST ?? "http://localhost:3000";

const browser = await puppeteerCore.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    defaultViewport: { width: 1680, height: 1100, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
await page.setCacheEnabled(false);
await page.setCookie({
    name: "30x_identity",
    value:
        "eyJuYW1lIjoiSnVhbiBEaWVnbyIsImVtYWlsIjoianVhbmRlbGFvc3NhQDMweC5jb20ifQ%3D%3D.Ktpkn_Y_IyNMp3BjDmxkEtaM6NscKAPUuNuxjjZ75xc",
    domain: HOST.includes("localhost") ? "localhost" : "design.30x.com",
    path: "/",
});
await page.goto(`${HOST}/?open=${ID}`, { waitUntil: "networkidle0", timeout: 30000 });
await new Promise((r) => setTimeout(r, 2500));
await page.evaluate((idx) => {
    const thumbs = Array.from(document.querySelectorAll("[data-thumb-index]"));
    if (thumbs[idx]) thumbs[idx].click();
}, SLIDE);
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: "/tmp/slide-n.png" });
console.log("done", "slide", SLIDE + 1);
await browser.close();
