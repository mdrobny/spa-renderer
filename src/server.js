const http = require('http');
const { URL } = require('url');

const config = require('config');

const logger = require('./utils/logger');
const renderer = require('./renderer');

async function app() {
    await renderer.init();

    const server = http.createServer(async (req, res) => {
        try {
            const body = await requestHandler(req, res, renderer)

            res.end(body);
        } catch (err) {
            logger.error(err);

            res.statusCode = err.statusCode || 500;
            res.end(JSON.stringify({ message: err.message }));
        }
    });

    server.on('error', (err) => {
        logger.error(`Server error: ${err.message}`);
    });

    server.listen(config.http.port, (err) => {
        if (err) {
            return logger.error(err);
        }

        logger.info(`Server is running on port ${config.http.port}`)
    });

    return server;
}

async function requestHandler(req, res, renderer) {
    if (req.url === '/status') {
        return JSON.stringify({ status: 'ok' });
    }

    let reqUrl;
    try {
        reqUrl = new URL(`${req.headers.host}${req.url}`);
    } catch (err) {
        err.statusCode = 400;
        throw err;
    }

    const pageUrl = reqUrl.searchParams.get('pageUrl');
    if (!pageUrl) {
        const err =  new Error('Query parameter "pageUrl" not provided');
        err.statusCode = 400;
        throw err;
    }

    if (reqUrl.pathname.endsWith('/render')) {
        return renderer.renderPage(pageUrl);
    } else if (reqUrl.pathname.endsWith('/screenshot')) {
        const image = await renderer.takePageScreenshot(pageUrl);
        res.setHeader('Content-Type', 'image/png');
        return image;
    }

    const err =  new Error('Path not found');
    err.statusCode = 404;
    throw err;
}

app()
    .then((server) => {
        process.on('SIGINT', () => {
            server.close();
        });
    })
    .catch((err) => {
        logger.error(err);
    });

