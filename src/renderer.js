const puppeteer = require('puppeteer');
const config = require('config');

const logger = require('./utils/logger');

const blacklistedUrlsRegex = new RegExp('(' + config.urlsBlacklist.join('|') + ')', 'i');

let browser = undefined;

async function init() {
    browser = await puppeteer.launch(config.headlessChromeOptions);
}

async function renderPage(pageUrl) {
    let page;
    try {
        page = await getBrowserPage();
    } catch (err) {
        page = await getBrowserPage({ forceRestart: true });
    }

    logger.info(`Opening "${pageUrl}"`);

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

async function takePageScreenshot(pageUrl) {
    let page;
    try {
        page = await getBrowserPage();
    } catch (err) {
        page = await getBrowserPage({ forceRestart: true });
    }

    logger.info(`Opening "${pageUrl}"`);

    let screenshot;

    try {
        await page.goto(pageUrl, {
            timeout: config.pageLoadingTimeout,
            waitUntil: 'networkidle2'
        });
        screenshot = await page.screenshot(pageUrl, {
            type: 'png'
        });
    } catch (err) {
        throw new Error(`Error when taking screenshot of ${pageUrl}. Message: ${err.message}`);
    } finally {
        page.close();
    }

    return screenshot;
}

/**
 * @private
 * @param {Boolean} forceRestart
 * @return {Promise<Object>}
 */
async function getBrowserPage({ forceRestart = false } = {}) {
    if (forceRestart && browser) {
        try {
            await browser.close();
        } catch (error) {
            logger.warn('Chromium died silently, relaunching');
        } finally {
            browser = undefined;
        }
    }

    if (browser === undefined) {
        browser = await puppeteer.launch();

        browser.on('disconnected', browserDisconnectHandler)
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
                logger.debug(`Blocked request for: ${url}`);
                interceptedRequest.abort();
            } else {
                interceptedRequest.continue();
            }
        });
    }

    return page;
}

async function browserDisconnectHandler() {
    logger.warn('Puppeteer disconnected from the Chromium instance, relaunching');

    await init();
}

module.exports = {
    init,
    renderPage,
    takePageScreenshot
};


