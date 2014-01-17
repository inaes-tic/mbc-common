/*
 * Bring support for bindBackend() behaviour on the server
 * so models are synchronized between the server and browser.
 *
 * It can also use redis as transport to have consistency
 * among many servers and their browsers.
 */

var iocompat = module.exports = exports = {};

