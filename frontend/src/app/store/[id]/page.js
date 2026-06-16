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

  // Fallbacks
  const defaultProducts = [
    { id: 'prod-shri-ram', title: 'Shri Ram Darbar Sticker Pack', category: 'Shri Ram', price: 149, description: 'Premium quality digital stickers of Lord Ram, Mata Sita, Lakshman Ji, and Hanuman Ji. Includes transparent backgrounds, shlokas, and mobile wallpapers.' },
    { id: 'prod-krishna', title: 'Radha Krishna Divine Love Pack', category: 'Radha Krishna', price: 199, description: 'Elegantly hand-drawn vector designs illustrating the eternal love of Radha & Krishna. Includes 10 high-res sticker sheets.' },
    { id: 'prod-mahadev', title: 'Mahadev Shiv Tandav Collection', category: 'Mahadev', price: 99, description: 'Vibrant artistic Shiv Tandav wallpapers and digital stickers. Suitable for framing and wallpaper settings.' },
    { id: 'prod-hanuman', title: 'Hanuman Ji Sankat Mochan Pack', category: 'Hanuman Ji', price: 129, description: 'Powerful illustrations of Bajrang Bali portraying strength, energy, and unmatched devotion.' },
    { id: 'prod-ganesh', title: 'Vighnaharta Ganesh Ji Stickers', category: 'Ganesh Ji', price: 79, description: 'Auspicious designs of Lord Ganesha for starting new ventures and festival wishes.' },
    { id: 'prod-mata-rani', title: 'Mata Durga Navratri Special Pack', category: 'Mata Rani', price: 179, description: 'Divine energy designs depicting the nine avatar stages of Maa Durga.' },
    { id: 'prod-quotes', title: 'Daily Spiritual Quotes & Shlokas', category: 'Spiritual Quotes', price: 49, description: 'Beautifully typography sticker pack containing Bhagavad Gita shlokas and quotes.' }
  ];

  // Fetch product and related products
  useEffect(() => {
    setLoading(true);
    let selectedProd = defaultProducts.find(p => p.id === productId);

    fetch(`${BACKEND_URL}/api/products/${productId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.product) {
          setProduct(data.product);
          selectedProd = data.product;
        } else {
          setProduct(selectedProd);
        }
      })
      .catch(() => {
        setProduct(selectedProd);
      })
      .finally(() => {
        setLoading(false);
      });

    // Fetch related products
    fetch(`${BACKEND_URL}/api/products`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.products.length > 0) {
          const related = data.products.filter(p => p.category === selectedProd.category && p.id !== productId);
          setRelatedProducts(related);
        } else {
          const related = defaultProducts.filter(p => p.category === selectedProd.category && p.id !== productId);
          setRelatedProducts(related);
        }
      })
      .catch(() => {
        const related = defaultProducts.filter(p => p.category === selectedProd?.category && p.id !== productId);
        setRelatedProducts(related);
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
      // Since direct download token JWT contains the device id, backend validates it securely.
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
      <div className="min-h-screen flex flex-col bg-[#FFFBF7] justify-center items-center">
        <div className="w-12 h-12 border-4 border-[#FF7700] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-bold text-[#5C0601]">{lang === 'hi' ? "लोड हो रहा है..." : "Loading Divine Details..."}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FFFBF7]">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center py-16">
          <AlertTriangle className="w-12 h-12 text-[#FF7700] mb-2 animate-bounce" />
          <h2 className="text-xl font-bold text-[#5C0601]">{lang === 'hi' ? "उत्पाद नहीं मिला।" : "Product not found."}</h2>
        </div>
        <Footer />
      </div>
    );
  }

  const isWish = wishlist.includes(product.id);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF7] text-[#2E1503]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-grow space-y-12">
        {/* Core Detail Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white p-6 sm:p-8 rounded-lg border border-amber-300/30 shadow-md">
          
          {/* Left: Large Artwork Preview Card */}
          <div className="space-y-4">
            <div className="relative w-full h-[350px] sm:h-[450px] bg-gradient-to-br from-amber-400 to-[#FF7700] rounded-lg border-2 border-[#D4AF37] shadow-inner overflow-hidden flex flex-col items-center justify-center text-white">
              {/* Devotional Arch */}
              <div className="absolute inset-4 border border-dashed border-yellow-200/50 rounded pointer-events-none"></div>
              <span className="font-yatra text-4xl sm:text-5xl text-yellow-200 drop-shadow-lg text-center leading-relaxed px-4">
                {product.category}
              </span>
              <div className="absolute inset-x-0 bottom-0 bg-[#3D0C02]/60 py-3 text-center text-xs font-sans tracking-widest text-yellow-300 border-t border-[#D4AF37]/30 uppercase">
                {lang === 'hi' ? "जय श्री राम डिजिटल चित्र" : "Devotional Sticker Collection"}
              </div>
            </div>
            
            {/* Visual safety badges */}
            <div className="flex items-center gap-2 p-3.5 bg-[#FFF8F0] border border-yellow-400/20 rounded text-xs text-gray-700">
              <ShieldCheck className="w-5 h-5 text-green-700 flex-shrink-0" />
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
              <div className="inline-block bg-[#FF7700] text-white border border-amber-300 text-xs font-bold px-3 py-1 rounded">
                {product.category}
              </div>

              <h1 className="text-2xl sm:text-3xl font-cinzel font-extrabold text-[#5C0601] tracking-wide">
                {product.title}
              </h1>

              <div className="text-xl sm:text-2xl font-extrabold text-[#FF7700] font-sans">
                ₹{product.price}
              </div>

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans">
                {product.description}
              </p>

              {/* Technical Grid specs */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-amber-200/20 text-xs font-sans">
                <div className="p-3 bg-[#FFFBF7] rounded border border-gray-100">
                  <span className="text-gray-500 block">{t.prodFormat}</span>
                  <span className="font-bold text-[#5C0601]">{t.formatDetails}</span>
                </div>
                <div className="p-3 bg-[#FFFBF7] rounded border border-gray-100">
                  <span className="text-gray-500 block">{t.prodResolution}</span>
                  <span className="font-bold text-[#5C0601]">{t.resolutionDetails}</span>
                </div>
                <div className="p-3 bg-[#FFFBF7] rounded border border-gray-100 col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-gray-500 block">{t.prodDeviceSafe}</span>
                    <span className="font-bold text-[#5C0601]">{t.deviceSafeDetails}</span>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
              </div>
            </div>

            {/* Checkout CTA block */}
            <div className="pt-6 border-t border-amber-200/20 space-y-3">
              {downloadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span>{downloadError}</span>
                </div>
              )}

              <div className="flex gap-4">
                {isPurchased ? (
                  <button 
                    disabled={downloadLoading}
                    onClick={triggerSecureDownload}
                    className="flex-grow py-3.5 bg-green-700 text-white hover:bg-green-800 font-bold rounded shadow-lg transition flex items-center justify-center gap-2 text-sm focus:outline-none"
                  >
                    <Download className="w-5 h-5" />
                    <span>{downloadLoading ? t.dashGeneratingLink : t.dashDownloadBtn}</span>
                  </button>
                ) : (
                  <button 
                    onClick={handleBuyClick}
                    className="flex-grow py-3.5 bg-[#FF7700] text-white hover:bg-[#B34400] font-bold rounded shadow-lg transition flex items-center justify-center gap-2 text-sm focus:outline-none shimmer-btn"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>{t.buyNow}</span>
                  </button>
                )}

                <button 
                  onClick={() => toggleWishlist(product.id)}
                  className="p-3.5 border border-amber-300 rounded hover:bg-[#FFF8F0] transition text-gray-500"
                >
                  <Heart className={`w-5 h-5 ${isWish ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
              </div>

              {!isPurchased && (
                <p className="text-[10px] text-gray-500 text-center">
                  {t.purchaseNeeded}
                </p>
              )}
            </div>

          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-amber-200/30 pb-2">
              <h2 className="text-xl font-cinzel font-bold text-[#5C0601] tracking-wide">
                {t.relatedProducts}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((rp) => {
                return (
                  <div key={rp.id} className="temple-card">
                    <div 
                      onClick={() => router.push(`/store/${rp.id}`)}
                      className="w-full h-32 bg-gradient-to-br from-amber-500 to-[#FF7700] flex items-center justify-center text-white font-yatra cursor-pointer text-sm"
                    >
                      {rp.category}
                    </div>
                    <div className="p-3.5 space-y-1">
                      <h4 
                        onClick={() => router.push(`/store/${rp.id}`)}
                        className="font-bold text-xs text-[#5C0601] hover:text-[#FF7700] transition cursor-pointer line-clamp-1"
                      >
                        {rp.title}
                      </h4>
                      <div className="flex justify-between items-center text-xs font-sans font-bold pt-1">
                        <span>₹{rp.price}</span>
                        <span className="text-[10px] text-[#FF7700] hover:underline cursor-pointer" onClick={() => router.push(`/store/${rp.id}`)}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#FFFBF7] max-w-md w-full rounded-lg border-2 border-[#D4AF37] overflow-hidden shadow-2xl relative animate-fade-in">
            <div className="temple-border-top"></div>
            
            <div className="p-6 space-y-6">
              <div className="text-center space-y-1">
                <h2 className="font-cinzel text-lg font-extrabold text-[#5C0601] tracking-wide">
                  {lang === 'hi' ? "सुरक्षित भुगतान गेटवे" : "Secure Payment Gateway"}
                </h2>
                <p className="text-xs text-gray-500 font-sans">Simulation Sandbox Mode</p>
              </div>

              <div className="p-3 bg-[#FFF8F0] border border-amber-200 rounded flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-[#5C0601]">{product.title}</div>
                  <div className="text-[10px] text-gray-500 capitalize">{product.category}</div>
                </div>
                <div className="font-sans font-extrabold text-sm text-[#5C0601]">₹{product.price}</div>
              </div>

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

              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200 animate-pulse">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {paymentSuccess ? (
                <div className="text-center py-6 space-y-3">
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
