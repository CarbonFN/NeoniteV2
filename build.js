const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

if (fs.existsSync('bin')) {
    fs.rmSync('bin', { recursive: true, force: true });
}
fs.mkdirSync('bin');

console.log('Building executable...');
execSync('caxa --input . --output bin/neonite.exe --exclude "bin" --exclude "build.js" --exclude "*.md" --exclude ".gitignore" --exclude "responses" --exclude "profile" -- "{{caxa}}/node_modules/.bin/node" "{{caxa}}/app.js"', { stdio: 'inherit' });

console.log('Copying external files and folders...');

//TODO: Add profile template folder and make caxa command dynamic based on the folders listed below
const foldersToInclude = [
    'responses',
    'profile'
];

foldersToInclude.forEach(folder => {
    if (fs.existsSync(folder)) {
        copyRecursive(folder, path.join('bin', folder));
        console.log(`Copied ${folder}/`);
    }
});

if (fs.existsSync('config.ini')) {
    fs.copyFileSync('config.ini', path.join('bin', 'config.ini'));
    console.log('Copied config.ini');
}

console.log('Build complete!');
console.log('Run: cd bin && neonite.exe');