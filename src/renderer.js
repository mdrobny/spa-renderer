const puppeteer = require('puppeteer');
const config = require('config');

const blacklistedUrlsRegex = new RegExp('(' + config.urlsBlacklist.join('|') + ')', 'i');

let browser = undefined;

async function init() {
    browser = await puppeteer.launch({
        headless: true
    });
}

async function getBrowserPage({ forceRestart = false } = {}) {
    if (forceRestart && browser) {
        try {
            await browser.close();

            browser = undefined;
        } catch (error) {
            console.warn('Chromium died silently, relaunching');
        }
    }

    if (browser === undefined) {
        browser = await puppeteer.launch();
    }

    const page = await browser.newPage();

    await page.setViewport({
        width: config.viewportSize.width,
        height: config.viewportSize.height
    });

    if (config.urlsBlacklist.length) {
        await page.setRequestInterception(true);
        page.on('request', interceptedRequest => {
            const url = interceptedRequest.url();
            console.log('interspection' ,url);

            if (blacklistedUrlsRegex.test(url)) {
                console.debug(`Blocked request for: ${url}`);
                interceptedRequest.abort();
            } else {
                interceptedRequest.continue();
            }
        });
    }

    return page;
}

async function renderPage(pageUrl) {
    let page;
    try {
        page = await getBrowserPage();
    } catch (err) {
        page = await getBrowserPage({ forceRestart: true });
    }

    console.info(`Opening "${pageUrl}"`);

    let pageContent;

    try {
        await page.goto(pageUrl, {
            timeout: config.pageLoadingTimeout,
            waitUntil: 'networkidle2'
        });

        pageContent = await page.content();
    } catch (err) {
        if (err.message.includes('Navigation Timeout Exceeded')) {
            throw new Error(`Request for ${pageUrl} timed out after ${config.pageGotoTimeout}ms`);
        } else {
            throw new Error(`Exception thrown by puppeteer: ${err.message}`);
        }
    } finally {
        page.close();
    }

    return pageContent;
}

module.exports = {
    init,
    getBrowserPage,
    renderPage
};


