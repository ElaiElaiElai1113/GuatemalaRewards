# Business Owner Portal Implementation Plan

## Overview
Transform the platform from single-admin to multi-tenant SaaS where each business owner manages their own location independently.

---

## Architecture Changes

### 1. Domain Type Updates

#### New Role System
```typescript
// Before
type UserRole = 'customer' | 'admin'

// After
type UserRole = 'customer' | 'platform-admin' | 'business-owner' | 'business-staff'
```

#### Profile Updates
```typescript
interface Profile {
  id: string
  fullName: string
  email: string
  phone: string
  location: string
  favoriteOrder: string
  joinedAt: string
  role: UserRole
  businessId?: string  // For business owners/staff - which business they belong to
}
```

#### Session Updates
```typescript
interface SessionUser {
  profileId: string
  role: UserRole
  businessId?: string  // Business owner's business
}
```

### 2. Route Structure

```
/customer/*           → Customer Portal (existing)
/admin/*              → Platform Admin (existing, enhanced)
/business/*           → Business Owner Portal (NEW)
  /business/dashboard  → Business overview, metrics
  /business/products   → Manage their products
  /business/rewards    → Manage their rewards
  /business/promotions → Manage their promotions
  /business/members   → View their customers
  /business/settings   → Business settings
```

### 3. Component Structure

```
src/features/business-owner/
├── layout/
│   └── business-owner-layout.tsx       ← NEW - sidebar, nav
├── pages/
│   ├── business-dashboard-page.tsx      ← NEW - overview metrics
│   ├── products-page.tsx               ← NEW - product CRUD
│   ├── rewards-page.tsx                ← NEW - reward CRUD
│   ├── promotions-page.tsx             ← NEW - promotion CRUD
│   ├── members-page.tsx                ← NEW - customer list
│   └── settings-page.tsx               ← NEW - business settings
└── components/
    ├── metric-card.tsx                 ← REUSE from admin
    └── quick-stats.tsx                ← NEW - business summary
```

### 4. Service Layer Updates

#### Business Owner Services
```typescript
// src/integrations/supabase/services/business-owner-service.ts
export const businessOwnerService = {
  // Get business owner's business details
  async getBusiness(businessId: string): Promise<Business>

  // Update business settings
  async updateBusiness(businessId: string, settings: Partial<Business>): Promise<Business>

  // Get business metrics
  async getMetrics(businessId: string): Promise<BusinessMetrics>
}

interface BusinessMetrics {
  totalMembers: number
  totalOrders: number
  totalRevenue: number
  pointsIssued: number
  pointsRedeemed: number
  activePromotions: number
}
```

---

## Implementation Steps

### Phase 1: Foundation (4-6 hours)

#### Step 1: Update Domain Types
- [ ] Add `business-owner` and `business-staff` roles
- [ ] Add `businessId` to Profile
- [ ] Add `businessId` to SessionUser
- [ ] Update MockStore seed data

#### Step 2: Create Layout
- [ ] Create `business-owner-layout.tsx`
- [ ] Add business logo/name in header
- [ ] Navigation: Dashboard, Products, Rewards, Promotions, Members, Settings
- [ ] Profile/signout section

#### Step 3: Update Routes
- [ ] Add `/business/*` routes
- [ ] Create route protection (business owners only)
- [ ] Redirect platform admins appropriately

### Phase 2: Dashboard (3-4 hours)

#### Step 4: Business Dashboard
- [ ] Metrics cards: Members, Orders, Revenue, Points
- [ ] Chart placeholder (optional)
- [ ] Recent activity (filtered to business)
- [ ] Quick actions: Add product, Add reward

### Phase 3: Content Management (8-10 hours)

#### Step 5: Products Management
- [ ] Product list (filtered to business)
- [ ] Create product form
- [ ] Edit product form
- [ ] Delete product
- [ ] Inventory tracking

#### Step 6: Rewards Management
- [ ] Reward list (filtered to business)
- [ ] Create reward form
- [ ] Edit reward form
- [ ] Delete reward
- [ ] Redemption queue (fulfillment)

#### Step 7: Promotions Management
- [ ] Promotion list (filtered to business)
- [ ] Create promotion form
- [ ] Edit promotion form
- [ ] Delete promotion
- [ ] Active/expired status

### Phase 4: Additional Features (6-8 hours)

#### Step 8: Members View
- [ ] Customer list (only business's customers)
- [ ] Customer details (points, history)
- [ ] Manual point adjustment

#### Step 9: Settings
- [ ] Business info (name, description, logo)
- [ ] Points earn rate
- [ ] Tax rate
- [ ] Contact info

#### Step 10: Refinement
- [ ] Loading states
- [ ] Error handling
- [ ] Empty states
- [ ] Mobile responsiveness

---

## Mock Data Updates

### Add Business Owner Profiles
```typescript
const profiles: Profile[] = [
  // Existing customers and platform admin
  // ...

  // NEW: Business Owners
  {
    id: 'profile-velvet-owner',
    fullName: 'Isabella Chen',
    email: 'owner@velvetbrew.co',
    phone: '+1 (415) 555-0101',
    location: 'Valencia Street',
    favoriteOrder: 'Velvet oat latte',
    joinedAt: '2025-01-15T08:00:00.000Z',
    role: 'business-owner',
    businessId: 'biz-velvet-brew',
  },
  {
    id: 'profile-luna-owner',
    fullName: 'Marcus Webb',
    email: 'owner@cafeluna.co',
    phone: '+1 (415) 555-0202',
    location: 'Noe Valley',
    favoriteOrder: 'Matcha latte',
    joinedAt: '2025-02-01T08:00:00.000Z',
    role: 'business-owner',
    businessId: 'biz-cafe-luna',
  },
]
```

### Business Metrics Service
```typescript
// Calculate metrics on the fly from existing data
export function calculateBusinessMetrics(businessId: string): BusinessMetrics {
  const store = readStore()
  const products = store.products.filter(p => p.businessId === businessId)
  const rewards = store.rewards.filter(r => r.businessId === businessId)
  const orders = store.orders.filter(o => o.businessId === businessId)
  const promotions = store.promotions.filter(p => p.businessId === businessId)

  return {
    totalMembers: store.profiles.filter(p => p.role === 'customer').length, // Simplified
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
    pointsIssued: store.activities
      .filter(a => a.type === 'earned' && a.profileId !== 'profile-admin')
      .reduce((sum, a) => sum + a.points, 0), // Simplified
    pointsRedeemed: store.activities
      .filter(a => a.type === 'redeemed')
      .reduce((sum, a) => sum + Math.abs(a.points), 0),
    activePromotions: promotions.filter(p => new Date(p.expiresAt) > new Date()).length,
  }
}
```

---

## UI Design Guidelines

### Business Owner vs Platform Admin

| Aspect | Platform Admin | Business Owner |
|--------|---------------|----------------|
| **Header** | "Admin Portal" | "[Business Name] Portal" |
| **Scope** | All businesses | Their business only |
| **Branding** | Platform branding | Business logo/colors |
| **Analytics** | Platform-wide | Business-specific |
| **Actions** | Can override any business | Can only edit their data |

### Color Coding (Per Business)
```css
/* Velvet Brew */
--biz-velvet-primary: #8B4513;
--biz-velvet-secondary: #654321;

/* Cafe Luna */
--biz-luna-primary: #D4A574;
--biz-luna-secondary: #C19A6B;
```

---

## Timeline Estimate

| Phase | Hours | Days |
|-------|-------|------|
| Foundation | 4-6 | 1 |
| Dashboard | 3-4 | 1 |
| Content Management | 8-10 | 2 |
| Additional Features | 6-8 | 2 |
| Testing & Polish | 4-6 | 1 |
| **Total** | **25-34** | **4-5** |

---

## Future Enhancements (Post-MVP)

1. **Staff Management** - Add staff to business with limited permissions
2. **Multi-Location** - Single business owner manages multiple locations
3. **Advanced Analytics** - Charts, trends, predictions
4. **Export Reports** - CSV/Excel exports
5. **Push Notifications** - Business owners can send promos
6. **Subscription Management** - Handle billing for platform use
7. **Business Onboarding** - Self-registration flow for new businesses

---

## Technical Notes

### Data Filtering Pattern
All business owner queries must filter by `businessId`:

```typescript
// ❌ WRONG - sees everything
const products = productsService.getProducts()

// ✅ RIGHT - sees only their products
const products = productsService.getProducts(businessId)
```

### Security Considerations
- When implementing Supabase, use Row Level Security (RLS)
- Business owners should never see other businesses' data
- Platform admins have access to everything
- Staff have read-only or limited access

### Session Management
```typescript
// On login, set the business context
function login(user: User) {
  if (user.role === 'business-owner') {
    // Find their business and set as active context
    const business = businesses.find(b => b.id === user.businessId)
    setActiveBusiness(business)
  }
  // ...
}
```

---

## Success Criteria

✅ Business owner can sign in and see ONLY their data
✅ Business owner can manage their products, rewards, promotions
✅ Business owner can view their customers and adjust points
✅ Business owner can update their business settings
✅ Platform admin still sees everything
✅ Clean separation of concerns between portals
✅ Mobile-responsive business owner interface

---

## Questions to Answer Before Implementation

1. Should business owners be able to add staff members?
2. Should platform admins be able to impersonate business owners?
3. What's the business model (SaaS subscription, per-transaction fee)?
4. Should there be a business onboarding wizard for new signups?
5. What analytics/metrics are most important for business owners?
