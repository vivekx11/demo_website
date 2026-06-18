"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { translations } from '@/utils/i18n';
import { Eye, Heart, Sparkles, AlertTriangle, ShieldCheck, Download, CreditCard, CheckCircle } from 'lucide-react';

export default function ProductDetails({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { lang, user, wishlist, toggleWishlist, apiFetch, BACKEND_URL } = useApp();
  const t = translations[lang];

  const productId = params.id;
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isPurchased, setIsPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  // Payments Simulation Modal States
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentGateway, setPaymentGateway] = useState('razorpay');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Fetch product and related products
  useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/products/${productId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.product) {
          setProduct(data.product);
          // Fetch related products
          fetch(`${BACKEND_URL}/api/products`)
            .then(res => res.json())
            .then(relData => {
              if (relData.success && relData.products.length > 0) {
                const related = relData.products.filter(p => p.category === data.product.category && p.id !== productId);
                setRelatedProducts(related);
              } else {
                setRelatedProducts([]);
              }
            })
            .catch(() => {
              setRelatedProducts([]);
            });
        } else {
          setProduct(null);
          setRelatedProducts([]);
        }
      })
      .catch(() => {
        setProduct(null);
        setRelatedProducts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [productId, BACKEND_URL]);

  // Check if product is purchased by user
  useEffect(() => {
    if (user && product) {
      apiFetch('/api/dashboard/purchases')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.purchases) {
            const purchased = data.purchases.some(p => p.product.id === product.id);
            setIsPurchased(purchased);
          }
        })
        .catch(() => {});
    }
  }, [user, product]);

  const handleBuyClick = () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    setShowCheckoutModal(true);
    setErrorMessage(null);
    setPaymentSuccess(null);
  };

  const executeCheckout = async () => {
    setCheckoutLoading(true);
    setErrorMessage(null);
    try {
      const orderRes = await apiFetch('/api/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id })
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || 'Checkout failed');
      }

      const orderId = orderData.order.id;

      const verifyRes = await apiFetch('/api/orders/verify', {
        method: 'POST',
        body: JSON.stringify({ orderId, successState: true })
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.message || 'Payment simulation failed');
      }

      setPaymentSuccess(verifyData.paymentId);
      setIsPurchased(true);
      setTimeout(() => {
        setShowCheckoutModal(false);
      }, 2000);

    } catch (err) {
      setErrorMessage(err.message || 'Something went wrong during checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const triggerSecureDownload = async () => {
    setDownloadLoading(true);
    setDownloadError(null);
    try {
      const linkRes = await apiFetch('/api/downloads/request-link', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id })
      });
      const linkData = await linkRes.json();

      if (!linkRes.ok || !linkData.success) {
        throw new Error(linkData.message || 'Download token request failed');
      }

      // Generate the complete URL and trigger direct browser download streaming
      const downloadUrl = `${BACKEND_URL}${linkData.downloadUrl}`;
      
      // Simulate download using hidden link element
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      // We pass the device ID header inside query parameters or rely on token signature
      downloadLink.setAttribute('download', product.title + '.zip');
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

    } catch (err) {
      setDownloadError(err.message || 'Download failed. Device limit of 3 exceeded.');
    } finally {
      setDownloadLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FCFAF7] justify-center items-center">
        <div className="w-12 h-12 border-4 border-[#EA580C] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-bold text-stone-700">{lang === 'hi' ? "लोड हो रहा है..." : "Loading Divine Details..."}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FCFAF7] text-[#1E1B18]">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center py-16 px-6">
          <div className="text-center py-16 px-6 bg-white border border-stone-200 rounded-2xl max-w-md w-full space-y-4 shadow-sm font-sans animate-fade-in">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-[#EA580C] border border-orange-100">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="font-cinzel font-bold text-lg text-stone-850">
              {lang === 'hi' ? "उत्पाद नहीं मिला" : "Product Not Found"}
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed font-medium">
              {lang === 'hi'
                ? "जिस उत्पाद को आप खोज रहे हैं वह मौजूद नहीं है या हटा दिया गया है।"
                : "The product you are looking for does not exist or has been removed."}
            </p>
            <div className="pt-2">
              <button
                onClick={() => router.push('/store')}
                className="px-6 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs transition shadow-sm cursor-pointer"
              >
                {lang === 'hi' ? "गैलरी पर वापस जाएं" : "Back to Gallery"}
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isWish = wishlist.includes(product.id);

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAF7] text-[#1E1B18]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-grow space-y-12">
        {/* Core Detail Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/50 shadow-sm">
          
          {/* Left: Large Artwork Preview Card */}
          <div className="space-y-4">
            <div className="relative w-full h-[350px] sm:h-[450px] bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500 rounded-xl border border-stone-200/50 shadow-inner overflow-hidden flex flex-col items-center justify-center text-white">
              {product.thumbnail && product.thumbnail.startsWith('/uploads/') ? (
                <img 
                  src={`${BACKEND_URL}${product.thumbnail}`} 
                  alt={product.title} 
                  className="object-cover w-full h-full" 
                />
              ) : (
                <>
                  <div className="absolute inset-4 border border-dashed border-white/20 rounded-xl pointer-events-none"></div>
                  <span className="font-yatra text-4xl sm:text-5xl text-white drop-shadow-lg text-center leading-relaxed px-4">
                    {product.category}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 bg-black/15 py-3 text-center text-xs font-sans tracking-widest text-yellow-100 border-t border-white/10 uppercase">
                    {lang === 'hi' ? "जय श्री राम डिजिटल चित्र" : "Devotional Sticker Collection"}
                  </div>
                </>
              )}
            </div>
            
            {/* Visual safety badges */}
            <div className="flex items-center gap-2.5 p-3.5 bg-stone-50 border border-stone-100 rounded-xl text-xs text-stone-600">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>
                {lang === 'hi' 
                  ? "सुरक्षित फ़ाइल स्टोरेज: डायरेक्ट यूआरएल कभी लीक नहीं होता।" 
                  : "Private file system protection. Source folder is never exposed."}
              </span>
            </div>
          </div>

          {/* Right: Specifications & CTA */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-block bg-orange-50 text-[#EA580C] border border-orange-100 text-xs font-bold px-3 py-1 rounded-lg">
                {product.category}
              </div>

              <h1 className="text-2xl sm:text-3xl font-cinzel font-extrabold text-stone-900 tracking-wide">
                {product.title}
              </h1>

              <div className="text-xl sm:text-2xl font-extrabold text-[#EA580C] font-sans">
                ₹{product.price}
              </div>

              <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-sans">
                {product.description}
              </p>

              {/* Technical Grid specs */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-100 text-xs font-sans">
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-stone-400 block mb-0.5">{t.prodFormat}</span>
                  <span className="font-bold text-stone-800">{t.formatDetails}</span>
                </div>
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="text-stone-400 block mb-0.5">{t.prodResolution}</span>
                  <span className="font-bold text-stone-800">{t.resolutionDetails}</span>
                </div>
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100 col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-stone-400 block mb-0.5">{t.prodDeviceSafe}</span>
                    <span className="font-bold text-stone-800">{t.deviceSafeDetails}</span>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
              </div>
            </div>

            {/* Checkout CTA block */}
            <div className="pt-6 border-t border-stone-100 space-y-3">
              {downloadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span>{downloadError}</span>
                </div>
              )}

              <div className="flex gap-4">
                {isPurchased ? (
                  <button 
                    disabled={downloadLoading}
                    onClick={triggerSecureDownload}
                    className="flex-grow py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 text-sm focus:outline-none cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    <span>{downloadLoading ? t.dashGeneratingLink : t.dashDownloadBtn}</span>
                  </button>
                ) : (
                  <button 
                    onClick={handleBuyClick}
                    className="flex-grow py-3.5 bg-[#EA580C] text-white hover:bg-[#C2410C] font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 text-sm focus:outline-none shimmer-btn cursor-pointer"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>{t.buyNow}</span>
                  </button>
                )}

                <button 
                  onClick={() => toggleWishlist(product.id)}
                  className="p-3.5 border border-stone-200 rounded-xl hover:bg-stone-50 transition text-stone-500 cursor-pointer"
                >
                  <Heart className={`w-5 h-5 ${isWish ? 'fill-red-500 text-red-500' : 'text-stone-500'}`} />
                </button>
              </div>

              {!isPurchased && (
                <p className="text-[10px] text-stone-400 text-center font-medium">
                  {t.purchaseNeeded}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200/60 pb-2">
              <h2 className="text-xl font-cinzel font-bold text-stone-900 tracking-wide">
                {t.relatedProducts}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((rp) => {
                return (
                  <div key={rp.id} className="temple-card group">
                    <div 
                      onClick={() => router.push(`/store/${rp.id}`)}
                      className="w-full h-32 bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-yatra cursor-pointer text-sm"
                    >
                      {rp.category}
                    </div>
                    <div className="p-4 space-y-1.5">
                      <h4 
                        onClick={() => router.push(`/store/${rp.id}`)}
                        className="font-bold text-xs text-stone-800 hover:text-[#EA580C] transition cursor-pointer line-clamp-1"
                      >
                        {rp.title}
                      </h4>
                      <div className="flex justify-between items-center text-xs font-sans font-bold pt-1.5 border-t border-stone-50">
                        <span className="text-stone-900">₹{rp.price}</span>
                        <span className="text-[10px] text-[#EA580C] hover:underline cursor-pointer" onClick={() => router.push(`/store/${rp.id}`)}>
                          {lang === 'hi' ? "विवरण" : "Details"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Payment Gateway Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full rounded-2xl border border-stone-200 overflow-hidden shadow-2xl relative animate-fade-in">
            <div className="temple-border-top"></div>
            
            <div className="p-6 space-y-6">
              <div className="text-center space-y-1">
                <h2 className="font-cinzel text-lg font-extrabold text-stone-900 tracking-wide">
                  {lang === 'hi' ? "सुरक्षित भुगतान गेटवे" : "Secure Payment Gateway"}
                </h2>
                <p className="text-xs text-stone-400 font-sans">Simulation Sandbox Mode</p>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-100 rounded-xl flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-stone-800">{product.title}</div>
                  <div className="text-[10px] text-stone-500 capitalize">{product.category}</div>
                </div>
                <div className="font-sans font-extrabold text-sm text-[#EA580C]">₹{product.price}</div>
              </div>

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

              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200 animate-pulse">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {paymentSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                  <h3 className="font-bold text-sm text-stone-850">
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

              {!paymentSuccess && (
                <div className="flex gap-3 pt-2">
                  <button 
                    disabled={checkoutLoading}
                    onClick={() => setShowCheckoutModal(false)}
                    className="w-1/2 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-750 font-bold rounded-xl text-xs transition cursor-pointer"
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
