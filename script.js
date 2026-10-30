const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("⚡ Starting PRIME FF MARKET installation on Replit...");

// 1. DEFINE PROJECT FILES MAP
const files = {
  // PACKAGE CONFIGURATION
  "package.json": JSON.stringify({
    "name": "prime-ff-market",
    "version": "1.0.0",
    "description": "Premium Free Fire Account Marketplace",
    "main": "src/server.js",
    "scripts": {
      "start": "node src/server.js",
      "dev": "node src/server.js",
      "db:setup": "prisma db push && node prisma/seed.js"
    },
    "dependencies": {
      "@prisma/client": "^5.14.0",
      "bcryptjs": "^2.4.3",
      "cookie-parser": "^1.4.6",
      "dotenv": "^16.4.5",
      "ejs": "^3.1.10",
      "express": "^4.19.2",
      "express-session": "^1.18.0",
      "jsonwebtoken": "^9.0.2",
      "multer": "^1.4.5-lts.1",
      "razorpay": "^2.9.4"
    },
    "devDependencies": {
      "prisma": "^5.14.0"
    }
  }, null, 2),

  ".env": `PORT=3000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
SESSION_SECRET="primeff-super-secret-session-key-2026"
JWT_SECRET="primeff-ultra-jwt-token-key-2026"
RAZORPAY_KEY_ID="rzp_test_placeholder"
RAZORPAY_KEY_SECRET="rzp_secret_placeholder"
`,

  ".replit": `run = "npm run db:setup && node src/server.js"
entrypoint = "src/server.js"

[nix]
channel = "stable-23_11"
`,

  // DATABASE SCHEMA
  "prisma/schema.prisma": `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id               String       @id @default(uuid())
  email            String       @unique
  username         String       @unique
  passwordHash     String
  role             String       @default("BUYER")
  isVerifiedSeller Boolean      @default(false)
  isSuspended      Boolean      @default(false)
  createdAt        DateTime     @default(now())

  listings         Listing[]
  ordersAsBuyer    Order[]      @relation("BuyerOrders")
  ordersAsSeller   Order[]      @relation("SellerOrders")
  inquiriesSent    Inquiry[]    @relation("BuyerInquiries")
  reportsSubmitted Report[]
}

model Listing {
  id              String         @id @default(uuid())
  title           String
  description     String
  price           Float
  accountLevel    Int
  rank            String
  serverRegion    String
  characterCount  Int            @default(0)
  gunSkinCount    Int            @default(0)
  evoGuns         String
  rareBundles     String
  loginMethod     String
  status          String         @default("AVAILABLE")
  isFeatured      Boolean        @default(false)
  sellerId        String
  seller          User           @relation(fields: [sellerId], references: [id], onDelete: Cascade)
  images          ListingImage[]
  orders          Order[]
  inquiries       Inquiry[]
  reports         Report[]
  createdAt       DateTime       @default(now())
}

model ListingImage {
  id        String   @id @default(uuid())
  url       String
  listingId String
  listing   Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)
}

model Order {
  id            String      @id @default(uuid())
  orderNumber   String      @unique
  amount        Float
  status        String      @default("PENDING")
  paymentMethod String      @default("GATEWAY_ESCROW")
  buyerId       String
  buyer         User        @relation("BuyerOrders", fields: [buyerId], references: [id])
  sellerId      String
  seller        User        @relation("SellerOrders", fields: [sellerId], references: [id])
  listingId     String
  listing       Listing     @relation(fields: [listingId], references: [id])
  createdAt     DateTime    @default(now())
}

model Inquiry {
  id        String   @id @default(uuid())
  message   String
  listingId String
  listing   Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)
  buyerId   String
  buyer     User     @relation("BuyerInquiries", fields: [buyerId], references: [id])
  createdAt DateTime @default(now())
}

model Report {
  id          String   @id @default(uuid())
  reason      String
  description String
  reporterId  String
  reporter    User     @relation(fields: [reporterId], references: [id])
  listingId   String
  listing     Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
}
`,

  // DATABASE SEEDER
  "prisma/seed.js": `const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  await prisma.report.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.order.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  const hashedAdminPass = await bcrypt.hash('Admin@123', 10);
  const hashedSellerPass = await bcrypt.hash('Seller@123', 10);
  const hashedBuyerPass = await bcrypt.hash('Buyer@123', 10);

  const admin = await prisma.user.create({
    data: { email: 'admin@primeffmarket.com', username: 'PrimeAdmin', passwordHash: hashedAdminPass, role: 'ADMIN', isVerifiedSeller: true }
  });

  const seller = await prisma.user.create({
    data: { email: 'seller@primeffmarket.com', username: 'GhostTrader', passwordHash: hashedSellerPass, role: 'SELLER', isVerifiedSeller: true }
  });

  const buyer = await prisma.user.create({
    data: { email: 'buyer@primeffmarket.com', username: 'ApexStriker', passwordHash: hashedBuyerPass, role: 'BUYER' }
  });

  await prisma.listing.create({
    data: {
      title: 'Grandmaster Veteran ID: Season 1 Sakura + 7 Max Evo Guns + Hip Hop',
      description: 'OG Free Fire ID. All Season 1 & 2 items unlocked. Max Evo MP40 Cobra, Blue Flame Draco AK47, Megalodon Alpha SCAR. 100% genuine and safe.',
      price: 249.00,
      accountLevel: 78,
      rank: 'Grandmaster',
      serverRegion: 'India',
      characterCount: 52,
      gunSkinCount: 310,
      evoGuns: 'MP40 Cobra (Max Lv.7), Draco AK (Max Lv.7), M1014 Dragon (Lv.6)',
      rareBundles: 'Sakura S1, Hip-Hop S2, Arctic Blue, Red Criminal',
      loginMethod: 'Google',
      status: 'AVAILABLE',
      isFeatured: true,
      sellerId: seller.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80' },
          { url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80' }
        ]
      }
    }
  });

  await prisma.listing.create({
    data: {
      title: 'Heroic Rank Tournament Smurf: Evo XM8 Max + All Characters Unlocked',
      description: 'Competitive Ready ID. Perfect squad stats with high K/D ratio. Includes Alok, Chrono, K, Homer maxed skills.',
      price: 69.00,
      accountLevel: 64,
      rank: 'Heroic',
      serverRegion: 'Singapore',
      characterCount: 46,
      gunSkinCount: 160,
      evoGuns: 'XM8 Destiny Guardian (Lv.7), UMP Booyah Day (Lv.4)',
      rareBundles: 'Purple Criminal, Street Boy, Toxic Lime Incubator',
      loginMethod: 'Facebook',
      status: 'AVAILABLE',
      isFeatured: true,
      sellerId: seller.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80' }
        ]
      }
    }
  });

  console.log("✅ Seed completed: Admin, Seller, and Accounts created!");
}
main().catch(console.error).finally(() => prisma.$disconnect());
`,

  // STYLESHEET
  "public/css/gaming-theme.css": `:root {
  --bg-dark: #0a0b0e;
  --surface: #12141a;
  --surface-hover: #1a1d26;
  --purple: #8b5cf6;
  --orange: #ff5722;
  --border: #272a37;
}
body {
  background-color: var(--bg-dark);
  color: #f3f4f6;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  margin: 0;
}
.gaming-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  transition: all 0.2s ease;
}
.gaming-card:hover {
  border-color: var(--purple);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.2);
}
.btn-orange {
  background: linear-gradient(135deg, #ff5722 0%, #e64a19 100%);
  color: #ffffff;
  font-weight: 700;
  border-radius: 8px;
  transition: opacity 0.2s;
}
.btn-orange:hover { opacity: 0.9; }
.btn-purple {
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  color: #ffffff;
  font-weight: 700;
  border-radius: 8px;
  transition: opacity 0.2s;
}
.btn-purple:hover { opacity: 0.9; }
`,

  // MIDDLEWARES
  "src/middleware/auth.js": `const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.attachUser = async (req, res, next) => {
  const token = req.cookies.auth_token;
  res.locals.currentUser = null;
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, email: true, role: true, isVerifiedSeller: true, isSuspended: true }
    });
    if (user && !user.isSuspended) {
      req.user = user;
      res.locals.currentUser = user;
    }
  } catch (err) {
    res.clearCookie('auth_token');
  }
  next();
};

exports.requireAuth = (req, res, next) => {
  if (!req.user) return res.redirect('/auth/login');
  next();
};

exports.requireRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).send("Unauthorized Access");
  }
  next();
};
`,

  "src/middleware/upload.js": `const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname).toLowerCase());
  }
});
module.exports = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
`,

  // ROUTES
  "src/routes/auth.js": `const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/login', (req, res) => res.render('auth/login', { error: null }));
router.get('/register', (req, res) => res.render('auth/register', { error: null }));

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (exists) return res.render('auth/register', { error: 'Username or Email already registered.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, passwordHash, role: role === 'SELLER' ? 'SELLER' : 'BUYER' }
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res.cookie('auth_token', token, { httpOnly: true });
    res.redirect('/');
  } catch (err) {
    res.render('auth/register', { error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.render('auth/login', { error: 'Invalid login credentials' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
    res.cookie('auth_token', token, { httpOnly: true });
    res.redirect('/');
  } catch (err) {
    res.render('auth/login', { error: err.message });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.redirect('/');
});

module.exports = router;
`,

  "src/routes/listings.js": `const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { requireAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', async (req, res) => {
  const { search, rank, server, minPrice, maxPrice } = req.query;
  const where = { status: 'AVAILABLE' };

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { rareBundles: { contains: search } },
      { evoGuns: { contains: search } }
    ];
  }
  if (rank) where.rank = rank;
  if (server) where.serverRegion = server;
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }

  const listings = await prisma.listing.findMany({
    where,
    include: { images: true, seller: true },
    orderBy: { createdAt: 'desc' }
  });

  res.render('listings/index', { listings, query: req.query });
});

router.get('/new', requireAuth, requireRole(['SELLER', 'ADMIN']), (req, res) => {
  res.render('listings/create', { error: null });
});

router.post('/new', requireAuth, requireRole(['SELLER', 'ADMIN']), upload.array('screenshots', 4), async (req, res) => {
  try {
    const { title, description, price, accountLevel, rank, serverRegion, evoGuns, rareBundles, loginMethod } = req.body;
    const files = req.files || [];
    
    await prisma.listing.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        accountLevel: parseInt(accountLevel),
        rank,
        serverRegion,
        evoGuns: evoGuns || 'None',
        rareBundles: rareBundles || 'None',
        loginMethod,
        sellerId: req.user.id,
        images: {
          create: files.length > 0 
            ? files.map(f => ({ url: '/uploads/' + f.filename })) 
            : [{ url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80' }]
        }
      }
    });
    res.redirect('/dashboard/seller');
  } catch (err) {
    res.render('listings/create', { error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id },
    include: { images: true, seller: true }
  });
  if (!listing) return res.status(404).send("Listing not found");
  res.render('listings/detail', { listing, query: req.query });
});

router.post('/:id/inquire', requireAuth, async (req, res) => {
  await prisma.inquiry.create({
    data: { message: req.body.message, listingId: req.params.id, buyerId: req.user.id }
  });
  res.redirect('/listings/' + req.params.id + '?inquiry=sent');
});

module.exports = router;
`,

  "src/routes/orders.js": `const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { requireAuth } = require('../middleware/auth');

router.post('/checkout/:listingId', requireAuth, async (req, res) => {
  const listing = await prisma.listing.findUnique({ where: { id: req.params.listingId } });
  if (!listing || listing.status !== 'AVAILABLE') return res.status(400).send("Account not available");

  const order = await prisma.order.create({
    data: {
      orderNumber: 'PFM-' + Date.now().toString().slice(-6),
      amount: listing.price,
      status: 'PAID_ESCROW_HOLD',
      buyerId: req.user.id,
      sellerId: listing.sellerId,
      listingId: listing.id
    }
  });

  await prisma.listing.update({
    where: { id: listing.id },
    data: { status: 'PENDING_TRANSFER' }
  });

  res.render('orders/checkout', { order, listing });
});

module.exports = router;
`,

  "src/routes/admin.js": `const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole(['ADMIN']));

router.get('/', async (req, res) => {
  const [users, listings, orders, reports] = await Promise.all([
    prisma.user.findMany({ take: 20 }),
    prisma.listing.findMany({ include: { seller: true }, take: 20 }),
    prisma.order.findMany({ include: { listing: true, buyer: true, seller: true }, take: 10 }),
    prisma.report.findMany({ include: { listing: true, reporter: true } })
  ]);
  res.render('admin/dashboard', { users, listings, orders, reports });
});

router.post('/users/:id/ban', async (req, res) => {
  const u = await prisma.user.findUnique({ where: { id: req.params.id } });
  await prisma.user.update({ where: { id: req.params.id }, data: { isSuspended: !u.isSuspended } });
  res.redirect('/admin');
});

router.post('/listings/:id/delete', async (req, res) => {
  await prisma.listing.delete({ where: { id: req.params.id } });
  res.redirect('/admin');
});

module.exports = router;
`,

  "src/routes/pages.js": `const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { requireAuth } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const featured = await prisma.listing.findMany({ where: { isFeatured: true }, include: { images: true, seller: true }, take: 6 });
  const latest = await prisma.listing.findMany({ where: { status: 'AVAILABLE' }, include: { images: true, seller: true }, take: 6, orderBy: { createdAt: 'desc' } });
  const stats = {
    listings: await prisma.listing.count({ where: { status: 'AVAILABLE' } }),
    orders: await prisma.order.count(),
    users: await prisma.user.count()
  };
  res.render('home', { featured, latest, stats });
});

router.get('/dashboard/buyer', requireAuth, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { buyerId: req.user.id },
    include: { listing: { include: { images: true } }, seller: true }
  });
  const inquiries = await prisma.inquiry.findMany({
    where: { buyerId: req.user.id },
    include: { listing: true }
  });
  res.render('dashboard/buyer', { orders, inquiries });
});

router.get('/dashboard/seller', requireAuth, async (req, res) => {
  const listings = await prisma.listing.findMany({
    where: { sellerId: req.user.id },
    include: { images: true }
  });
  const sales = await prisma.order.findMany({
    where: { sellerId: req.user.id },
    include: { listing: true, buyer: true }
  });
  res.render('dashboard/seller', { listings, sales });
});

router.get('/terms', (req, res) => res.render('legal/terms'));
router.get('/privacy', (req, res) => res.render('legal/privacy'));

module.exports = router;
`,

  // MAIN SERVER
  "src/server.js": `const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { attachUser } = require('./middleware/auth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(attachUser);

app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));
app.use('/listings', require('./routes/listings'));
app.use('/orders', require('./routes/orders'));
app.use('/admin', require('./routes/admin'));

app.listen(PORT, '0.0.0.0', () => {
  console.log('🔥 PRIME FF MARKET is live at http://localhost:' + PORT);
});
`,

  // VIEWS (PARTIALS)
  "views/partials/na
