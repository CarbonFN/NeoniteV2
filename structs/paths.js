const fs = require('fs');
const path = require('path');

const isPackaged = __dirname.includes('caxa');

const externalDir = isPackaged ? process.cwd() : path.join(__dirname, '..');

const bundledDir = path.join(__dirname, '..');

module.exports = {
    isPackaged,
    externalDir,
    bundledDir
};