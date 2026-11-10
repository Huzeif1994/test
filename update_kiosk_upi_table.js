const fs = require('fs');

const filePath = 'C:/Users/Huzeif/Downloads/FTX Comm/Huzeif Soft/Huzeif All Soft/Working-Aug-RestaurantPOSSystem-master-Copy-Copy-Cop/Working-Aug-RestaurantPOSSystem-master-Copy-Copy-Cop/pos-frontend/src/pages/SelfServiceKiosk.jsx';

let code = fs.readFileSync(filePath, 'utf8');

// 1. Update imports
const oldImports = `import { 
  FaUtensils, FaShoppingBag, FaSearch, FaFire, FaLeaf, FaDrumstickBite, 
  FaPlus, FaMinus, FaTrash, FaCheckCircle, FaQrcode, FaArrowLeft, 
  FaTag, FaPhone, FaTimes, FaRedo, FaStar, FaReceipt
} from 'react-icons/fa';`;

const newImports = `import { 
  FaUtensils, FaShoppingBag, FaSearch, FaFire, FaLeaf, FaDrumstickBite, 
  FaPlus, FaMinus, FaTrash, FaCheckCircle, FaQrcode, FaArrowLeft, 
  FaTag, FaPhone, FaTimes, FaRedo, FaStar, FaReceipt, FaChair, FaMobileAlt
} from 'react-icons/fa';
import { MdTableRestaurant, MdCheckCircle, MdPayment } from 'react-icons/md';`;

code = code.replace(oldImports, newImports);

// 2. Add states for table selection and UPI modal
const oldStates = `  const [countdown, setCountdown] = useState(10);
  const [paymentChoice, setPaymentChoice] = useState('COUNTER'); // 'COUNTER' | 'UPI'`;

const newStates = `  const [countdown, setCountdown] = useState(10);
  const [paymentChoice, setPaymentChoice] = useState('UPI'); // 'COUNTER' | 'UPI' (Default to UPI on modern Kiosk)
  
  // Table selection & Dynamic UPI states
  const [availableTables, setAvailableTables] = useState([]);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [pendingKioskToken, setPendingKioskToken] = useState('');
  const [upiExpiresIn, setUpiExpiresIn] = useState(180);
  const [manualTableInput, setManualTableInput] = useState('');`;

code = code.replace(oldStates, newStates);

// 3. Update fetchMenuData to fetch tables from /api/table
const oldFetch = `      const [itemsRes, catRes, comboRes] = await Promise.all([
        axiosWrapper.get('/api/menu').catch(() => ({ data: [] })),
        axiosWrapper.get('/api/menu/categories').catch(() => ({ data: [] })),
        axiosWrapper.get('/api/combos').catch(() => ({ data: { data: [] } }))
      ]);

      const itemList = Array.isArray(itemsRes.data) ? itemsRes.data : (itemsRes.data?.data || itemsRes.data?.items || []);
      const catList = Array.isArray(catRes.data) ? catRes.data : (catRes.data?.data || catRes.data?.categories || []);
      const comboList = Array.isArray(comboRes.data) ? comboRes.data : (comboRes.data?.data || []);

      setItems(itemList);
      setCategories(catList);
      setCombos(comboList);`;

const newFetch = `      const [itemsRes, catRes, comboRes, tablesRes] = await Promise.all([
        axiosWrapper.get('/api/menu').catch(() => ({ data: [] })),
        axiosWrapper.get('/api/menu/categories').catch(() => ({ data: [] })),
        axiosWrapper.get('/api/combos').catch(() => ({ data: { data: [] } })),
        axiosWrapper.get('/api/table').catch(() => ({ data: { data: [] } }))
      ]);

      const itemList = Array.isArray(itemsRes.data) ? itemsRes.data : (itemsRes.data?.data || itemsRes.data?.items || []);
      const catList = Array.isArray(catRes.data) ? catRes.data : (catRes.data?.data || catRes.data?.categories || []);
      const comboList = Array.isArray(comboRes.data) ? comboRes.data : (comboRes.data?.data || []);
      
      let tableList = Array.isArray(tablesRes.data) ? tablesRes.data : (tablesRes.data?.data || []);
      if (!tableList || tableList.length === 0) {
        tableList = [
          { id: 't1', tableNo: 1, name: 'T1', seats: 2, status: 'AVAILABLE', area: 'Indoor Main' },
          { id: 't2', tableNo: 2, name: 'T2', seats: 4, status: 'AVAILABLE', area: 'Indoor Main' },
          { id: 't3', tableNo: 3, name: 'T3', seats: 4, status: 'OCCUPIED', area: 'Window Bay' },
          { id: 't4', tableNo: 4, name: 'T4', seats: 6, status: 'AVAILABLE', area: 'Window Bay' },
          { id: 't5', tableNo: 5, name: 'T5', seats: 2, status: 'AVAILABLE', area: 'Outdoor Patio' },
          { id: 't6', tableNo: 6, name: 'T6', seats: 4, status: 'AVAILABLE', area: 'Outdoor Patio' },
          { id: 't7', tableNo: 7, name: 'T7', seats: 4, status: 'AVAILABLE', area: 'Family VIP' },
          { id: 't8', tableNo: 8, name: 'T8', seats: 8, status: 'AVAILABLE', area: 'Family VIP' },
          { id: 't9', tableNo: 9, name: 'T9', seats: 4, status: 'AVAILABLE', area: 'Indoor Main' },
          { id: 't10', tableNo: 10, name: 'T10', seats: 2, status: 'AVAILABLE', area: 'Indoor Main' }
        ];
      }

      setItems(itemList);
      setCategories(catList);
      setCombos(comboList);
      setAvailableTables(tableList);`;

code = code.replace(oldFetch, newFetch);

// 4. UPI Countdown effect
const upiTimerEffect = `  // UPI QR Code countdown timer
  useEffect(() => {
    let timer;
    if (showUpiModal && upiExpiresIn > 0) {
      timer = setInterval(() => {
        setUpiExpiresIn((prev) => prev - 1);
      }, 1000);
    } else if (showUpiModal && upiExpiresIn === 0) {
      setShowUpiModal(false);
    }
    return () => clearInterval(timer);
  }, [showUpiModal, upiExpiresIn]);
`;

code = code.replace('  // Countdown timer on Confirmation screen', upiTimerEffect + '\n  // Countdown timer on Confirmation screen');

// 5. Update handlePlaceOrder logic to handle UPI and Table checks
const oldPlaceOrder = `  // Place Order from Kiosk
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (orderType === 'DINE_IN' && !tableNumber) {
      setTableNumber('1'); // Default fallback table puck
    }

    setIsPlacingOrder(true);
    const tokenSeq = Math.floor(100 + Math.random() * 900);
    const kioskToken = \`K-\${tokenSeq}\`;

    const orderPayload = {
      orderNumber: kioskToken,
      orderNo: kioskToken,
      orderType: orderType === 'DINE_IN' ? 'KIOSK_DINE_IN' : 'KIOSK_TAKEAWAY',
      type: orderType === 'DINE_IN' ? 'DINE_IN' : 'TAKEAWAY',
      tableNumber: orderType === 'DINE_IN' ? (tableNumber || '1') : 'KIOSK-PICKUP',
      tableNo: orderType === 'DINE_IN' ? (tableNumber || '1') : 'KIOSK-PICKUP',
      customerName: customerPhone ? \`Kiosk Guest (\${customerPhone.slice(-4)})\` : 'Kiosk Guest',
      customerPhone: customerPhone || '',
      items: cart.map(it => ({
        id: it.originalId || it.id,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        notes: it.customizations || 'Self-Order Kiosk'
      })),
      subtotal: cartSubtotal,
      tax: taxAmount,
      discount: discountAmount,
      total: cartTotal,
      notes: \`Kiosk Self-Service Token #\${kioskToken}. Payment: \${paymentChoice === 'COUNTER' ? 'PAY_AT_COUNTER' : 'UPI_DYNAMIC_QR'}\`
    };

    try {
      const res = await axiosWrapper.post('/api/order', orderPayload);
      soundManager.playPaymentSuccessChime();

      setConfirmedOrder({
        token: kioskToken,
        orderId: res.data?.data?._id || res.data?.data?.id || \`ORD-\${tokenSeq}\`,
        orderType,
        tableNumber: orderType === 'DINE_IN' ? (tableNumber || '1') : null,
        total: cartTotal,
        paymentChoice,
        itemsCount: totalCartCount,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      setStage('CONFIRMATION');
      setCart([]);
      setAppliedCoupon(null);
      setShowCartDrawer(false);
      setCountdown(10);
    } catch (err) {
      console.error('Kiosk order submission failed:', err);
      // Even if network glitches, generate confirmed token for customer
      soundManager.playPaymentSuccessChime();
      setConfirmedOrder({
        token: kioskToken,
        orderId: \`ORD-\${tokenSeq}\`,
        orderType,
        tableNumber: orderType === 'DINE_IN' ? (tableNumber || '1') : null,
        total: cartTotal,
        paymentChoice,
        itemsCount: totalCartCount,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setStage('CONFIRMATION');
      setCart([]);
      setAppliedCoupon(null);
      setShowCartDrawer(false);
      setCountdown(10);
    } finally {
      setIsPlacingOrder(false);
    }
  };`;

const newPlaceOrder = `  // Trigger Checkout / Payment Workflow
  const handleInitiateCheckout = () => {
    if (cart.length === 0) return;

    // 1. If Dine-In and table number missing, prompt table selection first
    if (orderType === 'DINE_IN' && !tableNumber) {
      setShowTableModal(true);
      return;
    }

    const tokenSeq = Math.floor(100 + Math.random() * 900);
    const kioskToken = \`K-\${tokenSeq}\`;
    setPendingKioskToken(kioskToken);

    // 2. If Dynamic UPI is selected, open Dynamic UPI Modal
    if (paymentChoice === 'UPI') {
      setUpiExpiresIn(180);
      setShowUpiModal(true);
      setShowCartDrawer(false);
      return;
    }

    // 3. Otherwise pay at counter directly
    executeOrderPlacement('PENDING', 'COUNTER', kioskToken);
  };

  // Place Order on Backend
  const executeOrderPlacement = async (paymentStatus = 'PENDING', paymentMethod = 'COUNTER', existingToken = null) => {
    setIsPlacingOrder(true);
    const kioskToken = existingToken || pendingKioskToken || \`K-\${Math.floor(100 + Math.random() * 900)}\`;

    const orderPayload = {
      orderNumber: kioskToken,
      orderNo: kioskToken,
      orderType: orderType === 'DINE_IN' ? 'KIOSK_DINE_IN' : 'KIOSK_TAKEAWAY',
      type: orderType === 'DINE_IN' ? 'DINE_IN' : 'TAKEAWAY',
      tableNumber: orderType === 'DINE_IN' ? (tableNumber || '1') : 'KIOSK-PICKUP',
      tableNo: orderType === 'DINE_IN' ? (tableNumber || '1') : 'KIOSK-PICKUP',
      customerName: customerPhone ? \`Kiosk Guest (\${customerPhone.slice(-4)})\` : 'Kiosk Guest',
      customerPhone: customerPhone || '',
      items: cart.map(it => ({
        id: it.originalId || it.id,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        notes: it.customizations || 'Self-Order Kiosk'
      })),
      subtotal: cartSubtotal,
      tax: taxAmount,
      discount: discountAmount,
      total: cartTotal,
      paymentStatus: paymentStatus,
      paymentMethod: paymentMethod === 'UPI' ? 'UPI' : 'CASH',
      notes: \`Kiosk Self-Service Token #\${kioskToken}. Payment: \${paymentMethod === 'UPI' ? 'UPI_DYNAMIC_QR (PAID)' : 'PAY_AT_COUNTER'}\`
    };

    try {
      const res = await axiosWrapper.post('/api/order', orderPayload);
      soundManager.playPaymentSuccessChime();

      setConfirmedOrder({
        token: kioskToken,
        orderId: res.data?.data?._id || res.data?.data?.id || kioskToken,
        orderType,
        tableNumber: orderType === 'DINE_IN' ? (tableNumber || '1') : null,
        total: cartTotal,
        paymentChoice: paymentMethod,
        paymentStatus,
        itemsCount: totalCartCount,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      setShowUpiModal(false);
      setStage('CONFIRMATION');
      setCart([]);
      setAppliedCoupon(null);
      setShowCartDrawer(false);
      setCountdown(10);
    } catch (err) {
      console.error('Kiosk order submission failed, generating offline token:', err);
      soundManager.playPaymentSuccessChime();
      setConfirmedOrder({
        token: kioskToken,
        orderId: kioskToken,
        orderType,
        tableNumber: orderType === 'DINE_IN' ? (tableNumber || '1') : null,
        total: cartTotal,
        paymentChoice: paymentMethod,
        paymentStatus,
        itemsCount: totalCartCount,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setShowUpiModal(false);
      setStage('CONFIRMATION');
      setCart([]);
      setAppliedCoupon(null);
      setShowCartDrawer(false);
      setCountdown(10);
    } finally {
      setIsPlacingOrder(false);
    }
  };`;

code = code.replace(oldPlaceOrder, newPlaceOrder);

// 6. Update Welcome Screen Dine-In Button to open table modal
const oldDineInBtn = `            {/* Dine-In Card */}
            <button
              onClick={() => {
                setOrderType('DINE_IN');
                setStage('MENU');
              }}`;

const newDineInBtn = `            {/* Dine-In Card */}
            <button
              onClick={() => {
                setOrderType('DINE_IN');
                setShowTableModal(true);
              }}`;

code = code.replace(oldDineInBtn, newDineInBtn);

// 7. Update Menu Header Table Display with "Change Table" button
const oldHeaderTable = `            {orderType === 'DINE_IN' && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                <span>Table Puck #:</span>
                <input
                  type="text"
                  placeholder="e.g. 4"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-16 bg-[#0B0F19] border border-gray-700 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>
            )}`;

const newHeaderTable = `            {orderType === 'DINE_IN' && (
              <div className="flex items-center gap-2 text-xs mt-0.5">
                <span className="text-gray-400">Table:</span>
                <span className="font-extrabold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                  {tableNumber ? \`Table \${tableNumber}\` : 'Not Selected'}
                </span>
                <button
                  onClick={() => setShowTableModal(true)}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  Change Table
                </button>
              </div>
            )}`;

code = code.replace(oldHeaderTable, newHeaderTable);

// 8. Update Cart Drawer Checkout Button to call handleInitiateCheckout
code = code.replace(
  '<button\n                onClick={handlePlaceOrder}\n                disabled={cart.length === 0 || isPlacingOrder}',
  '<button\n                onClick={handleInitiateCheckout}\n                disabled={cart.length === 0 || isPlacingOrder}'
);

// Also single line replace if needed
code = code.replace(
  'onClick={handlePlaceOrder}',
  'onClick={handleInitiateCheckout}'
);

// 9. Append Table Selection Modal and Dynamic UPI Modal before the last </div>
const modalsJSX = `
      {/* ======================================================== */}
      {/* 1. INTERACTIVE RESTAURANT TABLE SELECTION MODAL          */}
      {/* ======================================================== */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#111827] border-2 border-blue-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <FaChair className="text-2xl" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">Select Your Dining Table</h3>
                  <p className="text-xs text-gray-400">Please choose your table so our captains can serve your order hot.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTableModal(false);
                  if (stage === 'WELCOME') setStage('WELCOME');
                }}
                className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            {/* Quick Status Legend */}
            <div className="flex items-center gap-4 py-3 text-xs text-gray-400 border-b border-gray-800/60">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                <span>Available</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Occupied / Reserved</span>
              </span>
            </div>

            {/* Table Grid (Touch Friendly) */}
            <div className="flex-1 overflow-y-auto py-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {availableTables.map((t) => {
                  const isAvailable = t.status === 'AVAILABLE' || !t.status;
                  const isSelected = tableNumber === (t.name || t.tableNo?.toString());
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTableNumber(t.name || t.tableNo?.toString());
                        setShowTableModal(false);
                        setStage('MENU');
                      }}
                      className={\`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between h-28 cursor-pointer \${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500'
                          : isAvailable
                          ? 'bg-[#1E293B]/60 hover:bg-[#1E293B] border-gray-800 hover:border-emerald-500/50'
                          : 'bg-[#1E293B]/30 border-gray-850 hover:border-amber-500/50'
                      }\`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-base font-black text-white">
                          {t.name || \`Table \${t.tableNo}\`}
                        </span>
                        <span className={\`w-2 h-2 rounded-full \${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}\`} />
                      </div>

                      <div>
                        <span className="text-[11px] text-gray-400 block font-medium">
                          {t.seats ? \`\${t.seats} Seats\` : 'Dining Table'}
                        </span>
                        <span className={\`text-[10px] font-bold uppercase \${isAvailable ? 'text-emerald-400' : 'text-amber-400'}\`}>
                          {isAvailable ? 'Available' : 'Occupied'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Manual Table Puck Number Input Alternative */}
            <div className="pt-4 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0B0F19]/50 -mx-6 -mb-6 p-6 rounded-b-3xl">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <FaMobileAlt className="text-gray-500 text-sm" />
                <span className="text-xs text-gray-400 font-semibold">Or enter Table / Puck #:</span>
                <input
                  type="text"
                  placeholder="e.g. 5"
                  value={manualTableInput}
                  onChange={(e) => setManualTableInput(e.target.value)}
                  className="w-20 bg-[#1E293B] border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold text-center focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (manualTableInput.trim()) {
                      setTableNumber(manualTableInput.trim());
                      setShowTableModal(false);
                      setStage('MENU');
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Confirm Puck
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setTableNumber('1');
                  setShowTableModal(false);
                  setStage('MENU');
                }}
                className="text-xs text-gray-400 hover:text-white underline font-medium"
              >
                Skip (Default Table #1)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. DYNAMIC UPI QR PAYMENT MODAL                          */}
      {/* ======================================================== */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#111827] border-2 border-emerald-500/40 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-center">
            
            {/* Top Close */}
            <button
              onClick={() => setShowUpiModal(false)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <FaTimes className="text-base" />
            </button>

            {/* Header */}
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <FaQrcode className="text-3xl" />
            </div>
            
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              Instant Dynamic UPI Gateway
            </span>

            <h3 className="text-2xl font-black text-white mt-3 mb-1">
              Scan & Pay ₹{cartTotal}
            </h3>
            <p className="text-xs text-gray-400 mb-5">
              Open Google Pay, PhonePe, Paytm, or any UPI app on your phone
            </p>

            {/* High-Contrast Crisp Dynamic QR Code */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl border-4 border-emerald-500/30 relative group">
              <QRCodeSVG
                value={\`upi://pay?pa=restaurant.ftxpos@icici&pn=FTX%20Gourmet%20POS&am=\${cartTotal}&tr=\${pendingKioskToken}&tn=Kiosk%20Order%20\${pendingKioskToken}&cu=INR\`}
                size={220}
                level="H"
                includeMargin={false}
              />
              <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between text-[10px] font-mono font-bold text-gray-700">
                <span>FTX GOURMET POS</span>
                <span>₹{cartTotal}</span>
              </div>
            </div>

            {/* Order & Table Meta */}
            <div className="bg-[#1E293B]/60 border border-gray-800 rounded-2xl p-3.5 my-4 text-xs flex justify-between items-center text-gray-300">
              <div className="text-left">
                <span className="text-[10px] text-gray-500 block uppercase">Order Token</span>
                <span className="font-extrabold text-blue-400">#{pendingKioskToken}</span>
              </div>
              <div className="h-6 w-px bg-gray-800" />
              <div>
                <span className="text-[10px] text-gray-500 block uppercase">Service</span>
                <span className="font-bold text-white">
                  {orderType === 'DINE_IN' ? \`Table \${tableNumber || '1'}\` : 'Takeaway'}
                </span>
              </div>
              <div className="h-6 w-px bg-gray-800" />
              <div className="text-right">
                <span className="text-[10px] text-gray-500 block uppercase">Expires In</span>
                <span className="font-mono font-black text-amber-400">
                  {Math.floor(upiExpiresIn / 60)}:{String(upiExpiresIn % 60).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Supported UPI Apps Badges */}
            <div className="flex items-center justify-center gap-2 mb-5">
              {['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'Cred'].map((app) => (
                <span
                  key={app}
                  className="px-2 py-0.5 rounded-md bg-[#0B0F19] border border-gray-800 text-[10px] text-gray-400 font-semibold"
                >
                  {app}
                </span>
              ))}
            </div>

            {/* Action CTAs */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => executeOrderPlacement('PAID', 'UPI', pendingKioskToken)}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <MdCheckCircle className="text-base" />
                <span>Simulate UPI Payment Success (Instant Confirm)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowUpiModal(false);
                  executeOrderPlacement('PENDING', 'COUNTER', pendingKioskToken);
                }}
                className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Pay at Cash Counter Instead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

// Replace the final closing div and export with modalsJSX
code = code.replace(/    <\/div>\s*\);\s*}\s*$/, modalsJSX);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated SelfServiceKiosk.jsx with Dynamic UPI & Table Selection!');

