# Cursor AI Agent Prompts — Food E-Commerce Website

Use these prompts **one at a time, in order**, in Cursor's agent chat. Wait for each step to finish, review/test, then move to the next. Each prompt assumes the previous ones are already done (context builds up).

**Stack used throughout:** Next.js (JavaScript, no TypeScript), HeroUI v3.1.0, Tailwind CSS, MongoDB (native driver or Mongoose — pick one and stay consistent), Better Auth, React Hook Form.

---

## Prompt 1 — Project Setup & Folder Structure

```
Create a new Next.js project (JavaScript, App Router, no TypeScript) for a food e-commerce website called "FoodMart".

Set up:
- Tailwind CSS
- HeroUI v3.1.0 (use compound component API: Card.Content/Card.Header, Select.Trigger/Select.Popover, TextField wrapping Input/TextArea, Button variants "primary"/"ghost"/"outline" — do NOT use v2 patterns like CardBody/CardHeader)
- Folder structure:
  /app
    /(customer)
    /(vendor)
    /(rider)
    /(admin)
    /api
  /components
  /lib
  /models
  /hooks
- A .env.example file with placeholders for: MONGODB_URI, BETTER_AUTH_SECRET, NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_IMAGE_UPLOAD_API, PAYMENT_GATEWAY_KEY
- Basic layout.js with a shared Navbar and Footer using HeroUI components
- White/black minimal theme with rounded corners and soft shadows as the base design language

Do not add any business logic yet — just scaffolding.
```

---

## Prompt 2 — Database Models

```
Create MongoDB schema/model files inside /models for the following entities. Use [Mongoose OR native MongoDB driver — pick one] consistently:

1. User — name, email, phone, passwordHash, role (enum: customer/vendor/rider/admin), isBlocked, addresses[], createdAt
2. Restaurant — name, ownerId (ref User), description, logoUrl, category, address, location (geo point), operatingHours, isApproved, isOpen, rating
3. MenuItem — restaurantId (ref), name, description, price, imageUrl, variants[], isAvailable, category
4. Order — customerId, restaurantId, riderId, items[] (menuItemId, qty, price, variant), status (enum: placed/confirmed/preparing/out_for_delivery/delivered/cancelled), totalAmount, deliveryAddress, paymentStatus, paymentMethod, timestamps for each status change
5. Rider — userId (ref), vehicleType, isAvailable, currentLocation (geo point), rating
6. Review — orderId, customerId, restaurantId, riderId, restaurantRating, riderRating, comment
7. Coupon — code, discountType (percent/flat), discountValue, minOrderAmount, expiryDate, isActive

Add proper indexes (e.g., geo index on location fields, unique index on email/coupon code). Export connection helper in /lib/db.js that reuses connection across hot reloads in dev.
```

---

## Prompt 3 — Authentication (Better Auth)

```
Set up Better Auth in this Next.js app for role-based authentication.

Requirements:
- Roles: customer, vendor, rider, admin (make sure the role field has input: true so it's settable at signup where appropriate, but isBlocked must NOT be client-settable — only modifiable server-side/admin)
- Email/password auth + Google OAuth
- Signup forms use React Hook Form with HeroUI TextField/Input components, with validation (email format, password min length, required fields)
- Separate signup flows: customer signup (name, email, phone, password) and vendor signup (add restaurant name, address, document upload placeholder)
- Middleware to protect routes: /vendor/* only for role=vendor, /rider/* only for role=rider, /admin/* only for role=admin, /dashboard/* requires any logged-in user
- Redirect unauthenticated users to /auth/login with a returnTo query param
- Show a logged-in user's role-based navbar links (customer sees Orders/Cart, vendor sees Dashboard, etc.)

Make sure the MongoDB client connection is properly awaited before use (no unawaited client bugs).
```

---

## Prompt 4 — Customer: Restaurant Listing & Search

```
Build the customer-facing restaurant discovery pages:

1. /  (Home page) — hero banner, search bar, list of featured/nearby restaurants as cards (use HeroUI Card.Header/Card.Content, black top accent bar, soft shadow, rounded corners — matching existing design language)
2. /restaurants — full listing page with:
   - Filters sidebar: cuisine/category, price range, rating, "open now" toggle (use HeroUI Select compound components and Checkbox)
   - Search input with debounced query
   - Grid of RestaurantCard components (image, name, rating, cuisine tags, est. delivery time)
   - Pagination or infinite scroll
3. /restaurants/[id] — restaurant menu page:
   - Restaurant header (logo, name, rating, address, operating hours, open/closed badge using StatusBadge component)
   - Menu grouped by category, each MenuItem shows image, name, price, "Add to Cart" button
   - If item has variants, clicking "Add to Cart" opens a HeroUI modal to select variant/qty before adding

Fetch data from API routes under /app/api/restaurants and /app/api/restaurants/[id]/menu. Handle loading and empty states with an EmptyState component.
```

---

## Prompt 5 — Cart & Checkout

```
Build the cart and checkout flow:

1. Cart state: use React Context (or Zustand if already in the project) to persist cart in localStorage, merged with server cart on login. Cart holds restaurantId (only one restaurant per cart at a time — warn user if they try adding from a different restaurant), items with variant/qty/price.
2. /cart page — list of cart items with qty steppers, remove button, price breakdown (subtotal, delivery fee, tax, discount, total), coupon code input (validates against /api/coupons/validate).
3. /checkout page:
   - Address selection (saved addresses + "add new address" form using React Hook Form + HeroUI)
   - Payment method selection (COD / card / mobile banking — build as radio-style custom-styled native select consistent with existing pattern, integrated via Controller)
   - Order summary sidebar
   - "Place Order" button creates an Order via POST /api/orders, then redirects to /orders/[id]/track

Validate: cart not empty, address selected, minimum order amount if coupon requires it.
```

---

## Prompt 6 — Order Tracking & History

```
Build order tracking and history:

1. /orders — list of customer's past and active orders, each as a card with restaurant name, status badge, total, date, and "Track" or "Reorder" button
2. /orders/[id]/track — order detail page showing:
   - Status timeline/stepper (Placed → Confirmed → Preparing → Out for delivery → Delivered) using an SVG or HeroUI stepper pattern, with timestamps
   - Order items list
   - Restaurant contact info
   - Cancel button (only visible if status is "placed" or "confirmed", calls /api/orders/[id]/cancel)
3. Real-time status updates: integrate polling (every 10s) or Socket.io if already available in the project, so status updates without manual refresh.
4. Post-delivery: show a "Rate your order" prompt (modal) that submits to /api/reviews.
```

---

## Prompt 7 — Vendor Dashboard

```
Build the vendor-facing dashboard under /vendor:

1. /vendor/dashboard — overview cards (today's orders, revenue, pending orders), recent orders table
2. /vendor/menu — CRUD interface for menu items:
   - Table/grid of items with edit/delete/toggle-availability actions
   - "Add Item" form (React Hook Form + HeroUI): name, description, price, category select, image upload via label + hidden file input pattern (upload to NEXT_PUBLIC_IMAGE_UPLOAD_API), variants (dynamic field array)
3. /vendor/orders — incoming orders list with status filter tabs (New/Preparing/Ready/Completed), each order card has action buttons to advance status (Accept → Preparing → Ready for pickup)
4. /vendor/settings — edit restaurant profile (name, description, logo, address, operating hours picker, open/closed toggle)

All API calls go through /app/api/vendor/* routes, protected by role=vendor middleware. Use res.ok checks and proper try/catch with structured JSON error responses (400/404/500), validating any ObjectId params with ObjectId.isValid() before querying.
```

---

## Prompt 8 — Rider Panel

```
Build a simple rider panel under /rider:

1. /rider/dashboard — toggle for online/offline availability, list of available delivery requests (restaurant pickup address, customer drop address, distance/estimated payout), "Accept" button
2. /rider/orders/[id] — accepted order detail with pickup/drop address, customer contact, and buttons to update status: "Picked up" → "Delivered"
3. /rider/history — past deliveries list with date, earnings, customer rating received

API routes under /app/api/rider/*, protected by role=rider middleware. Keep the UI minimal/mobile-first since riders will mostly use this on phones.
```

---

## Prompt 9 — Admin Panel

```
Build the admin panel under /admin:

1. /admin/dashboard — key metrics cards (total orders, revenue, active vendors, active customers) with a simple chart (use recharts if available)
2. /admin/vendors — table of vendors with approve/reject/suspend actions, filter by status
3. /admin/customers — table of customers with block/unblock action
4. /admin/orders — table of all orders across the platform with status filter and search
5. /admin/coupons — CRUD for coupons (code, discount type/value, expiry, min order amount, active toggle)

All routes protected by role=admin middleware. Use HeroUI Table/DataGrid-equivalent components consistent with v3 API. Add confirmation modals before destructive actions (suspend vendor, block customer).
```

---

## Prompt 10 — Payment Integration

```
Integrate a payment gateway for checkout (specify: SSLCommerz / bKash / Stripe — pick one based on target market).

- Create /app/api/payments/initiate route that creates a payment session/intent tied to an orderId
- On successful payment, update Order.paymentStatus to "paid" via a webhook/callback route /app/api/payments/callback (verify signature/authenticity of the callback before trusting it)
- Handle COD orders by skipping payment gateway and marking paymentStatus as "pending" until delivery
- Add a payment failure/retry flow on the checkout page
```

---

## Prompt 11 — Notifications

```
Add notification support:

1. Email notifications (using Nodemailer or Resend) for: order placed, order status changes, vendor new order alert
2. In-app notification bell (HeroUI dropdown) showing recent notifications, fetched from a Notification model/collection, with a "mark as read" action
3. (Optional) SMS notification stub for order confirmation — just create the integration point/service file even if using a placeholder provider for now
```

---

## Prompt 12 — Final Polish & Deployment Prep

```
Final cleanup pass before deployment:

- Replace any hardcoded localhost URLs with NEXT_PUBLIC_API_BASE_URL
- Add loading skeletons and empty states across all list pages
- Add a global error boundary and 404 page matching the site's design language
- Run through all forms and ensure React Hook Form validation messages are consistent
- Add basic SEO meta tags (title, description) per page using Next.js metadata API
- Write a README with setup instructions (.env variables, how to run locally, how to seed sample data)
- Create a seed script (/scripts/seed.js) that populates sample restaurants, menu items, and a test admin/vendor/customer/rider account for demo purposes
```

---

## How to Use With Cursor

1. Paste **Prompt 1** into Cursor's agent chat. Let it finish and run `npm run dev` to confirm it works.
2. Commit the working state to git before moving to the next prompt (so you can roll back if a step breaks something).
3. Paste **Prompt 2**, and so on — don't skip ahead, since later prompts assume earlier ones exist.
4. If Cursor generates HeroUI v2-style code (e.g., `CardBody`, `CardHeader`), explicitly correct it by pasting: *"Use HeroUI v3.1.0 compound API — Card.Content/Card.Header, not CardBody/CardHeader"* — this has come up before in your projects.
5. Test each module manually before moving on — Cursor agents can silently break earlier working code when adding new features.
