const fs = require('fs');
const filePath = 'C:/Users/Huzeif/Downloads/FTX Comm/Huzeif Soft/Huzeif All Soft/Working-Aug-RestaurantPOSSystem-master-Copy-Copy-Cop/Working-Aug-RestaurantPOSSystem-master-Copy-Copy-Cop/pos-frontend/src/pages/Dashboard.jsx';

let code = fs.readFileSync(filePath, 'utf8');

const target = `          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">`;

const replacement = `          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Fixed closing tags in Dashboard.jsx!');
} else {
  console.log('Target not found, checking with regex');
  code = code.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<div className="grid grid-cols-1 lg:grid-cols-12 gap-4">/, '</div>\n        </div>\n\n      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Regex replaced closing tags in Dashboard.jsx!');
}

