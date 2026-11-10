const fs = require('fs');

const filePath = 'C:/Users/Huzeif/Downloads/FTX Comm/Huzeif Soft/Huzeif All Soft/Working-Aug-RestaurantPOSSystem-master-Copy-Copy-Cop/Working-Aug-RestaurantPOSSystem-master-Copy-Copy-Cop/pos-frontend/src/pages/Dashboard.jsx';

let code = fs.readFileSync(filePath, 'utf8');

// 1. OrderCard padding and truncate
code = code.replace(
  'rounded-xl p-3.5 bg-white dark:bg-[#1e1e35] hover:shadow-sm transition-shadow cursor-pointer',
  'rounded-xl p-3 bg-white dark:bg-[#1e1e35] hover:shadow-sm transition-shadow cursor-pointer min-w-0'
);

code = code.replace(
  /<div className="flex items-center justify-between mb-3">\s*<p className="text-xs font-semibold text-gray-800 dark:text-gray-200">\s*Order# \{getOrderNo\(order\)\} \/ \{getOrderTypeLabel\(order\)\}\s*<\/p>\s*<p className="text-\[10px\] text-gray-400">\{formatOrderDate\(order\.createdAt\)\}<\/p>\s*<\/div>/,
  `<div className="flex items-center justify-between mb-2.5 gap-2 min-w-0">
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate flex-1 min-w-0">
          Order# {getOrderNo(order)} / {getOrderTypeLabel(order)}
        </p>
        <p className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap">{formatOrderDate(order.createdAt)}</p>
      </div>`
);

code = code.replace(
  '<div className="flex items-center gap-3 mb-3">',
  '<div className="flex items-center gap-2.5 mb-2.5 min-w-0">'
);

code = code.replace(
  '<div className="flex items-center justify-between">',
  '<div className="flex items-center justify-between min-w-0">'
);

// 2. Greeting & Clock responsive
code = code.replace(
  /<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">\s*<div>\s*<h1 className="text-xl font-bold text-gray-900 dark:text-white">([\s\S]*?)<\/div>\s*<div className="text-right hidden sm:block">([\s\S]*?)<\/div>\s*<\/div>/,
  `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
            {getGreeting()}, {userName}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5 truncate">
            Give your best services for customers, happy working
          </p>
        </div>
        <div className="text-left sm:text-right shrink-0">
          <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white tabular-nums">
            {formatTime(currentTime)}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400">{formatDate(currentTime)}</p>
        </div>
      </div>`
);

// 3. Live Metrics Banner Grid
const oldMetrics = `<div className="bg-white dark:bg-[#1a1a2e] rounded-xl border border-gray-100 dark:border-[#2a2a3e] px-4 py-3">
        <div className="flex flex-wrap items-center gap-4 justify-between">`;

const newMetrics = `<div className="bg-white dark:bg-[#1a1a2e] rounded-xl border border-gray-100 dark:border-[#2a2a3e] p-3 sm:p-4 min-w-0">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-[#2a2a3e] flex-wrap gap-2">`;

code = code.replace(oldMetrics, newMetrics);

// Replace gap-5 flex-wrap with responsive grid
code = code.replace(
  '<div className="flex flex-wrap items-center gap-5">',
  '</div>\n        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 min-w-0">'
);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated Dashboard.jsx responsive layout!');

