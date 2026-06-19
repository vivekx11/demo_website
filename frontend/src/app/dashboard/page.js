"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { translations } from '@/utils/i18n';
import { ShoppingBag, History, Settings, Download, Trash2, Smartphone, ShieldCheck, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const { lang, user, loginUser, token, apiFetch, BACKEND_URL } = useApp();
  const t = translations[lang];

  const [purchases, setPurchases] = useState([]);
  const [downloadsLog, setDownloadsLog] = useState([]);
  const [activeTab, setActiveTab] = useState('purchases'); // purchases, logs, devices
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadError, setDownloadError] = useState(null);

  // Force login redirect
  useEffect(() => {
    if (!token && !loading) {
      router.push('/auth');
    }
  }, [token, loading, router]);

  // Fetch purchases & download logs
  const loadDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Fetch purchased items
      const purRes = await apiFetch('/api/dashboard/purchases');
      const purData = await purRes.json();
      if (purRes.ok && purData.success) {
        setPurchases(purData.purchases);
      }

      // 2. Fetch download logs
      const logRes = await apiFetch('/api/dashboard/downloads');
      const logData = await logRes.json();
      if (logRes.ok && logData.success) {
        setDownloadsLog(logData.downloads);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [token]);

  const handleDownload = async (productId, title) => {
    setDownloadingId(productId);
    setDownloadError(null);
    try {
      const linkRes = await apiFetch('/api/downloads/request-link', {
        method: 'POST',
        body: JSON.stringify({ productId })
      });
      const linkData = await linkRes.json();

      if (!linkRes.ok || !linkData.success) {
        throw new Error(linkData.message || 'Download authorization failed');
      }

      // Trigger secure download stream from the server backend
      const downloadUrl = `${BACKEND_URL}${linkData.downloadUrl}`;
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.setAttribute('download', `${title.replace(/\s+/g, '_')}.zip`);
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Refresh logs after download
      setTimeout(loadDashboardData, 1000);

    } catch (err) {
      setDownloadError(err.message || 'Download failed. Device limit reached or account suspended.');
    } finally {
      setDownloadingId(null);
    }
  };

  const removeDevice = async (deviceToRemove) => {
    if (!confirm(lang === 'hi' ? 'क्या आप इस डिवाइस को हटाना चाहते हैं?' : 'Are you sure you want to remove this device?')) {
      return;
    }
    try {
      const res = await apiFetch('/api/auth/devices/remove', {
        method: 'POST',
        body: JSON.stringify({ deviceToRemove })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Update user device context
        const updatedUser = { ...user, devices: data.devices };
        loginUser(token, updatedUser, null);
      } else {
        alert(data.message || 'Failed to remove device');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FCFAF7] justify-center items-center">
        <div className="w-10 h-10 border-4 border-[#EA580C] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-bold text-stone-700">{lang === 'hi' ? "डैशबोर्ड लोड हो रहा है..." : "Loading Devotee Dashboard..."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAF7] text-stone-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-grow space-y-8">
        
        {/* Welcome Section */}
        {user && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/50 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center sm:text-left">
              <h1 className="text-2xl font-cinzel font-bold text-stone-900 tracking-wide">
                {t.dashWelcome}{user.name}!
              </h1>
              <p className="text-xs text-stone-500 font-sans">
                {lang === 'hi' ? `पंजीकृत ईमेल: ${user.email}` : `Account Email: ${user.email}`}
              </p>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200/50 rounded-xl text-xs text-[#EA580C] font-sans font-semibold">
              <Smartphone className="w-4.5 h-4.5 text-[#EA580C]" />
              <span>
                {lang === 'hi' 
                  ? `डिवाइस सीमा: 3 में से ${user.devices?.length || 0} पंजीकृत` 
                  : `Devices: ${user.devices?.length || 0} of 3 registered`}
              </span>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-stone-200/50 font-sans">
          <button 
            onClick={() => setActiveTab('purchases')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-xs sm:text-sm border-b-2 transition duration-200 cursor-pointer focus:outline-none ${
              activeTab === 'purchases' 
                ? 'border-[#EA580C] text-[#EA580C]' 
                : 'border-transparent text-stone-550 hover:text-stone-800'
            }`}
          >
            <ShoppingBag className="w-4.5 h-4.5" />
            <span>{t.dashPurchases}</span>
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-xs sm:text-sm border-b-2 transition duration-200 cursor-pointer focus:outline-none ${
              activeTab === 'logs' 
                ? 'border-[#EA580C] text-[#EA580C]' 
                : 'border-transparent text-stone-550 hover:text-stone-800'
            }`}
          >
            <History className="w-4.5 h-4.5" />
            <span>{t.dashHistory}</span>
          </button>
          <button 
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-xs sm:text-sm border-b-2 transition duration-200 cursor-pointer focus:outline-none ${
              activeTab === 'devices' 
                ? 'border-[#EA580C] text-[#EA580C]' 
                : 'border-transparent text-stone-550 hover:text-stone-800'
            }`}
          >
            <Settings className="w-4.5 h-4.5" />
            <span>{t.dashSettings}</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="space-y-6">

          {/* 1. Purchases Tab */}
          {activeTab === 'purchases' && (
            <div className="space-y-4">
              {downloadError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-750 text-xs flex items-center gap-2 font-sans font-medium">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{downloadError}</span>
                </div>
              )}

              {purchases.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {purchases.map((item) => (
                    <div key={item.orderId} className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/50 shadow-sm flex justify-between items-center gap-6">
                      <div className="space-y-2">
                        <span className="text-[10px] bg-orange-50 text-[#EA580C] border border-orange-100 rounded-lg font-sans px-2.5 py-0.5 font-bold uppercase">
                          {item.product.category}
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-stone-900 leading-normal">{item.product.title}</h3>
                        <p className="text-xs text-stone-500 font-sans font-medium">
                          {lang === 'hi' 
                            ? `खरीद तिथि: ${new Date(item.purchaseDate).toLocaleDateString('hi-IN')}`
                            : `Purchased: ${new Date(item.purchaseDate).toLocaleDateString()}`}
                        </p>
                      </div>

                      <button 
                        disabled={downloadingId === item.product.id}
                        onClick={() => handleDownload(item.product.id, item.product.title)}
                        className="p-3.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl transition shadow-sm shimmer-btn cursor-pointer focus:outline-none"
                        title={t.dashDownloadBtn}
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-6 bg-white border border-stone-250 border-dashed rounded-2xl max-w-md mx-auto space-y-4 shadow-sm font-sans">
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-[#EA580C] border border-orange-100">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h3 className="font-cinzel font-bold text-lg text-stone-850">
                    {lang === 'hi' ? "कोई ऑर्डर नहीं" : "No Orders Yet"}
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed font-medium">
                    {lang === 'hi' 
                      ? "आपने अभी तक कोई उत्पाद नहीं खरीदा है। स्टोर पर जाएं और अपनी पहली भक्ति खरीद करें!" 
                      : "You have not purchased any products yet. Visit the store to make your first purchase!"}
                  </p>
                  <div className="pt-2">
                    <button 
                      onClick={() => router.push('/store')}
                      className="px-6 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs transition shadow-sm cursor-pointer"
                    >
                      {lang === 'hi' ? "स्टोर पर जाएं" : "Visit Store"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Download History Tab */}
          {activeTab === 'logs' && (
            <div className="bg-white rounded-2xl border border-stone-200/50 overflow-hidden shadow-sm font-sans text-xs">
              {downloadsLog.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-100 text-stone-700">
                        <th className="p-4 font-bold">{lang === 'hi' ? "उत्पाद" : "Product Pack"}</th>
                        <th className="p-4 font-bold">{t.adminLogHeaderTime}</th>
                        <th className="p-4 font-bold">{t.adminLogHeaderIP}</th>
                        <th className="p-4 font-bold">{t.adminLogHeaderDevice}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-600 font-medium">
                      {downloadsLog.map((log) => (
                        <tr key={log.id} className="hover:bg-stone-50/50 transition duration-150">
                          <td className="p-4 font-bold text-stone-850">{log.productTitle}</td>
                          <td className="p-4 text-stone-500">{new Date(log.download_time).toLocaleString()}</td>
                          <td className="p-4 text-stone-400 font-mono">{log.ip_address}</td>
                          <td className="p-4 text-stone-400 font-mono">{log.device_id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 px-6 bg-white border border-stone-250 border-dashed rounded-2xl max-w-md mx-auto space-y-4 shadow-sm font-sans">
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-[#EA580C] border border-orange-100">
                    <Download className="w-8 h-8" />
                  </div>
                  <h3 className="font-cinzel font-bold text-lg text-stone-850">
                    {lang === 'hi' ? "कोई डाउनलोड नहीं" : "No Downloads Yet"}
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed font-medium">
                    {lang === 'hi' 
                      ? "अभी तक कोई डाउनलोड इतिहास दर्ज नहीं है।" 
                      : "No download logs recorded yet. Download your purchased files from the purchases tab!"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 3. Devices Configurations Tab */}
          {activeTab === 'devices' && user && (
            <div className="space-y-4 max-w-2xl font-sans text-xs sm:text-sm">
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 text-stone-700 flex items-start gap-2.5 font-medium leading-relaxed">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#EA580C] mt-0.5" />
                <p>
                  {t.dashDeviceWarning} {lang === 'hi' 
                    ? "यदि आप किसी पुराने उपकरण का उपयोग नहीं कर रहे हैं, तो उसे सूची से हटा दें ताकि आप नए डिवाइस पर डाउनलोड कर सकें।"
                    : "If you no longer use a device, remove it from the list below to allow login and secure downloads from a new browser."}
                </p>
              </div>

              <div className="bg-white border border-stone-200/50 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 bg-stone-50 border-b border-stone-100 font-bold text-stone-850">
                  {t.dashRegisteredDevices}
                </div>
                
                <ul className="divide-y divide-stone-100 text-stone-600 font-medium">
                  {user.devices?.map((dev, idx) => (
                    <li key={dev} className="p-4 flex items-center justify-between hover:bg-stone-50/50 transition">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-stone-400" />
                        <div>
                          <span className="font-bold block text-stone-800">Device #{idx + 1}</span>
                          <span className="text-[10px] text-stone-400 font-mono block mt-0.5">{dev}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => removeDevice(dev)}
                        className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-red-50 hover:bg-red-100 text-red-650 border border-red-100 rounded-xl font-bold transition cursor-pointer focus:outline-none text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.dashRemoveDevice}</span>
                      </button>
                    </li>
                  ))}
                  {(!user.devices || user.devices.length === 0) && (
                    <li className="p-4 text-center text-stone-400">No registered devices.</li>
                  )}
                </ul>
              </div>
            </div>
          )}

        </div>

      </main>

      <Footer />
    </div>
  );
}
