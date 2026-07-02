import type {
  Activity,
  Business,
  CartItem,
  MockStore,
  Order,
  Product,
  Profile,
  Promotion,
  Redemption,
  Reward,
  RewardBalance,
  SessionUser,
  UserRole,
} from '@/types/domain'

const STORAGE_KEY = 'guatemalarewards-store-v3'
const CART_KEY = 'guatemalarewards-cart-v1'

// ─── Businesses ────────────────────────────────────────────────

const businesses: Business[] = [
  {
    id: 'biz-velvet-brew',
    name: 'Velvet Brew',
    slug: 'velvet-brew',
    description: 'A neighborhood beverage shop known for handcrafted drinks, seasonal pastries, and retail favorites.',
    address: 'Cra. 37 #10-32, El Poblado, Guatemala',
    latitude: 6.2088,
    longitude: -75.5672,
    earnRate: 10,
    rewardRatePercent: 20,
    commissionRatePercent: 10,
    taxRate: 0.0875,
    taxIncludedInBill: false,
    serviceChargeEnabled: false,
    serviceChargeRate: 0,
    currency: 'USD',
    active: true,
  },
  {
    id: 'biz-mystic-coffee',
    name: 'Mystic Coffee',
    slug: 'mystic-coffee',
    description: 'A mystical coffee experience with ethically sourced beans, herbal infusions, and enchanted blends.',
    address: 'Cl. 10B #36-14, Provenza, Guatemala',
    latitude: 6.2099,
    longitude: -75.5651,
    earnRate: 8,
    rewardRatePercent: 20,
    commissionRatePercent: 10,
    taxRate: 0.0925,
    taxIncludedInBill: false,
    serviceChargeEnabled: false,
    serviceChargeRate: 0,
    currency: 'USD',
    active: true,
  },
]

// ─── Profiles ──────────────────────────────────────────────────

const profiles: Profile[] = [
  {
    id: 'profile-customer',
    fullName: 'Ava Mercer',
    email: 'ava@example.com',
    phone: '+1 (415) 555-0188',
    location: 'Mission District',
    favoriteOrder: 'Oat milk latte',
    joinedAt: '2025-11-12T08:00:00.000Z',
    role: 'customer',
    referralCode: 'AVAMERC1',
  },
  {
    id: 'profile-platform-admin',
    fullName: 'Noah Reyes',
    email: 'admin@guatemalarewards.com',
    phone: '+1 (415) 555-0140',
    location: 'San Francisco',
    favoriteOrder: 'Cortado',
    joinedAt: '2025-10-01T08:00:00.000Z',
    role: 'platform-admin',
    referralCode: 'NOAHADM1',
  },
  {
    id: 'profile-velvet-owner',
    fullName: 'Isabella Chen',
    email: 'owner@velvetbrew.co',
    phone: '+1 (415) 555-0101',
    location: 'Valencia Street',
    favoriteOrder: 'Oat milk latte',
    joinedAt: '2025-01-15T08:00:00.000Z',
    role: 'business-owner',
    businessId: 'biz-velvet-brew',
    referralCode: 'CAFOWNR1',
  },
  {
    id: 'profile-mystic-owner',
    fullName: 'Marcus Webb',
    email: 'owner@mysticcoffee.co',
    phone: '+1 (415) 555-0202',
    location: 'Noe Valley',
    favoriteOrder: 'Matcha latte',
    joinedAt: '2025-02-01T08:00:00.000Z',
    role: 'business-owner',
    businessId: 'biz-mystic-coffee',
    referralCode: 'MYSOWNR1',
  },
]

// ─── Balances ──────────────────────────────────────────────────

const balances: RewardBalance[] = [
  {
    profileId: 'profile-customer',
    points: 1280,
    nextRewardPoints: 1500,
    availableCredits: 4,
    tierProgress: 85,
  },
  {
    profileId: 'profile-platform-admin',
    points: 960,
    nextRewardPoints: 1200,
    availableCredits: 3,
    tierProgress: 72,
  },
]

// ─── Rewards ───────────────────────────────────────────────────

const rewards: Reward[] = [
  {
    id: 'reward-1',
    businessId: 'biz-velvet-brew',
    title: 'Signature Velvet Latte',
    description: 'Redeem any handcrafted latte with your choice of milk and syrup.',
    category: 'Drink',
    pointsCost: 250,
    inventory: 99,
    featured: true,
    highlight: 'Most redeemed this week',
  },
  {
    id: 'reward-2',
    businessId: 'biz-velvet-brew',
    title: 'Cold Brew Flight',
    description: 'Sample three seasonal cold brew profiles in one curated tasting.',
    category: 'Experience',
    pointsCost: 480,
    inventory: 24,
    featured: true,
    highlight: 'Weekend-only tasting',
  },
  {
    id: 'reward-3',
    businessId: 'biz-velvet-brew',
    title: 'Butter Croissant Pairing',
    description: 'Fresh-baked croissant paired with any small brewed coffee.',
    category: 'Pastry',
    pointsCost: 180,
    inventory: 44,
    featured: false,
    highlight: 'Morning favorite',
  },
  {
    id: 'reward-4',
    businessId: 'biz-velvet-brew',
    title: 'Velvet Brew Tote',
    description: 'Canvas tote with embossed logo and internal bottle sleeve.',
    category: 'Merch',
    pointsCost: 700,
    inventory: 12,
    featured: false,
    highlight: 'Limited spring merch',
  },
  {
    id: 'reward-5',
    businessId: 'biz-mystic-coffee',
    title: 'Mystic Matcha Latte',
    description: 'Ceremonial-grade matcha whisked with your choice of milk.',
    category: 'Drink',
    pointsCost: 200,
    inventory: 60,
    featured: true,
    highlight: 'Fan favorite',
  },
  {
    id: 'reward-6',
    businessId: 'biz-mystic-coffee',
    title: 'Almond Croissant',
    description: 'Flaky croissant filled with almond cream and topped with sliced almonds.',
    category: 'Pastry',
    pointsCost: 160,
    inventory: 30,
    featured: false,
    highlight: 'Fresh daily',
  },
  {
    id: 'reward-7',
    businessId: 'biz-mystic-coffee',
    title: 'Afternoon Tea Set',
    description: 'Pot of premium herbal tea served with a selection of three mini pastries.',
    category: 'Experience',
    pointsCost: 400,
    inventory: 15,
    featured: true,
    highlight: 'Weekend special',
  },
]

// ─── Products ──────────────────────────────────────────────────

const products: Product[] = [
  {
    id: 'product-1',
    businessId: 'biz-velvet-brew',
    title: 'Oat Milk Latte',
    description: 'Our signature oat milk latte with house-made vanilla syrup.',
    category: 'Coffee',
    price: 5.50,
    inventory: 200,
    featured: true,
    highlight: 'Best seller',
  },
  {
    id: 'product-2',
    businessId: 'biz-velvet-brew',
    title: 'Cold Brew Concentrate 32oz',
    description: 'Take home our 24-hour cold brew concentrate. Dilute to taste.',
    category: 'Coffee',
    price: 14.00,
    inventory: 50,
    featured: true,
    highlight: 'Take-home',
  },
  {
    id: 'product-3',
    businessId: 'biz-velvet-brew',
    title: 'Pistachio Cardamom Bun',
    description: 'Flaky laminated pastry with pistachio frangipane and cardamom glaze.',
    category: 'Pastry',
    price: 4.75,
    inventory: 30,
    featured: false,
    highlight: 'Seasonal',
  },
  {
    id: 'product-4',
    businessId: 'biz-velvet-brew',
    title: 'Single Origin: Ethiopia Yirgacheffe',
    description: '12oz bag of light-roasted whole beans with floral and citrus notes.',
    category: 'Coffee',
    price: 18.00,
    inventory: 40,
    featured: false,
    highlight: 'Direct trade',
  },
  {
    id: 'product-5',
    businessId: 'biz-velvet-brew',
    title: 'Velvet Brew Ceramic Tumbler',
    description: '16oz double-walled ceramic tumbler in matte black with silicone lid.',
    category: 'Merch',
    price: 28.00,
    inventory: 25,
    featured: true,
    highlight: 'New arrival',
  },
  {
    id: 'product-6',
    businessId: 'biz-velvet-brew',
    title: 'Pour-Over Starter Kit',
    description: 'Ceramic dripper, 100 filters, and a 12oz sample roast.',
    category: 'Equipment',
    price: 42.00,
    inventory: 15,
    featured: false,
    highlight: 'Brew at home',
  },
  {
    id: 'product-7',
    businessId: 'biz-mystic-coffee',
    title: 'Chai Spice Latte',
    description: 'House-blended chai with cinnamon, cardamom, ginger, and steamed milk.',
    category: 'Coffee',
    price: 5.00,
    inventory: 150,
    featured: true,
    highlight: 'House blend',
  },
  {
    id: 'product-8',
    businessId: 'biz-mystic-coffee',
    title: 'Mystic Breakfast Sandwich',
    description: 'Scrambled eggs, gruyere, arugula, and truffle aioli on brioche.',
    category: 'Pastry',
    price: 9.50,
    inventory: 40,
    featured: true,
    highlight: 'Morning staple',
  },
  {
    id: 'product-9',
    businessId: 'biz-mystic-coffee',
    title: 'Lavender Honey Scone',
    description: 'Buttery scone with dried lavender and a honey glaze drizzle.',
    category: 'Pastry',
    price: 4.25,
    inventory: 35,
    featured: false,
    highlight: 'Popular',
  },
  {
    id: 'product-10',
    businessId: 'biz-mystic-coffee',
    title: 'Premium Tea Sampler',
    description: 'Set of 4 loose-leaf herbal teas: Chamomile, Peppermint, Hibiscus, and Lavender.',
    category: 'Coffee',
    price: 22.00,
    inventory: 20,
    featured: false,
    highlight: 'Gift idea',
  },
  {
    id: 'product-11',
    businessId: 'biz-mystic-coffee',
    title: 'Mystic Coffee Mug',
    description: 'Handmade ceramic mug with a mystical mountain motif. 12oz capacity.',
    category: 'Merch',
    price: 24.00,
    inventory: 18,
    featured: true,
    highlight: 'Limited edition',
  },
]

// ─── Promotions ────────────────────────────────────────────────

const promotions: Promotion[] = [
  {
    id: 'promo-1',
    businessId: 'biz-velvet-brew',
    title: 'Double points after 3 PM',
    description: 'Stop by after 3 PM and earn twice the points on any handcrafted drink.',
    badge: 'Weekday perk',
    cta: 'Drop by after work',
    expiresAt: '2026-04-24T23:59:59.000Z',
    audience: 'All members',
  },
  {
    id: 'promo-2',
    businessId: 'biz-velvet-brew',
    title: 'Spring pairing menu',
    description: 'Earn a bonus 120 points when you pair a pistachio bun with any iced espresso.',
    badge: 'Seasonal',
    cta: 'Try the pairing',
    expiresAt: '2026-04-17T23:59:59.000Z',
    audience: 'All members',
  },
  {
    id: 'promo-3',
    businessId: 'biz-velvet-brew',
    title: 'Bring-a-friend Saturdays',
    description: 'Invite a friend to scan your code in-store and both of you receive a surprise bonus.',
    badge: 'Referral',
    cta: 'Share your code',
    expiresAt: '2026-05-01T23:59:59.000Z',
    audience: 'All members',
  },
  {
    id: 'promo-4',
    businessId: 'biz-mystic-coffee',
    title: 'Tea Tuesday Bonus',
    description: 'Order any tea on Tuesdays and earn triple points all day.',
    badge: 'Weekly',
    cta: 'View teas',
    expiresAt: '2026-05-15T23:59:59.000Z',
    audience: 'All members',
  },
  {
    id: 'promo-5',
    businessId: 'biz-mystic-coffee',
    title: 'Brunch Bundle',
    description: 'Get a free pastry when you order any breakfast sandwich before 11 AM.',
    badge: 'Weekend',
    cta: 'See menu',
    expiresAt: '2026-04-30T23:59:59.000Z',
    audience: 'All members',
  },
]

// ─── Activities ────────────────────────────────────────────────

const activities: Activity[] = [
  {
    id: 'activity-1',
    profileId: 'profile-customer',
    type: 'earned',
    title: 'Morning purchase',
    description: 'Oat milk latte and cardamom bun at Valencia St.',
    points: 96,
    createdAt: '2026-04-09T08:12:00.000Z',
    status: 'posted',
  },
  {
    id: 'activity-2',
    profileId: 'profile-customer',
    type: 'bonus',
    title: 'Promo bonus',
    description: 'Double points from the afternoon handcrafted drink campaign.',
    points: 120,
    createdAt: '2026-04-08T15:43:00.000Z',
    status: 'posted',
  },
  {
    id: 'activity-3',
    profileId: 'profile-customer',
    type: 'redeemed',
    title: 'Reward redeemed',
    description: 'Free butter croissant pairing picked up in-store.',
    points: -180,
    createdAt: '2026-04-06T10:08:00.000Z',
    status: 'posted',
  },
  {
    id: 'activity-4',
    profileId: 'profile-platform-admin',
    type: 'earned',
    title: 'Staff training visit',
    description: 'Cortado and tasting notes session.',
    points: 60,
    createdAt: '2026-04-07T13:20:00.000Z',
    status: 'posted',
  },
]

const redemptions: Redemption[] = [
  {
    id: 'redemption-1',
    profileId: 'profile-customer',
    rewardId: 'reward-3',
    rewardTitle: 'Butter Croissant Pairing',
    pointsCost: 180,
    notes: 'Warm if possible',
    redeemedAt: '2026-04-06T10:08:00.000Z',
    status: 'fulfilled',
  },
]

const orders: Order[] = []

// ─── Store ─────────────────────────────────────────────────────

export function createSeedStore(): MockStore {
  return {
    businesses,
    profiles,
    balances,
    rewards,
    products,
    promotions,
    activities,
    redemptions,
    orders,
    adminLogs: [
      {
        id: 'log-1',
        actorName: 'Noah Reyes',
        action: 'Reward adjustment',
        details: 'Added 90 points to Ava Mercer for service recovery.',
        createdAt: '2026-04-08T18:30:00.000Z',
      },
    ],
    session: null,
  }
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function cloneStore<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as T
}

export function readStore(): MockStore {
  const fallback = createSeedStore()

  if (!canUseStorage()) {
    return cloneStore(fallback)
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback))
    return cloneStore(fallback)
  }

  try {
    return { ...fallback, ...JSON.parse(raw) } as MockStore
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback))
    return cloneStore(fallback)
  }
}

export function writeStore(store: MockStore) {
  if (!canUseStorage()) {
    return store
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  return store
}

export function updateStore(updater: (store: MockStore) => MockStore) {
  const next = updater(readStore())
  return writeStore(next)
}

export function getProfileByRole(role: UserRole) {
  return readStore().profiles.find((profile) => profile.role === role) ?? null
}

export function setSession(session: SessionUser | null) {
  updateStore((store) => ({ ...store, session }))
}

// ─── Cart (separate localStorage key) ──────────────────────────

export function readCart(): CartItem[] {
  if (!canUseStorage()) return []
  const raw = window.localStorage.getItem(CART_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as CartItem[]
  } catch {
    return []
  }
}

export function writeCart(items: CartItem[]) {
  if (!canUseStorage()) return
  window.localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function clearCart() {
  if (!canUseStorage()) return
  window.localStorage.removeItem(CART_KEY)
}
