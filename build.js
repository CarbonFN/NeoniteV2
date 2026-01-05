const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function bundleFolderToJson(folderPath, target) {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(folderPath, entry.name);
        if (entry.isDirectory()) {
            target[entry.name] = {};
            bundleFolderToJson(fullPath, target[entry.name]);
        } else {
            target[entry.name] = fs.readFileSync(fullPath).toString('base64');
        }
    }
}

if (fs.existsSync('bin')) {
    fs.rmSync('bin', { recursive: true, force: true });
}
fs.mkdirSync('bin');

//bundled files get included with the exe and get extracted on first run
const foldersToEmbed = ['responses'];
const filesToEmbed = ['config.ini'];

const excludeList = ['bin', 'build.js', '*.md', '.gitignore', 'profile', ...foldersToEmbed]; //, ...filesToEmbed //filestoembed will break until FortniteGameController will get updated to use the path system
const excludeArgs = excludeList.map(e => `--exclude "${e}"`).join(' ');

console.log('Bundling external files...');
const bundle = { folders: {}, files: {} };

foldersToEmbed.forEach(folder => {
    if (fs.existsSync(folder)) {
        bundle.folders[folder] = {};
        bundleFolderToJson(folder, bundle.folders[folder]);
        console.log(`Bundled ${folder}/`);
    }
});

filesToEmbed.forEach(file => {
    if (fs.existsSync(file)) {
        bundle.files[file] = fs.readFileSync(file).toString('base64');
        console.log(`Bundled ${file}`);
    }
});

//not my prefered solution but seems to work more stable
const embeddedContent = `module.exports = ${JSON.stringify(bundle)};`;
fs.writeFileSync('structs/embedded-data.js', embeddedContent);

console.log('Building executable...');
execSync(`caxa --input . --output bin/neonite.exe ${excludeArgs} -- "{{caxa}}/node_modules/.bin/node" "{{caxa}}/app.js"`, { stdio: 'inherit' });

fs.unlinkSync('structs/embedded-data.js');

console.log('Build complete!');
