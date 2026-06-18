"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { translations } from '@/utils/i18n';
import { Search, Heart, Sparkles, AlertCircle, CheckCircle, CreditCard, ShieldCheck } from 'lucide-react';

function StoreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, wishlist, toggleWishlist, user, apiFetch, BACKEND_URL } = useApp();
  const t = translations[lang];

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [paymentGateway, setPaymentGateway] = useState('razorpay'); // razorpay, stripe, paypal
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Sync category filter from URL search parameters if present
  useEffect(() => {
    const cat = searchParams.get('category');
    const filter = searchParams.get('filter');
    if (cat) {
      setSelectedCategory(cat);
    } else if (filter === 'wishlist') {
      setSelectedCategory('wishlist');
    }
  }, [searchParams]);

  // Fetch products
  useEffect(() => {
    let url = `${BACKEND_URL}/api/products`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProducts(data.products || []);
        } else {
          setProducts([]);
        }
      })
      .catch(() => {
        setProducts([]);
      });
  }, [BACKEND_URL]);

  // Filter products based on search term & category selection
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedCategory === 'All') {
      return matchesSearch;
    } else if (selectedCategory === 'wishlist') {
      return wishlist.includes(p.id) && matchesSearch;
    } else {
      return p.category === selectedCategory && matchesSearch;
    }
  });

  const handleBuyClick = (product) => {
    if (!user) {
      // Direct to Login
      router.push('/auth');
      return;
    }
    setCheckoutProduct(product);
    setShowCheckoutModal(true);
    setErrorMessage(null);
    setPaymentSuccess(null);
  };

  const executeCheckout = async () => {
    setCheckoutLoading(true);
    setErrorMessage(null);
    try {
      // 1. Create order
      const orderRes = await apiFetch('/api/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({ productId: checkoutProduct.id })
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || 'Checkout failed');
      }

      const orderId = orderData.order.id;

      // 2. Verify order (payment simulation)
      const verifyRes = await apiFetch('/api/orders/verify', {
        method: 'POST',
        body: JSON.stringify({ orderId, successState: true })
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.message || 'Payment simulation verification failed');
      }

      setPaymentSuccess(verifyData.paymentId);
      setTimeout(() => {
        setShowCheckoutModal(false);
        router.push('/dashboard');
      }, 2000);

    } catch (err) {
      setErrorMessage(err.message || 'Something went wrong during checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const getProductImage = (product) => {
    if (product.thumbnail && product.thumbnail.startsWith('/uploads/')) {
      return (
        <div className="w-full h-44 overflow-hidden relative border-b border-stone-100">
          <img 
            src={`${BACKEND_URL}${product.thumbnail}`} 
            alt={product.title} 
            className="object-cover w-full h-full transform hover:scale-105 transition-transform duration-500" 
          />
        </div>
      );
    }
    return (
      <div className="w-full h-44 bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500 flex flex-col items-center justify-center text-white relative">
        <span className="font-yatra text-xl drop-shadow text-white">{product.category}</span>
        <div className="absolute inset-x-0 bottom-0 bg-black/20 text-[9px] text-center font-sans tracking-widest text-yellow-100 py-1 uppercase">
          {lang === 'hi' ? "भक्ति स्वरूप" : "Divine Art"}
        </div>
      </div>
    );
  };

  const categories = [
    { key: 'All', display: lang === 'hi' ? "सभी श्रेणियां" : "All Categories" },
    { key: 'Shri Ram', display: "Shri Ram" },
    { key: 'Shri Krishna', display: "Shri Krishna" },
    { key: 'Mahadev', display: "Mahadev" },
    { key: 'Hanuman Ji', display: "Hanuman Ji" },
    { key: 'Ganesh Ji', display: "Ganesh Ji" },
    { key: 'Mata Rani', display: "Mata Rani" },
    { key: 'Radha Krishna', display: "Radha Krishna" },
    { key: 'Spiritual Quotes', display: "Spiritual Quotes" },
    { key: 'wishlist', display: lang === 'hi' ? "मेरी पसंद ❤️" : "My Wishlist ❤️" }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAF7] text-[#1E1B18]">
      <Header />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-grow space-y-8">
        
        {/* Page Headings */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-cinzel font-extrabold text-stone-900 tracking-wider uppercase">
            {t.storeTitle}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
            {t.storeSubtitle}
          </p>
          <div className="h-0.5 w-12 bg-[#EA580C] mx-auto rounded-full mt-2"></div>
        </div>

        {/* Filters and Search Bar Row */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/60 shadow-sm">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-4.5 h-4.5 text-stone-400" />
            </span>
            <input 
              type="text" 
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-transparent text-sm bg-stone-50 text-stone-800"
            />
          </div>

          {/* Result Count Indicators */}
          <div className="text-xs font-semibold text-stone-500 font-sans">
            {lang === 'hi'
              ? `दिखाए जा रहे हैं: ${filteredProducts.length} उत्पाद`
              : `Showing ${filteredProducts.length} items`}
          </div>
        </div>

        {/* Category Filters Chips */}
        <div className="flex flex-wrap gap-2 justify-center py-2">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-200 shadow-sm border cursor-pointer ${
                  isSelected 
                    ? 'bg-[#EA580C] text-white border-transparent' 
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                {cat.display}
              </button>
            );
          })}
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const isWish = wishlist.includes(product.id);
              return (
                <div key={product.id} className="temple-card group">
                  {/* Category */}
                  <div className="absolute top-2 left-2 z-10 bg-[#EA580C] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-lg shadow-sm border border-white/20">
                    {product.category}
                  </div>

                  {/* Wishlist toggle */}
                  <button 
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-2 right-2 z-10 p-2 bg-white/95 rounded-full border border-stone-200 hover:text-red-500 text-stone-500 shadow-sm transition duration-200 hover:scale-110 cursor-pointer"
                  >
                    <Heart className={`w-4 h-4 ${isWish ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>

                  {/* Thumbnail Image */}
                  <div onClick={() => router.push(`/store/${product.id}`)} className="cursor-pointer">
                    {getProductImage(product)}
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-2">
                    <h3 
                      onClick={() => router.push(`/store/${product.id}`)} 
                      className="font-bold text-sm sm:text-base text-stone-850 hover:text-[#EA580C] cursor-pointer transition line-clamp-1"
                    >
                      {product.title}
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-2 min-h-[2.5rem] leading-relaxed">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                      <span className="font-extrabold text-sm sm:text-base text-[#EA580C] font-sans">
                        ₹{product.price}
                      </span>
                      <button 
                        onClick={() => handleBuyClick(product)}
                        className="text-xs font-bold bg-[#EA580C] text-white hover:bg-[#C2410C] px-3.5 py-2 rounded-lg transition shadow-sm shimmer-btn cursor-pointer"
                      >
                        {t.buyNow}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 px-6 bg-white border border-stone-200 rounded-2xl max-w-md mx-auto space-y-4 shadow-sm font-sans animate-fade-in">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-[#EA580C] border border-orange-100">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="font-cinzel font-bold text-lg text-stone-850">
              {lang === 'hi' ? "कोई उत्पाद उपलब्ध नहीं है" : "No Products Available"}
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              {lang === 'hi' 
                ? "वर्तमान में कोई वॉलपेपर या चित्र इस श्रेणी में उपलब्ध नहीं हैं। कृपया बाद में जांचें!" 
                : "No wallpapers or images are currently available in this category. Please check back later!"}
            </p>
          </div>
        )}

      </main>

      {/* Payment Gateway Simulation Modal */}
      {showCheckoutModal && checkoutProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full rounded-2xl border border-stone-200 overflow-hidden shadow-2xl relative animate-fade-in">
            <div className="temple-border-top"></div>
            
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="text-center space-y-1">
                <h2 className="font-cinzel text-lg font-extrabold text-stone-900 tracking-wide">
                  {lang === 'hi' ? "सुरक्षित भुगतान गेटवे" : "Secure Payment Gateway"}
                </h2>
                <p className="text-xs text-stone-400 font-sans">Simulation Sandbox Mode</p>
              </div>

              {/* Product Info */}
              <div className="p-4 bg-stone-50 border border-stone-100 rounded-xl flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-stone-800">{checkoutProduct.title}</div>
                  <div className="text-[10px] text-stone-500 capitalize">{checkoutProduct.category}</div>
                </div>
                <div className="font-sans font-extrabold text-sm text-[#EA580C]">₹{checkoutProduct.price}</div>
              </div>

              {/* Gateway Selector Chips */}
              {!paymentSuccess && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-stone-600 block">
                    {lang === 'hi' ? "भुगतान विकल्प चुनें" : "Select Payment Gateway"}
                  </span>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => setPaymentGateway('razorpay')}
                      className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                        paymentGateway === 'razorpay' 
                          ? 'border-[#EA580C] bg-orange-50/50 text-[#EA580C]' 
                          : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-600'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Razorpay</span>
                    </button>
                    <button 
                      onClick={() => setPaymentGateway('stripe')}
                      className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                        paymentGateway === 'stripe' 
                          ? 'border-[#EA580C] bg-orange-50/50 text-[#EA580C]' 
                          : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-600'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Stripe</span>
                    </button>
                    <button 
                      onClick={() => setPaymentGateway('paypal')}
                      className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                        paymentGateway === 'paypal' 
                          ? 'border-[#EA580C] bg-orange-50/50 text-[#EA580C]' 
                          : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-600'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>PayPal</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Status / Errors */}
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {paymentSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                  <h3 className="font-bold text-sm text-stone-800">
                    {lang === 'hi' ? "भुगतान सफलतापूर्वक पूर्ण!" : "Payment Successfully Processed!"}
                  </h3>
                  <p className="text-[10px] text-stone-400 font-mono">ID: {paymentSuccess}</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 py-1 text-[10px] text-stone-400 justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'hi' ? "256-बिट एसएसएल एन्क्रिप्टेड सुरक्षा" : "256-Bit SSL Encrypted Security"}</span>
                </div>
              )}

              {/* Action Buttons */}
              {!paymentSuccess && (
                <div className="flex gap-3 pt-2">
                  <button 
                    disabled={checkoutLoading}
                    onClick={() => setShowCheckoutModal(false)}
                    className="w-1/2 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    {lang === 'hi' ? "रद्द करें" : "Cancel"}
                  </button>
                  
                  <button 
                    disabled={checkoutLoading}
                    onClick={executeCheckout}
                    className="w-1/2 py-2.5 bg-[#EA580C] text-white hover:bg-[#C2410C] font-bold rounded-xl text-xs transition shadow-sm shimmer-btn cursor-pointer flex items-center justify-center gap-1"
                  >
                    {checkoutLoading 
                      ? (lang === 'hi' ? "प्रसंस्करण..." : "Processing...") 
                      : (lang === 'hi' ? "अभी भुगतान करें" : "Pay Now")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function Store() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-[#FCFAF7] justify-center items-center">
        <div className="w-10 h-10 border-4 border-[#EA580C] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-bold text-stone-700">Loading Store...</p>
      </div>
    }>
      <StoreContent />
    </Suspense>
  );
}
