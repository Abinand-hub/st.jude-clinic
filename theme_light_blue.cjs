const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'src');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Backgrounds
  content = content.replace(/bg-\[\#212121\]/g, 'bg-white');
  content = content.replace(/bg-\[\#171717\]/g, 'bg-slate-50');
  content = content.replace(/bg-\[\#2F2F2F\]/g, 'bg-slate-100');
  content = content.replace(/bg-slate-950/g, 'bg-slate-100'); // From Header.tsx

  // Texts
  content = content.replace(/text-\[\#ECECEC\]/g, 'text-slate-900');
  content = content.replace(/text-\[\#B4B4B4\]/g, 'text-slate-600');
  content = content.replace(/text-\[\#9B9B9B\]/g, 'text-slate-500');
  content = content.replace(/text-\[\#676767\]/g, 'text-slate-400');
  content = content.replace(/text-slate-300/g, 'text-slate-600');
  content = content.replace(/text-slate-200/g, 'text-slate-900');
  content = content.replace(/text-slate-100/g, 'text-slate-900');
  
  // Specific fix for "Wait..." strings or white text
  // We'll leave explicit text-white where it's on blue backgrounds (like buttons)

  // Borders
  content = content.replace(/border-\[\#383838\]/g, 'border-slate-200');
  content = content.replace(/border-\[\#424242\]/g, 'border-slate-300');

  // Accents (ChatGPT Green back to Blue)
  content = content.replace(/bg-\[\#10a37f\]/g, 'bg-blue-600');
  content = content.replace(/bg-\[\#0e906f\]/g, 'bg-blue-700');
  content = content.replace(/bg-\[\#0c7c5f\]/g, 'bg-blue-800');
  content = content.replace(/bg-\[\#1a2723\]/g, 'bg-blue-50');
  
  content = content.replace(/text-\[\#10a37f\]/g, 'text-blue-600');
  content = content.replace(/text-\[\#0e906f\]/g, 'text-blue-700');
  
  content = content.replace(/ring-\[\#10a37f\]/g, 'ring-blue-500');
  content = content.replace(/ring-\[\#ECECEC\]/g, 'ring-white');
  content = content.replace(/border-\[\#10a37f\]/g, 'border-blue-200');

  // Specific overrides for certain backgrounds/hover states that were dark
  content = content.replace(/hover:bg-\[\#2F2F2F\]/g, 'hover:bg-slate-100');
  content = content.replace(/hover:bg-\[\#383838\]/g, 'hover:bg-slate-200');
  content = content.replace(/hover:bg-\[\#212121\]/g, 'hover:bg-slate-50');
  content = content.replace(/hover:bg-slate-700/g, 'hover:bg-slate-200');
  
  // Specific color HEX codes directly
  content = content.replace(/#212121/g, '#ffffff');
  content = content.replace(/#171717/g, '#f8fafc');
  content = content.replace(/#ECECEC/g, '#0f172a');
  content = content.replace(/#10a37f/g, '#2563eb');

  fs.writeFileSync(filePath, content, 'utf8');
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath);
    } else if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
      replaceInFile(dirPath);
    }
  });
}

walkDir(directory);
console.log('Replacement complete.');
