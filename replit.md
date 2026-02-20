# CarpetPro Executive

## Overview
Premium carpet cleaning operations platform for a Nairobi-based carpet cleaning company with three interfaces: Customer, Technician, and Admin.

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
- `/customer` - Customer dashboard (my orders)
- `/admin` - Admin dashboard (orders, pricing, zones)
- `/technician` - Technician task list

## API Endpoints
- `POST /api/auth/request-otp` - Request OTP
- `POST /api/auth/verify-otp` - Verify OTP and create session
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `GET /api/pricing` - Get pricing rules
- `GET /api/delivery-zones` - Get delivery zones
- `POST /api/orders` - Create order
- `GET /api/orders/my` - Get customer's orders
- `GET /api/orders/:id` - Get order details
- `GET /api/admin/orders` - Admin: all orders
- `GET /api/admin/stats` - Admin: dashboard stats
- `PATCH /api/admin/orders/:id/status` - Update order status
- `PATCH /api/admin/orders/:id/lock` - Lock/unlock order
- `PATCH /api/admin/orders/:id/price` - Adjust order price
- `POST /api/admin/pricing` - Create pricing rule
- `DELETE /api/admin/pricing/:id` - Delete pricing rule
- `POST /api/admin/delivery-zones` - Create delivery zone
- `DELETE /api/admin/delivery-zones/:id` - Delete delivery zone
- `GET /api/technician/tasks` - Get technician tasks
- `PATCH /api/technician/tasks/:id/complete` - Complete task

## Seed Data
- Admin: phone `0700000001`
- Technician: phone `0700000002`
- Customer: phone `0712345678`
- 8 pricing rules (one per carpet type)
- 5 delivery zones (Nairobi areas)
- 2 sample orders

## Database Schema
- users (id, phone, email, name, role, otpCode, otpExpiry)
- sessions (id, userId, token, expiresAt)
- pricing_rules (id, name, description, pricePerSqMeter, carpetType, isActive)
- delivery_zones (id, name, description, fee, isActive)
- orders (id, customerId, technicianId, status, totalAmount, depositPaid, balanceDue, isLocked, deliveryZoneId, pickupAddress, notes, locationLat, locationLng, locationName, createdAt, updatedAt)
- order_items (id, orderId, carpetType, width, length, quantity, unitPrice, subtotal, description)
- order_photos (id, orderId, fileKey, photoType, uploadedAt)
- media_library (id, title, fileKey, mimeType, category, uploadedAt)

## Security
- Frontend route guards: Protected routes redirect unauthorized users based on role
- Backend auth middleware: All protected endpoints require valid session
- Admin middleware: Admin-only endpoints check role
- Ownership checks: Customers can only view their own orders
- Input validation: All create/update endpoints validate payloads (status, price, lock, pricing rules, zones)
- Valid order statuses: PENDING, AWAITING_PICKUP, IN_CLEANING, DRYING, READY, COMPLETED

## Order Statuses
PENDING → AWAITING_PICKUP → IN_CLEANING → DRYING → READY → COMPLETED
