const fs = require('fs');
const path = require('path');

// Configuration
const outputFile = 'project_code.txt';
const startDir = '.'; 

// IGNORE LIST (Updated for Python/Ventiko)
const foldersToIgnore = [
    'node_modules', 
    '.git', 
    '.next', 
    'dist', 
    'build', 
    'coverage', 
    '.vscode', 
    'public',
    'venv',          // Python Virtual Environment
    '__pycache__',   // Python Cache
    '.pytest_cache', // Testing Cache
    'data'           // Ignore the raw XML/CSV data folder (too large)
];

const filesToIgnore = [
    'package-lock.json', 
    'yarn.lock', 
    'bundle_code.js', 
    outputFile, 
    '.DS_STORE', 
    '.env',
    'requirements.txt' // Optional: keep or remove if you want to see libs
];

// EXTENSIONS (Updated for Python/Ventiko)
const allowedExtensions = [
    '.js', '.jsx', '.ts', '.tsx', 
    '.css', '.html', '.json', '.md', 
    '.py',  // Python
    '.xml'  // XML Feeds (Small ones only, large ones ignored by folder above)
];

function getFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);

        if (fs.lstatSync(filePath).isSymbolicLink()) {
            return;
        }

        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (!foldersToIgnore.includes(path.basename(filePath))) {
                getFiles(filePath, fileList);
            }
        } else {
            const ext = path.extname(file).toLowerCase();
            if (!filesToIgnore.includes(file) && allowedExtensions.includes(ext)) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

const allFiles = getFiles(startDir);
let outputContent = `VENTIKO ENGINE - CODE SNAPSHOT - ${new Date().toISOString()}\n\n`;

allFiles.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        outputContent += `\n\n================================================================\n`;
        outputContent += `FILE: ${path.relative(__dirname, file)}\n`;
        outputContent += `================================================================\n\n`;
        outputContent += content;
    } catch (err)
        {
        console.log(`Could not read file: ${file}`);
    }
});

fs.writeFileSync(outputFile, outputContent);
console.log(`\nSuccess! Created ${outputFile} with ${allFiles.length} files.`);
console.log(`Size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);