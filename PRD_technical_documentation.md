# RentEase – Product Requirement Document & Technical Documentation

This document serves as the official Product Requirement Document (PRD) and Technical Specification manual for **RentEase**, a web-based Furniture & Appliance Rental Platform.

---

## 1. Project Overview & Problem Statement

### Context
Students and working professionals relocate frequently due to education and career movements. Buying new furniture and appliances involves high upfront costs, transportation logistics, and resale challenges during subsequent relocations. 

**RentEase** offers a monthly rental subscription framework for essential furniture and appliances, delivering flexibility, affordability, and repair assistance to urban dwellers.

### Problem Statement
Current renters face several challenges:
- High upfront purchasing expenses.
- Complex and expensive moving logistics.
- Lack of customizable rental tenures.
- Limited availability of trusted local inventory.
- Poor maintenance and repair options.

### Objectives
- Provide affordable, predictable monthly subscription alternatives.
- Implement flexible tenure configurations (e.g., 3, 6, 12 months).
- Streamline delivery, assembly, and relocation scheduling.
- Increase sustainability by extending the life cycle of home products.

---

## 2. Product Scope

### In-Scope
- Responsive, mobile-first web interface.
- Categorized product inventory (Furniture & Appliances).
- Flexible lease options with clear security deposit breakdowns.
- Delivery scheduling and address capture during checkout.
- Maintenance logging and remediation ticket routing.
- Real-time KPI panels for inventory vendors.

### Out-of-Scope
- Cross-border rental structures.
- Advanced machine-learning pricing calculators.
- User-to-user second-hand resale marketplace.
- Native mobile applications (iOS/Android).

---

## 3. Data Schema & Models

The system is powered by a lightweight, asynchronous JSON database driver. The schema configurations are structured as follows:

### 3.1 User Model
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique user ID |
| `name` | String | User's full name |
| `email` | String | Lowercase unique email address |
| `password` | String | Hashed password string (bcrypt) |
| `role` | String | Either `tenant` or `landlord` |
| `createdAt` | Date String | ISO timestamp of registration |

### 3.2 Product Model
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique product identifier |
| `title` | String | Product name |
| `description`| String | Detailed technical description |
| `price` | Number | Monthly rental subscription fee ($) |
| `deposit` | Number | Refundable upfront security deposit ($) |
| `category` | String | `furniture` or `appliances` |
| `type` | String | Sub-types: `bed`, `sofa`, `table`, `fridge`, `washing machine`, `TV` |
| `tenures` | Array | Supported term values (e.g., `[3, 6, 12]`) |
| `imageUrl` | String | Path to catalog image asset |
| `ownerId` | String | User ID of the listing vendor |
| `isAvailable`| Boolean | True if the product is in-stock and not rented |

### 3.3 Rental Order Model
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique rental order identifier |
| `productId` | String | Linked product ID |
| `tenantId` | String | User ID of renting tenant |
| `tenantName` | String | Display name of renting tenant |
| `landlordId` | String | User ID of the product vendor |
| `tenure` | Number | Selected lease tenure (months) |
| `deliveryDate`| String | Selected delivery date |
| `deliveryAddress`| String | Target street address for shipping |
| `totalPrice` | Number | Calculated upfront invoice total |
| `status` | String | State: `pending`, `approved`, `declined`, `completed` |

### 3.4 Maintenance Ticket Model
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique support ticket identifier |
| `productId` | String | Linked product ID |
| `tenantId` | String | User ID of filing tenant |
| `tenantName` | String | Name of filing tenant |
| `landlordId` | String | Vendor ID responsible for fixing the item |
| `description`| String | Explanation of the defect |
| `severity` | String | Priority: `low`, `medium`, `high` |
| `status` | String | Progress: `pending`, `in-progress`, `resolved` |

---

## 4. API Endpoints

### 4.1 Authentication Route (`/api/auth`)
- `POST /register`: Registers new users and returns a JWT token.
- `POST /login`: Validates password credentials and returns a JWT token.
- `GET /profile`: Secures profile data (requires JWT Authorization header).

### 4.2 Product Inventory Route (`/api/products`)
- `GET /`: Lists catalog products with query filters (`category`, `type`, `minPrice`, `maxPrice`, `search`).
- `GET /:id`: Retrieves detailed info on a single product.
- `POST /`: Lists a new item (requires vendor role).
- `PUT /:id`: Modifies item details (requires vendor owner auth).
- `DELETE /:id`: Deletes item listing (requires vendor owner auth).

### 4.3 Rental Subscription Route (`/api/rentals`)
- `GET /`: Retrieves user-role specific orders list.
- `POST /`: Creates a pending lease request (requires tenant role).
- `PATCH /:id`: Modifies rental status (requires vendor owner authorization).

### 4.4 Maintenance Logs Route (`/api/maintenance`)
- `GET /`: Retrieves active tickets list.
- `POST /`: Submits a support repair request (requires tenant role).
- `PATCH /:id`: Modifies remediation ticket status (requires vendor auth).

---

## 5. System Execution

To boot the backend server (Port 5000) and the frontend Vite environment (Port 5173):
```bash
npm run install-all
npm run dev
```
Explore the app at `http://localhost:5173`.
