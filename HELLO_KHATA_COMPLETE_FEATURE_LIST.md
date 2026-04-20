# HelloKhata Complete Feature List
## হ্যালো খাতা সম্পূর্ণ ফিচার তালিকা

**Document Version:** 1.0  
**Generated:** March 2025  
**Purpose:** Mobile App Development Prompt Reference

---

## Table of Contents

1. [Authentication & User Management](#1-authentication--user-management)
2. [Business & Multi-Branch](#2-business--multi-branch)
3. [Parties (Customers/Suppliers)](#3-parties-customerssuppliers)
4. [Inventory Management](#4-inventory-management)
5. [Batch Tracking & Expiry](#5-batch-tracking--expiry)
6. [Sales Management](#6-sales-management)
7. [Purchases Management](#7-purchases-management)
8. [Quotations](#8-quotations)
9. [Returns Management](#9-returns-management)
10. [Payments & Collections](#10-payments--collections)
11. [Expenses Management](#11-expenses-management)
12. [Accounts & Cash Management](#12-accounts--cash-management)
13. [Credit Control](#13-credit-control)
14. [Dashboard & Analytics](#14-dashboard--analytics)
15. [Reports Module](#15-reports-module)
16. [AI Assistant (Voice & Chat)](#16-ai-assistant-voice--chat)
17. [Settings & Configuration](#17-settings--configuration)
18. [Notifications & Alerts](#18-notifications--alerts)
19. [Data Management](#19-data-management)
20. [Subscription & Billing](#20-subscription--billing)
21. [Audit & Compliance](#21-audit--compliance)
22. [Support System](#22-support-system)
23. [Feature Gates & Plans](#23-feature-gates--plans)

---

## 1. Authentication & User Management
### অথেন্টিকেশন ও ইউজার ম্যানেজমেন্ট

### 1.1 OTP-Based Phone Authentication
**বাংলা:** ওটিপি ভিত্তিক ফোন অথেন্টিকেশন

**What it does:**
- Phone number-based authentication without passwords
- OTP verification for secure login
- Session management with JWT tokens

**Key Sub-features:**
- Send OTP via SMS
- Verify OTP code
- Auto-login on valid OTP
- Session refresh mechanism
- Logout functionality

**API Endpoints:**
- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP and create session
- `POST /api/auth/logout` - Clear session
- `POST /api/auth/refresh-session` - Refresh session data
- `POST /api/v1/auth/login` - Alternative login endpoint
- `POST /api/v1/auth/register` - New user registration
- `POST /api/v1/auth/logout` - Logout endpoint
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/reset-password` - Password reset

**Database Models:**
- `User` - User profile, phone, role, permissions
- `Otp` - OTP codes with expiry tracking
- `Business` - Business context for user

### 1.2 User Profile Management
**বাংলা:** ইউজার প্রোফাইল ম্যানেজমেন্ট

**What it does:**
- View and edit personal profile
- Update name, email, phone
- Change password functionality

**Key Sub-features:**
- Profile viewing
- Profile editing
- Password change with validation

**API Endpoints:**
- `GET /api/user` - Get user profile
- `PATCH /api/user` - Update user profile
- `PATCH /api/user/password` - Change password

**Database Models:**
- `User` - name, email, phone, password, roleId

### 1.3 Staff Management
**বাংলা:** স্টাফ ম্যানেজমেন্ট

**What it does:**
- Add staff members to business
- Assign roles and permissions
- Activate/deactivate staff accounts

**Key Sub-features:**
- Staff listing
- Add new staff
- Edit staff details
- Delete/deactivate staff
- Role assignment

**API Endpoints:**
- `GET /api/staff` - List all staff
- `POST /api/staff` - Create staff member
- `GET /api/staff/[id]` - Get single staff
- `DELETE /api/staff/[id]` - Delete staff

**Database Models:**
- `User` - Staff accounts
- `Role` - Role assignments

---

## 2. Business & Multi-Branch
### ব্যবসা ও মাল্টি-ব্রাঞ্চ

### 2.1 Business Profile Management
**বাংলা:** ব্যবসার প্রোফাইল ম্যানেজমেন্ট

**What it does:**
- Create and manage business profile
- Configure business details and settings
- Set business preferences

**Key Sub-features:**
- Business name (English & Bangla)
- Business category/type
- Contact details (phone, email, address)
- Logo upload
- Trade license & registration info
- Bank account details
- Currency & timezone settings
- Invoice configuration

**API Endpoints:**
- `GET /api/business` - Get business details
- `PATCH /api/business` - Update business profile

**Database Models:**
- `Business` - Complete business profile

### 2.2 Branch Management
**বাংলা:** শাখা ম্যানেজমেন্ট

**What it does:**
- Create and manage multiple business branches
- Switch between branches
- Branch-specific data isolation

**Key Sub-features:**
- Branch listing
- Create new branch
- Edit branch details
- Delete branch
- Set main branch
- Branch types (main, warehouse, retail, wholesale)
- Branch manager assignment
- Opening cash tracking

**API Endpoints:**
- `GET /api/branches` - List all branches
- `POST /api/branches` - Create branch
- `PATCH /api/branches/[id]` - Update branch
- `DELETE /api/branches/[id]` - Delete branch

**Database Models:**
- `Branch` - Branch details, type, manager
- `User` - Branch assignment

### 2.3 Branch Context System
**বাংলা:** শাখা কন্টেক্সট সিস্টেম

**What it does:**
- Maintain current branch context
- Filter data by branch
- Branch-scoped operations

**Key Sub-features:**
- Branch switching
- Branch-aware queries
- Data isolation per branch

**State Management:**
- `branchStore` - Zustand store for branch context
- `useBranchContext` hook

---

## 3. Parties (Customers/Suppliers)
### পার্টি (কাস্টমার/সাপ্লায়ার)

### 3.1 Party Management
**বাংলা:** পার্টি ম্যানেজমেন্ট

**What it does:**
- Manage customers, suppliers, or both
- Track party balances and transactions
- Maintain party ledger

**Key Sub-features:**
- Party listing with search/filter
- Create new party
- Edit party details
- Delete party
- Party types: customer, supplier, both
- Customer tiers: regular, wholesale, VIP, premium
- Credit limit setting
- Payment terms configuration
- Opening balance setup
- Party categories
- Risk level assessment

**API Endpoints:**
- `GET /api/parties` - List parties with filters
- `POST /api/parties` - Create party
- `GET /api/parties/[id]` - Get party details
- `PATCH /api/parties/[id]` - Update party
- `DELETE /api/parties/[id]` - Delete party

**Database Models:**
- `Party` - Party profile, balance, credit settings
- `PartyCategory` - Party categorization
- `PartyLedger` - Transaction history

### 3.2 Party Categories
**বাংলা:** পার্টি ক্যাটাগরি

**What it does:**
- Organize parties by categories
- Category-based filtering

**Key Sub-features:**
- Category listing
- Create category
- Update category
- Delete category
- Color coding

**API Endpoints:**
- `GET /api/party-categories` - List categories
- `POST /api/party-categories` - Create category
- `PUT /api/party-categories/[id]` - Update category
- `DELETE /api/party-categories/[id]` - Delete category

**Database Models:**
- `PartyCategory` - Category details

### 3.3 Party Ledger
**বাংলা:** পার্টি লেজার

**What it does:**
- Complete transaction history per party
- Balance tracking over time

**Key Sub-features:**
- Transaction history
- Balance tracking
- Entry types: sale, purchase, payment, adjustment, opening
- Date-based filtering
- Reference linking

**API Endpoints:**
- `GET /api/party-ledger` - Get ledger entries

**Database Models:**
- `PartyLedger` - Transaction records
- `Party` - Running balance

### 3.4 Aliases & Search
**বাংলা:** উপনাম ও সার্চ

**What it does:**
- Multiple name aliases for parties
- Quick search by alias or name

**Key Sub-features:**
- Store multiple aliases
- Search by any alias
- Voice command matching

**Database Models:**
- `PartyAlias` - Aliases for voice/search

---

## 4. Inventory Management
### ইনভেন্টরি ম্যানেজমেন্ট

### 4.1 Item Management
**বাংলা:** পণ্য ম্যানেজমেন্ট

**What it does:**
- Complete product catalog management
- Stock tracking and valuation
- Multi-price tier support

**Key Sub-features:**
- Item listing with search/filter
- Create new item
- Edit item details
- Delete item
- SKU and barcode support
- Multiple pricing: cost, retail, wholesale, VIP, minimum
- Stock tracking
- Min/max stock levels
- Category assignment
- Unit of measurement
- Item image
- Active/inactive status
- Track batch setting

**API Endpoints:**
- `GET /api/items` - List items with filters
- `POST /api/items` - Create item
- `GET /api/items/[id]` - Get item details
- `PUT /api/items/[id]` - Update item
- `DELETE /api/items/[id]` - Delete item

**Database Models:**
- `Item` - Item details, pricing, stock
- `Category` - Item categories
- `Unit` - Unit definitions
- `ItemVariant` - Item variations

### 4.2 Item Categories
**বাংলা:** পণ্য ক্যাটাগরি

**What it does:**
- Hierarchical category structure
- Category-based organization

**Key Sub-features:**
- Category listing
- Create category
- Update category
- Delete category
- Parent-child hierarchy
- Item count per category

**API Endpoints:**
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PATCH /api/categories/[id]` - Update category
- `DELETE /api/categories/[id]` - Delete category

**Database Models:**
- `Category` - Category with hierarchy

### 4.3 Units of Measurement
**বাংলা:** পরিমাপের একক

**What it does:**
- Define measurement units
- Unit conversion support

**Key Sub-features:**
- Unit listing
- Create unit
- Update unit
- Delete unit
- Base unit marking
- Conversion factors

**API Endpoints:**
- `GET /api/units` - List units
- `POST /api/units` - Create unit
- `PATCH /api/units/[id]` - Update unit
- `DELETE /api/units/[id]` - Delete unit

**Database Models:**
- `Unit` - Unit definitions with conversions

### 4.4 Item Variants
**বাংলা:** পণ্য ভ্যারিয়েন্ট

**What it does:**
- Manage product variations
- Size, color, style options

**Key Sub-features:**
- Variant creation
- Variant-level pricing
- Variant stock tracking

**API Endpoints:**
- `GET /api/items/variants` - List variants
- `POST /api/items/variants` - Create variant

**Database Models:**
- `ItemVariant` - Variant details

### 4.5 Stock Ledger
**বাংলা:** স্টক লেজার

**What it does:**
- Complete stock movement history
- Audit trail for inventory

**Key Sub-features:**
- Stock movement tracking
- Entry types: purchase, sale, adjustment, transfer, return
- Previous and new stock recording
- Reference linking
- Branch-wise tracking

**API Endpoints:**
- `GET /api/stock-ledger` - Get ledger entries

**Database Models:**
- `StockLedger` - Stock movement records

### 4.6 Stock Adjustment
**বাংলা:** স্টক অ্যাডজাস্টমেন্ট

**What it does:**
- Manual stock corrections
- Damage/loss recording

**Key Sub-features:**
- Increase stock
- Decrease stock
- Reason selection
- Notes for adjustment
- Stock ledger entry

**API Endpoints:**
- `POST /api/inventory/adjustment` - Adjust stock

**Adjustment Reasons:**
- Increase: found, return_rejected, counting_correction
- Decrease: damaged, expired, lost, counting_correction

**Database Models:**
- `StockLedger` - Adjustment records

### 4.7 Stock Transfer (Inter-Branch)
**বাংলা:** স্টক ট্রান্সফার

**What it does:**
- Transfer stock between branches
- Track transfer status

**Key Sub-features:**
- Select source branch
- Select destination branch
- Transfer quantity
- Notes
- Stock ledger entries for both branches

**API Endpoints:**
- `POST /api/inventory/transfer` - Transfer stock

**Database Models:**
- `StockLedger` - Transfer records

### 4.8 Import Items
**বাংলা:** পণ্য ইম্পোর্ট

**What it does:**
- Bulk import items from CSV
- Category mapping

**Key Sub-features:**
- CSV file upload
- Column mapping
- Duplicate detection
- Stock ledger for opening stock

**API Endpoints:**
- `POST /api/items/import` - Import items

### 4.9 Master Product Catalog
**বাংলা:** মাস্টার প্রোডাক্ট ক্যাটালগ

**What it does:**
- Global product database
- Quick product search/selection
- Product alias matching

**Key Sub-features:**
- Search master products
- Category listing
- Popular products
- Product aliases

**API Endpoints:**
- `GET /api/master-products/search` - Search products
- `GET /api/master-products/categories` - List categories
- `GET /api/master-products/popular` - Popular products
- `GET /api/master-products/[id]` - Product details

**Database Models:**
- `MasterProduct` - Global product templates
- `MasterCategory` - Global categories
- `MasterBrand` - Global brands
- `MasterProductAlias` - Search aliases

### 4.10 Dead Stock Analysis
**বাংলা:** ডেড স্টক বিশ্লেষণ

**What it does:**
- Identify unsold inventory
- Calculate stuck capital
- Suggest actions

**Key Sub-features:**
- Days without sale tracking
- Stock value calculation
- Suggested actions: discount, return, donate, write_off
- Priority levels

**API Endpoints:**
- `GET /api/inventory/dead-stock` - Dead stock report

**Database Models:**
- `Item` - Last sale date tracking
- `StockLedger` - Sales history

---

## 5. Batch Tracking & Expiry
### ব্যাচ ট্র্যাকিং ও মেয়াদ

### 5.1 Batch Management
**বাংলা:** ব্যাচ ম্যানেজমেন্ট

**What it does:**
- Track inventory by batch
- Monitor expiry dates
- FEFO/FIFO management

**Key Sub-features:**
- Batch listing
- Create batch (auto from purchase)
- Update batch
- Delete batch
- Batch number tracking
- Expiry date monitoring
- Manufacture date
- Cost price per batch
- MRP tracking
- Location tracking
- Status: active, expiring, expired, depleted

**API Endpoints:**
- `GET /api/batches` - List batches
- `POST /api/batches` - Create batch
- `GET /api/batches/[id]` - Batch details
- `PUT /api/batches/[id]` - Update batch
- `DELETE /api/batches/[id]` - Delete batch

**Database Models:**
- `Batch` - Batch details
- `Item` - trackBatch flag

### 5.2 Expiry Alerts
**বাংলা:** মেয়াদ এলার্ট

**What it does:**
- Proactive expiry notifications
- Urgency classification

**Key Sub-features:**
- Days until expiry calculation
- Urgency levels: normal, warning, critical
- Threshold configuration
- Alert summary

**API Endpoints:**
- `GET /api/batches/expiry-alerts` - Get expiry alerts

### 5.3 Available Batches (FEFO)
**বাংলা:** উপলব্ধ ব্যাচ (FEFO)

**What it does:**
- FEFO prioritized batch selection
- Batch allocation for sales

**Key Sub-features:**
- FEFO ordering
- Available quantity check
- Suggested allocation
- Shortage calculation

**API Endpoints:**
- `GET /api/batches/available` - Available batches for item

### 5.4 Batch Reports
**বাংলা:** ব্যাচ রিপোর্ট

**What it does:**
- CSV export of batch data
- Filtered reports

**API Endpoints:**
- `GET /api/batches/report` - Generate CSV report

---

## 6. Sales Management
### সেলস ম্যানেজমেন্ট

### 6.1 Sales Creation (POS)
**বাংলা:** বিক্রি তৈরি (POS)

**What it does:**
- Point of Sale interface
- Quick sales entry
- Customer selection
- Item selection with stock check

**Key Sub-features:**
- Party selection
- Item search and selection
- Quantity input
- Price adjustment
- Discount (item-level and bill-level)
- Tax calculation
- Payment method selection
- Cash/credit/partial payment
- Due amount tracking
- Notes
- Invoice number generation (INV-YYYYMMDD-XXXX)
- Profit calculation

**API Endpoints:**
- `GET /api/sales` - List sales
- `POST /api/sales` - Create sale
- `GET /api/sales/[id]` - Sale details
- `PATCH /api/sales/[id]` - Update sale status

**Database Models:**
- `Sale` - Sale header
- `SaleItem` - Sale line items
- `Party` - Customer reference
- `Item` - Product reference
- `StockLedger` - Stock deduction
- `PartyLedger` - Credit tracking

### 6.2 Sales List & History
**বাংলা:** বিক্রি তালিকা ও ইতিহাস

**What it does:**
- View all sales transactions
- Search and filter

**Key Sub-features:**
- Date range filter
- Party filter
- Status filter
- Search by invoice number
- Detail modal view

### 6.3 Multi-Price Tiers
**বাংলা:** মাল্টি-প্রাইস টিয়ার

**What it does:**
- Apply different price tiers
- Customer-based pricing

**Key Sub-features:**
- Retail price
- Wholesale price
- VIP price
- Minimum price floor
- Customer tier matching

**Database Models:**
- `Item` - Multiple price fields
- `Sale.pricingTier` - Used tier tracking

### 6.4 Credit Sales
**বাংলা:** ক্রেডিট সেলস

**What it does:**
- Sell on credit
- Track receivables

**Key Sub-features:**
- Due amount calculation
- Party balance update
- Party ledger entry
- Credit limit check

### 6.5 Sales Returns
**বাংলা:** বিক্রি রিটার্ন

**What it does:**
- Process customer returns
- Restore stock
- Handle refunds

**Key Sub-features:**
- Select original sale
- Select items to return
- Quantity validation
- Return reason selection
- Refund method: cash, bank, bKash, credit_note, exchange
- Stock restoration
- Party balance adjustment
- Return number generation (SR-YYYY-NNNN)

**API Endpoints:**
- `GET /api/sales/returns` - List returns
- `POST /api/sales/returns` - Create return
- `GET /api/sales/returns?id={id}` - Return details

**Database Models:**
- `SaleReturn` - Return header
- `SaleReturnItem` - Return line items
- `CreditNote` - Credit notes
- `StockLedger` - Stock restoration
- `PartyLedger` - Balance adjustment

### 6.6 Invoice Generation
**বাংলা:** ইনভয়েস জেনারেশন

**What it does:**
- Generate printable invoices
- PDF export
- Thermal printing

**Key Sub-features:**
- A4 paper size
- Thermal paper size
- Bengali/English language
- Business logo
- Invoice prefix/suffix
- Footer notes

**API Endpoints:**
- `GET /api/v1/invoices/[id]/pdf` - Generate PDF
- `GET /api/v1/invoices/[id]/print` - Print invoice
- `GET /api/v1/invoices/[id]/download` - Download PDF

**Database Models:**
- `Sale` - Invoice data
- `Business` - Invoice settings

---

## 7. Purchases Management
### ক্রয় ম্যানেজমেন্ট

### 7.1 Purchase Entry
**বাংলা:** ক্রয় এন্ট্রি

**What it does:**
- Record purchases from suppliers
- Add stock to inventory
- Track supplier dues

**Key Sub-features:**
- Supplier selection
- Item entry
- Cost price input
- Quantity tracking
- Batch information (for batch items)
- Invoice number reference
- GRN number
- Payment mode: cash, credit, partial
- Due amount tracking
- Purchase number generation (PUR-YYYYMMDD-XXXX)
- Automatic stock update
- Automatic batch creation

**API Endpoints:**
- `GET /api/purchases` - List purchases
- `POST /api/purchases` - Create purchase
- `GET /api/purchases/[id]` - Purchase details
- `PATCH /api/purchases/[id]` - Update purchase

**Database Models:**
- `Purchase` - Purchase header
- `PurchaseItem` - Purchase line items
- `Batch` - Batch creation
- `StockLedger` - Stock addition
- `PartyLedger` - Supplier credit

### 7.2 Purchase Orders (PO)
**বাংলা:** ক্রয় অর্ডার

**What it does:**
- Create purchase orders
- Track order status
- Convert to purchase

**Key Sub-features:**
- PO creation
- Supplier selection
- Item list
- Expected delivery date
- Status workflow: draft → submitted → approved → partial → received
- PO to purchase conversion
- PO number generation (PO-YYYYMMDD-XXXX)

**API Endpoints:**
- `GET /api/purchase-orders` - List POs
- `POST /api/purchase-orders` - Create PO
- `PATCH /api/purchase-orders` - Update PO status

**Database Models:**
- `PurchaseOrder` - PO header
- `PurchaseOrderItem` - PO line items

### 7.3 Purchase Returns
**বাংলা:** ক্রয় রিটার্ন

**What it does:**
- Return items to supplier
- Reduce stock
- Track supplier credits

**Key Sub-features:**
- Select original purchase
- Select items to return
- Return reason
- Refund method: cash, bank, debit_note, replacement
- Stock reduction
- Debit note creation
- Return number generation (PR-YYYY-NNNN)

**API Endpoints:**
- `GET /api/purchases/returns` - List returns
- `POST /api/purchases/returns` - Create return

**Database Models:**
- `PurchaseReturn` - Return header
- `PurchaseReturnItem` - Return line items
- `DebitNote` - Debit notes
- `StockLedger` - Stock reduction

---

## 8. Quotations
### কোটেশন

### 8.1 Quotation Management
**বাংলা:** কোটেশন ম্যানেজমেন্ট

**What it does:**
- Create price quotes
- Track quote status
- Convert to sales

**Key Sub-features:**
- Create quotation
- Customer selection
- Item list with pricing
- Discount and tax
- Validity date
- Quotation date
- Status workflow: draft → sent → accepted/rejected → converted
- Convert to sale
- Quotation number generation (QT-YYYY-NNNN)
- Notes

**API Endpoints:**
- `GET /api/quotations` - List quotations
- `POST /api/quotations` - Create quotation
- `GET /api/quotations/[id]` - Quotation details
- `PATCH /api/quotations/[id]` - Update quotation
- `DELETE /api/quotations/[id]` - Delete quotation

**Database Models:**
- `Quotation` - Quotation details

---

## 9. Returns Management
### রিটার্ন ম্যানেজমেন্ট

### 9.1 Sale Returns
**বাংলা:** বিক্রি রিটার্ন

**Key Sub-features:**
- Original sale reference
- Item selection
- Quantity validation
- Return reasons: damaged, wrong_item, not_needed, defective, expired
- Refund methods: cash, bank, bKash, credit_note, exchange
- Stock restoration
- Party balance update

### 9.2 Purchase Returns
**বাংলা:** ক্রয় রিটার্ন

**Key Sub-features:**
- Original purchase reference
- Item selection
- Return reasons: quality_issue, damaged, wrong_item, expired
- Refund methods: cash, bank, debit_note, replacement
- Stock reduction
- Supplier balance update

### 9.3 Credit Notes
**বাংলা:** ক্রেডিট নোট

**Key Sub-features:**
- Create credit notes for customers
- Apply to future sales
- Track note status
- Credit note number generation (CN-YYYY-NNNN)

**API Endpoints:**
- `GET /api/credit-notes` - List credit notes
- `POST /api/credit-notes` - Create credit note
- `POST /api/credit-notes/[id]/apply` - Apply to sale

**Database Models:**
- `CreditNote` - Credit note details

### 9.4 Debit Notes
**বাংলা:** ডেবিট নোট

**Key Sub-features:**
- Create debit notes for suppliers
- Apply to future purchases
- Track note status
- Debit note number generation (DN-YYYY-NNNN)

**API Endpoints:**
- `GET /api/debit-notes` - List debit notes
- `POST /api/debit-notes` - Create debit note
- `POST /api/debit-notes/[id]/apply` - Apply to purchase

**Database Models:**
- `DebitNote` - Debit note details

### 9.5 Returns Analytics
**বাংলা:** রিটার্ন অ্যানালিটিক্স

**API Endpoints:**
- `GET /api/returns/stats` - Return statistics
- `GET /api/returns/reasons` - Reasons breakdown
- `GET /api/returns/trends` - Return trends

---

## 10. Payments & Collections
### পেমেন্ট ও কালেকশন

### 10.1 Payment Recording
**বাংলা:** পেমেন্ট রেকর্ডিং

**What it does:**
- Record payments from customers
- Record payments to suppliers
- Track payment history

**Key Sub-features:**
- Party selection
- Payment type: received (from customer), paid (to supplier)
- Payment mode: cash, card, mobile_banking, bank_transfer, cheque
- Account selection
- Amount entry
- Reference number
- Link to sale/purchase
- Notes
- Party balance update
- Party ledger entry

**API Endpoints:**
- `GET /api/payments` - List payments
- `POST /api/payments` - Record payment

**Database Models:**
- `Payment` - Payment records
- `Party` - Balance update
- `PartyLedger` - Ledger entry
- `Account` - Balance update

### 10.2 Supplier Payments
**বাংলা:** সাপ্লায়ার পেমেন্ট

**API Endpoints:**
- `GET /api/supplier-payments` - List supplier payments
- `POST /api/supplier-payments` - Record supplier payment

### 10.3 Payment Plans (Installments)
**বাংলা:** পেমেন্ট প্ল্যান (কিস্ত)

**What it does:**
- Setup installment payments
- Track payment schedule

**Key Sub-features:**
- Total amount
- Number of installments
- Payment frequency: weekly, monthly
- Due dates
- Payment tracking
- Reminder scheduling

**Database Models:**
- `PaymentPlan` - Payment plan details
- `Installment` - Individual installments

---

## 11. Expenses Management
### খরচ ম্যানেজমেন্ট

### 11.1 Expense Recording
**বাংলা:** খরচ রেকর্ডিং

**What it does:**
- Track business expenses
- Categorize expenses
- Monitor spending

**Key Sub-features:**
- Expense listing
- Create expense
- Edit expense
- Delete expense
- Category selection
- Amount entry
- Description
- Date selection
- Receipt photo upload
- Account selection (auto-deduct from account)

**API Endpoints:**
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/[id]` - Expense details
- `PATCH /api/expenses/[id]` - Update expense
- `DELETE /api/expenses/[id]` - Delete expense

**Database Models:**
- `Expense` - Expense records
- `ExpenseCategory` - Categories
- `Account` - Balance deduction

### 11.2 Expense Categories
**বাংলা:** খরচের ক্যাটাগরি

**Default Categories:**
- Rent (ভাড়া)
- Utilities (ইউটিলিটি)
- Salaries (বেতন)
- Supplies (সাপ্লাই)
- Transport (পরিবহন)
- Marketing (মার্কেটিং)
- Maintenance (রক্ষণাবেক্ষণ)
- Other (অন্যান্য)

**API Endpoints:**
- `GET /api/expenses/categories` - List categories
- `POST /api/expenses/categories` - Create category

**Database Models:**
- `ExpenseCategory` - Category details

---

## 12. Accounts & Cash Management
### অ্যাকাউন্ট ও ক্যাশ ম্যানেজমেন্ট

### 12.1 Account Management
**বাংলা:** অ্যাকাউন্ট ম্যানেজমেন্ট

**What it does:**
- Manage multiple accounts
- Track balances
- Cash, bank, mobile wallet support

**Key Sub-features:**
- Account listing
- Create account
- Edit account
- Delete account
- Account types: cash, bank, mobile_wallet, credit_card
- Opening balance
- Current balance tracking
- Default account marking
- Branch assignment

**API Endpoints:**
- `GET /api/accounts` - List accounts
- `POST /api/accounts` - Create account
- `GET /api/accounts/[id]` - Account details
- `PATCH /api/accounts/[id]` - Update account

**Database Models:**
- `Account` - Account details

### 12.2 Account Transfers
**বাংলা:** অ্যাকাউন্ট ট্রান্সফার

**What it does:**
- Transfer funds between accounts
- Track transfer history

**Key Sub-features:**
- Source account selection
- Destination account selection
- Amount entry
- Reference/notes
- Status tracking

**API Endpoints:**
- `GET /api/accounts/transfers` - List transfers
- `POST /api/accounts/transfers` - Create transfer

**Database Models:**
- `AccountTransfer` - Transfer records

### 12.3 Cash Drawer Sessions
**বাংলা:** ক্যাশ ড্রয়ার সেশন

**What it does:**
- Track opening/closing cash
- Daily cash reconciliation

**Key Sub-features:**
- Opening balance entry
- Closing balance entry
- Expected balance calculation
- Difference tracking
- Session status: open, closed

**Database Models:**
- `CashDrawerSession` - Session records

---

## 13. Credit Control
### ক্রেডিট কন্ট্রোল

### 13.1 Credit Aging Analysis
**বাংলা:** ক্রেডিট এজিং বিশ্লেষণ

**What it does:**
- Analyze receivables by age
- Risk assessment
- Collection prioritization

**Key Sub-features:**
- Aging buckets: 0-30, 31-60, 61-90, 90+ days
- Risk score calculation
- Risk levels: low, medium, high
- Credit utilization percentage
- Suggested actions

**API Endpoints:**
- `GET /api/credit/aging` - Aging report
- `POST /api/credit/check-limit` - Check credit limit

**Database Models:**
- `Party` - Balance and credit data
- `PartyLedger` - Transaction history

### 13.2 Credit Limit Management
**বাংলা:** ক্রেডিট লিমিট ম্যানেজমেন্ট

**What it does:**
- Set customer credit limits
- Warning on limit breach

**Key Sub-features:**
- Credit limit per party
- Credit utilization tracking
- Warning during sales
- Payment terms setup

**Database Models:**
- `Party.creditLimit` - Maximum credit
- `Party.paymentTerms` - Payment days

---

## 14. Dashboard & Analytics
### ড্যাশবোর্ড ও অ্যানালিটিক্স

### 14.1 Main Dashboard
**বাংলা:** প্রধান ড্যাশবোর্ড

**What it does:**
- Business overview at a glance
- Key performance indicators
- Quick actions

**Key Sub-features:**
- Today's sales
- Today's profit
- Today's expenses
- Receivables (পাওনা)
- Payables (দেনা)
- Stock value
- Low stock items count
- Active parties count
- Sales growth percentage
- Profit growth percentage
- 7-day trend chart
- Account balances (cash/bank)
- Dead stock value
- Credit overdue

**API Endpoints:**
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/daily-sales` - 7-day sales data

**Database Models:**
- `Sale` - Sales aggregation
- `Expense` - Expense aggregation
- `Item` - Stock data
- `Party` - Balance data
- `Account` - Balance data

### 14.2 Business Health Score
**বাংলা:** ব্যবসার হেলথ স্কোর

**What it does:**
- AI-powered health assessment
- Actionable suggestions

**Key Sub-features:**
- Overall score (0-100)
- Grade: A, B, C, D, F
- Component scores:
  - Profit trend (25%)
  - Credit risk (20%)
  - Dead stock (15%)
  - Cash stability (20%)
  - Sales consistency (20%)
- Trend indicator
- Improvement suggestions

**API Endpoints:**
- `GET /api/health-score` - Health score data

**Database Models:**
- Aggregated from multiple models

### 14.3 AI Daily Brief
**বাংলা:** AI দৈনিক সারাংশ

**What it does:**
- Intelligent insights
- Actionable recommendations

**Key Sub-features:**
- Alert insights
- Opportunity insights
- Achievement insights
- Quick stats summary

**API Endpoints:**
- `GET /api/ai/brief` - AI brief data

---

## 15. Reports Module
### রিপোর্ট মডিউল

### 15.1 Sales Reports
**বাংলা:** বিক্রি রিপোর্ট

**What it does:**
- Comprehensive sales analysis
- Trend visualization

**Key Sub-features:**
- Date range selection
- Total sales amount
- Transaction count
- Average sale value
- Profit margin
- Sales trend chart
- Payment method breakdown
- Category breakdown
- Sales list export

**API Endpoints:**
- `GET /api/reports/sales` - Sales report data

### 15.2 Profit/Loss Report
**বাংলা:** লাভ-ক্ষতি রিপোর্ট

**What it does:**
- Income statement
- Profitability analysis

**Key Sub-features:**
- Revenue
- Cost of Goods Sold
- Gross Profit
- Operating Expenses
- Net Profit
- Profit margin percentage

**API Endpoints:**
- `GET /api/reports/profit` - P&L data

### 15.3 Stock Reports
**বাংলা:** স্টক রিপোর্ট

**What it does:**
- Inventory valuation
- Stock analysis

**Key Sub-features:**
- Total stock value
- Item count
- Low stock items
- Dead stock analysis
- Category breakdown

**API Endpoints:**
- `GET /api/reports/stock` - Stock report data

### 15.4 Party Ledger Report
**বাংলা:** পার্টি লেজার রিপোর্ট

**What it does:**
- Transaction history per party
- Balance tracking

**Key Sub-features:**
- Party selection
- Date range filter
- Transaction list
- Running balance
- Export options

**API Endpoints:**
- `GET /api/party-ledger` - Party ledger data

### 15.5 Credit Aging Report
**বাংলা:** ক্রেডিট এজিং রিপোর্ট

**What it does:**
- Detailed aging analysis
- Collection tracking

**API Endpoints:**
- `GET /api/reports/credit-aging` - Aging report
- `GET /api/reports/credit-control` - Credit control report

### 15.6 Expense Reports
**বাংলা:** খরচ রিপোর্ট

**What it does:**
- Expense analysis
- Category breakdown

**Key Sub-features:**
- Date range selection
- Category filtering
- Expense trend chart
- Category breakdown pie chart

**API Endpoints:**
- `GET /api/reports/expenses` - Expense report data

### 15.7 Dead Stock Report
**বাংলা:** ডেড স্টক রিপোর্ট

**API Endpoints:**
- `GET /api/reports/dead-stock` - Dead stock report

### 15.8 Health Score Details
**বাংলা:** হেলথ স্কোর বিস্তারিত

**API Endpoints:**
- `GET /api/reports/health-score` - Detailed health score

### 15.9 Export Functionality
**বাংলা:** এক্সপোর্ট কার্যকারিতা

**Key Sub-features:**
- CSV export
- Excel export
- PDF export
- Print functionality

**API Endpoints:**
- `GET /api/v1/export` - Export data

---

## 16. AI Assistant (Voice & Chat)
### AI সহকারী (ভয়েস ও চ্যাট)

### 16.1 AI Chat Interface
**বাংলা:** AI চ্যাট ইন্টারফেস

**What it does:**
- Conversational AI for business queries
- Natural language processing
- Multi-language support (Bangla/English)

**Key Sub-features:**
- Chat interface
- Context-aware responses
- Business data queries
- Quick action buttons
- Voice input support

**API Endpoints:**
- `POST /api/ai/chat` - AI chat endpoint

**State Management:**
- `VoiceModal.tsx` - Voice input component
- `AIDrawer.tsx` - AI interface drawer
- `AIPage.tsx` - Full AI page

### 16.2 Voice Commands
**বাংলা:** ভয়েস কমান্ড

**What it does:**
- Voice-based transaction entry
- Hands-free operation
- Bangla voice recognition

**Key Sub-features:**
- Voice recording
- Speech-to-text
- Intent parsing
- Entity extraction
- Draft transaction creation
- Confirmation flow

**Voice Intents Supported:**
- `create_sale` - Create a sale
- `get_stock` - Check stock
- `create_purchase` - Record purchase
- `get_sales` - View sales
- `get_party` - View party info
- `create_expense` - Record expense
- `get_report` - View reports
- `general_query` - General questions

**API Endpoints:**
- `POST /api/voice` - Process voice command
- `POST /api/voice/seed` - Seed voice data

**Database Models:**
- `VoiceCommandDataset` - Command phrases
- `IntentSynonym` - Action word synonyms
- `VoiceSession` - Session tracking
- `VoiceFeedback` - User feedback
- `DraftTransaction` - Draft transactions
- `PartyAlias` - Party name aliases
- `ProductAlias` - Product name aliases

### 16.3 AI Safety Features
**বাংলা:** AI সেফটি ফিচার

**Key Sub-features:**
- Confirmation guard (must confirm before action)
- Rate limiting (prevent abuse)
- Tool executor with circuit breaker
- Timeout handling
- Retry logic
- Draft hash for idempotency
- Cross-business security check

**Security Measures:**
- Rate limiter: 20 AI chats/minute
- Write operations: 10/minute
- LLM generation: 30/minute
- Confirmation required for write operations
- 5-minute draft expiration

### 16.4 AI Usage Tracking
**বাংলা:** AI ব্যবহার ট্র্যাকিং

**Database Models:**
- `UsageRecord` - Usage tracking
- `VoiceCommandLog` - Command logs

---

## 17. Settings & Configuration
### সেটিংস ও কনফিগারেশন

### 17.1 Personal Profile Settings
**বাংলা:** ব্যক্তিগত প্রোফাইল সেটিংস

**Key Sub-features:**
- Name editing
- Email updating
- Phone number
- Password change

### 17.2 Business Profile Settings
**বাংলা:** ব্যবসার প্রোফাইল সেটিংস

**Key Sub-features:**
- Business name (English & Bangla)
- Business type/category
- Contact details
- Address
- Logo upload
- Trade license
- TIN/BIN numbers
- Bank details

### 17.3 Invoice Settings
**বাংলা:** ইনভয়েস সেটিংস

**Key Sub-features:**
- Logo upload
- Invoice prefix
- Invoice footer text
- Paper size: A4, A5, thermal
- Language: Bengali, English

**API Endpoints:**
- `GET /api/inventory-settings` - Get settings
- `PUT /api/inventory-settings` - Update settings

### 17.4 Branch Settings
**বাংলা:** শাখা সেটিংস

**Key Sub-features:**
- Branch management page
- Create/edit/delete branches
- Set main branch

### 17.5 Roles & Permissions
**বাংলা:** রোল ও পারমিশন

**What it does:**
- Role-based access control
- Permission management

**Key Sub-features:**
- Role listing
- Create role
- Edit role
- Delete role
- Permission matrix
- Module permissions:
  - sales: view, create, edit, delete
  - inventory: view, create, edit, delete
  - parties: view, create, edit, delete
  - expenses: view, create, edit, delete
  - reports: view
  - settings: view, edit
  - branches: view, create, edit
  - staff: view, create, edit

**API Endpoints:**
- `GET /api/roles` - List roles
- `POST /api/roles` - Create role
- `PATCH /api/roles/[id]` - Update role
- `DELETE /api/roles/[id]` - Delete role
- `GET /api/permissions` - List permissions

**Database Models:**
- `Role` - Role definitions
- `User.roleId` - Role assignment

### 17.6 Period Lock
**বাংলা:** পিরিয়ড লক

**What it does:**
- Lock accounting periods
- Prevent edits in closed periods

**Key Sub-features:**
- Lock date range
- Lock notes
- Lock history

**API Endpoints:**
- `GET /api/period-locks` - List locks
- `POST /api/period-locks` - Create lock

**Database Models:**
- `PeriodLock` - Lock records

### 17.7 Approval Dashboard
**বাংলা:** অনুমোদন ড্যাশবোর্ড

**What it does:**
- Manage approval workflows
- Review pending items

**API Endpoints:**
- `GET /api/approvals` - List approvals
- `POST /api/approvals` - Create approval

### 17.8 Inventory Settings
**বাংলা:** ইনভেন্টরি সেটিংস

**Key Sub-features:**
- Low stock threshold
- Low stock alerts toggle
- Stock warning notifications

---

## 18. Notifications & Alerts
### নোটিফিকেশন ও এলার্ট

### 18.1 Notification System
**বাংলা:** নোটিফিকেশন সিস্টেম

**What it does:**
- Send notifications via multiple channels
- Template-based messaging

**Key Sub-features:**
- WhatsApp integration
- SMS integration
- Email (planned)
- Push notifications

**API Endpoints:**
- `POST /api/v1/notifications/send` - Send notification
- `POST /api/v1/notifications/send-sms` - Send SMS
- `POST /api/v1/notifications/send-whatsapp` - Send WhatsApp
- `GET /api/v1/notifications/templates` - Get templates

**Database Models:**
- `SupportTicket` - Support tracking
- `SupportMessage` - Support messages

### 18.2 Alert Types
**বাংলা:** এলার্টের ধরন

**Low Stock Alerts:**
- Notify when stock falls below minimum

**Credit Alerts:**
- Notify when credit limit approaching
- Notify for overdue payments

**Expiry Alerts:**
- Notify for expiring batches
- Critical batch warnings

**Dead Stock Alerts:**
- Notify for unsold inventory

---

## 19. Data Management
### ডেটা ম্যানেজমেন্ট

### 19.1 Backup & Export
**বাংলা:** ব্যাকআপ ও এক্সপোর্ট

**What it does:**
- Export business data
- Create backups

**Key Sub-features:**
- CSV export
- Excel export
- JSON export
- Full data export

### 19.2 Recycle Bin
**বাংলা:** রিসাইকেল বিন

**What it does:**
- View deleted items
- Restore deleted records

**Key Sub-features:**
- List deleted records
- Restore functionality
- Permanent delete

**API Endpoints:**
- `GET /api/trash` - List deleted items
- `POST /api/trash/[id]/restore` - Restore item

**Database Models:**
- All models with `deletedAt` field

### 19.3 Soft Delete
**বাংলা:** সফট ডিলিট

**Implementation:**
- All deletable models have `deletedAt` field
- Delete sets timestamp instead of removing
- Queries filter out deleted records

---

## 20. Subscription & Billing
### সাবস্ক্রিপশন ও বিলিং

### 20.1 Plan Management
**বাংলা:** প্ল্যান ম্যানেজমেন্ট

**Available Plans:**

| Plan | Price | Key Limits |
|------|-------|------------|
| FREE | ৳0/mo | 100 items, 1 staff, 1 branch, 3 AI chats/day |
| STARTER | ৳199/mo | Unlimited items, 2 staff, 1 branch, 15 AI chats/day |
| GROWTH | ৳499/mo | Unlimited items, 5 staff, 3 branches, 50 AI chats/day |
| INTELLIGENCE | ৳999/mo | Unlimited everything |

**Plan Features:**

**FREE:**
- Basic sales tracking
- Credit tracking
- 3 AI chats/day
- 100 items limit
- 1 staff, 1 branch

**STARTER:**
- All FREE features
- Unlimited items
- 2 staff members
- CSV export
- Dead stock alert
- Low stock alert
- Credit alert
- 15 AI chats/day

**GROWTH:**
- All STARTER features
- 5 staff, 3 branches
- Multi-branch sync
- Staff performance
- AI daily summary
- Basic forecasting
- Health score
- Profit analytics
- Excel/PDF export
- Priority support
- 50 AI chats/day

**INTELLIGENCE:**
- All GROWTH features
- Unlimited staff & branches
- Smart reorder
- Cash flow forecast
- Growth insights
- API access
- Custom reports
- Dedicated support
- Unlimited AI chats

### 20.2 Subscription API
**API Endpoints:**
- `GET /api/subscription` - Get subscription status
- `GET /api/subscription/usage` - Get usage data

**Database Models:**
- `Subscription` - Subscription records
- `UsageRecord` - Usage tracking

### 20.3 Payment Integration
**বাংলা:** পেমেন্ট ইন্টিগ্রেশন

**Supported Gateways:**
- bKash (mobile banking)
- Nagad (mobile banking)
- Stripe (international)

**API Endpoints:**
- `POST /api/v1/payments/create-intent` - Create payment intent
- `POST /api/v1/payments/verify` - Verify payment
- `POST /api/v1/payments/webhooks/stripe` - Stripe webhook
- `POST /api/v1/payments/webhooks/bkash` - bKash webhook

---

## 21. Audit & Compliance
### অডিট ও কমপ্লায়েন্স

### 21.1 Audit Trail
**বাংলা:** অডিট ট্রেইল

**What it does:**
- Track all changes
- Maintain compliance
- Security monitoring

**Key Sub-features:**
- Action tracking: create, update, delete, view, export, login, logout
- Entity tracking: sale, item, party, payment, expense, user, branch, account, settings
- Old/new value tracking
- IP address logging
- User agent logging
- Timestamp tracking

**API Endpoints:**
- `GET /api/audit` - Query audit logs (via auditStore)

**Database Models:**
- `AuditLog` - Audit records

---

## 22. Support System
### সাপোর্ট সিস্টেম

### 22.1 Support Tickets
**বাংলা:** সাপোর্ট টিকেট

**What it does:**
- Create support requests
- Track ticket status

**Key Sub-features:**
- Create ticket
- Add messages
- Track status: open, in_progress, resolved, closed
- Priority levels: low, normal, high, urgent

**API Endpoints:**
- `GET /api/support` - List tickets
- `POST /api/support` - Create ticket

**Database Models:**
- `SupportTicket` - Ticket records
- `SupportMessage` - Ticket messages

---

## 23. Feature Gates & Plans
### ফিচার গেট ও প্ল্যান

### 23.1 Feature Gate System
**বাংলা:** ফিচার গেট সিস্টেম

**What it does:**
- Control feature access by plan
- Show upgrade prompts

**Available Feature Gates:**
- `multiBranch` - Multi-branch support
- `creditControl` - Credit management
- `auditTrail` - Audit logging
- `advancedPricing` - Multiple price tiers
- `healthScore` - Business health score
- `reconciliation` - Account reconciliation
- `staffPerformance` - Staff analytics
- `deadStockAnalysis` - Dead stock reports
- `globalSearch` - Global search
- `aiAssistant` - AI features
- `dataExport` - Export functionality
- `advancedReports` - Advanced reporting

**Plan Feature Matrix:**
```typescript
PLAN_FEATURES = {
  free: ['globalSearch'],
  starter: ['globalSearch', 'dataExport', 'deadStockAnalysis'],
  growth: ['globalSearch', 'multiBranch', 'creditControl', 'reconciliation', 
           'staffPerformance', 'healthScore', 'deadStockAnalysis', 'dataExport', 
           'advancedReports', 'aiAssistant'],
  intelligence: ['all features']
}
```

### 23.2 Feature Gate Components
**বাংলা:** ফিচার গেট কম্পোনেন্ট

**UI Components:**
- `<FeatureGate>` - Wrapper component
- `<FeatureGateSync>` - Sync component
- `<PlanIndicator>` - Current plan display
- Premium blur overlay

**State Management:**
- `featureGateStore` - Feature gate state
- `useFeatureAccess()` - Feature check hook

---

## Database Models Summary
### ডেটাবেস মডেল সারসংক্ষেপ

### Core Business Models
| Model | Purpose |
|-------|---------|
| `Business` | Business profile |
| `Branch` | Branch locations |
| `User` | User accounts |
| `Role` | User roles |
| `Otp` | OTP codes |

### Party Models
| Model | Purpose |
|-------|---------|
| `Party` | Customers/Suppliers |
| `PartyCategory` | Party categories |
| `PartyLedger` | Party transactions |
| `PartyAlias` | Name aliases |

### Inventory Models
| Model | Purpose |
|-------|---------|
| `Item` | Products |
| `Category` | Item categories |
| `Unit` | Measurement units |
| `ItemVariant` | Product variants |
| `Batch` | Batch tracking |
| `StockLedger` | Stock movements |

### Sales Models
| Model | Purpose |
|-------|---------|
| `Sale` | Sales header |
| `SaleItem` | Sale line items |
| `SaleReturn` | Sales returns |
| `SaleReturnItem` | Return items |
| `Quotation` | Price quotes |

### Purchase Models
| Model | Purpose |
|-------|---------|
| `Purchase` | Purchases |
| `PurchaseItem` | Purchase items |
| `PurchaseOrder` | Purchase orders |
| `PurchaseReturn` | Purchase returns |

### Financial Models
| Model | Purpose |
|-------|---------|
| `Payment` | Payments |
| `Account` | Bank/Cash accounts |
| `AccountTransfer` | Transfers |
| `CashDrawerSession` | Cash sessions |
| `Expense` | Expenses |
| `ExpenseCategory` | Expense types |
| `CreditNote` | Customer credits |
| `DebitNote` | Supplier debits |
| `PaymentPlan` | Installment plans |
| `Installment` | Payment installments |

### System Models
| Model | Purpose |
|-------|---------|
| `AuditLog` | Audit trail |
| `PeriodLock` | Period locks |
| `Subscription` | Subscriptions |
| `UsageRecord` | Usage tracking |
| `SupportTicket` | Support tickets |
| `SupportMessage` | Ticket messages |

### AI/Voice Models
| Model | Purpose |
|-------|---------|
| `VoiceCommandDataset` | Voice commands |
| `IntentSynonym` | Action synonyms |
| `VoiceSession` | Voice sessions |
| `VoiceFeedback` | User feedback |
| `DraftTransaction` | Draft transactions |

### Master Catalog Models
| Model | Purpose |
|-------|---------|
| `MasterProduct` | Global products |
| `MasterCategory` | Global categories |
| `MasterBrand` | Global brands |
| `MasterProductAlias` | Product aliases |

---

## API Endpoints Summary
### API এন্ডপয়েন্ট সারসংক্ষেপ

### Authentication
- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/logout`
- `POST /api/auth/refresh-session`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/reset-password`

### User
- `GET /api/user`
- `PATCH /api/user`
- `PATCH /api/user/password`

### Business
- `GET /api/business`
- `PATCH /api/business`

### Branches
- `GET /api/branches`
- `POST /api/branches`
- `PATCH /api/branches/[id]`
- `DELETE /api/branches/[id]`

### Parties
- `GET /api/parties`
- `POST /api/parties`
- `GET /api/parties/[id]`
- `PATCH /api/parties/[id]`
- `DELETE /api/parties/[id]`
- `GET /api/party-categories`
- `POST /api/party-categories`
- `GET /api/party-ledger`

### Items/Inventory
- `GET /api/items`
- `POST /api/items`
- `GET /api/items/[id]`
- `PUT /api/items/[id]`
- `DELETE /api/items/[id]`
- `GET /api/items/variants`
- `POST /api/items/variants`
- `POST /api/items/import`
- `GET /api/categories`
- `POST /api/categories`
- `PATCH /api/categories/[id]`
- `DELETE /api/categories/[id]`
- `GET /api/units`
- `POST /api/units`
- `PATCH /api/units/[id]`
- `DELETE /api/units/[id]`
- `GET /api/stock-ledger`
- `POST /api/inventory/adjustment`
- `POST /api/inventory/transfer`
- `GET /api/inventory/dead-stock`

### Batches
- `GET /api/batches`
- `POST /api/batches`
- `GET /api/batches/[id]`
- `PUT /api/batches/[id]`
- `DELETE /api/batches/[id]`
- `GET /api/batches/available`
- `GET /api/batches/expiry-alerts`
- `GET /api/batches/report`

### Sales
- `GET /api/sales`
- `POST /api/sales`
- `GET /api/sales/[id]`
- `PATCH /api/sales/[id]`
- `GET /api/sales/returns`
- `POST /api/sales/returns`

### Purchases
- `GET /api/purchases`
- `POST /api/purchases`
- `GET /api/purchases/[id]`
- `PATCH /api/purchases/[id]`
- `GET /api/purchases/returns`
- `POST /api/purchases/returns`
- `GET /api/purchase-orders`
- `POST /api/purchase-orders`
- `PATCH /api/purchase-orders`

### Quotations
- `GET /api/quotations`
- `POST /api/quotations`
- `GET /api/quotations/[id]`
- `PATCH /api/quotations/[id]`
- `DELETE /api/quotations/[id]`

### Payments
- `GET /api/payments`
- `POST /api/payments`
- `GET /api/supplier-payments`
- `POST /api/supplier-payments`

### Accounts
- `GET /api/accounts`
- `POST /api/accounts`
- `GET /api/accounts/transfers`
- `POST /api/accounts/transfers`
- `GET /api/cash-drawer`

### Expenses
- `GET /api/expenses`
- `POST /api/expenses`
- `GET /api/expenses/[id]`
- `PATCH /api/expenses/[id]`
- `DELETE /api/expenses/[id]`
- `GET /api/expenses/categories`
- `POST /api/expenses/categories`

### Credit Control
- `GET /api/credit/aging`
- `POST /api/credit/check-limit`

### Notes
- `GET /api/credit-notes`
- `POST /api/credit-notes`
- `GET /api/debit-notes`
- `POST /api/debit-notes`

### Dashboard
- `GET /api/dashboard/stats`
- `GET /api/dashboard/daily-sales`
- `GET /api/health-score`
- `GET /api/ai/brief`

### Reports
- `GET /api/reports/sales`
- `GET /api/reports/profit`
- `GET /api/reports/stock`
- `GET /api/reports/expenses`
- `GET /api/reports/credit-aging`
- `GET /api/reports/credit-control`
- `GET /api/reports/party-ledger`
- `GET /api/reports/dead-stock`
- `GET /api/reports/health-score`

### AI/Voice
- `POST /api/ai/chat`
- `GET /api/ai/brief`
- `POST /api/voice`
- `POST /api/voice/seed`

### Roles/Permissions
- `GET /api/roles`
- `POST /api/roles`
- `PATCH /api/roles/[id]`
- `DELETE /api/roles/[id]`
- `GET /api/permissions`

### Staff
- `GET /api/staff`
- `POST /api/staff`
- `GET /api/staff/[id]`
- `DELETE /api/staff/[id]`

### Settings
- `GET /api/inventory-settings`
- `PUT /api/inventory-settings`
- `GET /api/period-locks`
- `POST /api/period-locks`
- `GET /api/approvals`
- `POST /api/approvals`

### Data Management
- `GET /api/trash`
- `POST /api/trash/[id]/restore`
- `GET /api/v1/export`

### Subscription
- `GET /api/subscription`
- `GET /api/subscription/usage`

### Notifications
- `POST /api/v1/notifications/send`
- `POST /api/v1/notifications/send-sms`
- `POST /api/v1/notifications/send-whatsapp`
- `GET /api/v1/notifications/templates`

### Payments/Webhooks
- `POST /api/v1/payments/create-intent`
- `POST /api/v1/payments/verify`
- `POST /api/v1/payments/webhooks/stripe`
- `POST /api/v1/payments/webhooks/bkash`

### Support
- `GET /api/support`
- `POST /api/support`

### Master Catalog
- `GET /api/master-products/search`
- `GET /api/master-products/categories`
- `GET /api/master-products/popular`
- `GET /api/master-products/[id]`

### Misc
- `GET /api/search`
- `GET /api/docs/openapi`
- `GET /api/v1/health`
- `GET /api/v1/analytics`
- `GET /api/v1/portal/[id]`
- `POST /api/v1/portal/verify`

---

## State Management Summary
### স্টেট ম্যানেজমেন্ট সারসংক্ষেপ

### Zustand Stores
| Store | Purpose |
|-------|---------|
| `sessionStore` | User, business, plan, authentication |
| `uiStore` | Theme, language, navigation |
| `branchStore` | Branch context |
| `accountStore` | Account state |
| `healthScoreStore` | Health score data |
| `auditStore` | Audit trail state |
| `offlineQueueStore` | Offline mutations |
| `featureGateStore` | Feature gates |

### React Query Hooks
| Hook | Purpose |
|------|---------|
| `useSales()` | Sales data |
| `usePurchases()` | Purchases data |
| `useItems()` | Inventory data |
| `useParties()` | Party data |
| `useExpenses()` | Expenses data |
| `useAccounts()` | Account data |
| `useDashboardStats()` | Dashboard metrics |
| `useDailySales()` | Sales trends |
| `useHealthScore()` | Health score |
| `useCreditAgingReport()` | Credit aging |
| `useDeadStockReport()` | Dead stock |
| `useQuotations()` | Quotations |
| `useCategories()` | Categories |
| `useBatches()` | Batch data |

---

## Internationalization
### আন্তর্জাতিকীকরণ

### Supported Languages
- **Bengali (bn)** - Primary
- **English (en)** - Secondary

### Localization Files
- `public/locales/bn/translation.json`
- `public/locales/en/translation.json`

### Translation Hook
```typescript
const { t, isBangla } = useAppTranslation();
```

### Currency Formatting
```typescript
const { formatCurrency, formatNumber } = useCurrency();
// Output: ৳১,২৩৪ (Bengali numerals)
```

---

## Mobile App Considerations
### মোবাইল অ্যাপ বিবেচনা

### Offline-First Features
- Offline queue for mutations
- Local storage persistence
- Sync on reconnect
- Conflict resolution needed

### Key Mobile-Specific Features Needed
1. **Barcode Scanner** - Scan items for sales/purchases
2. **Camera Integration** - Capture receipts, item images
3. **Push Notifications** - Low stock, credit alerts, reminders
4. **Biometric Auth** - Fingerprint/Face ID login
5. **Offline Mode** - Full offline transaction capability
6. **Voice Commands** - Native voice recognition
7. **Quick Actions** - Home screen shortcuts
8. **Share Invoices** - WhatsApp/Telegram sharing
9. **PDF Viewer** - View generated invoices
10. **Print Support** - Bluetooth thermal printer support

### API Authentication
- Use `x-business-id` header
- Use `x-user-id` header
- Use `x-branch-id` header
- Bearer token authentication

### Recommended Mobile Architecture
- React Native or Flutter
- SQLite for offline storage
- Sync queue management
- Push notification service
- Camera/barcode plugins

---

*End of Complete Feature List*

**Document Generated for:** Mobile App Development  
**Total Features:** 150+  
**Total API Endpoints:** 100+  
**Total Database Models:** 40+
