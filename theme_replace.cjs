const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'src');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Backgrounds
  content = content.replace(/bg-white/g, 'bg-[#212121]');
  content = content.replace(/bg-slate-50/g, 'bg-[#171717]');
  content = content.replace(/bg-slate-100/g, 'bg-[#212121]');
  content = content.replace(/bg-slate-800/g, 'bg-[#2F2F2F]');
  content = content.replace(/bg-slate-900/g, 'bg-[#171717]');

  // Texts
  content = content.replace(/text-slate-900/g, 'text-[#ECECEC]');
  content = content.replace(/text-slate-800/g, 'text-[#ECECEC]');
  content = content.replace(/text-slate-700/g, 'text-[#B4B4B4]');
  content = content.replace(/text-slate-600/g, 'text-[#B4B4B4]');
  content = content.replace(/text-slate-500/g, 'text-[#9B9B9B]');
  content = content.replace(/text-slate-400/g, 'text-[#676767]');

  // Borders
  content = content.replace(/border-slate-100/g, 'border-[#383838]');
  content = content.replace(/border-slate-200/g, 'border-[#383838]');
  content = content.replace(/border-slate-300/g, 'border-[#424242]');
  content = content.replace(/border-slate-800/g, 'border-[#383838]');
  content = content.replace(/border-slate-700/g, 'border-[#383838]');

  // Accents (Blues to Greens/ChatGPT theme)
  // Replaces bg-blue-* with ChatGPT green equivalents
  content = content.replace(/bg-blue-600/g, 'bg-[#10a37f]');
  content = content.replace(/bg-blue-700/g, 'bg-[#0e906f]');
  content = content.replace(/bg-blue-800/g, 'bg-[#0c7c5f]');
  content = content.replace(/bg-blue-50/g, 'bg-[#1a2723]');
  
  content = content.replace(/text-blue-600/g, 'text-[#10a37f]');
  content = content.replace(/text-blue-700/g, 'text-[#0e906f]');
  content = content.replace(/text-blue-900/g, 'text-[#ececec]');
  content = content.replace(/text-blue-400/g, 'text-[#10a37f]');

  content = content.replace(/ring-blue-500/g, 'ring-[#10a37f]');
  content = content.replace(/ring-blue-400/g, 'ring-[#10a37f]');
  content = content.replace(/border-blue-200/g, 'border-[#10a37f]');

  // Change bg-slate-900 text-white to bg-[#171717] text-[#ECECEC]
  // Wait, text-white is already fine, maybe replace text-white with text-[#ECECEC] in some contexts, but text-white is usually good on dark backgrounds.
  content = content.replace(/text-white/g, 'text-[#ECECEC]');
  content = content.replace(/ring-white/g, 'ring-[#ECECEC]');

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
