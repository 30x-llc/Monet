// Verify the production editor view by seeding a minimal deck into
// localStorage and waiting for the editor to render.
import puppeteerCore from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const browser = await puppeteerCore.launch({
    executablePath: CHROME,
    headless: true,
    defaultViewport: { width: 1680, height: 1100, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
await page.setCacheEnabled(false);
await page.setExtraHTTPHeaders({ "cache-control": "no-cache" });

await page.setCookie({
    name: "30x_identity",
    value:
        "eyJuYW1lIjoiSnVhbiBEaWVnbyIsImVtYWlsIjoianVhbmRlbGFvc3NhQDMweC5jb20ifQ%3D%3D.Ktpkn_Y_IyNMp3BjDmxkEtaM6NscKAPUuNuxjjZ75xc",
    domain: "design.30x.com",
    path: "/",
});

// Use the deep-link /?open=<id> path which goes straight into the editor
await page.goto("https://design.30x.com/?open=uyh1ckace6jmoj6cbsj", {
    waitUntil: "networkidle0",
    timeout: 30000,
});
await new Promise((r) => setTimeout(r, 3000));

await page.screenshot({ path: "/tmp/prod-after-seed.png", fullPage: false });

const html = await page.content();
const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 2000));

console.log("--- PROD EDITOR HTML CHECK ---");
const checks = {
    "Pidele al agente": html.includes("Pidele al agente"),
    "Asistente": html.includes("Asistente"),
    "Modifica el deck": html.includes("Modifica el deck"),
    "Propiedades button": html.includes("Propiedades"),
    "Pulir button": html.includes("Pulir"),
    "Nuevo button": html.includes("Nuevo"),
    "Handoff to Claude": html.includes("Handoff to Claude"),
    "Descargar PDF": html.includes("Descargar PDF"),
};
for (const [k, v] of Object.entries(checks)) console.log(v ? "  ✓" : "  ✗", k);
console.log("--- BODY TEXT (first 2k chars) ---");
console.log(bodyText);

await browser.close();
