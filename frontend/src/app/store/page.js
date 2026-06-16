"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { translations } from '@/utils/i18n';
import { Search, Heart, Sparkles, AlertCircle, CheckCircle, CreditCard, ShieldCheck } from 'lucide-react';

export default function Store() {
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

  // Default fallback products
  const defaultProducts = [
    { id: 'prod-shri-ram', title: 'Shri Ram Darbar Sticker Pack', category: 'Shri Ram', price: 149, description: 'Premium quality digital stickers of Lord Ram, Mata Sita, Lakshman Ji, and Hanuman Ji. Perfect for WhatsApp.' },
    { id: 'prod-krishna', title: 'Radha Krishna Divine Love Pack', category: 'Radha Krishna', price: 199, description: 'Elegantly hand-drawn vector designs illustrating the eternal love of Radha & Krishna.' },
    { id: 'prod-mahadev', title: 'Mahadev Shiv Tandav Collection', category: 'Mahadev', price: 99, description: 'Vibrant artistic Shiv Tandav wallpapers and digital stickers. Suitable for framing.' },
    { id: 'prod-hanuman', title: 'Hanuman Ji Sankat Mochan Pack', category: 'Hanuman Ji', price: 129, description: 'Powerful illustrations of Bajrang Bali portraying strength, energy, and unmatched devotion.' },
    { id: 'prod-ganesh', title: 'Vighnaharta Ganesh Ji Stickers', category: 'Ganesh Ji', price: 79, description: 'Auspicious designs of Lord Ganesha for starting new ventures and festival wishes.' },
    { id: 'prod-mata-rani', title: 'Mata Durga Navratri Special Pack', category: 'Mata Rani', price: 179, description: 'Divine energy designs depicting the nine avatar stages of Maa Durga.' },
    { id: 'prod-quotes', title: 'Daily Spiritual Quotes & Shlokas', category: 'Spiritual Quotes', price: 49, description: 'Beautifully typography sticker pack containing Bhagavad Gita shlokas and quotes.' }
  ];

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
        if (data.success && data.products.length > 0) {
          setProducts(data.products);
        } else {
          setProducts(defaultProducts);
        }
      })
      .catch(() => {
        setProducts(defaultProducts);
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

  const getCategoryImage = (category) => {
    return (
      <div className="w-full h-44 bg-gradient-to-br from-[#FF7700] to-yellow-600 flex flex-col items-center justify-center text-white relative">
        <span className="font-yatra text-xl drop-shadow text-yellow-200">{category}</span>
        <div className="absolute inset-x-0 bottom-0 bg-[#3D0C02]/50 text-[9px] text-center font-sans tracking-widest text-yellow-100 py-1 uppercase">
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
    <div className="min-h-screen flex flex-col bg-[#FFFBF7] text-[#2E1503]">
      <Header />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-grow space-y-8">
        
        {/* Page Headings */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-cinzel font-extrabold text-[#5C0601] tracking-wider uppercase">
            {t.storeTitle}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-lg mx-auto">
            {t.storeSubtitle}
          </p>
          <div className="h-1 w-20 bg-[#FF7700] mx-auto rounded-full"></div>
        </div>

        {/* Filters and Search Bar Row */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border border-amber-300/30 shadow-sm">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </span>
            <input 
              type="text" 
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-amber-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF7700] focus:border-transparent text-sm bg-[#FFFBF7] text-[#2E1503]"
            />
          </div>

          {/* Wishlist Indicators */}
          <div className="text-xs font-semibold text-[#5C0601] font-sans">
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
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition shadow-sm border ${
                  isSelected 
                    ? 'bg-[#FF7700] text-white border-transparent' 
                    : 'bg-white text-[#5C0601] border-amber-200 hover:bg-[#FFF8F0]'
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
                <div key={product.id} className="temple-card">
                  {/* Category */}
                  <div className="absolute top-2 left-2 z-10 bg-[#FF7700] text-white border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded shadow">
                    {product.category}
                  </div>

                  {/* Wishlist toggle */}
                  <button 
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 rounded-full border border-gray-200 hover:text-red-500 text-gray-500 shadow-md transition"
                  >
                    <Heart className={`w-4 h-4 ${isWish ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>

                  {/* Thumbnail Image */}
                  <div onClick={() => router.push(`/store/${product.id}`)} className="cursor-pointer">
                    {getCategoryImage(product.category)}
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-2">
                    <h3 
                      onClick={() => router.push(`/store/${product.id}`)} 
                      className="font-bold text-sm text-[#5C0601] hover:text-[#FF7700] cursor-pointer transition line-clamp-1"
                    >
                      {product.title}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2 min-h-[2.5rem]">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-amber-200/20">
                      <span className="font-extrabold text-sm text-[#5C0601] font-sans">
                        ₹{product.price}
                      </span>
                      <button 
                        onClick={() => handleBuyClick(product)}
                        className="text-xs font-bold bg-[#FF7700] text-white hover:bg-[#B34400] px-3.5 py-1.5 rounded transition shadow shimmer-btn"
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
          <div className="text-center py-16 bg-white border border-amber-200/30 rounded-lg shadow-inner">
            <AlertCircle className="w-12 h-12 text-[#FF7700] mx-auto animate-bounce mb-3" />
            <p className="text-gray-500 text-sm font-semibold">{t.noProducts}</p>
          </div>
        )}

      </main>

      {/* Payment Gateway Simulation Modal */}
      {showCheckoutModal && checkoutProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#FFFBF7] max-w-md w-full rounded-lg border-2 border-[#D4AF37] overflow-hidden shadow-2xl relative">
            <div className="temple-border-top"></div>
            
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="text-center space-y-1">
                <h2 className="font-cinzel text-lg font-extrabold text-[#5C0601] tracking-wide">
                  {lang === 'hi' ? "सुरक्षित भुगतान गेटवे" : "Secure Payment Gateway"}
                </h2>
                <p className="text-xs text-gray-500 font-sans">Simulation Sandbox Mode</p>
              </div>

              {/* Product Info */}
              <div className="p-3 bg-[#FFF8F0] border border-amber-200 rounded flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-[#5C0601]">{checkoutProduct.title}</div>
                  <div className="text-[10px] text-gray-500 capitalize">{checkoutProduct.category}</div>
                </div>
                <div className="font-sans font-extrabold text-sm text-[#5C0601]">₹{checkoutProduct.price}</div>
              </div>

              {/* Gateway Selector Chips */}
              {!paymentSuccess && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-gray-600 block">
                    {lang === 'hi' ? "भुगतान विकल्प चुनें" : "Select Payment Gateway"}
                  </span>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => setPaymentGateway('razorpay')}
                      className={`p-3 rounded border text-xs font-bold transition flex flex-col items-center gap-1 ${
                        paymentGateway === 'razorpay' 
                          ? 'border-[#FF7700] bg-orange-50 text-[#FF7700]' 
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Razorpay</span>
                    </button>
                    <button 
                      onClick={() => setPaymentGateway('stripe')}
                      className={`p-3 rounded border text-xs font-bold transition flex flex-col items-center gap-1 ${
                        paymentGateway === 'stripe' 
                          ? 'border-[#FF7700] bg-orange-50 text-[#FF7700]' 
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Stripe</span>
                    </button>
                    <button 
                      onClick={() => setPaymentGateway('paypal')}
                      className={`p-3 rounded border text-xs font-bold transition flex flex-col items-center gap-1 ${
                        paymentGateway === 'paypal' 
                          ? 'border-[#FF7700] bg-orange-50 text-[#FF7700]' 
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
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
                <div className="text-center py-6 space-y-3 animate-fade-in">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto animate-bounce" />
                  <h3 className="font-bold text-sm text-[#5C0601]">
                    {lang === 'hi' ? "भुगतान सफलतापूर्वक पूर्ण!" : "Payment Successfully Processed!"}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-mono">ID: {paymentSuccess}</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 py-1 text-[10px] text-gray-500 justify-center">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <span>{lang === 'hi' ? "256-बिट एसएसएल एन्क्रिप्टेड सुरक्षा" : "256-Bit SSL Encrypted Security"}</span>
                </div>
              )}

              {/* Action Buttons */}
              {!paymentSuccess && (
                <div className="flex gap-3 pt-2">
                  <button 
                    disabled={checkoutLoading}
                    onClick={() => setShowCheckoutModal(false)}
                    className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded text-xs transition focus:outline-none"
                  >
                    {lang === 'hi' ? "रद्द करें" : "Cancel"}
                  </button>
                  
                  <button 
                    disabled={checkoutLoading}
                    onClick={executeCheckout}
                    className="w-1/2 py-2.5 bg-[#FF7700] text-white hover:bg-[#B34400] font-bold rounded text-xs transition shadow shimmer-btn focus:outline-none flex items-center justify-center gap-1"
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
