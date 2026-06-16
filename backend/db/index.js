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
    
    // Apply updates (supports simple $set and flat updates)
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

// Define Schema Structures for mongoose
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  facebook_id: { type: String },
  google_id: { type: String },
  devices: { type: [String], default: [] },
  status: { type: String, default: 'active' }, // active or disabled
  role: { type: String, default: 'user' }, // user or admin
  created_at: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  thumbnail: { type: String },
  file_path: { type: String }
});

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  product_id: { type: String, required: true },
  payment_status: { type: String, default: 'pending' }, // pending, paid
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
  User: new LocalModel('users'),
  Product: new LocalModel('products'),
  Order: new LocalModel('orders'),
  Download: new LocalModel('downloads')
};

// Seed initial default products to local database if empty
function seedDefaultProducts() {
  readLocalDB();
  if (!localData.products || localData.products.length === 0) {
    const mockProducts = [
      {
        id: 'prod-shri-ram',
        title: 'Shri Ram Darbar Sticker Pack',
        description: 'Premium quality digital stickers of Lord Ram, Mata Sita, Lakshman Ji, and Hanuman Ji. Perfect for chats, social media, and digital prints.',
        category: 'Shri Ram',
        price: 149,
        thumbnail: '/stickers/ram_darbar_thumb.jpg',
        file_path: 'ram_darbar_stickers.zip'
      },
      {
        id: 'prod-krishna',
        title: 'Radha Krishna Divine Love Pack',
        description: 'Elegantly hand-drawn vector designs illustrating the eternal love and pastimes of Radha and Krishna. Includes high-resolution PNGs.',
        category: 'Radha Krishna',
        price: 199,
        thumbnail: '/stickers/radha_krishna_thumb.jpg',
        file_path: 'radha_krishna_stickers.zip'
      },
      {
        id: 'prod-mahadev',
        title: 'Mahadev Shiv Tandav Collection',
        description: 'Vibrant artistic prints representing Lord Shiva in meditation and Tandav mudra. High resolution suitable for wallpaper and framing.',
        category: 'Mahadev',
        price: 99,
        thumbnail: '/stickers/shiv_tandav_thumb.jpg',
        file_path: 'shiv_tandav_stickers.zip'
      },
      {
        id: 'prod-hanuman',
        title: 'Hanuman Ji Sankat Mochan Pack',
        description: 'Powerful, modern, vector illustrations of Lord Hanuman, depicting strength, devotion, and cosmic energy. High-quality sticker pack.',
        category: 'Hanuman Ji',
        price: 129,
        thumbnail: '/stickers/hanuman_ji_thumb.jpg',
        file_path: 'hanuman_ji_stickers.zip'
      },
      {
        id: 'prod-ganesh',
        title: 'Vighnaharta Ganesh Ji Stickers',
        description: 'Auspicious and decorative Ganesh Ji stickers for starting new ventures, festivals, and spiritual greetings.',
        category: 'Ganesh Ji',
        price: 79,
        thumbnail: '/stickers/ganesh_ji_thumb.jpg',
        file_path: 'ganesh_ji_stickers.zip'
      },
      {
        id: 'prod-mata-rani',
        title: 'Mata Durga Navratri Special Pack',
        description: 'Divine energy artwork representing the nine avatars of Durga Maa. Perfect for Navratri and festive blessings.',
        category: 'Mata Rani',
        price: 179,
        thumbnail: '/stickers/mata_durga_thumb.jpg',
        file_path: 'mata_durga_stickers.zip'
      },
      {
        id: 'prod-quotes',
        title: 'Daily Spiritual Quotes & Shlokas',
        description: 'Beautifully typography sticker pack containing famous Sanskrit shlokas and daily positive quotes from the Bhagavad Gita.',
        category: 'Spiritual Quotes',
        price: 49,
        thumbnail: '/stickers/spiritual_quotes_thumb.jpg',
        file_path: 'spiritual_quotes_stickers.zip'
      }
    ];
    localData.products = mockProducts;
    writeLocalDB();
    console.log('Seeded default products in local database.');
  }

  // Seed default admin account
  if (!localData.users || !localData.users.some(u => u.role === 'admin')) {
    // Password: 'adminpassword', hashed using bcryptjs (we can hash it here or let backend do it,
    // but bcrypt.hashSync is easy: standard hash for 'adminpassword' is '$2a$10$Uq/nUWhHl6f.q9L0XvszPee7C8gZ3hLzU8VdJjM1iXf31B0qR6qU.')
    // Let's seed a default admin
    const defaultAdmin = {
      id: 'admin-1',
      name: 'Sumity Devotional Admin',
      email: 'admin@sumity.com',
      password: '$2a$10$Uq/nUWhHl6f.q9L0XvszPee7C8gZ3hLzU8VdJjM1iXf31B0qR6qU.', // bcrypt hash for 'adminpassword'
      facebook_id: null,
      google_id: null,
      devices: [],
      status: 'active',
      role: 'admin',
      created_at: new Date().toISOString()
    };
    if (!localData.users) localData.users = [];
    localData.users.push(defaultAdmin);
    writeLocalDB();
    console.log('Seeded default admin account in local database.');
  }
}

async function connectDB() {
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
      seedDefaultProducts();
    }
  } else {
    console.log('No MONGODB_URI provided. Running on local JSON file database fallback.');
    seedDefaultProducts();
  }
}

connectDB();

module.exports = db;
