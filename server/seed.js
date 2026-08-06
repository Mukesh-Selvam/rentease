import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Product from './models/Product.js';
import RentalOrder from './models/RentalOrder.js';
import MaintenanceTicket from './models/MaintenanceTicket.js';
import DamageClaim from './models/DamageClaim.js';
import ServiceArea from './models/ServiceArea.js';
import DeliveryPartner from './models/DeliveryPartner.js';
import Coupon from './models/Coupon.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rentease';

async function seedDatabase() {
  try {
    console.log(`[Seed] Connecting to MongoDB: ${MONGODB_URI.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.*)/, '$1*****$3')}`);
    await mongoose.connect(MONGODB_URI);

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@rentease.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';

    // Clear existing collections for a clean seed
    await User.deleteMany({});
    await Product.deleteMany({});
    await RentalOrder.deleteMany({});
    await MaintenanceTicket.deleteMany({});
    await DamageClaim.deleteMany({});
    await ServiceArea.deleteMany({});
    await DeliveryPartner.deleteMany({});
    await Coupon.deleteMany({});

    console.log('[Seed] Cleared existing database collections.');

    // ---------------------------------------------------------
    // 1. SEED ACCOUNTS (ADMIN, VENDORS, CUSTOMERS)
    // ---------------------------------------------------------
    const admin = await User.create({
      name: process.env.ADMIN_NAME || 'Platform Administrator',
      email: adminEmail.toLowerCase().trim(),
      password: adminPassword,
      role: 'ADMIN',
      city: 'Bengaluru',
      phone: '+91 98765 00001',
      kycStatus: 'VERIFIED',
      isEmailVerified: true,
      status: 'ACTIVE'
    });

    const vendor1 = await User.create({
      name: 'Urban Decor Logistics',
      email: 'vendor@rentease.com',
      password: 'VendorPassword123!',
      role: 'VENDOR',
      city: 'Bengaluru',
      phone: '+91 98765 00002',
      kycStatus: 'VERIFIED',
      isEmailVerified: true,
      isVendorApproved: true,
      status: 'ACTIVE'
    });

    const vendor2 = await User.create({
      name: 'ElectraHome Appliances',
      email: 'electra@rentease.com',
      password: 'VendorPassword123!',
      role: 'VENDOR',
      city: 'Mumbai',
      phone: '+91 98765 00003',
      kycStatus: 'VERIFIED',
      isEmailVerified: true,
      isVendorApproved: true,
      status: 'ACTIVE'
    });

    const vendor3 = await User.create({
      name: 'FitPulse Wellness Gear',
      email: 'fitpulse@rentease.com',
      password: 'VendorPassword123!',
      role: 'VENDOR',
      city: 'Delhi NCR',
      phone: '+91 98765 00004',
      kycStatus: 'VERIFIED',
      isEmailVerified: true,
      isVendorApproved: true,
      status: 'ACTIVE'
    });

    const customer1 = await User.create({
      name: 'Aarav Sharma',
      email: 'customer@rentease.com',
      password: 'CustomerPassword123!',
      role: 'CUSTOMER',
      city: 'Bengaluru',
      phone: '+91 98765 43210',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      kycStatus: 'VERIFIED',
      isEmailVerified: true,
      status: 'ACTIVE',
      addresses: [
        {
          label: 'Home',
          street: 'Flat 402, Sunshine Heights, HSR Layout Sector 1',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560102',
          landmark: 'Near HSR Police Station',
          phone: '+91 98765 43210',
          isDefault: true
        }
      ]
    });

    const customer2 = await User.create({
      name: 'Priya Patel',
      email: 'priya@gmail.com',
      password: 'CustomerPassword123!',
      role: 'CUSTOMER',
      city: 'Mumbai',
      phone: '+91 98765 43211',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      kycStatus: 'VERIFIED',
      isEmailVerified: true,
      status: 'ACTIVE',
      addresses: [
        {
          label: 'Apartment',
          street: 'Tower B - 1204, Lodha Woods, Kandivali East',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400101',
          landmark: 'Opposite Western Express Highway',
          phone: '+91 98765 43211',
          isDefault: true
        }
      ]
    });

    const customer3 = await User.create({
      name: 'Rohan Verma',
      email: 'rohan@gmail.com',
      password: 'CustomerPassword123!',
      role: 'CUSTOMER',
      city: 'Delhi NCR',
      phone: '+91 98765 43212',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      kycStatus: 'VERIFIED',
      isEmailVerified: true,
      status: 'ACTIVE',
      addresses: [
        {
          label: 'Home',
          street: 'C-45, Sushant Lok Phase 1, DLF Golf Course Road',
          city: 'Gurugram',
          state: 'Haryana',
          pincode: '122002',
          landmark: 'Near HUDA City Centre Metro',
          phone: '+91 98765 43212',
          isDefault: true
        }
      ]
    });

    console.log('[Seed] Accounts provisioned: 1 Admin, 3 Vendors, 3 Customers.');

    // ---------------------------------------------------------
    // 2. SERVICE AREAS
    // ---------------------------------------------------------
    await ServiceArea.insertMany([
      { city: 'Bengaluru', state: 'Karnataka', active: true, pincodes: '560001,560102,560034,560037,560068,560100' },
      { city: 'Mumbai', state: 'Maharashtra', active: true, pincodes: '400001,400050,400076,400093,400101' },
      { city: 'Delhi NCR', state: 'Delhi', active: true, pincodes: '110001,110020,122001,122002,201301' },
      { city: 'Hyderabad', state: 'Telangana', active: true, pincodes: '500001,500032,500081' },
      { city: 'Pune', state: 'Maharashtra', active: true, pincodes: '411001,411014,411057' },
      { city: 'Chennai', state: 'Tamil Nadu', active: true, pincodes: '600001,600028,600096' },
      { city: 'Kolkata', state: 'West Bengal', active: true, pincodes: '700001,700091,700156' }
    ]);

    console.log('[Seed] Service Areas seeded (7 major metro regions).');

    // ---------------------------------------------------------
    // 3. DELIVERY PARTNERS
    // ---------------------------------------------------------
    const partners = await DeliveryPartner.insertMany([
      {
        name: 'Rajesh Kumar',
        phone: '+91 98888 11111',
        cities: ['Bengaluru'],
        vehicleType: 'Tata Ace (1.5 Ton)',
        rating: 4.9,
        completedDeliveries: 340,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
        active: true
      },
      {
        name: 'Vikram Singh',
        phone: '+91 98888 22222',
        cities: ['Mumbai', 'Pune'],
        vehicleType: 'Mahindra Bolero Pickup',
        rating: 4.8,
        completedDeliveries: 280,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
        active: true
      },
      {
        name: 'Suresh Nair',
        phone: '+91 98888 33333',
        cities: ['Hyderabad'],
        vehicleType: 'Electric Cargo Trike',
        rating: 4.7,
        completedDeliveries: 190,
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200',
        active: true
      }
    ]);

    // ---------------------------------------------------------
    // 4. COUPONS & OFFERS
    // ---------------------------------------------------------
    await Coupon.insertMany([
      {
        code: 'WELCOME300',
        discountType: 'FLAT',
        discountValue: 300,
        minOrderValue: 999,
        maxDiscount: 300,
        expiryDate: new Date('2030-12-31'),
        active: true
      },
      {
        code: 'RENTFEST20',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        minOrderValue: 2000,
        maxDiscount: 600,
        expiryDate: new Date('2030-12-31'),
        active: true
      },
      {
        code: 'WFHSPECIAL',
        discountType: 'FLAT',
        discountValue: 500,
        minOrderValue: 1500,
        maxDiscount: 500,
        expiryDate: new Date('2030-12-31'),
        active: true
      }
    ]);

    // ---------------------------------------------------------
    // 5. RICH PRODUCT CATALOG (16 REAL-WORLD ITEMS)
    // ---------------------------------------------------------
    const products = await Product.insertMany([
      // FURNITURE
      {
        title: 'Ergonomic Mesh Office Chair',
        slug: 'ergonomic-mesh-office-chair',
        category: 'furniture',
        type: 'Chair',
        description: 'High-back ergonomic mesh chair with adjustable lumbar support, 3D armrests, and synchronous tilt mechanism for all-day comfort.',
        specifications: { Dimensions: '65W x 65D x 118H cm', Material: 'High-density Breathable Mesh & Heavy-duty Nylon', WeightCapacity: '135 kg' },
        vendor: vendor1._id,
        vendorName: vendor1.name,
        city: 'Bengaluru',
        availableCities: ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune'],
        sku: 'FUR-OFF-001',
        totalStock: 25,
        availableStock: 20,
        rentedStock: 5,
        maintenanceStock: 0,
        monthlyRent: 599,
        deposit: 1000,
        tenurePrices: { '3': 599, '6': 499, '9': 449, '12': 399 },
        images: [
          'https://images.unsplash.com/photo-1580481072645-022f9a6d1276?w=800',
          'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=800'
        ],
        featured: true,
        rating: 4.8,
        reviewCount: 54,
        approved: true
      },
      {
        title: 'Sleek Modern Leather 3-Seater Sofa',
        slug: 'sleek-modern-leather-3-seater-sofa',
        category: 'furniture',
        type: 'Sofa',
        description: 'Premium three-seater leatherette sofa with high-resilience foam cushions, solid timber frame, and sleek minimalist aesthetic.',
        specifications: { Dimensions: '210W x 90D x 85H cm', Material: 'Premium Leatherette & Teak Wood Base', SeatingCapacity: '3 Adults' },
        vendor: vendor1._id,
        vendorName: vendor1.name,
        city: 'Bengaluru',
        availableCities: ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad'],
        sku: 'FUR-SOF-002',
        totalStock: 12,
        availableStock: 9,
        rentedStock: 3,
        maintenanceStock: 0,
        monthlyRent: 899,
        deposit: 2000,
        tenurePrices: { '3': 899, '6': 799, '9': 729, '12': 649 },
        images: [
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
          'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800'
        ],
        featured: true,
        rating: 4.9,
        reviewCount: 41,
        approved: true
      },
      {
        title: 'Minimalist Solid Oak Queen Bed Frame + Mattress',
        slug: 'minimalist-solid-oak-queen-bed',
        category: 'furniture',
        type: 'Bed',
        description: 'Sturdy solid oak queen bed frame paired with a 6-inch orthopedic dual-comfort memory foam mattress.',
        specifications: { Dimensions: '160W x 205L x 90H cm', Mattress: '6-inch Orthopedic Memory Foam', Finish: 'Natural Oak' },
        vendor: vendor1._id,
        vendorName: vendor1.name,
        city: 'Bengaluru',
        availableCities: ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Pune'],
        sku: 'FUR-BED-003',
        totalStock: 15,
        availableStock: 11,
        rentedStock: 4,
        maintenanceStock: 0,
        monthlyRent: 999,
        deposit: 2500,
        tenurePrices: { '3': 999, '6': 899, '9': 819, '12': 749 },
        images: [
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
          'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800'
        ],
        featured: true,
        rating: 4.9,
        reviewCount: 68,
        approved: true
      },
      {
        title: 'Scandinavian 4-Seater Wooden Dining Set',
        slug: 'scandinavian-4-seater-wooden-dining-set',
        category: 'furniture',
        type: 'Dining',
        description: 'Compact Scandinavian style dining table with 4 cushioned ergonomic chairs. Perfect for cozy dining areas and family meals.',
        specifications: { TableDimensions: '120L x 80W x 75H cm', Seating: '4 Chairs Included', WoodType: 'Sheesham Solid Wood' },
        vendor: vendor1._id,
        vendorName: vendor1.name,
        city: 'Mumbai',
        availableCities: ['Bengaluru', 'Mumbai', 'Delhi NCR'],
        sku: 'FUR-DIN-004',
        totalStock: 10,
        availableStock: 8,
        rentedStock: 2,
        maintenanceStock: 0,
        monthlyRent: 799,
        deposit: 1800,
        tenurePrices: { '3': 799, '6': 699, '9': 629, '12': 569 },
        images: [
          'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800'
        ],
        featured: false,
        rating: 4.7,
        reviewCount: 22,
        approved: true
      },
      {
        title: 'Solid Oak Study & Work Desk',
        slug: 'solid-oak-study-work-desk',
        category: 'furniture',
        type: 'Table',
        description: 'Clean modern study table with integrated cable management grommet and two smooth-gliding storage drawers.',
        specifications: { Dimensions: '120W x 60D x 75H cm', Drawers: '2 Storage Drawers', Material: 'Engineered Wood & Metal Legs' },
        vendor: vendor1._id,
        vendorName: vendor1.name,
        city: 'Bengaluru',
        availableCities: ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune'],
        sku: 'FUR-DESK-005',
        totalStock: 20,
        availableStock: 16,
        rentedStock: 4,
        maintenanceStock: 0,
        monthlyRent: 449,
        deposit: 1000,
        tenurePrices: { '3': 449, '6': 399, '9': 359, '12': 319 },
        images: [
          'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800'
        ],
        featured: false,
        rating: 4.8,
        reviewCount: 37,
        approved: true
      },

      // APPLIANCES
      {
        title: 'Smart Double-Door Refrigerator 260L 5-Star',
        slug: 'smart-double-door-refrigerator-260l',
        category: 'appliances',
        type: 'Refrigerators',
        description: 'Frost-free double door refrigerator with convertible cooling modes, inverter linear compressor, and toughened glass shelves.',
        specifications: { Capacity: '260 Litres', EnergyRating: '5 Star Inverter', CoolingType: 'Frost Free' },
        vendor: vendor2._id,
        vendorName: vendor2.name,
        city: 'Mumbai',
        availableCities: ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad'],
        sku: 'APP-REF-001',
        totalStock: 14,
        availableStock: 10,
        rentedStock: 4,
        maintenanceStock: 0,
        monthlyRent: 999,
        deposit: 2500,
        tenurePrices: { '3': 999, '6': 849, '9': 779, '12': 699 },
        images: [
          'https://images.unsplash.com/photo-1571175432267-efb92b4c6831?w=800'
        ],
        featured: true,
        rating: 4.9,
        reviewCount: 62,
        approved: true
      },
      {
        title: 'Fully Automatic Front-Load Washing Machine 7kg',
        slug: 'fully-automatic-front-load-washing-machine-7kg',
        category: 'appliances',
        type: 'Washing Machines',
        description: 'Energy efficient front loader with 1400 RPM spin speed, hygiene steam clean cycle, and quiet inverter drive.',
        specifications: { Capacity: '7.0 kg', SpinSpeed: '1400 RPM', EnergyRating: '5 Star' },
        vendor: vendor2._id,
        vendorName: vendor2.name,
        city: 'Mumbai',
        availableCities: ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Pune'],
        sku: 'APP-WAS-002',
        totalStock: 16,
        availableStock: 12,
        rentedStock: 4,
        maintenanceStock: 0,
        monthlyRent: 899,
        deposit: 2200,
        tenurePrices: { '3': 899, '6': 789, '9': 719, '12': 649 },
        images: [
          'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800'
        ],
        featured: true,
        rating: 4.8,
        reviewCount: 45,
        approved: true
      },
      {
        title: '55" 4K Ultra HD Smart LED TV',
        slug: '55-4k-ultra-hd-smart-led-tv',
        category: 'appliances',
        type: 'TVs',
        description: 'Cinematic 55-inch 4K HDR Smart TV with Dolby Atmos sound, bezel-less design, and built-in OTT apps (Netflix, Prime, Hotstar).',
        specifications: { DisplaySize: '55 inch (139 cm)', Resolution: '4K Ultra HD (3840 x 2160)', Sound: '20W Dolby Atmos' },
        vendor: vendor2._id,
        vendorName: vendor2.name,
        city: 'Bengaluru',
        availableCities: ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Chennai'],
        sku: 'APP-TV-003',
        totalStock: 10,
        availableStock: 7,
        rentedStock: 3,
        maintenanceStock: 0,
        monthlyRent: 1199,
        deposit: 3000,
        tenurePrices: { '3': 1199, '6': 1049, '9': 949, '12': 849 },
        images: [
          'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800'
        ],
        featured: true,
        rating: 4.9,
        reviewCount: 71,
        approved: true
      },
      {
        title: '1.5 Ton 5-Star Inverter Split AC',
        slug: '1-5-ton-5-star-inverter-split-ac',
        category: 'appliances',
        type: 'Appliances',
        description: 'High-cooling 1.5 Ton 5-Star Dual Inverter Split AC with PM 2.5 air purification filter and 100% copper condenser coil.',
        specifications: { Capacity: '1.5 Ton', StarRating: '5 Star Inverter', Condenser: '100% Copper Coil' },
        vendor: vendor2._id,
        vendorName: vendor2.name,
        city: 'Bengaluru',
        availableCities: ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Chennai'],
        sku: 'APP-AC-004',
        totalStock: 18,
        availableStock: 14,
        rentedStock: 4,
        maintenanceStock: 0,
        monthlyRent: 1499,
        deposit: 3500,
        tenurePrices: { '3': 1499, '6': 1299, '9': 1199, '12': 1099 },
        images: [
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800'
        ],
        featured: false,
        rating: 4.7,
        reviewCount: 39,
        approved: true
      },

      // FITNESS
      {
        title: 'Commercial Motorized Treadmill (3.0 HP Peak)',
        slug: 'commercial-motorized-treadmill-3hp',
        category: 'fitness',
        type: 'Fitness',
        description: 'Heavy-duty motorized treadmill featuring 15 auto-incline levels, shock-absorbing running deck, and heart rate sensors.',
        specifications: { Motor: '3.0 HP Peak DC Motor', SpeedRange: '1 - 16 km/h', MaxUserWeight: '120 kg' },
        vendor: vendor3._id,
        vendorName: vendor3.name,
        city: 'Delhi NCR',
        availableCities: ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad'],
        sku: 'FIT-TRE-001',
        totalStock: 8,
        availableStock: 6,
        rentedStock: 2,
        maintenanceStock: 0,
        monthlyRent: 1299,
        deposit: 3000,
        tenurePrices: { '3': 1299, '6': 1149, '9': 1029, '12': 929 },
        images: [
          'https://images.unsplash.com/photo-1576678927484-cc909957088c?w=800'
        ],
        featured: true,
        rating: 4.8,
        reviewCount: 31,
        approved: true
      },
      {
        title: 'Magnetic Resistance Exercise Spin Bike',
        slug: 'magnetic-resistance-exercise-spin-bike',
        category: 'fitness',
        type: 'Fitness',
        description: 'Whisper-quiet magnetic resistance indoor cycling exercise bike with adjustable handlebar, comfortable saddle, and digital metric screen.',
        specifications: { Flywheel: '12 kg Precision Steel', Resistance: 'Infinite Magnetic Dial', Display: 'Time, Distance, Speed, Calories' },
        vendor: vendor3._id,
        vendorName: vendor3.name,
        city: 'Delhi NCR',
        availableCities: ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Pune'],
        sku: 'FIT-BIK-002',
        totalStock: 10,
        availableStock: 8,
        rentedStock: 2,
        maintenanceStock: 0,
        monthlyRent: 699,
        deposit: 1500,
        tenurePrices: { '3': 699, '6': 599, '9': 539, '12': 479 },
        images: [
          'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800'
        ],
        featured: false,
        rating: 4.7,
        reviewCount: 26,
        approved: true
      },

      // PACKAGES
      {
        title: '1BHK Essential Living Package',
        slug: '1bhk-essential-living-package',
        category: 'packages',
        type: 'Packages',
        description: 'Complete home setup for 1BHK apartment: Solid Queen Bed + Mattress, 3-Seater Leatherette Sofa, 260L Double Door Fridge, and 7kg Washer.',
        specifications: { PackageIncludes: 'Queen Bed + Mattress, 3-Seater Sofa, 260L Refrigerator, 7kg Washing Machine', SetupFee: '100% FREE Doorstep Setup' },
        vendor: vendor1._id,
        vendorName: vendor1.name,
        city: 'Bengaluru',
        availableCities: ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune'],
        sku: 'PKG-1BHK-001',
        totalStock: 10,
        availableStock: 7,
        rentedStock: 3,
        maintenanceStock: 0,
        monthlyRent: 3499,
        deposit: 5000,
        tenurePrices: { '3': 3499, '6': 2999, '9': 2799, '12': 2499 },
        images: [
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'
        ],
        featured: true,
        rating: 4.9,
        reviewCount: 89,
        approved: true
      },
      {
        title: 'Work From Home Ultimate Setup',
        slug: 'work-from-home-ultimate-setup',
        category: 'packages',
        type: 'Packages',
        description: 'Boost your productivity with an Ergonomic Mesh Chair, Solid Oak Desk, and 27" Full HD IPS Monitor combo.',
        specifications: { Includes: 'Ergonomic Chair, Oak Desk, 27" IPS Monitor, Power Strip', Warranty: 'Full Maintenance Included' },
        vendor: vendor1._id,
        vendorName: vendor1.name,
        city: 'Bengaluru',
        availableCities: ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune'],
        sku: 'PKG-WFH-002',
        totalStock: 15,
        availableStock: 11,
        rentedStock: 4,
        maintenanceStock: 0,
        monthlyRent: 1499,
        deposit: 2500,
        tenurePrices: { '3': 1499, '6': 1299, '9': 1169, '12': 1049 },
        images: [
          'https://images.unsplash.com/photo-1580481072645-022f9a6d1276?w=800'
        ],
        featured: true,
        rating: 4.9,
        reviewCount: 76,
        approved: true
      }
    ]);

    console.log(`[Seed] Product catalog populated with ${products.length} high-quality items.`);

    // ---------------------------------------------------------
    // 6. REALISTIC RENTAL ORDERS
    // ---------------------------------------------------------
    const order1 = await RentalOrder.create({
      rentalCode: 'RE-2026-881920',
      customer: customer1._id,
      customerName: customer1.name,
      customerEmail: customer1.email,
      customerPhone: customer1.phone,
      product: products[0]._id,
      productTitle: products[0].title,
      productCategory: products[0].category,
      productImage: products[0].images[0],
      vendor: vendor1._id,
      tenureMonths: 6,
      monthlyRent: 499,
      deposit: 1000,
      deliveryFee: 0,
      taxes: 45,
      totalPaidToday: 1544,
      deliveryDate: '2026-07-28',
      deliveryAddress: customer1.addresses[0].street,
      city: 'Bengaluru',
      pincode: '560102',
      status: 'CONFIRMED',
      isStockDecremented: true,
      startDate: '2026-07-28',
      endDate: '2027-01-28',
      nextPaymentDate: '2026-08-28',
      trackingTimeline: [
        { label: 'Order Placed', description: 'Upfront payment received', timestamp: '2026-07-25T10:00:00Z', completed: true, current: false },
        { label: 'Order Confirmed', description: 'Vendor assigned and quality checked', timestamp: '2026-07-26T14:30:00Z', completed: true, current: true },
        { label: 'Out for Delivery', description: 'Dispatched with partner Rajesh Kumar', timestamp: '', completed: false, current: false },
        { label: 'Delivered & Installed', description: 'Free doorstep setup completed', timestamp: '', completed: false, current: false }
      ]
    });

    const order2 = await RentalOrder.create({
      rentalCode: 'RE-2026-904112',
      customer: customer2._id,
      customerName: customer2.name,
      customerEmail: customer2.email,
      customerPhone: customer2.phone,
      product: products[5]._id, // Refrigerator
      productTitle: products[5].title,
      productCategory: products[5].category,
      productImage: products[5].images[0],
      vendor: vendor2._id,
      tenureMonths: 12,
      monthlyRent: 699,
      deposit: 2500,
      deliveryFee: 0,
      taxes: 62,
      totalPaidToday: 3261,
      deliveryDate: '2026-06-10',
      deliveryAddress: customer2.addresses[0].street,
      city: 'Mumbai',
      pincode: '400101',
      status: 'DELIVERED',
      isStockDecremented: true,
      startDate: '2026-06-10',
      endDate: '2027-06-10',
      nextPaymentDate: '2026-09-10',
      trackingTimeline: [
        { label: 'Order Placed', description: 'Payment verified', timestamp: '2026-06-08T11:20:00Z', completed: true, current: false },
        { label: 'Order Confirmed', description: 'Partner assigned', timestamp: '2026-06-08T16:00:00Z', completed: true, current: false },
        { label: 'Out for Delivery', description: 'Dispatched with Vikram Singh', timestamp: '2026-06-10T09:00:00Z', completed: true, current: false },
        { label: 'Delivered & Installed', description: 'Installed successfully', timestamp: '2026-06-10T11:45:00Z', completed: true, current: true }
      ]
    });

    console.log('[Seed] Rental Orders seeded with tracking histories.');

    // ---------------------------------------------------------
    // 7. MAINTENANCE TICKETS
    // ---------------------------------------------------------
    await MaintenanceTicket.create({
      ticketCode: 'TKT-2026-00102',
      order: order2._id,
      customer: customer2._id,
      customerName: customer2.name,
      customerPhone: customer2.phone,
      vendor: vendor2._id,
      product: products[5]._id,
      productTitle: products[5].title,
      technicianName: 'Suresh Service Tech',
      technicianPhone: '+91 99999 88888',
      issueType: 'Routine Cooling Maintenance',
      description: 'Scheduled semi-annual filter cleaning and gas pressure check.',
      priority: 'LOW',
      status: 'RESOLVED',
      scheduledAppointment: '2026-07-15 14:00',
      resolutionNotes: 'Cooling coils cleaned, gas pressure verified optimal at 120 PSI.',
      resolvedAt: new Date('2026-07-15T15:30:00Z')
    });

    console.log('[Seed] Maintenance tickets seeded.');
    console.log('---------------------------------------------------------');
    console.log('✅ DATABASE SEED COMPLETED SUCCESSFULLY!');
    console.log('---------------------------------------------------------');
    console.log('Provisioned Credentials for Testing:');
    console.log(`• Admin Account:    ${adminEmail} / ${adminPassword}`);
    console.log('• Vendor Account:   vendor@rentease.com / VendorPassword123!');
    console.log('• Customer Account: customer@rentease.com / CustomerPassword123!');
    console.log('---------------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
}

seedDatabase();
