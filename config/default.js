module.exports = {
    http: {
        port: 3000
    },
    logger: {
        name: 'spa-renderer',
        level: 'info',
        src: false
    },
    headlessChromeOptions: {
        headless: true,
        devtools: false,
        timeout: 10000 // Maximum time in milliseconds to wait for the browser instance to start
    },
    viewportSize: {
        width: 375,
        height: 1200
    },
    pageLoadingTimeout: 10 * 1000, // 10 seconds
    // Every request containing url from this list will be aborted
    urlsBlacklist: []
};

