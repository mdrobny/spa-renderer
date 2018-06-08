const bunyan = require('bunyan');
const config = require('config');

module.exports = bunyan.createLogger({
    name: config.logger.name,
    src: config.logger.src,
    level: config.logger.level
});
