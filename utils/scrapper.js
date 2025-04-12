const puppeteer = require("puppeteer");

const scrapeMetaFromURL = async (url) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((res) => setTimeout(res, 3000));

    const data = await page.evaluate(() => {
      const getTitle = () =>
        document.querySelector('meta[property="og:title"]')?.content ||
        document.querySelector("h1")?.innerText ||
        document.title ||
        "N/A";

      const getImage = () =>
        document.querySelector('meta[property="og:image"]')?.content ||
        Array.from(document.images)
          .filter((img) => img.width > 200 && img.height > 200)
          .sort((a, b) => b.width * b.height - a.width * a.height)[0]?.src ||
        "N/A";

      const getPrice = () => {
        const selectors = ["._30jeq3", ".price", '[class*="price"]'];
        for (let s of selectors) {
          const price = document.querySelector(s)?.innerText;
          if (price) return price;
        }
        const text = document.body.innerText;
        const match =
          text.match(/₹\s?\d{1,3}(,\d{3})*(\.\d{2})?/) ||
          text.match(/\$\s?\d{1,3}(,\d{3})*(\.\d{2})?/) ||
          text.match(/Rs\.\s?\d+/);
        return match ? match[0] : "N/A";
      };

      return {
        title: getTitle(),
        image: getImage(),
        price: getPrice(),
      };
    });

    await browser.close();
    return data;
  } catch (error) {
    console.log("Product scrape failed:", error.message);
    return null;
  }
};

module.exports = scrapeMetaFromURL;