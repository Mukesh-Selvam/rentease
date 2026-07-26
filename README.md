# RentEase — Furniture & Appliance Rental Platform for India (MERN Stack)

**Tagline:** *“Make every home feel ready.”*

RentEase is a production-ready, full-stack MERN (MongoDB, Express, React, Node.js) web application built for urban professionals, students, and families relocating across major tech hubs in India (Bengaluru, Mumbai, Delhi NCR, Pune, Hyderabad).

It provides a monthly subscription model for essential home furniture and appliances with flexible tenure options (3, 6, 9, and 12 months), free doorstep delivery, transparent security deposits, recurring rent schedules, doorstep maintenance support, and city relocation assistance.

---

## 🌟 Architecture & Tech Stack

- **Frontend (`/client`)**: React 19 + Vite + Tailwind CSS + Lucide Icons + React Router DOM.
- **Backend (`/server`)**: Node.js + Express + Mongoose (MongoDB) REST API.
- **Database**: MongoDB (Local or MongoDB Atlas) with Mongoose schemas, indexes, and validation.
- **Authentication**: JWT with Bearer tokens / HTTP-only cookies, password hashing via bcrypt, role-based authorization middleware.
- **Payment Gateway**: Razorpay integration with server-side validated pricing, signature verification, webhooks, and idempotency protection.
- **Portals**: Dedicated role-based portals for **Customer**, **Vendor**, and **Admin**.

---

## 🔑 Standardized Roles & Environment Seeding

| Role | Email | Password | Access & Responsibilities |
| :--- | :--- | :--- | :--- |
| **CUSTOMER** | `customer@rentease.com` | `CustomerPassword123!` | Browse catalog, pincode serviceability checker, 3/6/9/12mo tenure pricing, cart, checkout with Razorpay, customer dashboard (active rentals, monthly bill schedules, maintenance tickets, extension/return/relocation requests). |
| **VENDOR** | `vendor@rentease.com` | `VendorPassword123!` | Vendor analytics (MRR, stock utilization), product inventory management (SKU, stock counts: available/rented/maintenance, images), order fulfillment, technician assignment, return pickup & damage inspection workflow. |

> **Note on Admin Provisioning**: Platform Admin accounts are initialized directly into MongoDB via environment variables (`ADMIN_EMAIL` and `ADMIN_PASSWORD`) using the database seed script. Admin login is performed using the standard sign-in interface without public exposure.

---

## 📦 Core Data Models (Mongoose)

1. **User**: Standardized roles `CUSTOMER`, `VENDOR`, `ADMIN`. Indexed email, hashed password, KYC status, saved address book.
2. **Product**: SKU, vendor reference, category (`furniture`, `appliances`, `packages`), tenure rates map, stock breakdown (`totalStock`, `availableStock`, `rentedStock`), condition, specifications, city.
3. **Cart & CartItem**: Customer cart with tenure selection and calculated monthly rent.
4. **RentalOrder**: Unique `rentalCode`, customer ID, vendor ID, line items, tenure, delivery date/slot/address, status enum (`CONFIRMED`, `ACTIVE`, `RETURN_REQUESTED`, `CANCELLED`).
5. **Payment & Invoice**: Razorpay order ID, payment ID, signature, status, invoice number.
6. **RentalBilling**: Monthly recurring rent schedules, due dates, paid status.
7. **MaintenanceTicket**: Ticket code, customer ID, vendor ID, issue type, priority (`LOW`, `MEDIUM`, `HIGH`), status (`PENDING`, `IN_PROGRESS`, `RESOLVED`).
8. **ServiceArea**: City name, supported pincodes, delivery fee, min lead time.
9. **DamageClaim**: Return inspection checklist, damage photos, deposit deduction, refund amount calculation.

---

## 🛠️ Installation & Setup Instructions

### 1. Prerequisites
- Node.js v18+ and `npm`
- MongoDB local instance (`mongodb://127.0.0.1:27017/rentease`) or MongoDB Atlas URI

### 2. Backend Environment Setup (`/server/.env`)

Create `.env` inside the `server/` folder:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/rentease
JWT_SECRET=your_secure_jwt_secret_key_here
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
ADMIN_EMAIL=admin@rentease.com
ADMIN_PASSWORD=YourSecureAdminPassword123!
```

### 3. Database Seeding

Run the seed script from the `server` directory:

```bash
cd server
npm run seed
```

This will seed:
- System Admin account from environment variables
- Demo Vendor account (`vendor@rentease.com`)
- Demo Customer account (`customer@rentease.com`)
- Sample catalog items across Furniture, Appliances, and Room Packages
- Service area pincodes & delivery schedules
- Active rental subscriptions & invoices

### 4. Running the Development Servers

```bash
# Terminal 1: Backend Server (Port 5000)
cd server
npm start

# Terminal 2: Frontend Client (Port 5173)
cd client
npm run dev
```

---

## 🧪 Running Tests & Verification

```bash
# Server API Vitest suite
cd server
npm test

# Client Vitest suite
cd client
npx vitest run

# Client ESLint verification
cd client
npm run lint

# Production bundle build
cd client
npm run build
```
