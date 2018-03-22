require('babel-polyfill');
require('babel-register')();

const path = require('path');
const driversDirPath = path.join(__dirname, './e2e/driver');
process.env.PATH = process.env.PATH + ':' + driversDirPath;
