const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/Huzeif/Downloads/FTX Comm/Huzeif Soft/Huzeif All Soft/Working-Aug-RestaurantPOSSystem-master-Copy-Copy-Cop/Working-Aug-RestaurantPOSSystem-master-Copy-Copy-Cop/pos-frontend/src/pages/FloorPlans.jsx';

let code = fs.readFileSync(filePath, 'utf8');

// 1. Dine-In container: flex-col md:flex-row
code = code.replace(
  '<div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">',
  '<div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">'
);

// 2. Mobile tab switcher in Dine-In
code = code.replace(
  '<div className="lg:hidden flex items-center p-1.5 bg-[#111827] border-b border-white/10 shrink-0 gap-1.5 z-20">',
  '<div className="md:hidden flex items-center p-1.5 bg-[#111827] border-b border-white/10 shrink-0 gap-1.5 z-20">'
);

// 3. Fix ticketItems in Dine-In mobile tab
code = code.replace(
  /Live Ticket \{ticketItems\.length > 0 \? `\(\$\{ticketItems\.length\} items[^`]*\$\{Math\.round\(ticketTotal\)\}\)` : ""\}/,
  'Live Ticket {activeTicketItems.length > 0 ? `(${activeTicketItems.length} items • ₹${Math.round(ticketTotal)})` : ""}'
);

// 4. Dine-In Left Column: md:w-[58%] lg:w-[62%]
code = code.replace(
  'w-full lg:w-[60%] flex-col border-r border-white/10 bg-[#0B0F19] min-w-0 ${\n            mobilePosTab === "CATALOG" ? "flex flex-1" : "hidden lg:flex"\n          }',
  'w-full md:w-[58%] lg:w-[62%] flex-col border-r border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F19] min-w-0 ${\n            mobilePosTab === "CATALOG" ? "flex flex-1" : "hidden md:flex"\n          }'
);

// Also try single line if newline differed
code = code.replace(
  /w-full lg:w-\[60%\] flex-col border-r border-white\/10 bg-\[#0B0F19\] min-w-0 \$\{\s*mobilePosTab === "CATALOG" \? "flex flex-1" : "hidden lg:flex"\s*\}/,
  'w-full md:w-[58%] lg:w-[62%] flex-col border-r border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0F19] min-w-0 ${\n            mobilePosTab === "CATALOG" ? "flex flex-1" : "hidden md:flex"\n          }'
);

// 5. Dine-In Right Column: md:w-[42%] lg:w-[38%]
code = code.replace(
  /w-full lg:w-\[40%\] flex-col bg-\[#111827\] text-white shadow-2xl border-l border-white\/10 \$\{\s*mobilePosTab === "TICKET" \? "flex flex-1" : "hidden lg:flex"\s*\}/,
  'w-full md:w-[42%] lg:w-[38%] flex-col bg-[#111827] text-white shadow-2xl border-l border-white/10 ${\n            mobilePosTab === "TICKET" ? "flex flex-1" : "hidden md:flex"\n          }'
);

// 6. Dine-In Floating Mobile Cart Button
code = code.replace(
  /\{mobilePosTab === "CATALOG" && ticketItems\.length > 0 && \(\s*<button[\s\S]*?onClick=\{\(\) => setMobilePosTab\("TICKET"\)\}[\s\S]*?className="lg:hidden fixed bottom-6 right-6 z-30 px-4 py-2\.5 bg-blue-600[\s\S]*?<span>View Ticket \(\{ticketItems\.length\} items[^<]*<\/span>[\s\S]*?<\/button>\s*\)\}/,
  `{mobilePosTab === "CATALOG" && activeTicketItems.length > 0 && (
            <button
              type="button"
              onClick={() => setMobilePosTab("TICKET")}
              className="md:hidden fixed bottom-6 right-6 z-30 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-full shadow-2xl shadow-blue-500/60 flex items-center gap-2 transition-all active:scale-95 animate-pulse"
            >
              <FaReceipt className="text-sm" />
              <span>View Ticket ({activeTicketItems.length} items • ₹{Math.round(ticketTotal)})</span>
            </button>
          )}`
);

// 7. Takeaway Mode Container & Mobile Tabs
const oldTakeawayHeader = `{activeMode === "TAKEAWAY" && (
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left: Quick Item Selector */}
          <div className="w-[65%] flex flex-col bg-[#0B0F19] border-r border-white/10">`;

const newTakeawayHeader = `{activeMode === "TAKEAWAY" && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

          {/* Mobile Screen Tab Switcher for Takeaway */}
          <div className="md:hidden flex items-center p-1.5 bg-[#111827] border-b border-white/10 shrink-0 gap-1.5 z-20">
            <button
              type="button"
              onClick={() => setMobilePosTab("CATALOG")}
              className={\`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition \${
                mobilePosTab === "CATALOG" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }\`}
            >
              <MdOutlineFastfood className="text-sm" />
              <span>Menu Catalog</span>
            </button>
            <button
              type="button"
              onClick={() => setMobilePosTab("TICKET")}
              className={\`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition \${
                mobilePosTab === "TICKET" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }\`}
            >
              <FaReceipt className="text-sm" />
              <span>
                Cart {takeawayCart.length > 0 ? \`(\${takeawayCart.length} items • ₹\${Math.round(takeawayTotal)})\` : ""}
              </span>
            </button>
          </div>
          
          {/* Left: Quick Item Selector */}
          <div className={\`w-full md:w-[60%] lg:w-[65%] flex-col bg-slate-50 dark:bg-[#0B0F19] border-r border-slate-200 dark:border-white/10 min-w-0 \${
            mobilePosTab === "CATALOG" ? "flex flex-1" : "hidden md:flex"
          }\`}>`;

code = code.replace(oldTakeawayHeader, newTakeawayHeader);

// 8. Takeaway Right Column
const oldTakeawayRight = `{/* Right: Takeaway Cart & Tender Actions */}
          <div className="w-[35%] flex flex-col bg-[#111827] text-white shadow-2xl border-l border-white/10">`;

const newTakeawayRight = `{/* Right: Takeaway Cart & Tender Actions */}
          <div className={\`w-full md:w-[40%] lg:w-[35%] flex-col bg-[#111827] text-white shadow-2xl border-l border-white/10 min-w-0 \${
            mobilePosTab === "TICKET" ? "flex flex-1" : "hidden md:flex"
          }\`}>`;

code = code.replace(oldTakeawayRight, newTakeawayRight);

// 9. Takeaway Floating Cart Button
code = code.replace(
  /\{mobilePosTab === "CATALOG" && ticketItems\.length > 0 && \(\s*<button[\s\S]*?onClick=\{\(\) => setMobilePosTab\("TICKET"\)\}[\s\S]*?className="lg:hidden fixed bottom-6 right-6 z-30 px-4 py-2\.5 bg-blue-600[\s\S]*?<span>View Ticket \(\{ticketItems\.length\} items[^<]*<\/span>[\s\S]*?<\/button>\s*\)\}/,
  `{mobilePosTab === "CATALOG" && takeawayCart.length > 0 && (
            <button
              type="button"
              onClick={() => setMobilePosTab("TICKET")}
              className="md:hidden fixed bottom-6 right-6 z-30 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-full shadow-2xl shadow-blue-500/60 flex items-center gap-2 transition-all active:scale-95 animate-pulse"
            >
              <FaReceipt className="text-sm" />
              <span>View Cart ({takeawayCart.length} items • ₹{Math.round(takeawayTotal)})</span>
            </button>
          )}`
);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated FloorPlans.jsx responsive layout and fixed all ticketItems references!');

