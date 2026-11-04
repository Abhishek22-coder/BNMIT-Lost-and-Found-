import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Prevent unhandled mongoose connection error events from crashing Node.js process asynchronously
mongoose.connection.on('error', (err) => {
  console.error('⚠️ Global Mongoose Connection Error captured safely:', err);
});

// Connection function
export async function connectDB() {
  // Disable Mongoose schema command buffering globally to fail fast and fallback automatically
  mongoose.set('bufferCommands', false);

  const uri = process.env.MONGODB_URI;
  if (
    !uri ||
    uri.trim() === '' ||
    uri.includes('your_username') ||
    uri.includes('your_password') ||
    uri.includes('cluster.xxxx') ||
    uri.includes('<username>') ||
    uri.includes('<password>') ||
    uri.includes('MY_MONGODB')
  ) {
    console.warn('⚠️ MONGODB_URI is not configured, contains placeholders, or is empty. Using high-fidelity local file database persistence for now.');
    return false;
  }

  try {
    // Mongoose connection setup with timeouts to prevent hanging
    await mongoose.connect(uri, {
      connectTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Successfully connected to MongoDB Atlas cluster.');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB Atlas:', error);
    console.warn('⚠️ Falling back to high-fidelity local file database persistence.');
    return false;
  }
}

// Defining Mongoose Schemas & Models
const StudentSchema = new mongoose.Schema({
  usn: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  branch: { type: String, required: true },
  year: { type: String, required: true },
}, { timestamps: true });

const ItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  image: { type: String, required: false }, // Base64 encoding
  status: { type: String, enum: ['lost', 'found', 'claimed'], default: 'lost' },
  uploadedBy: {
    name: { type: String, required: true },
    usn: { type: String, required: true },
    email: { type: String, required: true },
    branch: { type: String, required: true },
  },
  claimedBy: {
    name: { type: String },
    usn: { type: String },
    email: { type: String },
    branch: { type: String },
    claimedAt: { type: String },
  },
}, { timestamps: true });

const ClaimSchema = new mongoose.Schema({
  item_id: { type: String, required: true },
  item_title: { type: String, required: true },
  claimedBy: {
    name: { type: String, required: true },
    usn: { type: String, required: true },
    email: { type: String, required: true },
    branch: { type: String, required: true },
  },
  uploadedBy: {
    name: { type: String, required: true },
    usn: { type: String, required: true },
    email: { type: String, required: true },
    branch: { type: String, required: true },
  },
  claimedAt: { type: String, required: true },
}, { timestamps: true });

const RequestedItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  image: { type: String, required: false }, // Base64 encoding
  requester: {
    name: { type: String, required: true },
    usn: { type: String, required: true },
    email: { type: String, required: true },
    branch: { type: String, required: true },
  },
  createdAt: { type: String, required: true }
}, { timestamps: true });

const RequestMessageSchema = new mongoose.Schema({
  requestId: { type: String, required: true },
  requestTitle: { type: String, required: true },
  messageText: { type: String, required: true },
  sender: {
    name: { type: String, required: true },
    usn: { type: String, required: true },
    email: { type: String, required: true },
  },
  recipientUsn: { type: String, required: true },
  createdAt: { type: String, required: true }
}, { timestamps: true });

export const StudentModel: any = mongoose.models.Student || mongoose.model('Student', StudentSchema);
export const ItemModel: any = mongoose.models.Item || mongoose.model('Item', ItemSchema);
export const ClaimModel: any = mongoose.models.Claim || mongoose.model('Claim', ClaimSchema);
export const RequestedItemModel: any = mongoose.models.RequestedItem || mongoose.model('RequestedItem', RequestedItemSchema);
export const RequestMessageModel: any = mongoose.models.RequestMessage || mongoose.model('RequestMessage', RequestMessageSchema);

// JSON Fallback database implementation for robust, zero-crash local execution
const LOCAL_DB_PATH = path.join(process.cwd(), 'local_database.json');

interface LocalDB {
  students: any[];
  items: any[];
  claims: any[];
  requests: any[];
  messages: any[];
}

function readLocalDB(): LocalDB {
  try {
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      const initialDb: LocalDB = { students: [], items: [], claims: [], requests: [], messages: [] };
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initialDb, null, 2));
      return initialDb;
    }
    const data = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
    const db = JSON.parse(data);
    
    // Ensure lists exist backfilled
    if (!db.students) db.students = [];
    if (!db.items) db.items = [];
    if (!db.claims) db.claims = [];
    if (!db.requests) db.requests = [];
    if (!db.messages) db.messages = [];
    
    return db;
  } catch (err) {
    console.error('Error reading local file DB:', err);
    return { students: [], items: [], claims: [], requests: [], messages: [] };
  }
}

function writeLocalDB(db: LocalDB) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Error writing local file DB:', err);
  }
}

export const dbService = {
  isUsingAtlas: false,

  async init(useAtlas: boolean) {
    this.isUsingAtlas = useAtlas;
  },

  // Students API
  async findStudent(usn: string) {
    if (this.isUsingAtlas) {
      try {
        return await StudentModel.findOne({ usn: usn.toUpperCase() }).lean();
      } catch (e) {
        console.error('Atlas FindStudent error, falling back to local search', e);
      }
    }
    const db = readLocalDB();
    return db.students.find(s => (s && s.usn || '').toUpperCase() === (usn || '').toUpperCase()) || null;
  },

  async createStudent(studentData: { usn: string; email: string; name: string; branch: string; year: string }) {
    const data = {
      ...studentData,
      usn: (studentData.usn || '').toUpperCase(),
      email: (studentData.email || '').toLowerCase(),
    };

    if (this.isUsingAtlas) {
      try {
        // Use findOneAndUpdate with upsert to prevent unique key index errors (E11000 duplicate key error)
        const updatedStudent = await StudentModel.findOneAndUpdate(
          { usn: data.usn },
          data,
          { upsert: true, new: true, runValidators: true }
        );
        return updatedStudent;
      } catch (e) {
        console.error('Atlas CreateStudent error', e);
      }
    }

    const db = readLocalDB();
    const existingIndex = db.students.findIndex(s => (s && s.usn || '').toUpperCase() === data.usn);
    if (existingIndex >= 0) {
      db.students[existingIndex] = { ...db.students[existingIndex], ...data };
    } else {
      db.students.push({ ...data, _id: 'stu_' + Math.random().toString(36).substring(2, 9) });
    }
    writeLocalDB(db);
    return data;
  },

  // Items API
  async fetchItems() {
    if (this.isUsingAtlas) {
      try {
        return await ItemModel.find({}).sort({ createdAt: -1 }).lean();
      } catch (e) {
        console.error('Atlas fetchItems error, falling back to local files', e);
      }
    }
    const db = readLocalDB();
    return db.items.slice().reverse();
  },

  async addItem(itemData: {
    title: string;
    description: string;
    category: string;
    location: string;
    image?: string | null;
    status: 'lost' | 'found' | 'claimed';
    uploadedBy: { name: string; usn: string; email: string; branch: string };
  }) {
    const data = {
      ...itemData,
      createdAt: new Date().toISOString(),
    };

    if (this.isUsingAtlas) {
      try {
        const item = new ItemModel(data);
        return await item.save();
      } catch (e) {
        console.error('Atlas addItem error', e);
      }
    }

    const db = readLocalDB();
    const newItem = {
      ...data,
      _id: 'item_' + Math.random().toString(36).substring(2, 9),
    };
    db.items.push(newItem);
    writeLocalDB(db);
    return newItem;
  },

  async updateItem(id: string, updateData: any) {
    if (this.isUsingAtlas) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          return await ItemModel.findByIdAndUpdate(id, updateData, { new: true });
        }
      } catch (e) {
        console.error('Atlas updateItem error', e);
      }
    }

    const db = readLocalDB();
    const index = db.items.findIndex(item => item._id === id);
    if (index >= 0) {
      db.items[index] = { ...db.items[index], ...updateData };
      writeLocalDB(db);
      return db.items[index];
    }
    return null;
  },

  async deleteItem(id: string) {
    if (this.isUsingAtlas) {
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          const res = await ItemModel.findByIdAndDelete(id);
          if (res) return true;
        }
      } catch (e) {
        console.error('Atlas deleteItem error', e);
      }
    }

    const db = readLocalDB();
    const index = db.items.findIndex(item => item._id === id);
    if (index >= 0) {
      db.items.splice(index, 1);
      writeLocalDB(db);
      return true;
    }
    return false;
  },

  // Claims API
  async addClaim(claimData: {
    item_id: string;
    item_title: string;
    claimedBy: { name: string; usn: string; email: string; branch: string };
    uploadedBy: { name: string; usn: string; email: string; branch: string };
    claimedAt: string;
  }) {
    if (this.isUsingAtlas) {
      try {
        const claim = new ClaimModel(claimData);
        await claim.save();

        // Update item status and claim details
        await ItemModel.findByIdAndUpdate(claimData.item_id, {
          status: 'claimed',
          claimedBy: {
            ...claimData.claimedBy,
            claimedAt: claimData.claimedAt,
          },
        });
        return claim;
      } catch (e) {
        console.error('Atlas addClaim error', e);
      }
    }

    const db = readLocalDB();
    const newClaim = {
      ...claimData,
      _id: 'claim_' + Math.random().toString(36).substring(2, 9),
    };
    db.claims.push(newClaim);

    // Update matching local item status
    const itemIndex = db.items.findIndex(item => item._id === claimData.item_id);
    if (itemIndex >= 0) {
      db.items[itemIndex].status = 'claimed';
      db.items[itemIndex].claimedBy = {
        ...claimData.claimedBy,
        claimedAt: claimData.claimedAt,
      };
    }

    writeLocalDB(db);
    return newClaim;
  },

  async fetchClaims() {
    if (this.isUsingAtlas) {
      try {
        return await ClaimModel.find({}).sort({ createdAt: -1 }).lean();
      } catch (e) {
        console.error('Atlas fetchClaims error', e);
      }
    }
    const db = readLocalDB();
    return db.claims;
  },

  async fetchRequests() {
    if (this.isUsingAtlas) {
      try {
        return await RequestedItemModel.find({}).sort({ createdAt: -1 }).lean();
      } catch (e) {
        console.error('Atlas fetchRequests error', e);
      }
    }
    const db = readLocalDB();
    return db.requests.slice().reverse();
  },

  async addRequest(requestData: {
    title: string;
    description: string;
    category: string;
    location: string;
    image?: string | null;
    requester: { name: string; usn: string; email: string; branch: string };
  }) {
    const data = {
      ...requestData,
      createdAt: new Date().toISOString(),
    };

    if (this.isUsingAtlas) {
      try {
        const reqItem = new RequestedItemModel(data);
        return await reqItem.save();
      } catch (e) {
        console.error('Atlas addRequest error', e);
      }
    }

    const db = readLocalDB();
    const newRequest = {
      ...data,
      _id: 'req_' + Math.random().toString(36).substring(2, 9),
    };
    db.requests.push(newRequest);
    writeLocalDB(db);
    return newRequest;
  },

  async fetchMessages(recipientUsn: string) {
    if (this.isUsingAtlas) {
      try {
        return await RequestMessageModel.find({ recipientUsn: recipientUsn.toUpperCase() }).sort({ createdAt: -1 }).lean();
      } catch (e) {
        console.error('Atlas fetchMessages error', e);
      }
    }
    const db = readLocalDB();
    return db.messages.filter(msg => (msg.recipientUsn || '').toUpperCase() === recipientUsn.toUpperCase()).slice().reverse();
  },

  async addMessage(msgData: {
    requestId: string;
    requestTitle: string;
    messageText: string;
    sender: { name: string; usn: string; email: string };
    recipientUsn: string;
  }) {
    const data = {
      ...msgData,
      sender: {
        name: msgData.sender.name,
        usn: msgData.sender.usn.toUpperCase(),
        email: msgData.sender.email.toLowerCase()
      },
      recipientUsn: msgData.recipientUsn.toUpperCase(),
      createdAt: new Date().toISOString(),
    };

    if (this.isUsingAtlas) {
      try {
        const msg = new RequestMessageModel(data);
        return await msg.save();
      } catch (e) {
        console.error('Atlas addMessage error', e);
      }
    }

    const db = readLocalDB();
    const newMsg = {
      ...data,
      _id: 'msg_' + Math.random().toString(36).substring(2, 9),
    };
    db.messages.push(newMsg);
    writeLocalDB(db);
    return newMsg;
  },
};
