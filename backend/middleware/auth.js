const jwt = require('jsonwebtoken');
const db = require('../db');

module.exports = async (req, res, next) => {
  try {
    // 1. Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'लॉगिन आवश्यक है / Authentication required',
        message_en: 'Authentication required'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'sumity_spiritual_sticker_marketplace_secret_key_108');
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'अमान्य टोकन / Invalid or expired token',
        message_en: 'Invalid or expired token'
      });
    }

    // 2. Fetch user details and check status
    const user = await db.User.findOne({ id: decoded.userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'उपयोगकर्ता नहीं मिला / User not found',
        message_en: 'User not found'
      });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({
        success: false,
        message: 'आपका खाता निलंबित कर दिया गया है। कृपया सहायता से संपर्क करें।',
        message_en: 'Your account has been suspended. Please contact support.'
      });
    }

    // 3. Device identification and limits
    const deviceId = req.headers['x-device-id'] || 'web-default';
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    let userDevices = user.devices || [];
    let isNewDevice = !userDevices.includes(deviceId);
    let warningMessage = null;

    if (isNewDevice) {
      if (userDevices.length >= 3) {
        return res.status(403).json({
          success: false,
          message: 'अधिकतम डिवाइस सीमा (3) पार हो गई है। नया डिवाइस जोड़ने के लिए पहले वाले को हटाएं।',
          message_en: 'Maximum device limit (3) exceeded. Please remove a registered device to login here.',
          deviceLimitExceeded: true
        });
      }

      // Register new device
      userDevices.push(deviceId);
      await db.User.findByIdAndUpdate(user.id, { devices: userDevices });
      warningMessage = `नया डिवाइस पहचाना गया! यह 3 में से डिवाइस संख्या ${userDevices.length} है। / New device detected! Registered device ${userDevices.length} of 3.`;
    }

    // Attach user information and device metadata to request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      devices: userDevices
    };
    req.deviceId = deviceId;
    req.ipAddress = clientIp;
    req.deviceWarning = warningMessage;

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({
      success: false,
      message: 'सर्वर त्रुटि / Server error in authentication',
      message_en: 'Server error in authentication'
    });
  }
};
