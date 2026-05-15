// Screenshot just the closing slide (slide 9 of 12 in the Aeroméxico deck).
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

// Click the closing thumb. We probe right-to-left and pick the last
// thumb that has an .s-end-portada inside (covers the case where the
// user added duplicates after the original closing slide).
const lastIdx = await page.evaluate(() => {
    const thumbs = Array.from(document.querySelectorAll("[data-thumb-index]"));
    for (let i = thumbs.length - 1; i >= 0; i--) {
        if (thumbs[i].querySelector(".s-end-portada")) {
            thumbs[i].click();
            return i;
        }
    }
    // Fallback: just click the last thumb
    if (thumbs.length) {
        thumbs[thumbs.length - 1].click();
        return thumbs.length - 1;
    }
    return -1;
});
console.log("clicked thumb index", lastIdx);
await new Promise((r) => setTimeout(r, 1500));

// Just full page — easier to see context
await page.screenshot({ path: "/tmp/closing-slide.png" });
console.log("done");
await browser.close();
