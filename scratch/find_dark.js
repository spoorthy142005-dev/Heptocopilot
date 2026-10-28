const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) results = results.concat(walk(fullPath));
    else if (file.endsWith('.jsx')) results.push(fullPath);
  });
  return results;
}

const files = walk('frontend/src');
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  content.split('\n').forEach((l, idx) => {
    if (
      l.includes('#0f172a') ||
      l.includes('#090d16') ||
      l.includes('rgba(9, 13, 22') ||
      l.includes('rgba(15, 23, 42') ||
      l.includes('rgba(11, 19, 36') ||
      l.includes('rgba(0, 0, 0') ||
      l.includes('rgba(0,0,0') ||
      l.includes("color: '#fff'") ||
      l.includes('color: "#fff"') ||
      l.includes("color: '#ffffff'") ||
      l.includes('color: "#ffffff"')
    ) {
      console.log(f + ':' + (idx + 1) + ' ' + l.trim());
    }
  });
});
