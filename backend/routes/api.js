const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const auth = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'sumity_spiritual_sticker_marketplace_secret_key_108';

// Set up secure private storage folder for uploads
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}



// Configure Multer for secure and validated uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'thumbnail') {
      cb(null, path.join(UPLOADS_DIR, 'images'));
    } else {
      cb(null, path.join(UPLOADS_DIR, 'pdfs'));
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB maximum file size
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'thumbnail') {
      const allowedImgTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (allowedImgTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Thumbnail must be a valid image (JPEG, PNG, WEBP, GIF)'));
      }
    } else if (file.fieldname === 'productFile') {
      const allowedDocTypes = [
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed',
        'image/jpeg',
        'image/png',
        'image/webp'
      ];
      if (allowedDocTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Product file must be a PDF, ZIP or Image'));
      }
    } else {
      cb(null, true);
    }
  }
});

const cpUpload = (req, res, next) => {
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'productFile', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// Register
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, deviceId } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'सभी फ़ील्ड आवश्यक हैं / All fields are required',
        message_en: 'All fields are required'
      });
    }

    const existingUser = await db.User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'यह ईमेल पहले से पंजीकृत है / Email already registered',
        message_en: 'Email already registered'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const devicesList = deviceId ? [deviceId] : [];
    const newUser = await db.User.create({
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      facebook_id: null,
      google_id: null,
      devices: devicesList,
      status: 'active',
      role: 'user'
    });

    const token = jwt.sign({ userId: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      success: true,
      message: 'पंजीकरण सफल! / Registration successful!',
      message_en: 'Registration successful!',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        devices: newUser.devices
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'रजिस्टर करने में विफल / Registration failed', message_en: 'Registration failed' });
  }
});

// Login (Passwordless)
router.post('/auth/login', async (req, res) => {
  try {
    const { email, deviceId } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'ईमेल आवश्यक है / Email is required',
        message_en: 'Email is required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const isAdminEmail = normalizedEmail === 'admin@sumity.com' || normalizedEmail === 'admin@bhaktichitra.com';

    let user = await db.User.findOne({ email: normalizedEmail });
    let firebaseCustomToken = null;

    if (db.isFirebase) {
      const admin = require('firebase-admin');
      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(normalizedEmail);
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          // Auto-register in Firebase Auth
          userRecord = await admin.auth().createUser({
            email: normalizedEmail,
            emailVerified: true,
            displayName: normalizedEmail.split('@')[0]
          });
        } else {
          throw err;
        }
      }

      // Sync user into Firestore
      if (!user) {
        const devicesList = deviceId ? [deviceId] : [];
        let name = normalizedEmail.split('@')[0];
        name = name.charAt(0).toUpperCase() + name.slice(1);
        if (isAdminEmail) name = 'Bhakti Chitra Admin';

        user = await db.User.create({
          id: userRecord.uid, // Map Firestore doc id and id to Firebase Auth UID
          name: name,
          email: normalizedEmail,
          password: null,
          facebook_id: null,
          google_id: null,
          devices: devicesList,
          status: 'active',
          role: isAdminEmail ? 'admin' : 'user'
        });
      } else {
        // Check if user status is disabled
        if (user.status === 'disabled') {
          return res.status(403).json({
            success: false,
            message: 'आपका खाता निलंबित है / Your account is suspended',
            message_en: 'Your account is suspended'
          });
        }

        // Promote to admin if email matches
        if (isAdminEmail && user.role !== 'admin') {
          user = await db.User.findByIdAndUpdate(user.id, { role: 'admin' });
        }

        // Device validation
        let devices = user.devices || [];
        let isNewDevice = deviceId && !devices.includes(deviceId);

        if (isNewDevice) {
          if (devices.length >= 3) {
            return res.status(403).json({
              success: false,
              message: 'डिवाइस सीमा पार हो गई है (अधिकतम 3) / Device limit exceeded (Max 3)',
              message_en: 'Device limit exceeded (Max 3)',
              deviceLimitExceeded: true
            });
          }
          devices.push(deviceId);
          await db.User.findByIdAndUpdate(user.id, { devices });
        }
      }

      // Generate a secure Custom Token for Firebase Client SDK login if needed
      firebaseCustomToken = await admin.auth().createCustomToken(userRecord.uid);
    } else {
      // Fallback Database Flow
      if (!user) {
        // Auto-register user since they don't exist
        const devicesList = deviceId ? [deviceId] : [];
        let name = email.split('@')[0];
        name = name.charAt(0).toUpperCase() + name.slice(1);
        if (isAdminEmail) name = 'Bhakti Chitra Admin';

        user = await db.User.create({
          id: uuidv4(),
          name: name,
          email: normalizedEmail,
          password: null,
          facebook_id: null,
          google_id: null,
          devices: devicesList,
          status: 'active',
          role: isAdminEmail ? 'admin' : 'user'
        });
      } else {
        // Check if user status is disabled
        if (user.status === 'disabled') {
          return res.status(403).json({
            success: false,
            message: 'आपका खाता निलंबित है / Your account is suspended',
            message_en: 'Your account is suspended'
          });
        }

        // Promote to admin if email matches
        if (isAdminEmail && user.role !== 'admin') {
          user = await db.User.findByIdAndUpdate(user.id, { role: 'admin' });
        }

        // Device validation
        let devices = user.devices || [];
        let isNewDevice = deviceId && !devices.includes(deviceId);

        if (isNewDevice) {
          if (devices.length >= 3) {
            return res.status(403).json({
              success: false,
              message: 'डिवाइस सीमा पार हो गई है (अधिकतम 3) / Device limit exceeded (Max 3)',
              message_en: 'Device limit exceeded (Max 3)',
              deviceLimitExceeded: true
            });
          }
          devices.push(deviceId);
          await db.User.findByIdAndUpdate(user.id, { devices });
        }
      }
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    const finalDevices = user.devices || [];

    res.json({
      success: true,
      message: 'लॉगिन सफल! / Login successful!',
      message_en: 'Login successful!',
      token,
      firebaseCustomToken,
      warning: finalDevices.length > 0 && deviceId && !finalDevices.includes(deviceId) ? `नया डिवाइस पंजीकृत: 3 में से ${finalDevices.length}` : null,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        devices: finalDevices
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'लॉगिन विफल / Login failed', message_en: 'Login failed' });
  }
});

// Social Login Mock
router.post('/auth/social-login', async (req, res) => {
  try {
    const { name, email, socialId, provider, deviceId } = req.body;
    if (!email || !socialId) {
      return res.status(400).json({
        success: false,
        message: 'अमान्य डेटा / Invalid social data',
        message_en: 'Invalid social data'
      });
    }

    let user = await db.User.findOne({ email });

    if (!user) {
      // Create user
      user = await db.User.create({
        id: uuidv4(),
        name,
        email,
        password: null,
        facebook_id: provider === 'facebook' ? socialId : null,
        google_id: provider === 'google' ? socialId : null,
        devices: deviceId ? [deviceId] : [],
        status: 'active',
        role: 'user'
      });
    } else {
      // Connect provider
      const update = {};
      if (provider === 'facebook') update.facebook_id = socialId;
      if (provider === 'google') update.google_id = socialId;

      let devices = user.devices || [];
      if (deviceId && !devices.includes(deviceId)) {
        if (devices.length >= 3) {
          return res.status(403).json({
            success: false,
            message: 'डिवाइस सीमा पार हो गई है (अधिकतम 3) / Device limit exceeded (Max 3)',
            message_en: 'Device limit exceeded (Max 3)',
            deviceLimitExceeded: true
          });
        }
        devices.push(deviceId);
        update.devices = devices;
      }
      user = await db.User.findByIdAndUpdate(user.id, update);
    }

    if (user.status === 'disabled') {
      return res.status(403).json({
        success: false,
        message: 'आपका खाता निलंबित है / Your account is suspended',
        message_en: 'Your account is suspended'
      });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      message: 'सोशल लॉगिन सफल! / Social Login successful!',
      message_en: 'Social Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        devices: user.devices
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'सोशल लॉगिन विफल / Social Login failed', message_en: 'Social Login failed' });
  }
});

// Remove registered device from user account
router.post('/auth/devices/remove', auth, async (req, res) => {
  try {
    const { deviceToRemove } = req.body;
    const user = await db.User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const updatedDevices = user.devices.filter(d => d !== deviceToRemove);
    await db.User.findByIdAndUpdate(user.id, { devices: updatedDevices });

    res.json({
      success: true,
      message: 'डिवाइस सफलतापूर्वक हटा दिया गया / Device removed successfully',
      message_en: 'Device removed successfully',
      devices: updatedDevices
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error removing device' });
  }
});

// Admin Login (Secure with Password Check)
router.post('/auth/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'ईमेल और पासवर्ड आवश्यक हैं / Email and password are required',
        message_en: 'Email and password are required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.User.findOne({ email: normalizedEmail });

    if (!user || user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'अमान्य एडमिन क्रेडेंशियल / Invalid admin credentials',
        message_en: 'Invalid admin credentials'
      });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({
        success: false,
        message: 'आपका खाता निलंबित है / Your account is suspended',
        message_en: 'Your account is suspended'
      });
    }

    // Verify hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'अमान्य एडमिन क्रेडेंशियल / Invalid admin credentials',
        message_en: 'Invalid admin credentials'
      });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      message: 'एडमिन लॉगिन सफल! / Admin login successful!',
      message_en: 'Admin login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'एडमिन लॉगिन विफल / Admin login failed', message_en: 'Admin login failed' });
  }
});

// ==========================================
// 2. PRODUCT ENDPOINTS
// ==========================================

// Get all products (Public: active only, support category & featured filters)
router.get('/products', async (req, res) => {
  try {
    const { category, search, featured } = req.query;
    let filter = { status: 'active' };
    
    if (category && category !== 'All') {
      filter.category = category;
    }
    
    if (featured === 'true') {
      filter.featured = true;
    }

    let products = await db.Product.find(filter);

    // Apply client side search logic on title/description if query set
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'उत्पाद लोड करने में विफल / Failed to fetch products' });
  }
});

// Get single product (Public: active only, unless requester is Admin)
router.get('/products/:id', async (req, res) => {
  try {
    const product = await db.Product.findOne({ id: req.params.id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'उत्पाद नहीं मिला / Product not found' });
    }
    
    // Check if the product is draft and restrict access
    if (product.status === 'draft') {
      let isAdmin = false;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          if (decoded && decoded.role === 'admin') {
            isAdmin = true;
          }
        } catch (e) {}
      }
      if (!isAdmin) {
        return res.status(404).json({ success: false, message: 'उत्पाद नहीं मिला / Product not found' });
      }
    }
    
    res.json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching product details' });
  }
});

// ==========================================
// 3. ORDERS & CHECOUT FLOWS (MOCKED PAYMENTS)
// ==========================================

// Simulate Razorpay/Stripe checkout checkout
router.post('/orders/checkout', auth, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID required' });
    }

    const product = await db.Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if product is already purchased by this user
    const existingOrder = await db.Order.findOne({
      user_id: req.user.id,
      product_id: productId,
      payment_status: 'paid'
    });
    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: 'यह उत्पाद पहले से ही खरीदा गया है / Product already purchased',
        message_en: 'Product already purchased'
      });
    }

    // Create a new pending order
    const orderId = 'ord-' + uuidv4().substring(0, 8);
    const newOrder = await db.Order.create({
      id: orderId,
      user_id: req.user.id,
      product_id: productId,
      payment_status: 'pending',
      payment_id: null,
      purchase_date: new Date().toISOString()
    });

    res.json({
      success: true,
      order: newOrder,
      product: {
        title: product.title,
        price: product.price
      },
      message: 'भुगतान प्रक्रिया आरंभ की गई / Checkout initiated'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Checkout failure' });
  }
});

// Verify payment hook
router.post('/orders/verify', auth, async (req, res) => {
  try {
    const { orderId, successState } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const order = await db.Order.findOne({ id: orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (successState === false) {
      return res.json({ success: false, message: 'भुगतान विफल रहा / Payment failed' });
    }

    // Simulate successful payment verification (e.g. Razorpay signature checks)
    const paymentId = 'pay_' + Math.random().toString(36).substring(2, 11).toUpperCase();
    await db.Order.findByIdAndUpdate(order.id, {
      payment_status: 'paid',
      payment_id: paymentId,
      purchase_date: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'भुगतान सफल! आपकी खरीद पूरी हो गई है। / Payment successful! Purchase completed.',
      message_en: 'Payment successful! Purchase completed.',
      paymentId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
});

// User purchases list
router.get('/dashboard/purchases', auth, async (req, res) => {
  try {
    const orders = await db.Order.find({ user_id: req.user.id, payment_status: 'paid' });
    
    // Fetch product details for each purchased item
    const purchasedProducts = [];
    for (let order of orders) {
      const product = await db.Product.findOne({ id: order.product_id });
      if (product) {
        purchasedProducts.push({
          orderId: order.id,
          purchaseDate: order.purchase_date,
          paymentId: order.payment_id,
          product
        });
      }
    }

    res.json({ success: true, purchases: purchasedProducts, deviceWarning: req.deviceWarning });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Purchases loading failed' });
  }
});

// User download history
router.get('/dashboard/downloads', auth, async (req, res) => {
  try {
    const downloads = await db.Download.find({ user_id: req.user.id });
    
    const populatedDownloads = [];
    for (let log of downloads) {
      const product = await db.Product.findOne({ id: log.product_id });
      populatedDownloads.push({
        ...log,
        productTitle: product ? product.title : 'Unknown Product'
      });
    }

    res.json({ success: true, downloads: populatedDownloads });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Downloads loading failed' });
  }
});

// ==========================================
// 4. SECURE DOWNLOAD ENDPOINTS
// ==========================================

// Request a secure temporary link (expires in 5 minutes)
router.post('/downloads/request-link', auth, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID required' });
    }

    // 1. Verify user purchased this product
    const order = await db.Order.findOne({
      user_id: req.user.id,
      product_id: productId,
      payment_status: 'paid'
    });

    if (!order && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'डाउनलोड करने के लिए पहले उत्पाद खरीदना आवश्यक है / Product purchase required to download',
        message_en: 'Product purchase required to download'
      });
    }

    // 2. Generate secure token containing required session parameters
    const tempToken = jwt.sign(
      {
        userId: req.user.id,
        productId: productId,
        deviceId: req.deviceId,
        ipAddress: req.ipAddress
      },
      JWT_SECRET,
      { expiresIn: '5m' } // 5-minute link expiration
    );

    res.json({
      success: true,
      downloadUrl: `/api/downloads/file/${tempToken}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Temporary link generation failed' });
  }
});

// Stream file securely, verifying the temporary token
router.get('/downloads/file/:token', async (req, res) => {
  try {
    const { token } = req.params;
    let payload;

    // Verify token expiration and signature
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(403).send('Link has expired or is invalid. Please generate a new link from your dashboard (यह लिंक समाप्त हो गया है। कृपया नया लिंक बनाएं).');
    }

    const { userId, productId, deviceId, ipAddress } = payload;

    // Make sure user account is not disabled
    const user = await db.User.findOne({ id: userId });
    if (!user || user.status === 'disabled') {
      return res.status(403).send('Access Denied (अधिकार नहीं है)');
    }

    // Fetch the product to identify the actual file on server storage
    const product = await db.Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).send('Product not found.');
    }

    // Capture the client request details during execution
    const requestDeviceId = req.headers['x-device-id'] || deviceId;
    const requestIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    // Verify user device limit is not exceeded during download action
    if (user.devices && user.devices.length > 3) {
       return res.status(403).send('Device limit exceeded.');
    }

    // Write download tracking audit log
    await db.Download.create({
      id: uuidv4(),
      user_id: userId,
      product_id: productId,
      device_id: requestDeviceId,
      ip_address: requestIp,
      download_time: new Date().toISOString()
    });

    let fileLoc = path.join(UPLOADS_DIR, 'pdfs', product.file_path);
    if (!fs.existsSync(fileLoc)) {
      fileLoc = path.join(UPLOADS_DIR, product.file_path);
    }

    if (!fs.existsSync(fileLoc)) {
      return res.status(404).send('File is temporarily unavailable. Please contact Admin.');
    }

    // Stream download directly to response. Prevents exposing direct static links or folders
    const cleanFilename = product.title.replace(/[^a-zA-Z0-9]/g, '_') + '.zip';
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"`);
    res.setHeader('Content-Type', 'application/zip');

    const fileStream = fs.createReadStream(fileLoc);
    fileStream.pipe(res);

  } catch (err) {
    console.error('File download processing error:', err);
    res.status(500).send('Internal Server Error.');
  }
});

// ==========================================
// 5. ADMIN DASHBOARD ENDPOINTS
// ==========================================

// Middleware for Admin only
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'एडमिन एक्सेस आवश्यक है / Admin access required' });
  }
  next();
};

// Admin metrics summary
router.get('/admin/metrics', auth, adminOnly, async (req, res) => {
  try {
    const users = await db.User.find();
    const orders = await db.Order.find({ payment_status: 'paid' });
    const downloads = await db.Download.find();
    const products = await db.Product.find();

    const revenue = orders.reduce((sum, order) => {
      const prod = products.find(p => p.id === order.product_id);
      return sum + (prod ? prod.price : 0);
    }, 0);

    // Calculate category-wise revenue
    const categoryRevenue = {};
    orders.forEach(order => {
      const prod = products.find(p => p.id === order.product_id);
      if (prod) {
        const cat = prod.category;
        categoryRevenue[cat] = (categoryRevenue[cat] || 0) + prod.price;
      }
    });

    // Recent Activity list (Combined chronologically)
    const recentActivity = [];
    orders.forEach(o => {
      const user = users.find(u => u.id === o.user_id);
      const prod = products.find(p => p.id === o.product_id);
      recentActivity.push({
        type: 'purchase',
        id: o.id,
        userEmail: user ? user.email : 'Unknown User',
        productTitle: prod ? prod.title : 'Deleted Product',
        amount: prod ? prod.price : 0,
        timestamp: o.purchase_date
      });
    });

    downloads.forEach(d => {
      const user = users.find(u => u.id === d.user_id);
      const prod = products.find(p => p.id === d.product_id);
      recentActivity.push({
        type: 'download',
        id: d.id,
        userEmail: user ? user.email : 'Unknown User',
        productTitle: prod ? prod.title : 'Deleted Product',
        timestamp: d.download_time
      });
    });

    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      metrics: {
        totalUsers: users.length,
        totalSales: orders.length,
        totalDownloads: downloads.length,
        totalRevenue: revenue,
        totalProducts: products.length,
        categoryRevenue,
        recentActivity: recentActivity.slice(0, 10)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch admin metrics' });
  }
});

// List users for admin control
router.get('/admin/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await db.User.find();
    // Exclude password hashes
    const secureUsersList = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      devices: u.devices,
      status: u.status,
      role: u.role,
      created_at: u.created_at
    }));
    res.json({ success: true, users: secureUsersList });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to retrieve users' });
  }
});

// Change user status (enable/disable suspicious accounts)
router.put('/admin/users/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updatedUser = await db.User.findByIdAndUpdate(req.params.id, { status });
    if (!updatedUser) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      message: `उपयोगकर्ता स्थिति को अपडेट कर दिया गया है / User status updated to ${status}`,
      user: { id: updatedUser.id, status }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to change user status' });
  }
});

// Fetch all audit logs (orders & download histories)
router.get('/admin/logs', auth, adminOnly, async (req, res) => {
  try {
    const downloads = await db.Download.find();
    const orders = await db.Order.find();
    
    const logs = {
      downloads: [],
      orders: []
    };

    const users = await db.User.find();
    const products = await db.Product.find();

    downloads.forEach(d => {
      const user = users.find(u => u.id === d.user_id);
      const product = products.find(p => p.id === d.product_id);
      logs.downloads.push({
        id: d.id,
        userEmail: user ? user.email : 'Unknown User',
        productTitle: product ? product.title : 'Deleted Product',
        device_id: d.device_id,
        ip_address: d.ip_address,
        download_time: d.download_time
      });
    });

    orders.forEach(o => {
      const user = users.find(u => u.id === o.user_id);
      const product = products.find(p => p.id === o.product_id);
      logs.orders.push({
        id: o.id,
        userEmail: user ? user.email : 'Unknown User',
        productTitle: product ? product.title : 'Deleted Product',
        price: product ? product.price : 0,
        payment_status: o.payment_status,
        payment_id: o.payment_id,
        purchase_date: o.purchase_date
      });
    });

    // Sort descending by dates
    logs.downloads.sort((a, b) => new Date(b.download_time) - new Date(a.download_time));
    logs.orders.sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date));

    res.json({ success: true, logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Logs fetch failure' });
  }
});

// Admin upload products & stickers (supports multiple file fields and validation)
router.post('/admin/products', auth, adminOnly, cpUpload, async (req, res) => {
  try {
    const { title, description, category, price, featured, status } = req.body;
    
    // Input Validation
    if (!title || !category || price === undefined) {
      return res.status(400).json({ success: false, message: 'Title, Category, and Price are required' });
    }
    
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a positive number' });
    }
    
    const validCategories = [
      "Shri Ram", "Shri Krishna", "Mahadev", "Hanuman Ji", "Ganesh Ji", "Mata Rani", "Radha Krishna", "Spiritual Quotes"
    ];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category selected' });
    }

    // Retrieve uploaded files
    const thumbnailFile = req.files && req.files.thumbnail ? req.files.thumbnail[0] : null;
    const productFile = req.files && req.files.productFile ? req.files.productFile[0] : null;

    if (!thumbnailFile) {
      return res.status(400).json({ success: false, message: 'Product preview thumbnail image is required' });
    }
    if (!productFile) {
      return res.status(400).json({ success: false, message: 'Product download file is required' });
    }

    const newProduct = await db.Product.create({
      id: 'prod-' + uuidv4().substring(0, 8),
      title: title.trim(),
      description: description ? description.trim() : 'Premium Hindu God and Goddess High Resolution Devotional Stickers and Art Package.',
      category,
      price: parsedPrice,
      thumbnail: `/uploads/images/${thumbnailFile.filename}`,
      file_path: productFile.filename,
      featured: featured === 'true' || featured === true,
      status: status === 'draft' ? 'draft' : 'active'
    });

    res.status(201).json({
      success: true,
      message: 'उत्पाद सफलतापूर्वक अपलोड किया गया / Product uploaded successfully',
      product: newProduct
    });

  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ success: false, message: 'Product upload failed' });
  }
});

// Admin edit product
router.put('/admin/products/:id', auth, adminOnly, cpUpload, async (req, res) => {
  try {
    const { title, description, category, price, featured, status } = req.body;
    const { id } = req.params;

    const product = await db.Product.findOne({ id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Input Validation
    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (category !== undefined) {
      const validCategories = [
        "Shri Ram", "Shri Krishna", "Mahadev", "Hanuman Ji", "Ganesh Ji", "Mata Rani", "Radha Krishna", "Spiritual Quotes"
      ];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ success: false, message: 'Invalid category' });
      }
      updates.category = category;
    }
    if (price !== undefined) {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ success: false, message: 'Price must be a positive number' });
      }
      updates.price = parsedPrice;
    }
    if (featured !== undefined) {
      updates.featured = featured === 'true' || featured === true;
    }
    if (status !== undefined) {
      if (!['active', 'draft'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      updates.status = status;
    }

    // Manage file updates
    const thumbnailFile = req.files && req.files.thumbnail ? req.files.thumbnail[0] : null;
    const productFile = req.files && req.files.productFile ? req.files.productFile[0] : null;

    if (thumbnailFile) {
      // Delete old thumbnail if it was uploaded (starts with /uploads/images/)
      if (product.thumbnail && product.thumbnail.startsWith('/uploads/images/')) {
        const oldThumbPath = path.join(UPLOADS_DIR, 'images', path.basename(product.thumbnail));
        if (fs.existsSync(oldThumbPath)) {
          fs.unlinkSync(oldThumbPath);
        }
      }
      updates.thumbnail = `/uploads/images/${thumbnailFile.filename}`;
    }

    if (productFile) {
      // Delete old product file from pdfs folder
      const oldFilePath = path.join(UPLOADS_DIR, 'pdfs', product.file_path);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      } else {
        // Check root uploads path as fallback
        const fallbackOldPath = path.join(UPLOADS_DIR, product.file_path);
        if (fs.existsSync(fallbackOldPath)) {
          fs.unlinkSync(fallbackOldPath);
        }
      }
      updates.file_path = productFile.filename;
    }

    const updatedProduct = await db.Product.findByIdAndUpdate(product.id, updates);

    res.json({
      success: true,
      message: 'उत्पाद सफलतापूर्वक अपडेट किया गया / Product updated successfully',
      product: { ...product, ...updates }
    });

  } catch (err) {
    console.error('Edit product error:', err);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

// Admin delete product
router.delete('/admin/products/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await db.Product.findOne({ id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Delete related files
    if (product.thumbnail && product.thumbnail.startsWith('/uploads/images/')) {
      const thumbPath = path.join(UPLOADS_DIR, 'images', path.basename(product.thumbnail));
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }
    }
    
    const filePath = path.join(UPLOADS_DIR, 'pdfs', product.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    } else {
      const fallbackPath = path.join(UPLOADS_DIR, product.file_path);
      if (fs.existsSync(fallbackPath)) {
        fs.unlinkSync(fallbackPath);
      }
    }

    await db.Product.deleteMany({ id });

    res.json({
      success: true,
      message: 'उत्पाद सफलतापूर्वक हटा दिया गया / Product deleted successfully'
    });

  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
});

// Admin list all products
router.get('/admin/products', auth, adminOnly, async (req, res) => {
  try {
    const products = await db.Product.find();
    res.json({ success: true, products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch admin products' });
  }
});

module.exports = router;
