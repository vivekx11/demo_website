const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// File paths for local JSON database
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Initialize local DB structure if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(
    DB_FILE,
    JSON.stringify({ users: [], products: [], orders: [], downloads: [] }, null, 2)
  );
}

// Pre-create upload folders
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const IMAGES_DIR = path.join(UPLOADS_DIR, 'images');
const PDFS_DIR = path.join(UPLOADS_DIR, 'pdfs');
[UPLOADS_DIR, IMAGES_DIR, PDFS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// In-memory data store cache when using file DB
let localData = { users: [], products: [], orders: [], downloads: [] };

function readLocalDB() {
  try {
    const content = fs.readFileSync(DB_FILE, 'utf8');
    localData = JSON.parse(content);
  } catch (err) {
    console.error('Error reading local DB:', err);
  }
}

function writeLocalDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(localData, null, 2));
  } catch (err) {
    console.error('Error writing to local DB:', err);
  }
}

// Read DB state initially
readLocalDB();

// Mock Mongoose Query API for file-based DB fallback
class LocalModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  async find(filter = {}) {
    readLocalDB();
    let items = localData[this.collectionName] || [];
    return items.filter(item => {
      for (let key in filter) {
        if (filter[key] !== undefined && item[key] !== filter[key]) {
          return false;
        }
      }
      return true;
    });
  }

  async findOne(filter = {}) {
    readLocalDB();
    const items = localData[this.collectionName] || [];
    return items.find(item => {
      for (let key in filter) {
        if (filter[key] !== undefined && item[key] !== filter[key]) {
          return false;
        }
      }
      return true;
    }) || null;
  }

  async findById(id) {
    return this.findOne({ id: id });
  }

  async create(doc) {
    readLocalDB();
    const newDoc = {
      id: doc.id || Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      ...doc
    };
    if (!localData[this.collectionName]) {
      localData[this.collectionName] = [];
    }
    localData[this.collectionName].push(newDoc);
    writeLocalDB();
    return newDoc;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    readLocalDB();
    const items = localData[this.collectionName] || [];
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    const current = items[index];
    const updates = update.$set || update;
    items[index] = { ...current, ...updates };
    writeLocalDB();
    return items[index];
  }

  async deleteMany(filter = {}) {
    readLocalDB();
    let items = localData[this.collectionName] || [];
    localData[this.collectionName] = items.filter(item => {
      for (let key in filter) {
        if (item[key] === filter[key]) return false;
      }
      return true;
    });
    writeLocalDB();
    return { deletedCount: items.length - localData[this.collectionName].length };
  }
}

// Production-ready Cloud Firestore query wrapper mapping to the same API
class FirestoreModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  get col() {
    const admin = require('firebase-admin');
    return admin.firestore().collection(this.collectionName);
  }

  async find(filter = {}) {
    let query = this.col;
    for (let key in filter) {
      if (filter[key] !== undefined) {
        query = query.where(key, '==', filter[key]);
      }
    }
    const snapshot = await query.get();
    const results = [];
    snapshot.forEach(doc => {
      results.push({ _id: doc.id, ...doc.data() });
    });
    return results;
  }

  async findOne(filter = {}) {
    const results = await this.find(filter);
    return results.length > 0 ? results[0] : null;
  }

  async findById(id) {
    const doc = await this.col.doc(id).get();
    if (!doc.exists) return null;
    return { _id: doc.id, ...doc.data() };
  }

  async create(doc) {
    const id = doc.id || doc.uid || Math.random().toString(36).substring(2, 9);
    const data = {
      created_at: new Date().toISOString(),
      ...doc,
      id
    };
    const docId = doc.id || id;
    await this.col.doc(docId).set(data);
    return { _id: docId, ...data };
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const docRef = this.col.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    const updates = update.$set || update;
    const cleanedUpdates = {};
    for (let key in updates) {
      if (updates[key] !== undefined) {
        cleanedUpdates[key] = updates[key];
      }
    }
    await docRef.update(cleanedUpdates);
    const updatedDoc = await docRef.get();
    return { _id: id, ...updatedDoc.data() };
  }

  async deleteMany(filter = {}) {
    const list = await this.find(filter);
    const admin = require('firebase-admin');
    const batch = admin.firestore().batch();
    list.forEach(item => {
      const docRef = this.col.doc(item._id || item.id);
      batch.delete(docRef);
    });
    await batch.commit();
    return { deletedCount: list.length };
  }
}

// Define Schema Structures for Mongoose fallback
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  facebook_id: { type: String },
  google_id: { type: String },
  devices: { type: [String], default: [] },
  status: { type: String, default: 'active' },
  role: { type: String, default: 'user' },
  created_at: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  thumbnail: { type: String },
  file_path: { type: String },
  featured: { type: Boolean, default: false },
  status: { type: String, default: 'active' }
});

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  product_id: { type: String, required: true },
  payment_status: { type: String, default: 'pending' },
  payment_id: { type: String },
  purchase_date: { type: Date, default: Date.now }
});

const downloadSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  product_id: { type: String, required: true },
  device_id: { type: String, required: true },
  ip_address: { type: String, required: true },
  download_time: { type: Date, default: Date.now }
});

let db = {
  isMongoose: false,
  isFirebase: false,
  User: new LocalModel('users'),
  Product: new LocalModel('products'),
  Order: new LocalModel('orders'),
  Download: new LocalModel('downloads')
};

// Seed default admin account if empty
async function seedDefaultProducts() {
  const admins = await db.User.find({ role: 'admin' });
  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  if (!admins || admins.length === 0) {
    await db.User.create({
      id: 'admin-1',
      name: 'Bhakti Chitra Admin',
      email: 'admin@bhaktichitra.com',
      password: hashedPassword,
      facebook_id: null,
      google_id: null,
      devices: [],
      status: 'active',
      role: 'admin',
      created_at: new Date().toISOString()
    });
    console.log('Seeded default admin account in database.');
  } else {
    // If admin exists but has a null password, update it
    const nullPasswordAdmins = admins.filter(a => !a.password);
    for (const a of nullPasswordAdmins) {
      await db.User.findByIdAndUpdate(a.id, { password: hashedPassword });
      console.log(`Updated password for admin user: ${a.email}`);
    }
  }
}

async function connectDB() {
  const firebaseKeyPath = path.join(__dirname, '..', 'firebase-service-account.json');
  if (fs.existsSync(firebaseKeyPath)) {
    try {
      const admin = require('firebase-admin');
      const serviceAccount = require(firebaseKeyPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Successfully initialized Firebase Admin SDK (Cloud Firestore Mode).');
      db.isFirebase = true;
      db.User = new FirestoreModel('users');
      db.Product = new FirestoreModel('products');
      db.Order = new FirestoreModel('orders');
      db.Download = new FirestoreModel('downloads');
      await seedDefaultProducts();
      return;
    } catch (err) {
      console.error('Firebase initialization failed. Falling back to local JSON database.', err);
    }
  }

  const uri = process.env.MONGODB_URI;
  if (uri) {
    try {
      await mongoose.connect(uri);
      console.log('Successfully connected to MongoDB.');
      db.isMongoose = true;
      db.User = mongoose.model('User', userSchema);
      db.Product = mongoose.model('Product', productSchema);
      db.Order = mongoose.model('Order', orderSchema);
      db.Download = mongoose.model('Download', downloadSchema);
    } catch (err) {
      console.error('MongoDB connection failed. Falling back to local file database.', err);
      await seedDefaultProducts();
    }
  } else {
    console.log('No Firebase credentials or MONGODB_URI provided. Running on local JSON file database.');
    await seedDefaultProducts();
  }
}

connectDB();

module.exports = db;
