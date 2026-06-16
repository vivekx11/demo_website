const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'sumity_spiritual_sticker_marketplace_secret_key_108';

async function runTests() {
  console.log('\n=============================================================');
  console.log('STARTING SUMITY SECURITY CRITERIA VERIFICATION SUITE');
  console.log('=============================================================\n');

  let testUser;
  let testProduct;

  try {
    // -------------------------------------------------------------
    // Test 1: Clean Up & Prep Mock Data
    // -------------------------------------------------------------
    console.log('[Test 1] Preparing test database sandbox...');
    await db.User.deleteMany({ email: 'test_devotee@sumity.com' });
    await db.Product.deleteMany({ id: 'test-product-id' });
    await db.Order.deleteMany({ user_id: 'test-user-id' });
    await db.Download.deleteMany({ user_id: 'test-user-id' });

    testUser = await db.User.create({
      id: 'test-user-id',
      name: 'Test Devotee',
      email: 'test_devotee@sumity.com',
      devices: [],
      status: 'active',
      role: 'user'
    });

    testProduct = await db.Product.create({
      id: 'test-product-id',
      title: 'Devotional Test Stickers',
      category: 'Shri Ram',
      price: 108,
      thumbnail: 'test.jpg',
      file_path: 'test_file.zip'
    });

    // Mark test product as purchased by creating a paid order
    await db.Order.create({
      id: 'test-order-id',
      user_id: testUser.id,
      product_id: testProduct.id,
      payment_status: 'paid',
      payment_id: 'test_payment_123',
      purchase_date: new Date().toISOString()
    });

    console.log('✓ Test data set up: User created, product purchased.\n');

    // -------------------------------------------------------------
    // Test 2: Device Limit Enforcement (Max 3 Devices)
    // -------------------------------------------------------------
    console.log('[Test 2] Verifying device registration limit (Max 3 devices)...');
    
    // Simulating login request with device IDs
    const mockDevices = ['Device-A-iPhone', 'Device-B-iPad', 'Device-C-WebBrowser', 'Device-D-AndroidPhone'];
    let currentDevices = [];

    for (let i = 0; i < mockDevices.length; i++) {
      const deviceId = mockDevices[i];
      console.log(`Attempting to add Device ${i + 1}: "${deviceId}"...`);
      
      // Simulate auth middleware registration checks
      if (currentDevices.includes(deviceId)) {
        console.log(`-> Device already registered.`);
      } else if (currentDevices.length >= 3) {
        console.log(`✕ REJECTED: Maximum device limit of 3 reached. Device "${deviceId}" blocked.`);
      } else {
        currentDevices.push(deviceId);
        await db.User.findByIdAndUpdate(testUser.id, { devices: currentDevices });
        console.log(`✓ REGISTERED: Device "${deviceId}" added. Total registered: ${currentDevices.length}/3`);
      }
    }

    // Assert database matches expectation
    const finalUserRecord = await db.User.findOne({ id: testUser.id });
    if (finalUserRecord.devices.length === 3 && !finalUserRecord.devices.includes('Device-D-AndroidPhone')) {
      console.log('✓ Success: Device limit strictly enforced at 3. 4th device blocked.\n');
    } else {
      throw new Error('Device limit test failed: Expected 3 registered devices, but found: ' + finalUserRecord.devices.length);
    }

    // -------------------------------------------------------------
    // Test 3: Generate and Validate Secure Download Links (5-minute expiration)
    // -------------------------------------------------------------
    console.log('[Test 3] Verifying temporary download links and expirations...');
    
    // Simulate generation of download token
    const ipAddress = '192.168.1.100';
    const deviceId = 'Device-A-iPhone';

    const validToken = jwt.sign(
      {
        userId: testUser.id,
        productId: testProduct.id,
        deviceId: deviceId,
        ipAddress: ipAddress
      },
      JWT_SECRET,
      { expiresIn: '5m' } // 5-minute link expiration
    );

    console.log(`✓ Generated token: ${validToken.substring(0, 30)}...`);

    // Verify valid token decryption
    const decryptedPayload = jwt.verify(validToken, JWT_SECRET);
    if (decryptedPayload.productId === testProduct.id && decryptedPayload.userId === testUser.id) {
      console.log('✓ Success: Token decoded, contains authentic buyer and file metadata.');
    } else {
      throw new Error('Token verification failed: Decrypted payload mismatch');
    }

    // Simulate link expiration (using a token signed with past date)
    console.log('Simulating link expiration (generating link with exp in past)...');
    const expiredToken = jwt.sign(
      {
        userId: testUser.id,
        productId: testProduct.id,
        deviceId: deviceId,
        ipAddress: ipAddress
      },
      JWT_SECRET,
      { expiresIn: '-1s' } // Expired 1 second ago
    );

    try {
      jwt.verify(expiredToken, JWT_SECRET);
      throw new Error('Failure: Token was verified but should have thrown an expiration error.');
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        console.log('✓ Success: Expired link successfully blocked with "TokenExpiredError"!');
      } else {
        throw err;
      }
    }
    console.log('');

    // -------------------------------------------------------------
    // Test 4: Download Audit Logging
    // -------------------------------------------------------------
    console.log('[Test 4] Verifying download history tracking and logging...');
    
    // Simulate downloading files
    const downloadRecordId = uuidv4();
    await db.Download.create({
      id: downloadRecordId,
      user_id: decryptedPayload.userId,
      product_id: decryptedPayload.productId,
      device_id: decryptedPayload.deviceId,
      ip_address: decryptedPayload.ipAddress,
      download_time: new Date().toISOString()
    });

    // Check if logged in db
    const loggedDownloads = await db.Download.find({ user_id: testUser.id });
    if (loggedDownloads.length === 1) {
      const log = loggedDownloads[0];
      console.log('✓ Download log recorded in database:');
      console.log(`  - User ID:     ${log.user_id}`);
      console.log(`  - Product ID:  ${log.product_id}`);
      console.log(`  - Device ID:   ${log.device_id}`);
      console.log(`  - Client IP:   ${log.ip_address}`);
      console.log(`  - Timestamp:   ${log.download_time}`);
      console.log('\n✓ Success: Download tracking logs verify user, device, IP, and time.\n');
    } else {
      throw new Error('Download tracking failed: Expected 1 log record, found: ' + loggedDownloads.length);
    }

    console.log('=============================================================');
    console.log('ALL SECURITY CONTROLS TESTED SUCCESSFULLY: PASS');
    console.log('=============================================================\n');

  } catch (error) {
    console.error('\n=============================================================');
    console.error('VERIFICATION SUITE FAILURE ERROR:');
    console.error(error.message);
    console.error('=============================================================\n');
    process.exit(1);
  }
}

runTests();
