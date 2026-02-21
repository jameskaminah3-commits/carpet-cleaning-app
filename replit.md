# CarpetPro Executive

## Overview
Premium carpet cleaning operations platform for a Nairobi-based carpet cleaning company with three interfaces: Customer (desktop-responsive with bottom navigation, functional notifications, M-Pesa payment flow, coupon redemption), Technician (task management), and Admin (comprehensive operations dashboard with user management, delivery scheduling, promotions/coupon system with eligibility rules, customer tagging, and price adjustment with payment request notifications).

## Tech Stack
- **Frontend**: React + TypeScript + Vite + Wouter (routing) + TanStack Query + Framer Motion
- **Styling**: TailwindCSS with warm amber/earth tone theme
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Session cookies with OTP-based phone login

## Routes
- `/` - Landing page
- `/login` - Phone OTP login
- `/book` - Booking flow (multi-step)
- `/customer` - Customer dashboard (mobile-first, bottom nav: Home/Orders/Offers/Profile)
- `/admin` - Admin dashboard (6 tabs: Orders/Deliveries/Users/Pricing & Zones/Promotions/Media CMS)
- `/technician` - Technician task list

## API Endpoints
### Auth
- `POST /api/auth/request-otp` - Request OTP
- `POST /api/auth/verify-otp` - Verify OTP and create session
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `PATCH /api/auth/profile` - Update own profile (name, email)

### Customer
- `GET /api/pricing` - Get pricing rules
- `GET /api/delivery-zones` - Get delivery zones
- `POST /api/orders` - Create order (auto-updates user lifetimeValue/totalOrders)
- `GET /api/orders/my` - Get customer's orders (with items)
- `GET /api/orders/:id` - Get order details
- `GET /api/saved-addresses` - Get customer's saved addresses
- `POST /api/saved-addresses` - Create saved address
- `DELETE /api/saved-addresses/:id` - Delete saved address
- `GET /api/promotions/my` - Get available promotions for customer
- `POST /api/promotions/validate` - Validate coupon code
- `POST /api/promotions/apply` - Apply promotion to order
- `GET /api/notifications` - Get user's notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `GET /api/notifications/unread-count` - Get unread notification count
- `POST /api/payments/stk-push` - Simulate M-Pesa STK push payment

### Admin
- `GET /api/admin/orders` - All orders (with customer data)
- `GET /api/admin/stats` - Dashboard stats (totalUsers, totalOrders, scheduledDeliveries, activePromotions, revenue, pending, inProgress, completed)
- `PATCH /api/admin/orders/:id/status` - Update order status
- `PATCH /api/admin/orders/:id/lock` - Lock/unlock order
- `PATCH /api/admin/orders/:id/price` - Adjust order price
- `POST /api/admin/pricing` - Create pricing rule
- `DELETE /api/admin/pricing/:id` - Delete pricing rule
- `POST /api/admin/delivery-zones` - Create delivery zone
- `DELETE /api/admin/delivery-zones/:id` - Delete delivery zone
- `GET /api/admin/users` - Get all customers
- `PATCH /api/admin/users/:id/tag` - Set customer tag (VIP/Frequent/Corporate/One-time)
- `PATCH /api/admin/users/:id/active` - Activate/deactivate customer
- `GET /api/admin/deliveries` - Get all deliveries (with order and technician)
- `PATCH /api/admin/deliveries/:id/status` - Update delivery status
- `GET /api/admin/promotions` - Get all promotions
- `POST /api/admin/promotions` - Create promotion/coupon
- `DELETE /api/admin/promotions/:id` - Delete promotion

### Reviews
- `POST /api/reviews` - Submit a review for a completed order
- `GET /api/reviews/public` - Get all public reviews (with customer names)

### Photos & Media
- `POST /api/orders/:id/photos` - Add photo to order
- `GET /api/orders/:id/photos` - Get order photos
- `POST /api/upload` - Upload file (returns fileKey)
- `GET /api/admin/media` - Get all media library items
- `POST /api/admin/media` - Create media entry
- `PATCH /api/admin/media/:id/public` - Toggle media public visibility
- `DELETE /api/admin/media/:id` - Delete media

### Extended Admin
- `GET /api/admin/users/all` - Get all users (all roles)
- `POST /api/admin/users` - Create new user
- `DELETE /api/admin/users/:id` - Deactivate/ban user
- `PATCH /api/admin/pricing/:id` - Update pricing rule
- `GET /api/admin/stats/extended` - Extended stats (revenue, active jobs, top carpet types)

### Technician
- `GET /api/technician/tasks` - Get technician tasks
- `PATCH /api/technician/tasks/:id/complete` - Complete task

## Seed Data
- Admin: phone `0700000001` (Admin Kamau)
- Technician: phone `0700000002` (Tech Ochieng)
- Customers: `0712345678` (Sarah Wanjiku, Frequent), `0723456789` (John Mwangi, Corporate), `0734567890` (Grace Akinyi, VIP)
- 8 pricing rules (one per carpet type)
- 5 delivery zones (Nairobi areas)
- 3 sample orders with pricing snapshots
- 3 deliveries (pickup/return, various statuses)
- 3 promotions (Frequent Discount, Free Pickup, New Customer Welcome)
- 2 saved addresses

## Database Schema
- **users** (id, phone, email, name, role, otpCode, otpExpiry, tag, lifetimeValue, totalOrders, lastOrderDate, isActive, profilePhoto)
- **sessions** (id, userId, token, expiresAt)
- **pricing_rules** (id, name, description, pricePerSqMeter, carpetType, isActive)
- **delivery_zones** (id, name, description, fee, isActive)
- **orders** (id, customerId, technicianId, status, totalAmount, depositPaid, balanceDue, isLocked, deliveryZoneId, pickupAddress, notes, locationLat, locationLng, locationName, pricingSnapshot, promotionId, discountAmount, pickupFee, deliveryFee, expressFee, createdAt, updatedAt)
- **order_items** (id, orderId, carpetType, width, length, quantity, unitPrice, subtotal, description)
- **order_photos** (id, orderId, fileKey, photoType, uploadedAt)
- **media_library** (id, title, fileKey, mimeType, category, uploadedAt)
- **deliveries** (id, orderId, technicianId, deliveryType, status, scheduledDate, scheduledTimeWindow, completedAt, notes, createdAt)
- **promotions** (id, name, description, promoType, appliesTo, discountValue, couponCode, isVipOnly, isSingleUse, isActive, expiresAt, minOrders, targetTag, createdAt)
- **saved_addresses** (id, userId, label, address, lat, lng, isDefault, createdAt)
- **notifications** (id, userId, type, title, message, orderId, amount, isRead, createdAt)
- **reviews** (id, orderId, customerId, rating, comment, isPublic, createdAt)

## Customer Tags
- VIP (purple badge), Frequent (blue badge), Corporate (green badge), One-time (gray badge)

## Order Statuses
PENDING → AWAITING_PICKUP → IN_CLEANING → DRYING → READY → COMPLETED

## Security
- Frontend route guards: Protected routes redirect unauthorized users based on role
- Backend auth middleware: All protected endpoints require valid session
- Admin middleware: Admin-only endpoints check role
- Ownership checks: Customers can only view their own orders/addresses
- Input validation: All create/update endpoints validate payloads
