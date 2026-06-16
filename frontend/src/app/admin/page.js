"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { translations } from '@/utils/i18n';
import { ShieldAlert, Users, FolderKanban, ShoppingBag, Landmark, Download, Upload, Check, Ban } from 'lucide-react';

export default function Admin() {
  const router = useRouter();
  const { lang, user, token, apiFetch } = useApp();
  const t = translations[lang];

  const [metrics, setMetrics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState({ downloads: [], orders: [] });
  const [activeTab, setActiveTab] = useState('overview'); // overview, upload, users, audits
  const [loading, setLoading] = useState(true);

  // Upload Product form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Shri Ram');
  const [price, setPrice] = useState('');
  const [stickerFile, setStickerFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Force Admin Authorization checks
  useEffect(() => {
    if (!token && !loading) {
      router.push('/auth');
      return;
    }
    if (user && user.role !== 'admin') {
      // Access Denied
      setLoading(false);
    }
  }, [user, token, loading, router]);

  // Load Admin Data
  const loadAdminData = async () => {
    if (!token || (user && user.role !== 'admin')) return;
    setLoading(true);
    try {
      // 1. Load metrics stats
      const metRes = await apiFetch('/api/admin/metrics');
      const metData = await metRes.json();
      if (metRes.ok && metData.success) {
        setMetrics(metData.metrics);
      }

      // 2. Load users table
      const usrRes = await apiFetch('/api/admin/users');
      const usrData = await usrRes.json();
      if (usrRes.ok && usrData.success) {
        setUsersList(usrData.users);
      }

      // 3. Load logs
      const logRes = await apiFetch('/api/admin/logs');
      const logData = await logRes.json();
      if (logRes.ok && logData.success) {
        setAuditLogs(logData.logs);
      }

    } catch (err) {
      console.error('Error fetching admin controls:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [token, user]);

  const toggleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    const confirmMsg = lang === 'hi' 
      ? `क्या आप इस उपयोगकर्ता खाते को ${nextStatus === 'disabled' ? 'निलंबित' : 'सक्रिय'} करना चाहते हैं?`
      : `Are you sure you want to change user status to ${nextStatus}?`;
    
    if (!confirm(confirmMsg)) return;

    try {
      const res = await apiFetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        loadAdminData(); // Reload
      } else {
        alert(data.message || 'Status change failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProductUpload = async (e) => {
    e.preventDefault();
    setUploadLoading(true);
    setUploadSuccess(false);

    try {
      // We use FormData to support file upload structures
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('price', price);
      if (stickerFile) {
        formData.append('stickerFile', stickerFile);
      }

      // Authenticated API request
      const res = await fetch('http://localhost:5000/api/admin/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData // Fetch handles Content-Type boundaries automatically
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Product upload failed');
      }

      setUploadSuccess(true);
      setTitle('');
      setDescription('');
      setPrice('');
      setStickerFile(null);
      loadAdminData();

    } catch (err) {
      alert(err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  // 1. Access Denied State (Not Admin)
  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col bg-[#FFFBF7]">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-[#5C0601] animate-bounce" />
          <h1 className="text-2xl font-cinzel font-extrabold text-[#5C0601]">{lang === 'hi' ? "पहुंच अस्वीकृत" : "Access Denied"}</h1>
          <p className="text-sm text-gray-500 max-w-sm">
            {lang === 'hi'
              ? "इस पृष्ठ को देखने के लिए आपके पास एडमिन विशेषाधिकार नहीं हैं।"
              : "You do not have administrative credentials to view this system."}
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  // 2. Loading State
  if (loading && !metrics) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FFFBF7] justify-center items-center">
        <div className="w-10 h-10 border-4 border-[#FF7700] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-bold text-[#5C0601]">{lang === 'hi' ? "डेटा लोड हो रहा है..." : "Loading Admin metrics..."}</p>
      </div>
    );
  }

  const categoryOptions = [
    "Shri Ram", "Shri Krishna", "Mahadev", "Hanuman Ji", "Ganesh Ji", "Mata Rani", "Radha Krishna", "Spiritual Quotes"
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF7] text-[#2E1503]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-grow space-y-8">
        
        {/* Header Heading */}
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-2xl sm:text-3xl font-cinzel font-extrabold text-[#5C0601] tracking-wide">
            {t.adminTitle}
          </h1>
          <p className="text-xs text-gray-500 font-sans">
            {lang === 'hi' ? "देवस्थान डिजिटल प्लेटफॉर्म प्रबंधन" : "Platform Management Console"}
          </p>
        </div>

        {/* Overview Stat Grid */}
        {metrics && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 font-sans text-xs sm:text-sm">
            
            <div className="bg-white p-4 rounded-lg border border-amber-200/40 shadow-sm flex items-center gap-3">
              <span className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <Users className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">{t.adminTotalUsers}</span>
                <span className="text-lg font-extrabold text-[#5C0601]">{metrics.totalUsers}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-amber-200/40 shadow-sm flex items-center gap-3">
              <span className="p-2.5 bg-green-50 text-green-600 rounded-lg">
                <ShoppingBag className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">{t.adminTotalSales}</span>
                <span className="text-lg font-extrabold text-[#5C0601]">{metrics.totalSales}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-amber-200/40 shadow-sm flex items-center gap-3">
              <span className="p-2.5 bg-yellow-50 text-[#FF7700] rounded-lg">
                <Landmark className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">{t.adminTotalRevenue}</span>
                <span className="text-lg font-extrabold text-[#5C0601]">₹{metrics.totalRevenue}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-amber-200/40 shadow-sm flex items-center gap-3">
              <span className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
                <Download className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">{t.adminTotalDownloads}</span>
                <span className="text-lg font-extrabold text-[#5C0601]">{metrics.totalDownloads}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-amber-200/40 shadow-sm flex items-center gap-3 col-span-2 lg:col-span-1">
              <span className="p-2.5 bg-orange-50 text-orange-600 rounded-lg">
                <FolderKanban className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">{t.adminTotalProducts}</span>
                <span className="text-lg font-extrabold text-[#5C0601]">{metrics.totalProducts}</span>
              </div>
            </div>

          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-amber-300/30 font-sans text-xs sm:text-sm">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-3 font-bold border-b-2 transition ${
              activeTab === 'overview' ? 'border-[#FF7700] text-[#FF7700]' : 'border-transparent text-gray-500 hover:text-[#5C0601]'
            }`}
          >
            {lang === 'hi' ? "अवलोकन" : "Overview"}
          </button>
          <button 
            onClick={() => setActiveTab('upload')}
            className={`px-5 py-3 font-bold border-b-2 transition ${
              activeTab === 'upload' ? 'border-[#FF7700] text-[#FF7700]' : 'border-transparent text-gray-500 hover:text-[#5C0601]'
            }`}
          >
            {t.adminUploadTab}
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-5 py-3 font-bold border-b-2 transition ${
              activeTab === 'users' ? 'border-[#FF7700] text-[#FF7700]' : 'border-transparent text-gray-500 hover:text-[#5C0601]'
            }`}
          >
            {t.adminUsersTab}
          </button>
          <button 
            onClick={() => setActiveTab('audits')}
            className={`px-5 py-3 font-bold border-b-2 transition ${
              activeTab === 'audits' ? 'border-[#FF7700] text-[#FF7700]' : 'border-transparent text-gray-500 hover:text-[#5C0601]'
            }`}
          >
            {t.adminLogsTab}
          </button>
        </div>

        {/* Tab content bodies */}
        <div className="space-y-6">

          {/* A. OVERVIEW GRAPHICS (MOCKED DETAILS) */}
          {activeTab === 'overview' && (
            <div className="bg-white p-6 rounded-lg border border-amber-200/40 shadow-sm space-y-4">
              <h3 className="font-cinzel font-bold text-sm sm:text-base text-[#5C0601]">Platform Overview Status</h3>
              <p className="text-xs text-gray-600 leading-relaxed font-sans">
                {lang === 'hi' 
                  ? "सिस्टम सामान्य रूप से चल रहा है। सभी अस्थायी डाउनलोड लिंक और डिवाइस प्रतिबंधों को सुरक्षित रूप से लागू किया गया है। विफलता के बिना सभी ऑर्डर इतिहास सुरक्षित रखे गए हैं।"
                  : "All secure temporary link features and 3-device validation checks are operating normally. Real-time logging of user activity log details is enabled."}
              </p>
            </div>
          )}

          {/* B. ADD PRODUCT TAB */}
          {activeTab === 'upload' && (
            <div className="bg-white p-6 rounded-lg border border-[#D4AF37]/30 shadow-sm max-w-xl font-sans text-xs sm:text-sm">
              <h3 className="font-cinzel text-sm sm:text-base font-bold text-[#5C0601] mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#FF7700]" />
                {t.adminUploadTab}
              </h3>

              {uploadSuccess && (
                <div className="p-3 bg-green-50 text-green-700 rounded border border-green-200 flex items-center gap-2 mb-4">
                  <Check className="w-4 h-4" />
                  <span>{lang === 'hi' ? "उत्पाद सफलतापूर्वक अपलोड किया गया!" : "Product registered successfully!"}</span>
                </div>
              )}

              <form onSubmit={handleProductUpload} className="space-y-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-600 block">{t.adminLabelTitle}</label>
                  <input 
                    type="text" 
                    required
                    placeholder={lang === 'hi' ? "श्री राम जी भक्ति स्टिकर पैक" : "Shri Ram Ji Stickers Pack"}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 bg-[#FFFBF7] border border-amber-200 rounded focus:outline-none focus:ring-2 focus:ring-[#FF7700] text-[#2E1503]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-600 block">{t.adminLabelDesc}</label>
                  <textarea 
                    rows="3"
                    placeholder="Enter detailed description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 bg-[#FFFBF7] border border-amber-200 rounded focus:outline-none focus:ring-2 focus:ring-[#FF7700] text-[#2E1503]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-600 block">{t.adminLabelCategory}</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2 bg-[#FFFBF7] border border-amber-200 rounded focus:outline-none focus:ring-2 focus:ring-[#FF7700] text-[#2E1503]"
                    >
                      {categoryOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-600 block">{t.adminLabelPrice}</label>
                    <input 
                      type="number" 
                      required
                      placeholder="108"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full p-2 bg-[#FFFBF7] border border-amber-200 rounded focus:outline-none focus:ring-2 focus:ring-[#FF7700] text-[#2E1503]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-600 block">{t.adminLabelFile}</label>
                  <input 
                    type="file" 
                    onChange={(e) => setStickerFile(e.target.files[0])}
                    className="w-full p-2 bg-[#FFFBF7] border border-dashed border-amber-200 rounded text-gray-500"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={uploadLoading}
                  className="w-full py-2.5 bg-[#FF7700] hover:bg-[#B34400] text-white font-bold rounded shadow transition focus:outline-none flex items-center justify-center gap-1.5 shimmer-btn"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploadLoading ? (lang === 'hi' ? "अपलोड किया जा रहा है..." : "Uploading...") : t.adminUploadBtn}</span>
                </button>

              </form>
            </div>
          )}

          {/* C. USERS LISTS */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-lg border border-amber-300/30 overflow-hidden shadow-sm font-sans text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FFF8F0] border-b border-amber-200/30 text-[#5C0601]">
                      <th className="p-4 font-bold">{t.adminTableName}</th>
                      <th className="p-4 font-bold">{t.adminTableEmail}</th>
                      <th className="p-4 font-bold">{t.adminTableDeviceCount}</th>
                      <th className="p-4 font-bold">{t.adminTableStatus}</th>
                      <th className="p-4 font-bold">{t.adminTableAction}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {usersList.map((usr) => (
                      <tr key={usr.id} className="hover:bg-gray-50">
                        <td className="p-4 font-bold text-[#5C0601]">{usr.name} {usr.role === 'admin' && '⭐'}</td>
                        <td className="p-4 text-gray-500 font-mono">{usr.email}</td>
                        <td className="p-4 text-gray-500 font-mono">
                          {usr.devices?.length || 0} / 3 Devices
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            usr.status === 'active' 
                              ? 'bg-green-50 text-green-700 border border-green-200' 
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {usr.status === 'active' ? t.adminUserActive : t.adminUserDisabled}
                          </span>
                        </td>
                        <td className="p-4">
                          {usr.role !== 'admin' && (
                            <button
                              onClick={() => toggleUserStatus(usr.id, usr.status)}
                              className={`flex items-center gap-1.5 py-1 px-3.5 border rounded font-bold transition focus:outline-none ${
                                usr.status === 'active' 
                                  ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200' 
                                  : 'bg-green-50 hover:bg-green-100 text-green-600 border-green-200'
                              }`}
                            >
                              {usr.status === 'active' ? <Ban className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                              <span>{usr.status === 'active' ? t.adminBlockBtn : t.adminUnblockBtn}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* D. AUDITS ACTIVITY LOGS */}
          {activeTab === 'audits' && (
            <div className="grid grid-cols-1 gap-6 font-sans text-xs">
              
              {/* 1. Downloads Log Table */}
              <div className="bg-white rounded-lg border border-amber-300/30 overflow-hidden shadow-sm">
                <div className="p-4 bg-[#FFF8F0] border-b border-amber-200/30 font-bold text-[#5C0601] flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#FF7700]" />
                  <span>Sticker Downloads Security Audit Trails</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
                        <th className="p-3 font-bold">{t.adminTableEmail}</th>
                        <th className="p-3 font-bold">{lang === 'hi' ? "उत्पाद" : "Sticker Pack"}</th>
                        <th className="p-3 font-bold">{t.adminLogHeaderIP}</th>
                        <th className="p-3 font-bold">{t.adminLogHeaderDevice}</th>
                        <th className="p-3 font-bold">{t.adminLogHeaderTime}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {auditLogs.downloads.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="p-3 text-[#5C0601] font-bold font-mono">{log.userEmail}</td>
                          <td className="p-3 text-gray-700">{log.productTitle}</td>
                          <td className="p-3 text-gray-500 font-mono">{log.ip_address}</td>
                          <td className="p-3 text-gray-500 font-mono">{log.device_id}</td>
                          <td className="p-3 text-gray-400">{new Date(log.download_time).toLocaleString()}</td>
                        </tr>
                      ))}
                      {auditLogs.downloads.length === 0 && (
                        <tr>
                          <td colSpan="5" className="p-6 text-center text-gray-500">No download logs recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Orders Log Table */}
              <div className="bg-white rounded-lg border border-amber-300/30 overflow-hidden shadow-sm">
                <div className="p-4 bg-[#FFF8F0] border-b border-amber-200/30 font-bold text-[#5C0601] flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#FF7700]" />
                  <span>Order Transactions Ledgers</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
                        <th className="p-3 font-bold">{t.adminTableEmail}</th>
                        <th className="p-3 font-bold">{lang === 'hi' ? "उत्पाद" : "Sticker Pack"}</th>
                        <th className="p-3 font-bold">{lang === 'hi' ? "कीमत" : "Price"}</th>
                        <th className="p-3 font-bold">Transaction ID</th>
                        <th className="p-3 font-bold">Status</th>
                        <th className="p-3 font-bold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {auditLogs.orders.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="p-3 text-[#5C0601] font-bold font-mono">{log.userEmail}</td>
                          <td className="p-3 text-gray-700">{log.productTitle}</td>
                          <td className="p-3 font-bold text-[#5C0601]">₹{log.price}</td>
                          <td className="p-3 text-gray-500 font-mono">{log.payment_id || 'MOCK_PENDING'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold capitalize ${
                              log.payment_status === 'paid' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            }`}>
                              {log.payment_status}
                            </span>
                          </td>
                          <td className="p-3 text-gray-400">{new Date(log.purchase_date).toLocaleString()}</td>
                        </tr>
                      ))}
                      {auditLogs.orders.length === 0 && (
                        <tr>
                          <td colSpan="6" className="p-6 text-center text-gray-500">No transactions recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

      </main>

      <Footer />
    </div>
  );
}
