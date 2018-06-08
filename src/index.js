const http = require('http');
const { URL, URLSearchParams } = require('url');

const config = require('config');

const renderer = require('./renderer');

async function app() {
    await renderer.init();

    const server = http.createServer(async (req, res) => {
        try {
            const body = await requestHandler(req, res, renderer)

            res.end(body);
        } catch (err) {
            console.error(err);

            res.statusCode = err.statusCode || 500;
            res.end(JSON.stringify({ message: err.message }));
        }
    });

    server.on('error', (err) => {
        console.error(`Server error: ${err.message}`);
    });

    server.listen(config.http.port, (err) => {
        if (err) {
            return console.error(err);
        }

        console.log(`Server is listening on ${config.http.port}`)
    });

    return server;
}

async function requestHandler(req, res, renderer) {
    const reqUrl = req.url.substring(1);
    console.log('request handler', reqUrl);
    const parsedSearchPath = new URLSearchParams(reqUrl);
    const pageUrl = parsedSearchPath.get('pageUrl');

    if (pageUrl) {
        try {
            new URL(pageUrl)
        } catch (err) {
            err.statusCode = 400;
            throw err;
        }

        return renderer.renderPage(pageUrl);
    }

    const err =  new Error('Not found');
    err.statusCode = 404;
    throw err;
}

app()
    .then((server) => {
        console.log('App started');

        process.on('SIGINT', () => {
            console.log('exit');
            server.close();
        });
    })
    .catch((err) => {
        console.error(err);
    });

