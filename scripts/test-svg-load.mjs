import puppeteerCore from "puppeteer-core";
const browser = await puppeteerCore.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
});
const page = await browser.newPage();
const failures = [];
page.on("requestfailed", (req) => failures.push({ url: req.url(), error: req.failure()?.errorText }));
page.on("response", (res) => {
    if (res.url().includes("aeromexico")) console.log("AERO:", res.status(), res.url());
});
await page.setContent(`
    <div style="background:#000;padding:50px;">
      <div style="background-image:url(https://www.aeromexico.com/cms/sites/default/files/icons/caballero_am-white-mobile_2.svg); width:220px; height:56px; background-size:contain; background-repeat:no-repeat; background-position:left center;"></div>
    </div>
`, { waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 1000));
await page.screenshot({ path: "/tmp/test-svg.png" });
console.log("failures", failures);
await browser.close();
