"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { translations } from '@/utils/i18n';
import { Sparkles, ArrowRight, Heart, Eye, HelpCircle, ChevronDown, Sun, Shield, Flame, Crown, Quote, Moon } from 'lucide-react';

export default function Home() {
  const { lang, toggleWishlist, wishlist, BACKEND_URL } = useApp();
  const t = translations[lang];
  const [products, setProducts] = useState([]);
  const [activeFaq, setActiveFaq] = useState(null);

  // Resilient fallback products for initial premium rendering
  const defaultProducts = [
    { id: 'prod-shri-ram', title: 'Shri Ram Darbar Sticker Pack', category: 'Shri Ram', price: 149, description: 'Premium quality digital stickers of Lord Ram, Mata Sita, Lakshman Ji, and Hanuman Ji. Ready for chats.', thumbnail: '/stickers/ram_darbar_thumb.jpg' },
    { id: 'prod-krishna', title: 'Radha Krishna Divine Love Pack', category: 'Radha Krishna', price: 199, description: 'Elegantly hand-drawn vector designs illustrating the eternal love of Radha & Krishna.', thumbnail: '/stickers/radha_krishna_thumb.jpg' },
    { id: 'prod-mahadev', title: 'Mahadev Shiv Tandav Collection', category: 'Mahadev', price: 99, description: 'Vibrant artistic Shiv Tandav wallpapers and digital stickers. High-resolution.', thumbnail: '/stickers/shiv_tandav_thumb.jpg' },
    { id: 'prod-hanuman', title: 'Hanuman Ji Sankat Mochan Pack', category: 'Hanuman Ji', price: 129, description: 'Powerful illustrations of Bajrang Bali portraying strength, energy, and unmatched devotion.', thumbnail: '/stickers/hanuman_ji_thumb.jpg' }
  ];

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/products`)
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

  const handleFaqToggle = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // Category list configured with rich styles, icons, and gradients for high-end feel
  const deitiesCategories = [
    { name: "Shri Ram", icon: <Sun className="w-6 h-6 text-yellow-300" />, gradient: "from-[#FF5500] to-[#FF9933]", count: "12 Packs" },
    { name: "Radha Krishna", icon: <Sparkles className="w-6 h-6 text-pink-300" />, gradient: "from-[#EC4899] to-[#F43F5E]", count: "8 Packs" },
    { name: "Mahadev", icon: <Flame className="w-6 h-6 text-cyan-300" />, gradient: "from-[#0F172A] to-[#334155]", count: "15 Packs" },
    { name: "Hanuman Ji", icon: <Shield className="w-6 h-6 text-orange-200" />, gradient: "from-[#B34400] to-[#E65C00]", count: "10 Packs" },
    { name: "Ganesh Ji", icon: <Sparkles className="w-6 h-6 text-amber-300" />, gradient: "from-[#D97706] to-[#F59E0B]", count: "6 Packs" },
    { name: "Mata Rani", icon: <Crown className="w-6 h-6 text-yellow-200" />, gradient: "from-[#990000] to-[#CC0000]", count: "9 Packs" },
    { name: "Spiritual Quotes", icon: <Quote className="w-6 h-6 text-emerald-300" />, gradient: "from-[#059669] to-[#10B981]", count: "5 Packs" }
  ];

  const getStickerPlaceholder = (category) => {
    return (
      <div className="w-full h-48 bg-gradient-to-br from-amber-500 to-orange-600 flex flex-col items-center justify-center text-white relative group-hover:scale-105 transition duration-500 overflow-hidden">
        {/* Subtle decorative temple arches */}
        <div className="absolute inset-3 border border-dashed border-white/20 rounded"></div>
        <div className="font-yatra text-2xl drop-shadow text-yellow-200">{category}</div>
        <div className="absolute inset-x-0 bottom-0 bg-black/40 text-[9px] text-center font-sans tracking-widest text-yellow-100 py-1 uppercase">
          {lang === 'hi' ? "भक्ति संग्रह" : "Devotional Pack"}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF7] text-[#2E1503] transition-colors duration-300">
      <Header />

      {/* Premium Hero with Animated Halo */}
      <section className="relative bg-[#5C0601] text-white overflow-hidden py-20 sm:py-28 border-b-4 border-[#D4AF37]">
        {/* Halo Glow background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] halo-glow pointer-events-none"></div>

        {/* Traditional borders background elements */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-12 left-12 w-64 h-64 rounded-full border-4 border-dashed border-yellow-300 animate-spin-slow"></div>
          <div className="absolute bottom-12 right-12 w-96 h-96 rounded-full border-4 border-dashed border-yellow-300 animate-spin-slow"></div>
        </div>

        <div className="max-w-5xl mx-auto px-4 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FF7700] text-yellow-100 border border-[#D4AF37] text-xs font-bold font-sans shadow-lg animate-float">
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            <span>{lang === 'hi' ? "ॐ जय श्री राम ॐ" : "Om Jai Shri Ram"}</span>
          </div>

          <h1 className="text-4xl sm:text-7xl font-extrabold font-cinzel tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-300 to-yellow-500 drop-shadow-md py-2 text-glow">
            {t.heroTitle}
          </h1>

          <p className="text-sm sm:text-lg text-orange-100 max-w-2xl mx-auto font-sans leading-relaxed">
            {t.heroSubtitle}
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link 
              href="/store" 
              className="w-full sm:w-auto px-8 py-4 rounded-md font-bold text-center text-[#5C0601] bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 border-2 border-amber-300 shadow-xl transition-transform hover:scale-105 shimmer-btn"
            >
              {lang === 'hi' ? "संग्रह देखें" : "Explore Collections"}
            </Link>
            <Link 
              href="/auth" 
              className="w-full sm:w-auto px-8 py-4 rounded-md font-bold text-center text-white bg-transparent border-2 border-yellow-400 hover:bg-[#FF7700]/20 transition"
            >
              {t.navRegister}
            </Link>
          </div>
        </div>

        {/* Temple Arch Bottom Shadow styling */}
        <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-[#FFFBF7] to-transparent opacity-30"></div>
      </section>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 flex-grow space-y-24">

        {/* Deity Categories Showcase Section */}
        <section className="space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-cinzel font-extrabold text-[#5C0601] tracking-wider uppercase">
              {lang === 'hi' ? "श्रेणियों के अनुसार खोजें" : "Browse by Deity Categories"}
            </h2>
            <p className="text-xs text-gray-500 font-sans max-w-sm mx-auto">
              {lang === 'hi' ? "अपने पसंदीदा आराध्य देव के स्टिकर खोजें" : "Explore sticker packs dedicated to your beloved Gods"}
            </p>
            <div className="h-1 w-16 bg-[#FF7700] mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {deitiesCategories.map((cat) => (
              <Link 
                key={cat.name}
                href={`/store?category=${cat.name}`}
                className="group relative rounded-xl overflow-hidden p-5 flex flex-col items-center justify-between text-center border border-amber-200/20 shadow hover:shadow-lg transition-all duration-300 scale-100 hover:scale-105 text-white"
              >
                {/* Dynamic Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-95 group-hover:scale-110 transition duration-500 -z-10`}></div>
                
                <span className="p-3 bg-white/10 rounded-full border border-white/20 mb-4 group-hover:rotate-12 transition duration-300">
                  {cat.icon}
                </span>

                <div className="space-y-1">
                  <h3 className="font-bold text-xs sm:text-sm tracking-wide font-cinzel drop-shadow-sm">{cat.name}</h3>
                  <span className="text-[10px] text-yellow-200 font-sans font-medium block opacity-80">{cat.count}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Sticker Packs Section */}
        <section className="space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-cinzel font-extrabold text-[#5C0601] tracking-wider uppercase">
              {t.featuredPacks}
            </h2>
            <div className="h-1 w-16 bg-[#FF7700] mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.slice(0, 4).map((product) => {
              const isWish = wishlist.includes(product.id);
              return (
                <div key={product.id} className="temple-card group">
                  {/* Deity category badge */}
                  <div className="absolute top-2.5 left-2.5 z-10 bg-[#FF7700] text-white border border-amber-300 text-[9px] font-bold px-2 py-0.5 rounded shadow-md font-sans">
                    {product.category}
                  </div>

                  {/* Wishlist toggle */}
                  <button 
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-2.5 right-2.5 z-10 p-1.5 bg-white/95 rounded-full border border-gray-100 hover:text-red-500 text-gray-500 shadow-md transition duration-300 hover:scale-110"
                  >
                    <Heart className={`w-4.5 h-4.5 ${isWish ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>

                  <Link href={`/store/${product.id}`} className="block overflow-hidden">
                    {getStickerPlaceholder(product.category)}
                  </Link>

                  <div className="p-5 space-y-2">
                    <Link href={`/store/${product.id}`} className="block">
                      <h3 className="font-sans font-bold text-sm sm:text-base text-[#5C0601] hover:text-[#FF7700] transition line-clamp-1">
                        {product.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-gray-600 line-clamp-2 min-h-[2.2rem] font-sans">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-amber-200/20">
                      <span className="text-base font-extrabold text-[#5C0601] font-sans">
                        ₹{product.price}
                      </span>
                      
                      <Link 
                        href={`/store/${product.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#FF7700] text-white hover:bg-[#B34400] px-3.5 py-2 rounded transition shadow-sm font-sans"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{lang === 'hi' ? "देखें" : "View"}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Link 
              href="/store" 
              className="inline-flex items-center gap-2 font-bold text-[#FF7700] hover:text-[#B34400] transition text-sm font-sans"
            >
              <span>{lang === 'hi' ? "सभी उत्कृष्ट स्टिकर पैक्स देखें" : "View All Devotional Sticker Packs"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Premium Testimonials Section */}
        <section className="py-16 px-6 sm:px-12 bg-gradient-to-b from-[#FDF6ED] to-[#FFF8F0] border-2 border-[#D4AF37]/30 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-300/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-300/10 rounded-full blur-2xl"></div>

          <div className="text-center space-y-2 mb-12 relative z-10">
            <h2 className="text-2xl sm:text-3xl font-cinzel font-extrabold text-[#5C0601] tracking-wider uppercase">
              {t.reviewsTitle}
            </h2>
            <div className="h-1 w-16 bg-[#FF7700] mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 font-sans">
            <div className="glass p-6 rounded-xl shadow-sm relative space-y-3 border-2 border-[#D4AF37]/20 flex flex-col justify-between hover:scale-[1.02] transition duration-300">
              <span className="text-4xl text-[#FF7700]/10 font-cinzel font-bold absolute top-2 right-4">”</span>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed italic">"{t.review1Text}"</p>
              <div className="font-bold text-xs text-[#5C0601] border-t border-amber-300/20 pt-3 flex items-center justify-between">
                <span>{t.review1Name}</span>
                <span className="text-yellow-500">★★★★★</span>
              </div>
            </div>
            
            <div className="glass p-6 rounded-xl shadow-sm relative space-y-3 border-2 border-[#D4AF37]/20 flex flex-col justify-between hover:scale-[1.02] transition duration-300">
              <span className="text-4xl text-[#FF7700]/10 font-cinzel font-bold absolute top-2 right-4">”</span>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed italic">"{t.review2Text}"</p>
              <div className="font-bold text-xs text-[#5C0601] border-t border-amber-300/20 pt-3 flex items-center justify-between">
                <span>{t.review2Name}</span>
                <span className="text-yellow-500">★★★★★</span>
              </div>
            </div>

            <div className="glass p-6 rounded-xl shadow-sm relative space-y-3 border-2 border-[#D4AF37]/20 flex flex-col justify-between hover:scale-[1.02] transition duration-300">
              <span className="text-4xl text-[#FF7700]/10 font-cinzel font-bold absolute top-2 right-4">”</span>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed italic">"{t.review3Text}"</p>
              <div className="font-bold text-xs text-[#5C0601] border-t border-amber-300/20 pt-3 flex items-center justify-between">
                <span>{t.review3Name}</span>
                <span className="text-yellow-500">★★★★★</span>
              </div>
            </div>
          </div>
        </section>

        {/* Accordion FAQ Section */}
        <section id="faq" className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-cinzel font-extrabold text-[#5C0601] tracking-wider uppercase">
              {t.faqTitle}
            </h2>
            <div className="h-1 w-16 bg-[#FF7700] mx-auto rounded-full"></div>
          </div>

          <div className="space-y-4 font-sans">
            {[
              { q: t.faq1Q, a: t.faq1A },
              { q: t.faq2Q, a: t.faq2A },
              { q: t.faq3Q, a: t.faq3A },
              { q: t.faq4Q, a: t.faq4A }
            ].map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={index} className="border border-amber-300/25 rounded-lg overflow-hidden bg-white shadow-sm">
                  <button 
                    onClick={() => handleFaqToggle(index)}
                    className="w-full flex items-center justify-between p-4.5 font-bold text-sm sm:text-base text-[#5C0601] hover:bg-[#FFF8F0] transition text-left gap-2 focus:outline-none"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-[#FF7700] flex-shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-[#FF7700] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="p-5 bg-[#FFFBF7] border-t border-amber-200/20 text-xs sm:text-sm text-gray-700 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
