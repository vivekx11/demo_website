"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { translations } from '@/utils/i18n';
import { Sparkles, ShoppingBag, Heart, LogOut, User, ShieldAlert, Globe, Sun, Moon } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const { lang, toggleLanguage, user, logoutUser, wishlist, deviceWarning, setDeviceWarning, darkMode, toggleDarkMode } = useApp();
  const t = translations[lang];

  const isActive = (path) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-[#5C0601] text-white shadow-lg">
      {/* Temple Saffron/Gold Top Trim */}
      <div className="temple-border-top w-full"></div>

      {/* Dynamic Device Limit Warning Alert */}
      {deviceWarning && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-3 flex items-center justify-between shadow-inner text-sm font-medium">
          <div className="flex items-center gap-2 max-w-[90%]">
            <ShieldAlert className="w-5 h-5 animate-pulse text-[#5C0601]" />
            <span>{deviceWarning}</span>
          </div>
          <button 
            onClick={() => setDeviceWarning(null)} 
            className="text-white hover:text-gray-200 font-bold px-2 py-1 rounded"
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
            <Link href="/" className="flex items-center gap-2 group">
              <span className="p-2 bg-[#FF7700] rounded-full border border-amber-300 shadow-md group-hover:scale-115 transition duration-300">
                <Sparkles className="w-6 h-6 text-yellow-300" />
              </span>
              <div>
                <span className="font-cinzel text-xl sm:text-2xl font-extrabold tracking-wider bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent gold-glow">
                  SUMITY
                </span>
                <span className="block text-[10px] text-orange-300 font-medium font-yatra tracking-widest text-center mt-[-2px]">
                  {lang === 'hi' ? "डिजिटल भक्ति" : "Digital Devotion"}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className={`text-sm font-semibold tracking-wide transition duration-300 hover:text-[#FF7700] ${isActive('/') ? 'text-[#FF7700] border-b-2 border-[#FF7700] pb-1' : 'text-gray-200'}`}
            >
              {t.navHome}
            </Link>
            <Link 
              href="/store" 
              className={`text-sm font-semibold tracking-wide transition duration-300 hover:text-[#FF7700] ${isActive('/store') ? 'text-[#FF7700] border-b-2 border-[#FF7700] pb-1' : 'text-gray-200'}`}
            >
              {t.navStore}
            </Link>
            {user && (
              <Link 
                href="/dashboard" 
                className={`text-sm font-semibold tracking-wide transition duration-300 hover:text-[#FF7700] ${isActive('/dashboard') ? 'text-[#FF7700] border-b-2 border-[#FF7700] pb-1' : 'text-gray-200'}`}
              >
                {t.navDashboard}
              </Link>
            )}
            {user && user.role === 'admin' && (
              <Link 
                href="/admin" 
                className={`text-sm font-semibold tracking-wide transition duration-300 hover:text-[#FF7700] ${isActive('/admin') ? 'text-[#FF7700] border-b-2 border-[#FF7700] pb-1' : 'text-gray-200'}`}
              >
                {t.navAdmin}
              </Link>
            )}
          </nav>

          {/* Right Controls Area */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Dark Mode Toggler */}
            <button 
              onClick={toggleDarkMode}
              className="p-1.5 rounded-full bg-[#3D0602] border border-[#D4AF37]/50 hover:bg-[#FF7700] transition duration-300 text-yellow-300 shadow-sm focus:outline-none"
              title={lang === 'hi' ? "थीम बदलें" : "Toggle Theme"}
            >
              {darkMode ? <Sun className="w-4 h-4 animate-spin-slow" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language Switcher */}
            <button 
              onClick={toggleLanguage} 
              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-[#3D0602] border border-[#D4AF37] hover:bg-[#FF7700] transition duration-300 text-yellow-300 shadow-sm"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{t.langToggle}</span>
            </button>

            {/* Wishlist Link */}
            <Link 
              href="/store?filter=wishlist" 
              className="relative p-2 hover:bg-[#3D0602] rounded-full transition duration-300 text-gray-200 hover:text-[#FF7700]"
              title={t.navWishlist}
            >
              <Heart className={`w-5 h-5 ${wishlist.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 text-[9px] font-bold bg-[#FF7700] text-white rounded-full flex items-center justify-center border border-[#5C0601] shadow-md animate-bounce">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* User Login Section */}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-xs text-yellow-300 font-bold">{user.name}</span>
                  <span className="text-[10px] text-gray-300 capitalize">{user.role}</span>
                </div>
                
                <Link 
                  href="/dashboard" 
                  className="p-2 bg-[#3D0602] rounded-full border border-gray-600 hover:border-yellow-400 transition"
                  title={t.navDashboard}
                >
                  <User className="w-4 h-4 text-yellow-300" />
                </Link>

                <button 
                  onClick={logoutUser}
                  className="p-2 hover:bg-red-900 rounded-full transition text-gray-300 hover:text-red-400"
                  title={t.navLogout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  href="/auth" 
                  className="text-xs sm:text-sm font-bold bg-[#FF7700] text-[#5C0601] hover:bg-yellow-400 px-4 py-2 rounded border border-[#D4AF37] transition duration-300 shadow-md font-sans"
                >
                  {t.navLogin}
                </Link>
              </div>
            )}
            
          </div>
        </div>
        
        {/* Mobile Navigation Row (under header for small devices) */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-[#3D0602] text-xs font-semibold">
          <Link href="/" className={`${isActive('/') ? 'text-[#FF7700]' : 'text-gray-300'}`}>{t.navHome}</Link>
          <Link href="/store" className={`${isActive('/store') ? 'text-[#FF7700]' : 'text-gray-300'}`}>{t.navStore}</Link>
          {user && <Link href="/dashboard" className={`${isActive('/dashboard') ? 'text-[#FF7700]' : 'text-gray-300'}`}>{t.navDashboard}</Link>}
          {user && user.role === 'admin' && <Link href="/admin" className={`${isActive('/admin') ? 'text-[#FF7700]' : 'text-gray-300'}`}>{t.navAdmin}</Link>}
        </div>

      </div>
    </header>
  );
}
