"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { translations } from '@/utils/i18n';
import { Sparkles, ArrowRight, Heart, Eye, HelpCircle, ChevronDown, Sun, Shield, Flame, Crown, Quote } from 'lucide-react';

export default function Home() {
  const { lang, toggleWishlist, wishlist, BACKEND_URL } = useApp();
  const t = translations[lang];
  const [products, setProducts] = useState([]);
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/products?featured=true`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProducts(data.products || []);
        }
      })
      .catch(() => {
        setProducts([]);
      });
  }, [BACKEND_URL]);

  const handleFaqToggle = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const deitiesCategories = [
    { name: "Shri Ram", icon: <Sun className="w-6 h-6 text-orange-600" />, gradient: "from-orange-50 to-orange-100/50" },
    { name: "Radha Krishna", icon: <Sparkles className="w-6 h-6 text-pink-600" />, gradient: "from-pink-50 to-rose-100/50" },
    { name: "Mahadev", icon: <Flame className="w-6 h-6 text-slate-700" />, gradient: "from-stone-100 to-stone-200/50" },
    { name: "Hanuman Ji", icon: <Shield className="w-6 h-6 text-amber-600" />, gradient: "from-amber-50 to-amber-100/50" },
    { name: "Ganesh Ji", icon: <Sparkles className="w-6 h-6 text-yellow-600" />, gradient: "from-yellow-50 to-yellow-100/50" },
    { name: "Mata Rani", icon: <Crown className="w-6 h-6 text-red-600" />, gradient: "from-red-50 to-red-100/50" },
    { name: "Spiritual Quotes", icon: <Quote className="w-6 h-6 text-emerald-600" />, gradient: "from-emerald-50 to-emerald-100/50" }
  ];

  const getProductImage = (product) => {
    if (product.thumbnail && product.thumbnail.startsWith('/uploads/')) {
      return (
        <div className="w-full h-48 overflow-hidden relative border-b border-stone-100">
          <img 
            src={`${BACKEND_URL}${product.thumbnail}`} 
            alt={product.title} 
            className="object-cover w-full h-full transform group-hover:scale-105 transition duration-500" 
          />
        </div>
      );
    }
    return (
      <div className="w-full h-48 bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500 flex flex-col items-center justify-center text-white relative group-hover:scale-105 transition duration-500 overflow-hidden">
        <div className="absolute inset-3 border border-dashed border-white/20 rounded-xl"></div>
        <div className="font-yatra text-2xl drop-shadow text-white">{product.category}</div>
        <div className="absolute inset-x-0 bottom-0 bg-black/20 text-[9px] text-center font-sans tracking-widest text-yellow-100 py-1 uppercase">
          {lang === 'hi' ? "भक्ति संग्रह" : "Devotional Pack"}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAF7] text-stone-900">
      <Header />

      {/* Premium Hero with Animated Halo */}
      <section className="relative bg-[#FFFDFB] overflow-hidden py-20 sm:py-32 border-b border-stone-200/50">
        {/* Halo Glow background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[550px] h-[350px] sm:h-[550px] halo-glow pointer-events-none"></div>

        {/* Traditional border rotating elements */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-12 left-12 w-64 h-64 rounded-full border-4 border-dashed border-stone-400 animate-spin-slow"></div>
          <div className="absolute bottom-12 right-12 w-96 h-96 rounded-full border-4 border-dashed border-stone-400 animate-spin-slow"></div>
        </div>

        <div className="max-w-5xl mx-auto px-4 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-50 text-[#EA580C] border border-orange-200 text-xs font-bold font-sans shadow-sm animate-float">
            <Sparkles className="w-4 h-4 text-[#EA580C] animate-pulse" />
            <span>{lang === 'hi' ? "ॐ जय श्री राम ॐ" : "Om Jai Shri Ram"}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold font-cinzel tracking-wider text-stone-900 py-1 drop-shadow-sm">
            {t.heroTitle}
          </h1>

          <p className="text-sm sm:text-lg text-stone-600 max-w-2xl mx-auto font-sans leading-relaxed">
            {t.heroSubtitle}
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link 
              href="/store" 
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-center text-white bg-[#EA580C] hover:bg-[#C2410C] border border-transparent shadow-lg transition duration-200 shimmer-btn"
            >
              {lang === 'hi' ? "संग्रह देखें" : "Explore Collections"}
            </Link>
            <Link 
              href="/auth" 
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-center text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 transition duration-200 shadow-sm"
            >
              {t.navRegister}
            </Link>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 flex-grow space-y-24">

        {/* Deity Categories Showcase Section */}
        <section className="space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-cinzel font-extrabold text-stone-900 tracking-wider uppercase">
              {lang === 'hi' ? "श्रेणियों के अनुसार खोजें" : "Browse by Deity Categories"}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 font-sans max-w-sm mx-auto">
              {lang === 'hi' ? "अपने पसंदीदा आराध्य देव के वॉलपेपर खोजें" : "Explore wallpaper packs dedicated to your beloved Gods"}
            </p>
            <div className="h-0.5 w-12 bg-[#EA580C] mx-auto rounded-full mt-2"></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {deitiesCategories.map((cat) => (
              <Link 
                key={cat.name}
                href={`/store?category=${cat.name}`}
                className="group relative bg-white rounded-2xl overflow-hidden p-6 flex flex-col items-center justify-between text-center border border-stone-200/60 shadow-sm hover:shadow-md transition-all duration-300 scale-100 hover:scale-105"
              >
                {/* Dynamic Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-100 transition duration-300 -z-10`}></div>
                
                <span className="p-3 bg-stone-50 rounded-full border border-stone-100 mb-4 group-hover:scale-110 transition duration-300 text-stone-700">
                  {cat.icon}
                </span>

                <div className="space-y-1">
                  <h3 className="font-bold text-xs sm:text-sm tracking-wide font-cinzel text-stone-850">{cat.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Sticker Packs Section */}
        <section className="space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-cinzel font-extrabold text-stone-900 tracking-wider uppercase">
              {t.featuredPacks}
            </h2>
            <div className="h-0.5 w-12 bg-[#EA580C] mx-auto rounded-full mt-2"></div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16 px-6 bg-white border border-stone-200 rounded-2xl max-w-md mx-auto space-y-4 shadow-sm font-sans">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-[#EA580C] border border-orange-100">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="font-cinzel font-bold text-lg text-stone-850">
                {lang === 'hi' ? "कोई उत्पाद उपलब्ध नहीं है" : "No Products Available"}
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                {lang === 'hi' 
                  ? "हम जल्द ही सुंदर दिव्य वॉलपेपर और भक्ति चित्र जोड़ेंगे। कृपया बाद में आएं!" 
                  : "We will add beautiful divine wallpapers and devotional DPs soon. Please check back later!"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.slice(0, 4).map((product) => {
                  const isWish = wishlist.includes(product.id);
                  return (
                    <div key={product.id} className="temple-card group">
                      {/* Deity category badge */}
                      <div className="absolute top-2.5 left-2.5 z-10 bg-[#EA580C] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-lg shadow-sm border border-white/20">
                        {product.category}
                      </div>

                      {/* Wishlist toggle */}
                      <button 
                        onClick={() => toggleWishlist(product.id)}
                        className="absolute top-2.5 right-2.5 z-10 p-2 bg-white/95 rounded-full border border-stone-200 hover:text-red-500 text-stone-500 shadow-sm transition duration-200 hover:scale-110 cursor-pointer"
                      >
                        <Heart className={`w-4 h-4 ${isWish ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>

                      <Link href={`/store/${product.id}`} className="block overflow-hidden">
                        {getProductImage(product)}
                      </Link>

                      <div className="p-5 space-y-2">
                        <Link href={`/store/${product.id}`} className="block">
                          <h3 className="font-sans font-bold text-sm sm:text-base text-stone-850 hover:text-[#EA580C] transition line-clamp-1">
                            {product.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-stone-500 line-clamp-2 min-h-[2.2rem] font-sans leading-relaxed">
                          {product.description}
                        </p>

                        <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                          <span className="text-base font-extrabold text-[#EA580C] font-sans">
                            ₹{product.price}
                          </span>
                          
                          <Link 
                            href={`/store/${product.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold bg-[#EA580C] text-white hover:bg-[#C2410C] px-3.5 py-2 rounded-lg transition shadow-sm font-sans"
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

              <div className="text-center pt-4">
                <Link 
                  href="/store" 
                  className="inline-flex items-center gap-2 font-bold text-[#EA580C] hover:text-[#C2410C] transition text-sm font-sans"
                >
                  <span>{lang === 'hi' ? "सभी दिव्य वॉलपेपर और चित्र देखें" : "View All Devotional Wallpapers & DPs"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </section>

        {/* Accordion FAQ Section */}
        <section id="faq" className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-cinzel font-extrabold text-stone-900 tracking-wider uppercase">
              {t.faqTitle}
            </h2>
            <div className="h-0.5 w-12 bg-[#EA580C] mx-auto rounded-full mt-2"></div>
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
                <div key={index} className="border border-stone-200/60 rounded-xl overflow-hidden bg-white shadow-sm">
                  <button 
                    onClick={() => handleFaqToggle(index)}
                    className="w-full flex items-center justify-between p-4.5 font-bold text-sm sm:text-base text-stone-850 hover:bg-stone-50 transition text-left gap-4 focus:outline-none cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-[#EA580C] flex-shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown className={`w-4.5 h-4.5 text-[#EA580C] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="p-5 bg-stone-50 border-t border-stone-100 text-xs sm:text-sm text-stone-600 leading-relaxed">
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
