import puppeteerCore from "puppeteer-core";
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
    domain: "localhost",
    path: "/",
});
await page.goto("http://localhost:3000/?open=uyh1ckace6jmoj6cbsj", { waitUntil: "networkidle0", timeout: 30000 });
await new Promise((r) => setTimeout(r, 2500));
await page.evaluate(() => {
    const thumbs = Array.from(document.querySelectorAll("[data-thumb-index]"));
    thumbs[thumbs.length - 1].click();
});
await new Promise((r) => setTimeout(r, 1500));

const debug = await page.evaluate(() => {
    const r = (el) => {
        const x = el.getBoundingClientRect();
        return { x: Math.round(x.x), y: Math.round(x.y), w: Math.round(x.width), h: Math.round(x.height) };
    };
    const cs = (el) => {
        const c = getComputedStyle(el);
        return { width: c.width, height: c.height, display: c.display, opacity: c.opacity };
    };
    const portadas = Array.from(document.querySelectorAll(".s-end-portada"));
    const canvasPortada = portadas.find((p) => p.getBoundingClientRect().width > 500) || portadas[0];
    if (!canvasPortada) return { found: false };
    const lockup = canvasPortada.querySelector(".lockup");
    const partner = canvasPortada.querySelector(".lockup-partner");
    const divider = canvasPortada.querySelector(".lockup-divider");
    const c2 = (el) => {
        const c = getComputedStyle(el);
        return { width: c.width, height: c.height, display: c.display, opacity: c.opacity, backgroundImage: c.backgroundImage };
    };
    return {
        found: true,
        lockup: lockup ? { rect: r(lockup), style: cs(lockup) } : null,
        partner: partner
            ? {
                  tag: partner.tagName,
                  inlineStyle: partner.getAttribute("style"),
                  rect: r(partner),
                  style: c2(partner),
              }
            : null,
        divider: divider ? { rect: r(divider), style: cs(divider) } : null,
    };
});
console.log(JSON.stringify(debug, null, 2));
await browser.close();
