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
      <div className="min-h-screen flex flex-col bg-[#FFFBF7] justify-center items-center">
        <div className="w-10 h-10 border-4 border-[#FF7700] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-bold text-[#5C0601]">{lang === 'hi' ? "डैशबोर्ड लोड हो रहा है..." : "Loading Devotee Dashboard..."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF7] text-[#2E1503]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-grow space-y-8">
        
        {/* Welcome Section */}
        {user && (
          <div className="bg-white p-6 rounded-lg border border-amber-300/30 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h1 className="text-2xl font-cinzel font-extrabold text-[#5C0601] tracking-wide">
                {t.dashWelcome}{user.name}!
              </h1>
              <p className="text-xs text-gray-500 font-sans">
                {lang === 'hi' ? `पंजीकृत ईमेल: ${user.email}` : `Account Email: ${user.email}`}
              </p>
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded text-xs text-[#5C0601] font-sans">
              <Smartphone className="w-4 h-4 text-[#FF7700]" />
              <span>
                {lang === 'hi' 
                  ? `डिवाइस सीमा: 3 में से ${user.devices?.length || 0} पंजीकृत` 
                  : `Devices: ${user.devices?.length || 0} of 3 registered`}
              </span>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-amber-300/30 font-sans">
          <button 
            onClick={() => setActiveTab('purchases')}
            className={`flex items-center gap-2 px-6 py-3 font-bold text-xs sm:text-sm border-b-2 transition ${
              activeTab === 'purchases' 
                ? 'border-[#FF7700] text-[#FF7700]' 
                : 'border-transparent text-gray-500 hover:text-[#5C0601]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t.dashPurchases}</span>
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-6 py-3 font-bold text-xs sm:text-sm border-b-2 transition ${
              activeTab === 'logs' 
                ? 'border-[#FF7700] text-[#FF7700]' 
                : 'border-transparent text-gray-500 hover:text-[#5C0601]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{t.dashHistory}</span>
          </button>
          <button 
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 px-6 py-3 font-bold text-xs sm:text-sm border-b-2 transition ${
              activeTab === 'devices' 
                ? 'border-[#FF7700] text-[#FF7700]' 
                : 'border-transparent text-gray-500 hover:text-[#5C0601]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{t.dashSettings}</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="space-y-6">

          {/* 1. Purchases Tab */}
          {activeTab === 'purchases' && (
            <div className="space-y-4">
              {downloadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center gap-2 font-sans">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{downloadError}</span>
                </div>
              )}

              {purchases.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {purchases.map((item) => (
                    <div key={item.orderId} className="bg-white p-5 rounded-lg border border-amber-200/40 shadow-sm flex justify-between items-center gap-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] bg-orange-50 text-[#FF7700] border border-orange-200 rounded font-sans px-2 py-0.5 font-bold uppercase">
                          {item.product.category}
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-[#5C0601]">{item.product.title}</h3>
                        <p className="text-xs text-gray-500 font-sans">
                          {lang === 'hi' 
                            ? `खरीद तिथि: ${new Date(item.purchaseDate).toLocaleDateString('hi-IN')}`
                            : `Purchased: ${new Date(item.purchaseDate).toLocaleDateString()}`}
                        </p>
                      </div>

                      <button 
                        disabled={downloadingId === item.product.id}
                        onClick={() => handleDownload(item.product.id, item.product.title)}
                        className="p-3 bg-[#FF7700] hover:bg-[#B34400] text-white rounded-full transition shadow shimmer-btn focus:outline-none"
                        title={t.dashDownloadBtn}
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-amber-300/30">
                  <p className="text-gray-500 text-xs sm:text-sm font-semibold">{t.dashNoPurchases}</p>
                </div>
              )}
            </div>
          )}

          {/* 2. Download History Tab */}
          {activeTab === 'logs' && (
            <div className="bg-white rounded-lg border border-amber-300/30 overflow-hidden shadow-sm font-sans text-xs">
              {downloadsLog.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FFF8F0] border-b border-amber-200/30 text-[#5C0601]">
                        <th className="p-4 font-bold">{lang === 'hi' ? "उत्पाद" : "Product Pack"}</th>
                        <th className="p-4 font-bold">{t.adminLogHeaderTime}</th>
                        <th className="p-4 font-bold">{t.adminLogHeaderIP}</th>
                        <th className="p-4 font-bold">{t.adminLogHeaderDevice}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {downloadsLog.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="p-4 font-bold text-[#5C0601]">{log.productTitle}</td>
                          <td className="p-4 text-gray-500">{new Date(log.download_time).toLocaleString()}</td>
                          <td className="p-4 text-gray-500 font-mono">{log.ip_address}</td>
                          <td className="p-4 text-gray-500 font-mono">{log.device_id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 font-semibold">{t.dashNoLogs}</p>
                </div>
              )}
            </div>
          )}

          {/* 3. Devices Configurations Tab */}
          {activeTab === 'devices' && user && (
            <div className="space-y-4 max-w-2xl font-sans text-xs sm:text-sm">
              <div className="bg-orange-50 p-4 rounded border border-orange-200 text-[#5C0601] flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#FF7700] mt-0.5" />
                <p className="leading-relaxed">
                  {t.dashDeviceWarning} {lang === 'hi' 
                    ? "यदि आप किसी पुराने उपकरण का उपयोग नहीं कर रहे हैं, तो उसे सूची से हटा दें ताकि आप नए डिवाइस पर डाउनलोड कर सकें।"
                    : "If you no longer use a device, remove it from the list below to allow login and secure downloads from a new browser."}
                </p>
              </div>

              <div className="bg-white border border-amber-200/30 rounded-lg overflow-hidden shadow-sm">
                <div className="p-4 bg-[#FFF8F0] border-b border-amber-200/30 font-bold text-[#5C0601]">
                  {t.dashRegisteredDevices}
                </div>
                
                <ul className="divide-y divide-gray-100">
                  {user.devices?.map((dev, idx) => (
                    <li key={dev} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-2.5">
                        <Smartphone className="w-5 h-5 text-gray-500" />
                        <div>
                          <span className="font-bold block text-[#5C0601]">Device #{idx + 1}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{dev}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => removeDevice(dev)}
                        className="inline-flex items-center gap-1 py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded font-bold transition focus:outline-none"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.dashRemoveDevice}</span>
                      </button>
                    </li>
                  ))}
                  {(!user.devices || user.devices.length === 0) && (
                    <li className="p-4 text-center text-gray-500">No registered devices.</li>
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
