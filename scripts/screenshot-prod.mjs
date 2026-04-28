// Screenshot the production editor view, fresh, no cache.
// Loads a sample deck from localStorage so we land in the editor instead
// of the home view.
import puppeteerCore from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = process.env.URL || "https://design.30x.com/";

const browser = await puppeteerCore.launch({
    executablePath: CHROME,
    headless: true,
    defaultViewport: { width: 1680, height: 1100, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
// Bypass HTTP cache
await page.setCacheEnabled(false);
await page.setExtraHTTPHeaders({
    "cache-control": "no-cache, no-store",
    pragma: "no-cache",
});

// Identity cookie so we skip the gate
await page.setCookie({
    name: "30x_identity",
    value:
        "eyJuYW1lIjoiSnVhbiBEaWVnbyIsImVtYWlsIjoianVhbmRlbGFvc3NhQDMweC5jb20ifQ%3D%3D.Ktpkn_Y_IyNMp3BjDmxkEtaM6NscKAPUuNuxjjZ75xc",
    domain: "design.30x.com",
    path: "/",
});

await page.goto(URL, { waitUntil: "networkidle0", timeout: 30000 });
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: "/tmp/prod-home.png" });

// Inspect what's in the bundle
const body = await page.content();
const newStrings = ["Pidele al agente", "Asistente", "Handoff to Claude", "Agentic edits"];
const oldStrings = ["Modifica el deck", "Propiedades", "Pulir", "Nuevo deck"];
console.log("NEW strings present:", newStrings.filter(s => body.includes(s)));
console.log("OLD strings present:", oldStrings.filter(s => body.includes(s)));

await browser.close();
console.log("done");
