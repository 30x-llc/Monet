// Screenshot the rail with hover state visible to confirm the delete button.
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

// Force visibility of delete button on first thumb
await page.evaluate(() => {
    const t = document.querySelector('[data-thumb-index="2"]');
    if (t) {
        t.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
        t.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    }
});
await new Promise((r) => setTimeout(r, 800));

// Crop just the rail
const rail = await page.$(".proto-rail");
if (rail) {
    await rail.screenshot({ path: "/tmp/rail-detail.png" });
} else {
    await page.screenshot({ path: "/tmp/rail-detail.png" });
}
console.log("done");
await browser.close();
