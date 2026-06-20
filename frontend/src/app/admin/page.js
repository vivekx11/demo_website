"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { translations } from '@/utils/i18n';
import { 
  ShieldAlert, Users, FolderKanban, ShoppingBag, Landmark, 
  Download, Upload, Check, Ban, Eye, Edit3, Trash2, X, Plus, Sparkles, AlertCircle, KeyRound, Image as ImageIcon
} from 'lucide-react';

export default function Admin() {
  const router = useRouter();
  const { lang, user, token, apiFetch, apiUpload, loginUser, logoutUser } = useApp();
  const t = translations[lang];

  // System states
  const [metrics, setMetrics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [auditLogs, setAuditLogs] = useState({ downloads: [], orders: [] });
  const [activeTab, setActiveTab] = useState('overview'); // overview, products, add-product, users, audits
  const [loading, setLoading] = useState(true);

  // Admin Login states
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Add/Edit Product form states
  const [editingProduct, setEditingProduct] = useState(null); // null for "Add Mode", product object for "Edit Mode"
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Shri Ram');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('active'); // active or draft
  const [featured, setFeatured] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [productFile, setProductFile] = useState(null);
  
  // Progress & Success states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState(null);

  // Preview Product Modal state
  const [previewProduct, setPreviewProduct] = useState(null);

  // Force Admin Authorization checks
  const isAdmin = user && user.role === 'admin';

  // Load Admin Data
  const loadAdminData = async () => {
    if (!token || !isAdmin) {
      setLoading(false);
      return;
    }
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

      // 4. Load all products (including drafts)
      const prodRes = await apiFetch('/api/admin/products');
      const prodData = await prodRes.json();
      if (prodRes.ok && prodData.success) {
        setProductsList(prodData.products);
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

  // Handle Admin Login submission
  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await apiFetch('/api/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email: adminEmail.trim(), password: adminPassword })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Authentication failed');
      }

      loginUser(data.token, data.user);
      setAdminEmail('');
      setAdminPassword('');
    } catch (err) {
      setLoginError(err.message || 'Invalid admin credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  // Toggle User Block/Unblock Status
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

  // Delete Product
  const handleDeleteProduct = async (prodId) => {
    const confirmMsg = lang === 'hi' 
      ? "क्या आप निश्चित रूप से इस उत्पाद को हटाना चाहते हैं? यह क्रिया वापस नहीं ली जा सकती।"
      : "Are you sure you want to delete this product? This action is permanent.";
    
    if (!confirm(confirmMsg)) return;

    try {
      const res = await apiFetch(`/api/admin/products/${prodId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(lang === 'hi' ? "उत्पाद सफलतापूर्वक हटा दिया गया" : "Product deleted successfully");
        loadAdminData();
      } else {
        alert(data.message || 'Product deletion failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Edit Mode
  const startEditProduct = (prod) => {
    setEditingProduct(prod);
    setTitle(prod.title);
    setDescription(prod.description);
    setCategory(prod.category);
    setPrice(prod.price);
    setStatus(prod.status || 'active');
    setFeatured(prod.featured || false);
    setThumbnailFile(null);
    setProductFile(null);
    setFormSuccess(false);
    setFormError(null);
    setUploadProgress(0);
    setActiveTab('add-product');
  };

  // Open Add Mode
  const startAddProduct = () => {
    setEditingProduct(null);
    setTitle('');
    setDescription('');
    setCategory('Shri Ram');
    setPrice('');
    setStatus('active');
    setFeatured(false);
    setThumbnailFile(null);
    setProductFile(null);
    setFormSuccess(false);
    setFormError(null);
    setUploadProgress(0);
    setActiveTab('add-product');
  };

  // Handle Form Submission (Add/Edit)
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(false);
    setUploadProgress(0);

    // Form validation
    if (!title.trim() || !category || price === '') {
      setFormError(lang === 'hi' ? 'सभी आवश्यक फ़ील्ड भरें' : 'Please fill all required fields');
      setFormLoading(false);
      return;
    }

    if (parseFloat(price) < 0) {
      setFormError(lang === 'hi' ? 'कीमत सकारात्मक संख्या होनी चाहिए' : 'Price must be a positive number');
      setFormLoading(false);
      return;
    }

    if (!editingProduct && (!thumbnailFile || !productFile)) {
      setFormError(lang === 'hi' ? 'थंबनेल और डाउनलोड फाइल दोनों आवश्यक हैं' : 'Both thumbnail and product files are required for new products');
      setFormLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('price', price);
      formData.append('status', status);
      formData.append('featured', String(featured));

      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }
      if (productFile) {
        formData.append('productFile', productFile);
      }

      const endpoint = editingProduct 
        ? `/api/admin/products/${editingProduct.id}` 
        : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await apiUpload(endpoint, formData, (percent) => {
        setUploadProgress(percent);
      }, method);

      if (!response.ok) {
        throw new Error(response.data?.message || 'Upload failed');
      }

      setFormSuccess(true);
      if (!editingProduct) {
        // Clear fields on successful creation
        setTitle('');
        setDescription('');
        setPrice('');
        setThumbnailFile(null);
        setProductFile(null);
        setFeatured(false);
      } else {
        // Refresh editing details
        setEditingProduct(response.data.product);
      }
      
      // Reload lists
      loadAdminData();
    } catch (err) {
      setFormError(err.message || 'An error occurred during submission');
    } finally {
      setFormLoading(false);
    }
  };

  // Local Category Images
  const getCategoryImage = (category) => {
    return (
      <div className="w-full h-32 bg-gradient-to-br from-orange-400 to-amber-500 flex flex-col items-center justify-center text-white relative">
        <span className="font-yatra text-base drop-shadow text-white">{category}</span>
        <div className="absolute inset-x-0 bottom-0 bg-black/15 text-[8px] text-center font-sans tracking-widest text-yellow-100 py-0.5 uppercase">
          {lang === 'hi' ? "भक्ति स्वरूप" : "Divine Art"}
        </div>
      </div>
    );
  };

  // 1. Admin Login Form (Not Logged in as Admin)
  if (!token || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FCFAF7] text-stone-900">
        <Header />
        <main className="flex-grow flex items-center justify-center py-16 px-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200/50 overflow-hidden shadow-2xl relative">
            <div className="temple-border-top"></div>
            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <span className="p-3 bg-stone-50 rounded-full inline-block border border-stone-200">
                  <KeyRound className="w-6 h-6 text-[#EA580C] animate-pulse" />
                </span>
                <h2 className="text-2xl font-cinzel font-bold text-stone-900 tracking-wider pt-2">
                  {lang === 'hi' ? "सुरक्षित एडमिन प्रवेश" : "Secure Admin Login"}
                </h2>
                <p className="text-xs text-stone-500 font-sans">
                  {lang === 'hi' ? "पोर्टल का प्रबंधन करने के लिए साख दर्ज करें" : "Enter credentials to access admin portal"}
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2 font-sans font-medium">
                  <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLoginSubmit} className="space-y-4 text-xs sm:text-sm font-sans">
                <div className="space-y-1">
                  <label className="font-bold text-stone-600 block">
                    {lang === 'hi' ? "एडमिन ईमेल" : "Admin Email"}
                  </label>
                  <input 
                    type="email" 
                    required
                    placeholder="admin@bhaktichitra.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C] text-stone-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-600 block">
                    {lang === 'hi' ? "पासवर्ड" : "Password"}
                  </label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C] text-stone-800"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold rounded-xl shadow-sm transition duration-200 flex items-center justify-center font-sans focus:outline-none border border-stone-850 shimmer-btn cursor-pointer"
                >
                  {loginLoading 
                    ? (lang === 'hi' ? "सत्यापन किया जा रहा है..." : "Authenticating...") 
                    : (lang === 'hi' ? "कंट्रोल पैनल में प्रवेश करें" : "Enter Admin Panel")}
                </button>
              </form>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 2. Loading State (Logged in, data loading)
  if (loading && !metrics) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FCFAF7] justify-center items-center">
        <div className="w-12 h-12 border-4 border-[#EA580C] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-bold text-stone-700 font-cinzel">
          {lang === 'hi' ? "एडमिन डेटा लोड हो रहा है..." : "Loading Admin Dashboard Data..."}
        </p>
      </div>
    );
  }

  const categoryOptions = [
    "Shri Ram", "Shri Krishna", "Mahadev", "Hanuman Ji", "Ganesh Ji", "Mata Rani", "Radha Krishna", "Spiritual Quotes"
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAF7] text-stone-900">
      <Header />

      {/* Main Layout containing Sidebar and Tab contents */}
      <div className="flex-grow flex flex-col md:flex-row max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 gap-8">
        
        {/* Sticky Dashboard Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-stone-200/50 p-5 shadow-sm sticky top-24 space-y-6 font-sans">
            <div className="border-b border-stone-100 pb-4 text-center md:text-left">
              <h2 className="text-lg font-cinzel font-bold text-stone-900">
                {lang === 'hi' ? "नियंत्रण केंद्र" : "Control Center"}
              </h2>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-250 inline-block mt-1">
                {lang === 'hi' ? "सुरक्षित सत्र सक्रिय" : "Secure Session Active"}
              </span>
            </div>

            {/* Sidebar Navigation Options */}
            <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible gap-1.5 pb-2 md:pb-0">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'overview' ? 'bg-[#EA580C] text-white shadow-sm' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <Landmark className="w-4.5 h-4.5" />
                <span>{lang === 'hi' ? "अवलोकन" : "Overview & Stats"}</span>
              </button>
              <button 
                onClick={() => setActiveTab('products')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'products' ? 'bg-[#EA580C] text-white shadow-sm' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <FolderKanban className="w-4.5 h-4.5" />
                <span>{lang === 'hi' ? "उत्पाद सूची" : "Wallpaper Products"}</span>
              </button>
              <button 
                onClick={startAddProduct}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'add-product' && !editingProduct ? 'bg-[#EA580C] text-white shadow-sm' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <Plus className="w-4.5 h-4.5" />
                <span>{lang === 'hi' ? "नया उत्पाद जोड़ें" : "Upload Product"}</span>
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'users' ? 'bg-[#EA580C] text-white shadow-sm' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <Users className="w-4.5 h-4.5" />
                <span>{lang === 'hi' ? "उपयोगकर्ता" : "Manage Users"}</span>
              </button>
              <button 
                onClick={() => setActiveTab('audits')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'audits' ? 'bg-[#EA580C] text-white shadow-sm' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <Download className="w-4.5 h-4.5" />
                <span>{lang === 'hi' ? "ऑडिट लॉग्स" : "Audits & Logs"}</span>
              </button>
            </nav>

            <button 
              onClick={logoutUser}
              className="w-full py-2 bg-stone-50 hover:bg-red-50 text-stone-500 hover:text-red-700 text-xs font-bold rounded-xl transition border border-stone-250 cursor-pointer"
            >
              {lang === 'hi' ? "पैनल बंद करें (लॉगआउट)" : "Logout Control Panel"}
            </button>
          </div>
        </aside>

        {/* Dynamic content rendering column */}
        <main className="flex-grow space-y-6 min-w-0">
          
          {/* Header block showing current location */}
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-cinzel font-bold text-stone-900 tracking-wide leading-snug">
              {editingProduct && activeTab === 'add-product'
                ? (lang === 'hi' ? `उत्पाद संपादित करें: ${editingProduct.title}` : `Edit Product: ${editingProduct.title}`)
                : activeTab === 'overview' ? (lang === 'hi' ? "प्लेटफॉर्म स्थिति और विश्लेषिकी" : "Platform Analytics Overview")
                : activeTab === 'products' ? (lang === 'hi' ? "वॉलपेपर उत्पाद सूची" : "Wallpaper & PDF Products Catalog")
                : activeTab === 'add-product' ? (lang === 'hi' ? "नया वॉलपेपर उत्पाद जोड़ें" : "Register & Upload Devotional Product")
                : activeTab === 'users' ? (lang === 'hi' ? "उपयोगकर्ता खाता प्रबंधन" : "User Access Management")
                : (lang === 'hi' ? "सुरक्षा ऑडिट और लॉग" : "Security Downloads & Purchase Log Ledger")
              }
            </h1>
            <p className="text-[10px] text-stone-400 font-mono">
              {lang === 'hi' ? "भक्ति चित्र स्टोर प्रशासनिक विशेषाधिकार" : "Bhakti Chitra Store Administrative console panel"}
            </p>
          </div>

          {/* Overview Tab Content */}
          {activeTab === 'overview' && metrics && (
            <div className="space-y-6">
              
              {/* Stat Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-sans text-xs sm:text-sm">
                <div className="bg-white p-4.5 rounded-2xl border border-stone-200/50 shadow-sm flex items-center gap-3">
                  <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <Users className="w-5 h-5" />
                  </span>
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold block uppercase">{t.adminTotalUsers}</span>
                    <span className="text-lg font-extrabold text-stone-900">{metrics.totalUsers}</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-stone-200/50 shadow-sm flex items-center gap-3">
                  <span className="p-2.5 bg-green-50 text-green-650 rounded-xl">
                    <ShoppingBag className="w-5 h-5" />
                  </span>
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold block uppercase">{t.adminTotalSales}</span>
                    <span className="text-lg font-extrabold text-stone-900">{metrics.totalSales}</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-stone-200/50 shadow-sm flex items-center gap-3">
                  <span className="p-2.5 bg-orange-50 text-[#EA580C] rounded-xl">
                    <Landmark className="w-5 h-5" />
                  </span>
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold block uppercase">{t.adminTotalRevenue}</span>
                    <span className="text-lg font-extrabold text-stone-900">₹{metrics.totalRevenue}</span>
                  </div>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-stone-200/50 shadow-sm flex items-center gap-3">
                  <span className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                    <Download className="w-5 h-5" />
                  </span>
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold block uppercase">{t.adminTotalDownloads}</span>
                    <span className="text-lg font-extrabold text-stone-900">{metrics.totalDownloads}</span>
                  </div>
                </div>
              </div>

              {/* Analytics Visuals or Empty State */}
              {metrics.totalSales === 0 && metrics.totalDownloads === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-stone-200/50 shadow-sm text-center space-y-4 font-sans py-16">
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-[#EA580C] border border-orange-100">
                    <AlertCircle className="w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="font-cinzel font-bold text-lg text-stone-850">
                    {lang === 'hi' ? "कोई विश्लेषण डेटा उपलब्ध नहीं है" : "No Analytics Data Available"}
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed max-w-md mx-auto">
                    {lang === 'hi'
                      ? "प्लेटफ़ॉर्म पर अभी तक कोई ऑर्डर या डाउनलोड नहीं हैं। एक बार जब भक्त चित्र डाउनलोड करना या खरीदना शुरू करेंगे, तो विश्लेषण और गतिविधि फ़ीड यहाँ दिखाई देंगे।"
                      : "No sales or download events have been recorded yet. Once users start purchasing or downloading wallpapers, category revenue charts and real-time activities will appear here."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Revenue breakdown by category */}
                  <div className="bg-white p-6 rounded-2xl border border-stone-200/50 shadow-sm space-y-4">
                    <h3 className="font-cinzel font-bold text-sm text-stone-900">
                      {lang === 'hi' ? "श्रेणी अनुसार राजस्व" : "Revenue by Deity Category"}
                    </h3>
                    
                    <div className="space-y-4 font-sans text-xs">
                      {categoryOptions.map(cat => {
                        const catRev = metrics.categoryRevenue?.[cat] || 0;
                        const maxRev = Math.max(...Object.values(metrics.categoryRevenue || {}), 1);
                        const percentage = Math.round((catRev / maxRev) * 100);
                        return (
                          <div key={cat} className="space-y-1.5">
                            <div className="flex justify-between font-medium">
                              <span className="text-stone-700">{cat}</span>
                              <span className="font-bold text-stone-950">₹{catRev}</span>
                            </div>
                            <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                              <div 
                                style={{ width: `${percentage}%` }}
                                className="h-full bg-gradient-to-r from-amber-500 to-[#EA580C] rounded-full"
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Combined Recent Activities Log Feed */}
                  <div className="bg-white p-6 rounded-2xl border border-stone-200/50 shadow-sm space-y-4">
                    <h3 className="font-cinzel font-bold text-sm text-stone-900">
                      {lang === 'hi' ? "हाल की गतिविधियां" : "Recent Activity Feed"}
                    </h3>
                    
                    <div className="divide-y divide-stone-100 font-sans text-xs max-h-96 overflow-y-auto pr-2">
                      {metrics.recentActivity && metrics.recentActivity.length > 0 ? (
                        metrics.recentActivity.map((act) => {
                          const isPurchase = act.type === 'purchase';
                          return (
                            <div key={act.id} className="py-3.5 flex justify-between items-start gap-4 hover:bg-stone-50/50 transition">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase ${
                                    isPurchase 
                                      ? 'bg-green-50 text-green-700 border border-green-200' 
                                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                                  }`}>
                                    {isPurchase ? (lang === 'hi' ? "बिक्री" : "Purchase") : (lang === 'hi' ? "डाउनलोड" : "Download")}
                                  </span>
                                  <span className="font-bold text-stone-800 font-mono">{act.userEmail}</span>
                                </div>
                                <p className="text-stone-600 font-medium">
                                  {isPurchase 
                                    ? (lang === 'hi' ? `ने खरीदा: ${act.productTitle}` : `purchased: ${act.productTitle}`)
                                    : (lang === 'hi' ? `ने डाउनलोड किया: ${act.productTitle}` : `downloaded: ${act.productTitle}`)}
                                </p>
                              </div>
                              <div className="text-right space-y-0.5 flex-shrink-0 font-medium">
                                {isPurchase && <span className="font-extrabold text-green-700 block">₹{act.amount}</span>}
                                <span className="text-[10px] text-stone-400 block">{new Date(act.timestamp).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-10 px-6 font-sans text-xs">
                          <ShieldAlert className="w-8 h-8 text-[#EA580C] mx-auto animate-pulse mb-2" />
                          <div className="font-bold text-stone-850 font-cinzel">No Analytics Data Available</div>
                          <div className="text-[10px] text-stone-400 mt-1">Waiting for user purchase or download activities to capture telemetry.</div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

            </div>
          )}

          {/* Product Catalog Tab Content */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-2xl border border-stone-200/50 overflow-hidden shadow-sm font-sans text-xs">
              <div className="p-4.5 bg-stone-50 border-b border-stone-150 flex justify-between items-center">
                <span className="font-cinzel font-bold text-sm text-stone-900">
                  {lang === 'hi' ? `उत्पाद सूची (${productsList.length} उत्पाद)` : `Products Inventory (${productsList.length} items)`}
                </span>
                <button 
                  onClick={startAddProduct}
                  className="px-3.5 py-1.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl font-bold transition duration-200 flex items-center gap-1 shadow-sm text-[10px] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? "उत्पाद जोड़ें" : "Add Product"}</span>
                </button>
              </div>

              {productsList.length === 0 ? (
                <div className="text-center py-16 px-6 bg-[#FCFAF7] rounded-xl border border-dashed border-stone-300 m-6 flex flex-col items-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400 border mb-3">
                    <FolderKanban className="w-6 h-6" />
                  </div>
                  <h4 className="font-cinzel font-bold text-stone-800 text-sm">
                    {lang === 'hi' ? "कोई उत्पाद उपलब्ध नहीं है" : "No Products Available"}
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm font-medium leading-relaxed">
                    {lang === 'hi'
                      ? "डेटाबेस में कोई उत्पाद नहीं मिला। नया वॉलपेपर उत्पाद जोड़ें पर जाकर उत्पाद अपलोड करें।"
                      : "No products found in the database. Go to the Upload Product tab to register your first wallpaper."}
                  </p>
                  <button 
                    onClick={startAddProduct}
                    className="mt-4 px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    {lang === 'hi' ? "उत्पाद जोड़ें" : "Upload Product"}
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50/50 border-b border-stone-100 text-stone-750 font-bold uppercase text-[9px] tracking-wider">
                        <th className="p-4">{lang === 'hi' ? "उत्पाद" : "Product"}</th>
                        <th className="p-4">{lang === 'hi' ? "श्रेणी" : "Category"}</th>
                        <th className="p-4">{lang === 'hi' ? "कीमत" : "Price"}</th>
                        <th className="p-4">{lang === 'hi' ? "स्थिति" : "Status"}</th>
                        <th className="p-4">{lang === 'hi' ? "विशेष (Featured)" : "Featured"}</th>
                        <th className="p-4 text-center">{lang === 'hi' ? "कार्रवाई" : "Actions"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-600 font-medium">
                      {productsList.map((prod) => (
                        <tr key={prod.id} className="hover:bg-stone-50/50 transition">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {/* Product thumbnail */}
                              <div className="w-12 h-12 bg-stone-50 rounded-xl border border-stone-200 overflow-hidden relative flex-shrink-0 flex items-center justify-center">
                                {prod.thumbnail && prod.thumbnail.startsWith('/uploads/') ? (
                                  <img src={`${BACKEND_URL}${prod.thumbnail}`} alt={prod.title} className="object-cover w-full h-full" />
                                ) : (
                                  <div className="text-[8px] text-center font-bold text-stone-400 p-1">No Image</div>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-stone-900 text-sm leading-normal">{prod.title}</div>
                                <div className="text-[10px] text-stone-400 font-mono mt-0.5">{prod.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-stone-750">{prod.category}</td>
                          <td className="p-4 font-bold text-[#EA580C]">₹{prod.price}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              prod.status === 'active' 
                                ? 'bg-green-50 text-green-700 border border-green-200' 
                                : 'bg-yellow-50 text-yellow-750 border border-yellow-200'
                            }`}>
                              {prod.status === 'active' ? (lang === 'hi' ? "सक्रिय" : "Active") : (lang === 'hi' ? "ड्राफ्ट" : "Draft")}
                            </span>
                          </td>
                          <td className="p-4">
                            {prod.featured ? (
                              <span className="text-amber-600 flex items-center gap-0.5 font-semibold">
                                <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                <span>Yes</span>
                              </span>
                            ) : (
                              <span className="text-stone-400">No</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setPreviewProduct(prod)}
                                title="Preview product card"
                                className="p-1.5 bg-stone-50 hover:bg-stone-100 text-stone-600 rounded-xl transition border border-stone-200 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => startEditProduct(prod)}
                                title="Edit product parameters"
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition border border-blue-200 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod.id)}
                                title="Delete product permanent"
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition border border-red-200 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Add / Edit Product Form Tab Content */}
          {activeTab === 'add-product' && (
            <div className="bg-white p-6 rounded-2xl border border-stone-200/50 shadow-sm font-sans text-xs sm:text-sm">
              <h3 className="font-cinzel text-sm sm:text-base font-bold text-stone-900 mb-6 flex items-center gap-2 border-b border-stone-100 pb-3">
                <Upload className="w-5 h-5 text-[#EA580C]" />
                {editingProduct ? (lang === 'hi' ? "उत्पाद संपादित करें" : "Edit Product Details") : t.adminUploadTab}
              </h3>

              {formSuccess && (
                <div className="p-3 bg-green-50 text-green-700 rounded-xl border border-green-200 flex items-center gap-2 mb-4 font-medium">
                  <Check className="w-4 h-4" />
                  <span>
                    {editingProduct 
                      ? (lang === 'hi' ? "उत्पाद सफलतापूर्वक अपडेट किया गया!" : "Product updated successfully!") 
                      : (lang === 'hi' ? "उत्पाद सफलतापूर्वक अपलोड किया गया!" : "Product registered successfully!")}
                  </span>
                </div>
              )}

              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-2 mb-4 font-medium">
                  <AlertCircle className="w-4 h-4" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleProductSubmit} className="space-y-5">
                <div className="space-y-1">
                  <label className="font-bold text-stone-600 block">{t.adminLabelTitle} *</label>
                  <input 
                    type="text" 
                    required
                    placeholder={lang === 'hi' ? "श्री राम जी भक्ति वॉलपेपर" : "Shri Ram Ji Divine Wallpaper"}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C] text-stone-850"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-600 block">{t.adminLabelDesc}</label>
                  <textarea 
                    rows="3"
                    placeholder="Enter detailed description of wallpaper/PDF package..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C] text-stone-850 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-stone-600 block">{t.adminLabelCategory} *</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C] text-stone-850 cursor-pointer"
                    >
                      {categoryOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-stone-600 block">{t.adminLabelPrice} *</label>
                    <input 
                      type="number" 
                      required
                      placeholder="108"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C] text-stone-850"
                    />
                  </div>
                </div>

                {/* Status and Featured toggles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="space-y-1 flex items-center justify-between">
                    <div>
                      <label className="font-bold text-stone-750 block">Featured Product</label>
                      <span className="text-[10px] text-stone-400 font-medium block mt-0.5">Display prominently on home</span>
                    </div>
                    <input 
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="w-4 h-4 text-[#EA580C] border-stone-300 rounded focus:ring-[#EA580C] accent-[#EA580C] cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1 flex items-center justify-between">
                    <div>
                      <label className="font-bold text-stone-750 block">Product Status</label>
                      <span className="text-[10px] text-stone-400 font-medium block mt-0.5">Draft is invisible on gallery</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStatus('active')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                          status === 'active' 
                            ? 'bg-green-50 text-green-700 border-green-300' 
                            : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus('draft')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                          status === 'draft' 
                            ? 'bg-yellow-50 text-yellow-750 border-yellow-300' 
                            : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        Draft
                      </button>
                    </div>
                  </div>
                </div>

                {/* File Upload System with previews */}
                <div className="space-y-4 border-t border-stone-100 pt-4">
                  <h4 className="font-cinzel font-bold text-stone-900 text-xs tracking-wider uppercase">Upload Assets & Content Packages</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Thumbnail preview upload */}
                    <div className="space-y-2">
                      <label className="font-bold text-stone-600 block flex items-center gap-1">
                        <ImageIcon className="w-4 h-4 text-[#EA580C]" />
                        <span>Preview Thumbnail Image {!editingProduct && '*'}</span>
                      </label>
                      <div className="p-4 border border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center text-center bg-stone-50/50">
                        {thumbnailFile ? (
                          <div className="relative w-20 h-20 bg-stone-50 border border-stone-200 rounded-xl overflow-hidden">
                            <img src={URL.createObjectURL(thumbnailFile)} alt="Thumb preview" className="object-cover w-full h-full" />
                            <button 
                              type="button"
                              onClick={() => setThumbnailFile(null)}
                              className="absolute top-0.5 right-0.5 p-0.5 bg-black/70 text-white rounded-full cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-stone-400 font-medium">Select Image (JPEG, PNG, WEBP, GIF, Max 5MB)</span>
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                          className="mt-2 text-[10px] text-stone-500 cursor-pointer"
                        />
                      </div>
                      {editingProduct && !thumbnailFile && (
                        <p className="text-[9px] text-stone-400 italic">Thumbnail currently set: {editingProduct.thumbnail}</p>
                      )}
                    </div>

                    {/* Product download file upload */}
                    <div className="space-y-2">
                      <label className="font-bold text-stone-600 block flex items-center gap-1">
                        <Download className="w-4 h-4 text-[#EA580C]" />
                        <span>Product Download Package {!editingProduct && '*'}</span>
                      </label>
                      <div className="p-4 border border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center text-center bg-stone-50/50 h-full justify-between py-5">
                        {productFile ? (
                          <div className="p-2 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-1.5 font-bold text-orange-700">
                            <span className="line-clamp-1 max-w-[150px]">{productFile.name}</span>
                            <button type="button" onClick={() => setProductFile(null)} className="cursor-pointer">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-stone-400 font-medium">Select PDF, ZIP, or Image (Max 50MB)</span>
                        )}
                        <input 
                          type="file" 
                          accept=".zip,.pdf,image/*"
                          onChange={(e) => setProductFile(e.target.files?.[0] || null)}
                          className="mt-2 text-[10px] text-stone-500 cursor-pointer"
                        />
                      </div>
                      {editingProduct && !productFile && (
                        <p className="text-[9px] text-stone-400 italic">Download package currently set: {editingProduct.file_path}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upload progress bar */}
                {formLoading && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-bold text-xs text-[#EA580C]">
                      <span>Uploading files to secure vault...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-50 rounded-full overflow-hidden border border-stone-100">
                      <div 
                        style={{ width: `${uploadProgress}%` }}
                        className="h-full bg-gradient-to-r from-amber-500 via-[#EA580C] to-orange-700 rounded-full transition-all duration-300 animate-pulse"
                      ></div>
                    </div>
                  </div>
                )}

                {/* Submit actions */}
                <div className="flex gap-3 pt-2">
                  {editingProduct && (
                    <button 
                      type="button"
                      onClick={startAddProduct}
                      className="w-1/2 py-2.5 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold rounded-xl text-xs transition border border-stone-250 cursor-pointer"
                    >
                      Cancel Edit Mode
                    </button>
                  )}
                  
                  <button 
                    type="submit"
                    disabled={formLoading}
                    className={`py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold rounded-xl shadow transition focus:outline-none flex items-center justify-center gap-1.5 shimmer-btn cursor-pointer ${
                      editingProduct ? 'w-1/2' : 'w-full'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>
                      {formLoading 
                        ? (lang === 'hi' ? "सहेजा जा रहा है..." : "Processing upload...") 
                        : editingProduct 
                          ? (lang === 'hi' ? "उत्पाद परिवर्तन सहेजें" : "Save Changes") 
                          : t.adminUploadBtn}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Manage Users Tab Content */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl border border-stone-200/50 overflow-hidden shadow-sm font-sans text-xs">
              <div className="p-4.5 bg-stone-50 border-b border-stone-150 font-bold text-stone-900 flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-[#EA580C]" />
                <span>Registered Devotees List</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100 text-stone-700 font-bold uppercase text-[9px] tracking-wider">
                      <th className="p-4">{t.adminTableName}</th>
                      <th className="p-4">{t.adminTableEmail}</th>
                      <th className="p-4">{t.adminTableDeviceCount}</th>
                      <th className="p-4">{t.adminTableStatus}</th>
                      <th className="p-4">{t.adminTableAction}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-600 font-medium">
                    {usersList.map((usr) => (
                      <tr key={usr.id} className="hover:bg-stone-50/50 transition">
                        <td className="p-4 font-bold text-stone-900">{usr.name} {usr.role === 'admin' && '⭐'}</td>
                        <td className="p-4 text-stone-500 font-mono">{usr.email}</td>
                        <td className="p-4 text-stone-500">
                          {usr.devices?.length || 0} / 3 Devices
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
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
                              className={`flex items-center gap-1.5 py-1.5 px-3.5 border rounded-xl font-bold transition focus:outline-none cursor-pointer ${
                                usr.status === 'active' 
                                  ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-100' 
                                  : 'bg-green-50 hover:bg-green-100 text-green-600 border-green-100'
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

          {/* Audit Logs Tab Content */}
          {activeTab === 'audits' && (
            <div className="grid grid-cols-1 gap-6 font-sans text-xs">
              
              {/* Downloads Audit */}
              <div className="bg-white rounded-2xl border border-stone-200/50 overflow-hidden shadow-sm">
                <div className="p-4.5 bg-stone-50 border-b border-stone-150 font-bold text-stone-900 flex items-center gap-2">
                  <Download className="w-4.5 h-4.5 text-[#EA580C]" />
                  <span>Sticker Downloads Security Audit Trails</span>
                </div>
                {auditLogs.downloads.length === 0 ? (
                  <div className="text-center py-12 px-6 bg-[#FCFAF7] rounded-xl border border-dashed border-stone-300 m-4 flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400 border mb-3">
                      <Download className="w-6 h-6" />
                    </div>
                    <h4 className="font-cinzel font-bold text-stone-800 text-sm">
                      {lang === 'hi' ? "कोई डाउनलोड नहीं" : "No Downloads Yet"}
                    </h4>
                    <p className="text-xs text-stone-500 mt-1">
                      {lang === 'hi' ? "उपयोगकर्ताओं द्वारा कोई डाउनलोड नहीं किया गया है।" : "No downloads have been recorded on the platform yet."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-100 text-stone-700 font-bold uppercase text-[9px] tracking-wider">
                          <th className="p-3">{t.adminTableEmail}</th>
                          <th className="p-3">{lang === 'hi' ? "उत्पाद" : "Sticker Pack"}</th>
                          <th className="p-3">{t.adminLogHeaderIP}</th>
                          <th className="p-3">{t.adminLogHeaderDevice}</th>
                          <th className="p-3">{t.adminLogHeaderTime}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-stone-600 font-medium">
                        {auditLogs.downloads.map((log) => (
                          <tr key={log.id} className="hover:bg-stone-50/50 transition">
                            <td className="p-3 text-stone-900 font-bold font-mono">{log.userEmail}</td>
                            <td className="p-3 text-stone-850 font-bold">{log.productTitle}</td>
                            <td className="p-3 text-stone-400 font-mono">{log.ip_address}</td>
                            <td className="p-3 text-stone-400 font-mono">{log.device_id}</td>
                            <td className="p-3 text-stone-500">{new Date(log.download_time).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Transactions Ledger */}
              <div className="bg-white rounded-2xl border border-stone-200/50 overflow-hidden shadow-sm">
                <div className="p-4.5 bg-stone-50 border-b border-stone-150 font-bold text-stone-900 flex items-center gap-2">
                  <ShoppingBag className="w-4.5 h-4.5 text-[#EA580C]" />
                  <span>Order Transactions Ledgers</span>
                </div>
                {auditLogs.orders.length === 0 ? (
                  <div className="text-center py-12 px-6 bg-[#FCFAF7] rounded-xl border border-dashed border-stone-300 m-4 flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400 border mb-3">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <h4 className="font-cinzel font-bold text-stone-800 text-sm">
                      {lang === 'hi' ? "कोई ऑर्डर नहीं" : "No Orders Yet"}
                    </h4>
                    <p className="text-xs text-stone-500 mt-1">
                      {lang === 'hi' ? "प्लेटफ़ॉर्म पर अभी तक कोई ऑर्डर दर्ज नहीं किया गया है।" : "No transactions have been recorded on the platform yet."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-100 text-stone-700 font-bold uppercase text-[9px] tracking-wider">
                          <th className="p-3">{t.adminTableEmail}</th>
                          <th className="p-3">{lang === 'hi' ? "उत्पाद" : "Sticker Pack"}</th>
                          <th className="p-3">{lang === 'hi' ? "कीमत" : "Price"}</th>
                          <th className="p-3">Transaction ID</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-stone-600 font-medium">
                        {auditLogs.orders.map((log) => (
                          <tr key={log.id} className="hover:bg-stone-50/50 transition">
                            <td className="p-3 text-stone-900 font-bold font-mono">{log.userEmail}</td>
                            <td className="p-3 text-stone-850 font-bold">{log.productTitle}</td>
                            <td className="p-3 font-bold text-[#EA580C]">₹{log.price}</td>
                            <td className="p-3 text-stone-400 font-mono">{log.payment_id || 'PENDING'}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold capitalize ${
                                log.payment_status === 'paid' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-750 border border-yellow-250'
                              }`}>
                                {log.payment_status}
                              </span>
                            </td>
                            <td className="p-3 text-stone-500">{new Date(log.purchase_date).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

        </main>
      </div>

      {/* Product Preview Modal */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-sm w-full rounded-2xl border border-stone-200 overflow-hidden shadow-2xl relative">
            <div className="temple-border-top"></div>
            
            <button 
              onClick={() => setPreviewProduct(null)}
              className="absolute top-2.5 right-2.5 z-20 p-2 bg-white/95 rounded-full border border-stone-200 shadow-sm hover:scale-105 transition cursor-pointer"
            >
              <X className="w-4 h-4 text-stone-600" />
            </button>

            {/* Simulated temple card wrapper */}
            <div className="p-5 font-sans relative">
              <div className="absolute top-2.5 left-2.5 z-10 bg-[#EA580C] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-lg shadow-sm border border-white/20">
                {previewProduct.category}
              </div>

              {/* Card Image */}
              <div className="rounded-xl overflow-hidden border border-stone-200 relative mb-4">
                {previewProduct.thumbnail && previewProduct.thumbnail.startsWith('/uploads/') ? (
                  <img src={`${BACKEND_URL}${previewProduct.thumbnail}`} alt={previewProduct.title} className="w-full h-44 object-cover" />
                ) : (
                  getCategoryImage(previewProduct.category)
                )}
              </div>

              {/* Title & description */}
              <div className="space-y-2 text-xs">
                <h3 className="font-bold text-stone-900 text-base line-clamp-1">{previewProduct.title}</h3>
                <p className="text-stone-500 line-clamp-3 min-h-[3rem] leading-relaxed font-medium">{previewProduct.description}</p>
                
                <div className="flex justify-between items-center pt-2.5 border-t border-stone-100">
                  <span className="font-extrabold text-sm text-[#EA580C]">₹{previewProduct.price}</span>
                  <button type="button" className="px-3.5 py-2 bg-[#EA580C] text-white font-bold rounded-lg shadow-sm text-[10px] hover:bg-[#C2410C] transition shimmer-btn cursor-pointer">
                    {t.buyNow}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
