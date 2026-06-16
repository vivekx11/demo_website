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
    <footer className="bg-[#3D0C02] text-white border-t-2 border-[#D4AF37]">
      {/* Visual top border styling */}
      <div className="h-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500"></div>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Logo & Devotional Pitch */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#FF7700] rounded-full border border-amber-300">
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </span>
              <span className="font-cinzel text-xl font-bold tracking-wider text-yellow-300 gold-glow">
                SUMITY
              </span>
            </div>
            <p className="text-gray-300 text-sm max-w-md">
              {lang === 'hi'
                ? "हमारी कलाकृतियां और डिजिटल स्टिकर्स पूरी श्रद्धा और भक्ति के साथ बनाए गए हैं। अपने दैनिक वार्तालाप और डिजिटल उपकरणों को पवित्र चित्रों के साथ सुंदर बनाएं।"
                : "Our digital stickers and artworks are crafted with deep devotion and faith. Elevate your digital space and messages with divine representations."}
            </p>
            
            {/* Secure download badge */}
            <div className="flex items-center gap-2 p-3 bg-[#5C0601] rounded border border-[#D4AF37]/30 text-xs text-yellow-200">
              <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span>
                {lang === 'hi'
                  ? "सुरक्षित भुगतान एवं 3-डिवाइस सुरक्षित अस्थायी डाउनलोड सुरक्षा"
                  : "Encrypted payments & 3-device temporary link download protection"}
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <h3 className="text-yellow-400 font-cinzel font-bold text-sm tracking-widest uppercase border-b border-yellow-400/20 pb-2">
              {lang === 'hi' ? "नेविगेशन" : "Navigation"}
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/" className="hover:text-[#FF7700] transition">{t.navHome}</Link>
              </li>
              <li>
                <Link href="/store" className="hover:text-[#FF7700] transition">{t.navStore}</Link>
              </li>
              <li>
                <Link href="/auth" className="hover:text-[#FF7700] transition">{t.navRegister}</Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-[#FF7700] transition flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>FAQ</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacts */}
          <div className="space-y-4">
            <h3 className="text-yellow-400 font-cinzel font-bold text-sm tracking-widest uppercase border-b border-yellow-400/20 pb-2">
              {lang === 'hi' ? "संपर्क करें" : "Contact Us"}
            </h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#FF7700] flex-shrink-0 mt-0.5" />
                <span>Ayodhya Dham, Uttar Pradesh, India</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#FF7700] flex-shrink-0" />
                <span>support@sumity.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#FF7700] flex-shrink-0" />
                <span>+91 108 555 RAMA</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Future Integrations Display (Payment Logos Mockups) */}
        <div className="mt-8 pt-8 border-t border-yellow-400/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span>{lang === 'hi' ? "आगामी गेटवे:" : "Future Gateways:"}</span>
            <span className="px-2 py-0.5 bg-[#5C0601] border border-gray-600 rounded text-gray-300 font-semibold font-sans">Razorpay</span>
            <span className="px-2 py-0.5 bg-[#5C0601] border border-gray-600 rounded text-gray-300 font-semibold font-sans">Stripe</span>
            <span className="px-2 py-0.5 bg-[#5C0601] border border-gray-600 rounded text-gray-300 font-semibold font-sans">PayPal</span>
          </div>
          <div className="text-center sm:text-right">
            © {new Date().getFullYear()} Sumity Digital. {lang === 'hi' ? "सभी अधिकार सुरक्षित।" : "All rights reserved."}
          </div>
        </div>

      </div>
    </footer>
  );
}
