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

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rentease';

async function seedDatabase() {
  try {
    console.log(`[Seed] Connecting to MongoDB: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('[Seed Error] Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment variables.');
      console.error('[Seed Error] Please configure ADMIN_EMAIL and ADMIN_PASSWORD in server/.env before running seed.');
      process.exit(1);
    }

    // Password Policy Validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(adminPassword)) {
      console.error('[Seed Error] ADMIN_PASSWORD does not meet security requirements.');
      console.error('[Seed Error] Must be at least 8 characters long and contain uppercase, lowercase, number, and special character (@$!%*?&).');
      process.exit(1);
    }

    // Clear existing collections
    await User.deleteMany({});
    await Product.deleteMany({});
    await RentalOrder.deleteMany({});
    await MaintenanceTicket.deleteMany({});
    await DamageClaim.deleteMany({});
    await ServiceArea.deleteMany({});
    await DeliveryPartner.deleteMany({});
    await Coupon.deleteMany({});

    console.log('[Seed] Cleared existing collections.');

    // 1. Seed Accounts (Pass plain passwords so User pre('save') hook hashes them ONCE)
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

    const vendor = await User.create({
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

    const customer = await User.create({
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

    console.log('[Seed] Accounts created: Customer, Vendor, and Secret Admin provisioned safely.');

    // 2. Service Areas
    await ServiceArea.insertMany([
      { city: 'Bengaluru', active: true, pincodes: ['560001', '560102', '560034', '560037', '560068', '560100'] },
      { city: 'Mumbai', active: true, pincodes: ['400001', '400050', '400076', '400093'] },
      { city: 'Delhi NCR', active: true, pincodes: ['110001', '110020', '122001', '201301'] },
      { city: 'Hyderabad', active: true, pincodes: ['500001', '500032', '500081'] },
      { city: 'Pune', active: true, pincodes: ['411001', '411014', '411057'] }
    ]);

    // 3. Coupons
    await Coupon.insertMany([
      {
        code: 'FIRSTRENT10',
        discountType: 'FLAT',
        discountValue: 300,
        minOrderValue: 1000,
        maxDiscount: 300,
        expiryDate: new Date('2030-12-31'),
        active: true
      },
      {
        code: 'RENTFEST20',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        minOrderValue: 2000,
        maxDiscount: 500,
        expiryDate: new Date('2030-12-31'),
        active: true
      }
    ]);

    // 4. Products
    const products = await Product.insertMany([
      {
        title: 'Ergonomic Mesh Office Chair',
        slug: 'ergonomic-mesh-office-chair',
        category: 'furniture',
        description: 'High-back ergonomic mesh chair with adjustable lumbar support, 3D armrests, and synchronous tilt mechanism.',
        specifications: { Dimensions: '65W x 65D x 118H cm', Material: 'High-density Mesh & Nylon Base', Color: 'Matte Black' },
        vendor: vendor._id,
        availableCities: ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune'],
        sku: 'FUR-OFF-001',
        availableStock: 15,
        rentedStock: 5,
        maintenanceStock: 0,
        pricing: [
          { tenureMonths: 3, monthlyRent: 599, deposit: 1000 },
          { tenureMonths: 6, monthlyRent: 499, deposit: 1000 },
          { tenureMonths: 9, monthlyRent: 449, deposit: 1000 },
          { tenureMonths: 12, monthlyRent: 399, deposit: 1000 }
        ],
        images: ['https://images.unsplash.com/photo-1580481072645-022f9a6d1276?w=800'],
        featured: true,
        rating: 4.8,
        reviewCount: 42,
        approved: true
      },
      {
        title: 'Single Door Refrigerator 190L (5 Star)',
        slug: 'single-door-refrigerator-190l',
        category: 'appliances',
        description: 'Energy-efficient 5-star inverter single door refrigerator with fast ice making and toughened glass shelves.',
        specifications: { Capacity: '190 Litres', EnergyRating: '5 Star Inverter', DefrostType: 'Direct Cool' },
        vendor: vendor._id,
        availableCities: ['Bengaluru', 'Mumbai', 'Delhi NCR'],
        sku: 'APP-REF-002',
        availableStock: 8,
        rentedStock: 3,
        maintenanceStock: 0,
        pricing: [
          { tenureMonths: 3, monthlyRent: 899, deposit: 2000 },
          { tenureMonths: 6, monthlyRent: 749, deposit: 2000 },
          { tenureMonths: 9, monthlyRent: 699, deposit: 2000 },
          { tenureMonths: 12, monthlyRent: 649, deposit: 2000 }
        ],
        images: ['https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800'],
        featured: true,
        rating: 4.7,
        reviewCount: 28,
        approved: true
      },
      {
        title: '1BHK Essential Living Package',
        slug: '1bhk-essential-living-package',
        category: 'packages',
        description: 'Complete living solution for 1BHK: Queen Bed + Mattress, 3-Seater Sofa, 190L Fridge, and Washing Machine.',
        specifications: { PackageIncludes: 'Queen Bed, Mattress, 3-Seater Sofa, 190L Fridge, 6.5kg Washing Machine', SetupFee: 'FREE' },
        vendor: vendor._id,
        availableCities: ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune'],
        sku: 'PKG-1BHK-001',
        availableStock: 10,
        rentedStock: 2,
        maintenanceStock: 0,
        pricing: [
          { tenureMonths: 3, monthlyRent: 3499, deposit: 5000 },
          { tenureMonths: 6, monthlyRent: 2999, deposit: 5000 },
          { tenureMonths: 9, monthlyRent: 2799, deposit: 5000 },
          { tenureMonths: 12, monthlyRent: 2499, deposit: 5000 }
        ],
        images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'],
        featured: true,
        rating: 4.9,
        reviewCount: 64,
        approved: true
      }
    ]);

    // 5. Seed Order
    const sampleOrder = await RentalOrder.create({
      rentalCode: 'RE-2026-881920',
      customer: customer._id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      product: products[0]._id,
      productTitle: products[0].title,
      productCategory: products[0].category,
      productImage: products[0].images[0],
      vendor: vendor._id,
      tenureMonths: 6,
      monthlyRent: 499,
      deposit: 1000,
      deliveryFee: 0,
      taxes: 45,
      totalPaidToday: 1544,
      deliveryDate: '2026-07-28',
      deliveryAddress: 'Flat 402, Sunshine Heights, HSR Layout Sector 1',
      city: 'Bengaluru',
      pincode: '560102',
      status: 'CONFIRMED',
      isStockDecremented: true,
      startDate: '2026-07-28',
      endDate: '2027-01-28',
      nextPaymentDate: '2026-08-28',
      trackingTimeline: [
        { label: 'Order Placed', description: 'Upfront payment received', timestamp: new Date().toISOString(), completed: true, current: false },
        { label: 'Order Confirmed', description: 'Vendor assigned', timestamp: new Date().toISOString(), completed: true, current: true }
      ]
    });

    console.log('[Seed] Sample data seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
}

seedDatabase();
