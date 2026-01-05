const fs = require('fs');
const path = require('path');

const isPackaged = __dirname.includes('caxa');

function getExeDir() {
    if (!isPackaged) {
        return path.join(__dirname, '..');
    }
    
    // console.log('[Extractor] Debug paths:');
    // console.log('  process.argv:', process.argv);
    // console.log('  process.execPath:', process.execPath);
    // console.log('  process.cwd():', process.cwd());
    // console.log('  __dirname:', __dirname);
    //I once fucked this up and spend 2 hours trying to solve it, dont ask how. I do not know either
    return process.cwd();
}

const baseDir = getExeDir();

function extractEmbeddedFiles() {
    if (!isPackaged) return;

    let bundle;
    try {
        bundle = require('./embedded-data.js');
    } catch (e) {
        console.log('[Extractor] No embedded data found, skipping extraction.');
        return;
    }

    console.log('[Extractor] Extracting embedded files...');

    //extract folders
    for (const [folderName, contents] of Object.entries(bundle.folders)) {
        const folderPath = path.join(baseDir, folderName);
        if (!fs.existsSync(folderPath)) {
            extractFolder(contents, folderPath);
            console.log(`[Extractor] Created ${folderName}/`);
        }
    }

    //extract files
    for (const [fileName, content] of Object.entries(bundle.files)) {
        const filePath = path.join(baseDir, fileName);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, Buffer.from(content, 'base64'));
            console.log(`[Extractor] Created ${fileName}`);
        }
    }
}

function extractFolder(contents, targetPath) {
    fs.mkdirSync(targetPath, { recursive: true });
    for (const [name, data] of Object.entries(contents)) {
        const fullPath = path.join(targetPath, name);
        if (typeof data === 'string') {
            fs.writeFileSync(fullPath, Buffer.from(data, 'base64'));
        } else {
            extractFolder(data, fullPath);
        }
    }
}

module.exports = { extractEmbeddedFiles, baseDir };