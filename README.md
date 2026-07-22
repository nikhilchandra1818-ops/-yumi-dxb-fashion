# YUMI DXB Fashion – E-Commerce Platform

A production-ready, luxury e-commerce platform for **YUMI DXB Fashion** (Mangaluru, India), built with Next.js 15, TypeScript, Tailwind CSS v4, Framer Motion, and Firebase.

## Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Framer Motion (for luxury animations)
- **Database & Storage**: Firebase Cloud Firestore, Firebase Storage
- **Authentication**: Firebase Authentication (Email/Password, Session tracking)

---

## Getting Started

### 1. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory and add your Firebase credentials:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB5AS32BKaBrF-LWQMbbVwo7WjzYo_zpz4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=yumi-e33cd.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=yumi-e33cd
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=yumi-e33cd.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=794097778737
NEXT_PUBLIC_FIREBASE_APP_ID=1:794097778737:web:5c5fa8c55c20a60c1ad510
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-SFR2PXRC4Y
```

### 3. Local Development
Run the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the customer boutique website.

---

## Firestore Database Structure

| Collection | Key Fields | Purpose |
|---|---|---|
| `/settings/global` | businessName, phone, address, currency, shippingFee, paymentGateway | Global store operations configurations |
| `/products` | name, slug, price, discountPrice, stock, images, sizes, colors, isActive | Garment catalogs and inventory |
| `/categories` | name, slug, displayOrder, imageUrl, isActive | Product grouping |
| `/collections` | name, slug, displayOrder, bannerUrl, isFeatured | Editorial marketing sets |
| `/orders` | orderNumber, items, shippingAddress, total, status, statusHistory | Client orders and timelines |
| `/users` | email, displayName, phone, emailVerified | Registered customer profiles |
| `/admins` | role, isActive | Role-Based Access Control list |
| `/faqs` | question, answer, category, displayOrder, isPublished | Customer FAQ database |
| `/policies` | slug, title, content | Store policies (Privacy, Returns) |
| `/testimonials` | customerName, location, rating, comment, isPublished | Client homepage testimonials |
| `/contactMessages` | name, email, phone, subject, message, status | Contact form entries inbox |
| `/newsletterSubscribers` | email, isActive, subscribedAt | Marketing newsletters list |

---

## Security Rules Config

### Cloud Firestore Rules (`firestore.rules`)
- **Public access**: Enabled for active products, categories, collections, testimonials, and FAQs.
- **Customer ownership**: Customers can read/write only their own profiles, carts, wishlists, and orders.
- **Admin operations**: Admin read/write permissions are restricted using firestore queries checking `/admins/{uid}` status.

### Firebase Storage Rules (`storage.rules`)
- Banners, icons, and product media directories (`/products`, `/categories`, etc.) allow **public read**.
- **Write permissions** require validation checks against the `/admins/{uid}` collection in Firestore.

---

## Admin Roles & Console

Supported Roles:
- `super_admin`: Full editing access + user and admin permissions control.
- `admin`: Full operations console access (products, inventory, settings, orders).
- `content_manager`: Restricted to products, CMS text, categories, FAQs.
- `order_manager`: Restricted to order list management, invoices, status changes.

### Authorizing an Admin
To grant admin privileges, create a document in the `admins` collection using the user's Auth UID as the document ID:
```json
// Path: /admins/USER_AUTH_UID
{
  "uid": "USER_AUTH_UID",
  "email": "admin@yumidxb.com",
  "displayName": "Admin Name",
  "role": "admin",
  "isActive": true,
  "createdAt": "serverTimestamp"
}
```
Once this document is created, the user will be routed to the Admin operational console at `/admin/dashboard` upon login.
