"use client";

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { translations } from '@/utils/i18n';
import { Mail, Phone, MapPin, Sparkles, ShieldCheck, HelpCircle } from 'lucide-react';

export default function Footer() {
  const { lang } = useApp();
  const t = translations[lang];

  return (
    <footer className="bg-[#141210] text-stone-300 border-t border-stone-800">
      {/* Visual top border styling - saffron & gold gradient line */}
      <div className="h-[3px] bg-gradient-to-r from-[#EA580C] via-[#C5A880] to-[#EA580C]"></div>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 font-sans">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Logo & Devotional Pitch */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#EA580C] rounded-full border border-orange-200/20">
                <Sparkles className="w-5 h-5 text-white" />
              </span>
              <span className="font-cinzel text-lg font-bold tracking-wider text-white">
                Bhakti Chitra
              </span>
            </div>
            <p className="text-stone-400 text-xs sm:text-sm max-w-md leading-relaxed">
              {lang === 'hi'
                ? "हमारी कलाकृतियां और डिजिटल वॉलपेपर्स पूरी श्रद्धा और भक्ति के साथ बनाए गए हैं। अपने डिजिटल उपकरणों और प्रोफाइल डीपी को पवित्र चित्रों के साथ सुंदर बनाएं।"
                : "Our digital wallpapers and artworks are crafted with deep devotion and faith. Elevate your digital screens and profile photos with divine representations."}
            </p>
            
            {/* Secure download badge */}
            <div className="flex items-center gap-2.5 p-3 bg-stone-900 border border-stone-800 rounded-lg text-xs text-stone-300">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />
              <span>
                {lang === 'hi'
                  ? "सुरक्षित भुगतान एवं 3-डिवाइस सुरक्षित अस्थायी डाउनलोड सुरक्षा"
                  : "Encrypted payments & 3-device temporary link download protection"}
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <h3 className="text-white font-cinzel font-bold text-xs tracking-wider uppercase border-b border-stone-800 pb-2">
              {lang === 'hi' ? "नेविगेशन" : "Navigation"}
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-stone-400">
              <li>
                <Link href="/" className="hover:text-[#EA580C] transition duration-200">{t.navHome}</Link>
              </li>
              <li>
                <Link href="/store" className="hover:text-[#EA580C] transition duration-200">{t.navStore}</Link>
              </li>
              <li>
                <Link href="/auth" className="hover:text-[#EA580C] transition duration-200">{t.navRegister}</Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-[#EA580C] transition duration-200 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>FAQ</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacts */}
          <div className="space-y-4">
            <h3 className="text-white font-cinzel font-bold text-xs tracking-wider uppercase border-b border-stone-800 pb-2">
              {lang === 'hi' ? "संपर्क करें" : "Contact Us"}
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-stone-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#EA580C] flex-shrink-0 mt-0.5" />
                <span>Ayodhya Dham, Uttar Pradesh, India</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#EA580C] flex-shrink-0" />
                <span>misteralex842148@gmail.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#EA580C] flex-shrink-0" />
                <span>+91 108 555 RAMA</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Future Integrations Display (Payment Logos Mockups) */}
        <div className="mt-8 pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <div className="flex items-center gap-3">
            <span>{lang === 'hi' ? "आगामी गेटवे:" : "Future Gateways:"}</span>
            <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded-md text-stone-400 font-semibold font-sans">Razorpay</span>
            <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded-md text-stone-400 font-semibold font-sans">Stripe</span>
            <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded-md text-stone-400 font-semibold font-sans">PayPal</span>
          </div>
          <div className="text-center sm:text-right text-stone-500 font-medium">
            © {new Date().getFullYear()} Bhakti Chitra Digital. {lang === 'hi' ? "सभी अधिकार सुरक्षित।" : "All rights reserved."}
          </div>
        </div>

      </div>
    </footer>
  );
}
