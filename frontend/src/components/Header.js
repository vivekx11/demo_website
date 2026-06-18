"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { translations } from '@/utils/i18n';
import { Sparkles, Heart, LogOut, User, ShieldAlert, Globe, Menu, X } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const { lang, toggleLanguage, user, logoutUser, wishlist, deviceWarning, setDeviceWarning } = useApp();
  const t = translations[lang];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-stone-200/50 shadow-sm text-stone-800">
      {/* Premium Top Trim */}
      <div className="temple-border-top w-full"></div>

      {/* Dynamic Device Limit Warning Alert */}
      {deviceWarning && (
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-3 flex items-center justify-between shadow-inner text-sm font-medium">
          <div className="flex items-center gap-2 max-w-[90%]">
            <ShieldAlert className="w-5 h-5 animate-pulse text-white" />
            <span>{deviceWarning}</span>
          </div>
          <button 
            onClick={() => setDeviceWarning(null)} 
            className="text-white hover:text-stone-200 font-bold px-2 py-1 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="p-2.5 bg-[#EA580C] rounded-full border border-orange-200 shadow-sm group-hover:scale-105 transition duration-300">
                <Sparkles className="w-5 h-5 text-white" />
              </span>
              <div>
                <span className="font-cinzel text-lg sm:text-xl font-bold tracking-wider text-stone-900 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 bg-clip-text">
                  Bhakti Chitra
                </span>
                <span className="block text-[10px] text-[#EA580C] font-semibold font-sans tracking-wider mt-[-2px]">
                  {lang === 'hi' ? "डिजिटल भक्ति" : "Digital Devotion"}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              href="/" 
              className={`text-sm font-semibold tracking-wide transition-colors duration-200 hover:text-[#EA580C] ${isActive('/') ? 'text-[#EA580C] border-b-2 border-[#EA580C] pb-1' : 'text-stone-600'}`}
            >
              {t.navHome}
            </Link>
            <Link 
              href="/store" 
              className={`text-sm font-semibold tracking-wide transition-colors duration-200 hover:text-[#EA580C] ${isActive('/store') ? 'text-[#EA580C] border-b-2 border-[#EA580C] pb-1' : 'text-stone-600'}`}
            >
              {t.navStore}
            </Link>
            {user && (
              <Link 
                href="/dashboard" 
                className={`text-sm font-semibold tracking-wide transition-colors duration-200 hover:text-[#EA580C] ${isActive('/dashboard') ? 'text-[#EA580C] border-b-2 border-[#EA580C] pb-1' : 'text-stone-600'}`}
              >
                {t.navDashboard}
              </Link>
            )}
            {user && user.role === 'admin' && (
              <Link 
                href="/admin" 
                className={`text-sm font-semibold tracking-wide transition-colors duration-200 hover:text-[#EA580C] ${isActive('/admin') ? 'text-[#EA580C] border-b-2 border-[#EA580C] pb-1' : 'text-stone-600'}`}
              >
                {t.navAdmin}
              </Link>
            )}
          </nav>

          {/* Right Controls Area */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language Switcher */}
            <button 
              onClick={toggleLanguage} 
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200 hover:bg-stone-100 hover:border-stone-300 transition duration-200 text-stone-700 shadow-sm cursor-pointer"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>{t.langToggle}</span>
            </button>

            {/* Wishlist Link */}
            <Link 
              href="/store?filter=wishlist" 
              className="relative p-2 hover:bg-stone-50 rounded-full transition duration-200 text-stone-600 hover:text-[#EA580C]"
              title={t.navWishlist}
            >
              <Heart className={`w-5 h-5 ${wishlist.length > 0 ? 'fill-red-500 text-red-500' : 'text-stone-600'}`} />
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-0 w-4.5 h-4.5 text-[8px] font-bold bg-[#EA580C] text-white rounded-full flex items-center justify-center border border-white shadow-sm animate-bounce">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* User Login Section */}
            {user ? (
              <div className="flex items-center gap-3 border-l border-stone-200 pl-4">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-stone-850 font-bold">{user.name}</span>
                  <span className="text-[10px] text-stone-500 capitalize">{user.role}</span>
                </div>
                
                <Link 
                  href="/dashboard" 
                  className="p-2 bg-stone-50 rounded-full border border-stone-200 hover:border-stone-300 hover:bg-stone-100 transition"
                  title={t.navDashboard}
                >
                  <User className="w-4 h-4 text-stone-700" />
                </Link>

                <button 
                  onClick={logoutUser}
                  className="p-2 hover:bg-red-50 rounded-full transition text-stone-500 hover:text-red-600 border border-transparent hover:border-red-100"
                  title={t.navLogout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 border-l border-stone-200 pl-4">
                <Link 
                  href="/auth" 
                  className="text-xs sm:text-sm font-bold bg-[#EA580C] hover:bg-[#C2410C] text-white px-4 py-2 rounded-lg transition duration-200 shadow-sm font-sans"
                >
                  {t.navLogin}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Navigation controls */}
          <div className="flex md:hidden items-center gap-3">
            {/* Wishlist Icon */}
            <Link 
              href="/store?filter=wishlist" 
              className="relative p-2 hover:bg-stone-50 rounded-full transition duration-200 text-stone-600"
              title={t.navWishlist}
            >
              <Heart className={`w-5 h-5 ${wishlist.length > 0 ? 'fill-red-500 text-red-500' : 'text-stone-600'}`} />
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 text-[8px] font-bold bg-[#EA580C] text-white rounded-full flex items-center justify-center border border-white shadow-sm">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200/50 bg-white/98 shadow-lg animate-fade-in">
          <div className="px-4 py-6 space-y-4 flex flex-col font-sans text-sm font-semibold">
            <Link 
              href="/" 
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-2.5 rounded-lg transition ${isActive('/') ? 'bg-orange-50 text-[#EA580C]' : 'text-stone-700 hover:bg-stone-50'}`}
            >
              {t.navHome}
            </Link>
            <Link 
              href="/store" 
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-2.5 rounded-lg transition ${isActive('/store') ? 'bg-orange-50 text-[#EA580C]' : 'text-stone-700 hover:bg-stone-50'}`}
            >
              {t.navStore}
            </Link>
            {user && (
              <Link 
                href="/dashboard" 
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2.5 rounded-lg transition ${isActive('/dashboard') ? 'bg-orange-50 text-[#EA580C]' : 'text-stone-700 hover:bg-stone-50'}`}
              >
                {t.navDashboard}
              </Link>
            )}
            {user && user.role === 'admin' && (
              <Link 
                href="/admin" 
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2.5 rounded-lg transition ${isActive('/admin') ? 'bg-orange-50 text-[#EA580C]' : 'text-stone-700 hover:bg-stone-50'}`}
              >
                {t.navAdmin}
              </Link>
            )}

            {/* Language Switcher */}
            <div className="pt-2 px-4 flex items-center justify-between border-t border-stone-100">
              <span className="text-xs text-stone-500 font-medium">{lang === 'hi' ? "भाषा बदलें" : "Language"}</span>
              <button 
                onClick={() => {
                  toggleLanguage();
                  setMobileMenuOpen(false);
                }} 
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200 text-stone-700 shadow-sm"
              >
                <Globe className="w-3.5 h-3.5 text-[#EA580C]" />
                <span>{t.langToggle}</span>
              </button>
            </div>

            {/* User Session mobile block */}
            <div className="pt-4 px-4 border-t border-stone-100">
              {user ? (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-stone-800 font-bold block">{user.name}</span>
                    <span className="text-[10px] text-stone-400 capitalize block">{user.role}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link 
                      href="/dashboard" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3.5 py-1.5 bg-stone-50 border border-stone-200 text-stone-750 font-bold rounded text-xs transition"
                    >
                      {t.navDashboard}
                    </Link>
                    <button 
                      onClick={() => {
                        logoutUser();
                        setMobileMenuOpen(false);
                      }}
                      className="px-3.5 py-1.5 bg-red-50 text-red-600 border border-red-100 font-bold rounded text-xs transition"
                    >
                      {t.navLogout}
                    </button>
                  </div>
                </div>
              ) : (
                <Link 
                  href="/auth" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full block text-center py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold rounded-lg shadow-sm"
                >
                  {t.navLogin}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
