
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { getCustomerSupportChat } from '../services/geminiService';
import { hardwareService } from '../services/hardwareService';

interface PurchaseRecord {
  id: string;
  name: string;
  quantity: number;
  total: number;
  timestamp: number;
}

const VendingInterface: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(hardwareService.getInventory());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [undoStack, setUndoStack] = useState<number[]>([]);
  const [redoStack, setRedoStack] = useState<number[]>([]);
  
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [pendingMethod, setPendingMethod] = useState<'CARD' | 'PAYPAL' | null>(null);
  
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'PAYPAL' | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS' | 'FAILURE'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dispensingStatus, setDispensingStatus] = useState<'READY' | 'ACTIVE' | 'DONE'>('READY');
  const [showAI, setShowAI] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('Welcome. How can I assist you with your health goals?');

  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  // Sync with Hardware Service
  useEffect(() => {
    const unsubscribe = hardwareService.subscribe(() => {
      const latestInventory = hardwareService.getInventory();
      setProducts([...latestInventory]);
      
      // If selected product's stock changed externally, update it
      if (selectedProduct) {
        const current = latestInventory.find(p => p.id === selectedProduct.id);
        if (current && current.stock < quantity) {
          setQuantity(Math.max(1, current.stock));
        }
      }
    });
    return () => unsubscribe();
  }, [selectedProduct, quantity]);

  useEffect(() => {
    const saved = localStorage.getItem('vend_history');
    if (saved) {
      try {
        setPurchaseHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('vend_history', JSON.stringify(purchaseHistory));
  }, [purchaseHistory]);

  const categories = ['All', ...new Set(products.map(p => p.category))];
  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const handleSelect = (product: Product) => {
    if (isProcessing || isConfirming || product.stock === 0) return;
    setSelectedProduct(product);
    setQuantity(1);
    setUndoStack([]);
    setRedoStack([]);
    setPaymentMethod(null);
    setPaymentStatus('IDLE');
    setErrorMessage(null);
  };

  const pushToHistory = (newVal: number) => {
    setUndoStack(prev => [...prev, quantity]);
    setRedoStack([]); 
    setQuantity(newVal);
  };

  const incrementQuantity = () => {
    if (selectedProduct && quantity < selectedProduct.stock) {
      pushToHistory(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      pushToHistory(quantity - 1);
    }
  };

  const undoQuantity = () => {
    if (undoStack.length === 0) return;
    const previousValue = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, quantity]);
    setUndoStack(prev => prev.slice(0, -1));
    setQuantity(previousValue);
  };

  const redoQuantity = () => {
    if (redoStack.length === 0) return;
    const nextValue = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, quantity]);
    setRedoStack(prev => prev.slice(0, -1));
    setQuantity(nextValue);
  };

  const handlePaymentClick = (method: 'CARD' | 'PAYPAL') => {
    setPendingMethod(method);
    setIsConfirming(true);
  };

  const cancelConfirmation = () => {
    setIsConfirming(false);
    setPendingMethod(null);
  };

  const resetPaymentState = () => {
    setPaymentStatus('IDLE');
    setPaymentMethod(null);
    setErrorMessage(null);
    setIsProcessing(false);
  };

  const executePayment = async () => {
    const method = pendingMethod || paymentMethod;
    if (!method || !selectedProduct) return;
    
    setIsConfirming(false);
    setPendingMethod(null);
    setIsProcessing(true);
    setPaymentMethod(method);
    setPaymentStatus('PENDING');
    setErrorMessage(null);

    const delay = method === 'PAYPAL' ? 4000 : 2500;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const isSuccess = Math.random() > 0.1; // Lowered failure for demo

    if (isSuccess) {
      setPaymentStatus('SUCCESS');
      setDispensingStatus('ACTIVE');
      
      const motorId = parseInt(selectedProduct.id) * 10;
      for(let i = 0; i < quantity; i++) {
          await hardwareService.dispenseItem(motorId);
      }
      
      // Real-time stock decrement in hardware service
      hardwareService.decrementStock(selectedProduct.id, quantity);
      
      const newRecord: PurchaseRecord = {
        id: Math.random().toString(36).substring(7),
        name: selectedProduct.name,
        quantity: quantity,
        total: selectedProduct.price * quantity,
        timestamp: Date.now()
      };
      setPurchaseHistory(prev => [newRecord, ...prev].slice(0, 5));
      
      setDispensingStatus('DONE');

      setTimeout(() => {
        setSelectedProduct(null);
        setQuantity(1);
        setUndoStack([]);
        setRedoStack([]);
        resetPaymentState();
        setDispensingStatus('READY');
      }, 4000);
    } else {
      setPaymentStatus('FAILURE');
      setIsProcessing(false);
      const errors = [
        "Card declined: Insufficient funds.",
        "Terminal timeout: Please try again.",
        "Communication error with bank.",
        "Payment cancelled by user."
      ];
      setErrorMessage(errors[Math.floor(Math.random() * errors.length)]);
    }
  };

  const askAI = async () => {
    if (!aiMessage.trim()) return;
    const prodNames = products.map(p => p.name).join(', ');
    const res = await getCustomerSupportChat(aiMessage, prodNames);
    setAiResponse(res || "I'm offline.");
    setAiMessage('');
  };

  return (
    <div className="h-screen w-full bg-white text-slate-900 flex flex-col overflow-hidden select-none font-light">
      {/* Sleek Minimal Header */}
      <header className="px-12 py-10 flex justify-between items-end bg-white border-b border-slate-50">
        <div>
          <h1 className="text-5xl font-extralight tracking-tight text-slate-800">
            Wellness<span className="font-bold text-black">.</span>
          </h1>
          <p className="text-slate-400 text-lg mt-2">Premium Supplements & Vitamins</p>
        </div>
        <div className="flex gap-8 items-center">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xl transition-all duration-300 relative ${
                activeCategory === cat ? 'text-black font-semibold' : 'text-slate-300 hover:text-slate-500'
              } pb-2`}
            >
              {cat}
              {activeCategory === cat && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-black transition-all duration-300"></span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 flex px-12 pb-12 gap-12 overflow-hidden mt-8">
        {/* Product Grid */}
        <div 
          key={activeCategory} 
          className="flex-[3] grid grid-cols-3 gap-10 overflow-y-auto pr-6 py-4 scrollbar-hide transition-opacity duration-300"
        >
          {filteredProducts.map((product, index) => (
            <div 
              key={product.id}
              onClick={() => handleSelect(product)}
              className={`group cursor-pointer flex flex-col opacity-0 animate-fade-up stagger-${(index % 6) + 1} ${
                product.stock === 0 ? 'cursor-not-allowed' : ''
              }`}
            >
              <div className={`relative aspect-square overflow-hidden rounded-2xl bg-slate-50 transition-all duration-500 ease-in-out ${
                selectedProduct?.id === product.id ? 'ring-2 ring-black scale-[0.97]' : 'hover:scale-[1.01]'
              } ${product.stock === 0 ? 'grayscale grayscale-50 opacity-60' : ''}`}>
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:opacity-100 group-hover:scale-[1.05] transition-all duration-700 ease-out" 
                />
                
                {product.stock === 0 ? (
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="bg-slate-900 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-2xl">Sold Out</span>
                  </div>
                ) : product.stock < 5 ? (
                  <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-xl animate-pulse flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    Alert
                  </div>
                ) : null}
              </div>
              <div className="mt-6 flex justify-between items-start transition-all duration-300">
                <div className="max-w-[65%]">
                  <h3 className={`text-2xl font-medium leading-tight ${product.stock === 0 ? 'text-slate-400' : 'text-slate-800'}`}>{product.name}</h3>
                  <p className="text-slate-400 font-light truncate text-sm mt-1">{product.description}</p>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-light ${product.stock === 0 ? 'text-slate-300 line-through' : 'text-slate-900'}`}>${product.price.toFixed(2)}</span>
                  <div className="flex items-center justify-end gap-1.5 mt-1">
                    {product.stock > 0 && <span className={`w-1 h-1 rounded-full animate-pulse ${product.stock < 5 ? 'bg-red-600' : 'bg-green-500'}`}></span>}
                    <p className={`text-[10px] uppercase tracking-[0.2em] font-black ${product.stock === 0 ? 'text-slate-300' : product.stock < 5 ? 'text-red-600' : 'text-slate-400'}`}>
                      {product.stock === 0 ? 'Unavailable' : `${product.stock} Units`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout Sidebar */}
        <div className="flex-1 flex flex-col h-full">
          <div className="bg-slate-50 rounded-[2.5rem] p-10 flex flex-col h-full shadow-sm border border-slate-100 transition-all duration-500 overflow-hidden relative">
            <h2 className="text-3xl font-light mb-8">Checkout</h2>
            
            {selectedProduct ? (
              <div key={selectedProduct.id} className="flex-1 flex flex-col animate-fade-up">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 bg-white rounded-2xl p-2 shadow-sm border border-slate-100 overflow-hidden">
                    <img src={selectedProduct.image} className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500" alt={selectedProduct.name} />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-medium leading-tight">{selectedProduct.name}</p>
                    <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest">{selectedProduct.category}</p>
                  </div>
                </div>

                {paymentStatus === 'IDLE' && (
                  <div className="mb-8 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all duration-300">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Adjust Quantity</p>
                        <div className="flex gap-4">
                          <button onClick={undoQuantity} disabled={undoStack.length === 0} className="text-slate-300 hover:text-black disabled:opacity-20 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                          </button>
                          <button onClick={redoQuantity} disabled={redoStack.length === 0} className="text-slate-300 hover:text-black disabled:opacity-20 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" /></svg>
                          </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <button onClick={decrementQuantity} disabled={quantity <= 1} className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 disabled:opacity-30 transition-all border border-slate-100">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                        </button>
                        <span className="text-3xl font-light tabular-nums">{quantity}</span>
                        <button onClick={incrementQuantity} disabled={quantity >= selectedProduct.stock} className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 disabled:opacity-30 transition-all border border-slate-100">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        </button>
                    </div>
                  </div>
                )}

                <div className="flex-1 transition-all duration-500 overflow-hidden">
                  {paymentStatus === 'IDLE' ? (
                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                      <p className="text-slate-400 text-sm uppercase tracking-widest mb-4">Select Payment Method</p>
                      <button onClick={() => handlePaymentClick('CARD')} className="w-full flex items-center justify-between bg-white border border-slate-200 p-6 rounded-2xl hover:border-black transition-all group">
                        <span className="text-lg font-medium">Credit / Debit Card</span>
                        <svg className="w-6 h-6 text-slate-300 group-hover:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                      </button>
                      <button onClick={() => handlePaymentClick('PAYPAL')} className="w-full flex items-center justify-between bg-white border border-slate-200 p-6 rounded-2xl hover:border-[#0070ba] transition-all group">
                        <span className="text-lg font-medium text-[#003087]">PayPal</span>
                        <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <svg className="w-6 h-6 text-[#0070ba]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.067 8.478c.492.29.851.642 1.077 1.056.226.414.339.882.339 1.404 0 .914-.333 1.764-1 2.55s-1.558 1.436-2.674 1.95c-1.116.514-2.454.771-4.013.771h-1.071c-.428 0-.802.213-.974.553l-.853 2.614c-.086.264-.326.436-.603.436h-2.583c-.422 0-.712-.423-.585-.824l2.181-6.818c.086-.264.326-.436.603-.436h1.229c1.073 0 1.996-.179 2.768-.536.772-.357 1.357-.886 1.754-1.586.397-.7.595-1.521.595-2.464 0-.442-.047-.842-.142-1.2h.582c.492 0 .918.156 1.277.468zM14.5 4c1.5 0 2.8.2 3.9.6s1.9.9 2.4 1.5c.5.6.8 1.4.8 2.3 0 1.2-.4 2.2-1.1 3.1-.7.9-1.8 1.6-3.1 2.1-1.3.5-2.8.7-4.4.7h-2.3l-1.3 4h-3.3l2.8-8.8.2-.6c.1-.4.5-.7.9-.7h4.8z"/></svg>
                        </div>
                      </button>
                    </div>
                  ) : paymentStatus === 'PENDING' ? (
                    <div className="flex flex-col items-center justify-center h-full py-10 space-y-6 animate-in fade-in zoom-in-95 duration-500">
                      {paymentMethod === 'PAYPAL' ? (
                        <>
                          <div className="p-4 bg-white rounded-3xl shadow-xl border border-slate-100 hover:scale-105 transition-transform">
                            <div className="w-48 h-48 bg-slate-900 rounded-xl flex flex-wrap p-2 gap-1 overflow-hidden opacity-80">
                               {Array.from({length: 100}).map((_, i) => (
                                 <div key={i} className={`w-[8px] h-[8px] ${Math.random() > 0.5 ? 'bg-white' : 'bg-transparent'}`}></div>
                               ))}
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-medium">Scan to Pay</p>
                            <p className="text-slate-400 text-sm">Open your PayPal app to complete purchase</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-20 h-20 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                          <div className="text-center">
                            <p className="text-2xl font-medium tracking-tight">Follow Terminal</p>
                            <p className="text-slate-400 text-lg mt-2">Tap, insert or swipe your card now</p>
                          </div>
                        </>
                      )}
                    </div>
                  ) : paymentStatus === 'FAILURE' ? (
                    <div className="flex flex-col items-center justify-center h-full py-10 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600 border-2 border-red-100 animate-pulse">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      </div>
                      <div className="text-center px-4">
                        <p className="text-2xl font-bold text-slate-800">Payment Failed</p>
                        <p className="text-red-500 font-medium mt-2">{errorMessage}</p>
                        <p className="text-slate-400 text-sm mt-4">The transaction could not be completed at this time.</p>
                      </div>
                      <div className="grid grid-cols-1 w-full gap-3">
                        <button onClick={executePayment} className="w-full py-5 bg-black text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                          Try Again
                        </button>
                        <button onClick={resetPaymentState} className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all">
                          Cancel & Return
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center space-y-4 animate-in zoom-in duration-500">
                       <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white scale-110">
                         <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                       </div>
                       <div className="text-center">
                         <p className="text-2xl font-light">Payment Verified</p>
                         <p className="text-slate-400 text-sm mt-2">{dispensingStatus === 'ACTIVE' ? 'Dispensing your selection...' : 'Enjoy your purchase!'}</p>
                       </div>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-6 border-t border-slate-200">
                  <div className="flex justify-between items-end">
                    <span className="text-slate-400 uppercase tracking-widest text-[10px] font-bold">Total Amount</span>
                    <span className="text-4xl font-light tracking-tighter tabular-nums text-slate-900">${(selectedProduct.price * quantity).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center px-6 transition-opacity duration-700">
                 <svg className="w-24 h-24 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                 <p className="text-2xl font-light leading-relaxed">Discover your next level of health.<br/>Select a product to begin.</p>
              </div>
            )}

            {/* Purchase History Section */}
            <div className={`mt-6 border-t border-slate-200 pt-6 transition-all duration-500 ease-in-out ${isHistoryExpanded ? 'mb-0' : 'mb-[-1px]'}`}>
              <button 
                onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                className="w-full flex items-center justify-between group py-2"
              >
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">Recent History</span>
                <svg className={`w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-all duration-300 ${isHistoryExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>
              
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isHistoryExpanded ? 'max-h-[300px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                {purchaseHistory.length > 0 ? (
                  <div className="space-y-3">
                    {purchaseHistory.map(record => (
                      <div key={record.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="max-w-[70%]">
                          <p className="text-sm font-medium text-slate-800 truncate">{record.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Qty: {record.quantity} • {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <span className="text-sm font-bold text-slate-900">${record.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-slate-300 italic">No recent transactions</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {isConfirming && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md transition-all duration-300">
          <div className="bg-white rounded-[2.5rem] p-12 max-w-lg w-full shadow-2xl animate-fade-up">
            <h3 className="text-3xl font-light mb-8">Confirm Purchase</h3>
            <div className="space-y-6 mb-10">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-slate-400">Product</span>
                <span className="font-medium text-lg text-right ml-4">{selectedProduct.name}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-slate-400">Quantity</span>
                <span className="font-medium text-lg">{quantity}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-slate-400">Payment via</span>
                <span className="font-medium text-lg uppercase tracking-wider">{pendingMethod}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-400">Total Amount</span>
                <span className="text-4xl font-light tracking-tighter text-black tabular-nums">
                  ${(selectedProduct.price * quantity).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={cancelConfirmation} className="py-5 rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-medium transition-all">
                Cancel
              </button>
              <button onClick={executePayment} className="py-5 rounded-2xl bg-black text-white font-medium hover:bg-slate-800 transition-all shadow-lg">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI */}
      <div className="fixed bottom-12 right-12 z-40">
        {!showAI ? (
          <button onClick={() => setShowAI(true)} className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          </button>
        ) : (
          <div className="bg-white w-[400px] rounded-[2rem] p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-slate-100 flex flex-col gap-6 animate-fade-up">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Health Advisor</span>
              <button onClick={() => setShowAI(false)} className="text-slate-300 hover:text-black transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="text-xl font-light leading-relaxed min-h-[100px] transition-all duration-500">
              {aiResponse}
            </div>
            <div className="relative mt-2">
              <input value={aiMessage} onChange={(e) => setAiMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && askAI()} placeholder="Ask for advice..." className="w-full bg-slate-50 rounded-2xl px-6 py-5 outline-none border border-transparent focus:border-slate-200 focus:bg-white transition-all text-lg shadow-inner" />
              <button onClick={askAI} className="absolute right-4 top-4 text-slate-300 hover:text-black">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="px-12 py-6 bg-white flex justify-between items-center text-[10px] text-slate-300 uppercase tracking-[0.3em] font-medium border-t border-slate-50">
        <div className="flex gap-10">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
            Hardware Secured
          </span>
          <span className="transition-all duration-500">Core 48°C</span>
          <span className="transition-all duration-500">LB-140 Controller v1.4</span>
        </div>
        <div className="font-bold text-slate-200">Kiosk 101</div>
      </footer>
    </div>
  );
};

export default VendingInterface;
