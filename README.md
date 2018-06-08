# SPA renderer

Simple server running headless Chrome to render a page.

Uses [puppeteer](https://github.com/GoogleChrome/puppeteer).

### How to use
```
$ npm install
$ npm start
```

#### Render page
```
$ curl http://localhost:3000/render?pageUrl=https://my.page.com
```

#### Take screenshot of page
```
$ curl http://localhost:3000/screenshot?pageUrl=https://my.page.com
```
