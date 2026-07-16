# Guatemala Rewards Complete Role Walkthrough

Purpose: use this as the full demo script for translation and training. This is broader than the short platform guide. It covers every role surface currently routed in the app, including features that are hidden from primary navigation but still accessible by URL or footer links.

## Screenshot Set

Available local screenshots:

- Public guide: `../public/walkthrough-screenshots/guide.png`
- Public partner map: `../public/walkthrough-screenshots/public-map.png`
- Public business page: `../public/walkthrough-screenshots/business-page.png`
- Business login: `../public/walkthrough-screenshots/business-login.png`
- Admin login: `../public/walkthrough-screenshots/admin-login.png`

Authenticated screenshots to capture during a seeded demo:

- Customer dashboard: `/dashboard`
- Customer profile and Member QR: `/profile`
- Customer gift cards: `/gift-cards`
- Customer wallet: `/wallet/gift-cards`
- Business dashboard: `/business/dashboard`
- Business member sale: `/business/member-sale/:token`
- Business transactions and gift card redemption: `/business/redemptions`
- Business members: `/business/members`
- Business partners: `/business/partners`
- Admin members: `/admin/portal#members`
- Admin partners: `/admin/portal#partners`
- Admin commissions: `/admin/portal#commissions`

## Demo Flow Summary

1. Start with public discovery and the guide.
2. Walk through the full customer experience.
3. Show the customer QR being used by business staff.
4. Show the business staff operational tools, including transactions with and without gift cards.
5. Show the business owner management tools.
6. Show the admin operations tools.
7. Finish with the commission ledger so the business model is clear.

## Public / Visitor Walkthrough

### Public Guide

Route: `/guide`

Photo: `../public/walkthrough-screenshots/guide.png`

Steps:

1. Open the guide page.
2. Explain that Guatemala Rewards connects customers, partner businesses, and the operations team.
3. Point out the guide sections: customer demo, business demo, admin demo, and storyboard screens.
4. Use this page as the entry point for the Spanish-language training script.
5. Mention that the same guide is also available inside the business portal and admin portal.

### Public Partner Discovery

Route: `/shop`

Photo: `../public/walkthrough-screenshots/public-map.png`

Steps:

1. Open the partner map.
2. Show the list of partner businesses.
3. Select a business from the list or map.
4. Review business details and available products if present.
5. Explain that signed-in customers use this area to decide where to shop or earn rewards.

### Public Promotions

Route: `/promotions`

Steps:

1. Open promotions.
2. Show active campaigns across partner businesses.
3. Explain that promotions are created by business owners or admins.
4. Explain that promotions are discovery content, not the same as QR sale recording.

### For Businesses

Route: `/business`

Photo: `../public/walkthrough-screenshots/business-page.png`

Steps:

1. Open the business landing page.
2. Explain the partner value: customers use a member QR, businesses record in-person purchases, and the platform tracks points and commission.
3. Point out business login and cost calculator entry points.

### Cost Calculator

Routes: `/cost-calculator`, `/business/cost-calculator`

Steps:

1. Open the calculator.
2. Use it to estimate value for a partner business.
3. Explain that this supports sales conversations with businesses before onboarding.

### Join / Invitation / Early Access

Routes: `/`, `/invitation`, `/join`, `/early-access`, `/joinusearly`, `/join-us-early`

Steps:

1. Open the invitation or join flow.
2. Explain that these routes collect interest and direct new users toward onboarding.
3. Mention that several old join URLs redirect to the invitation flow.

### Promo Referral Flow

Routes: `/promo`, `/promo/register`

Steps:

1. Open a promo URL, optionally with referral parameters.
2. Show how a customer can register from a referral or partner source.
3. Explain that partner referral attribution is later visible to business owners and admins.

### Ambassador Page

Route: `/ambassadors`

Steps:

1. Open the ambassador page.
2. Explain that ambassador leads are collected for operations follow-up.
3. Mention that admins can manage these leads in the admin portal.

### Public Gift Card Link

Route: `/g/:publicToken`

Steps:

1. Open a public gift card link.
2. Show the gift card display, balance, and public sharing URL.
3. Explain that business staff can redeem gift cards from the business redemption screen.

### Legal Pages

Routes: `/terms`, `/privacy`, `/reward-terms`, `/verification-policy`

Steps:

1. Open each legal page from the footer.
2. Explain that agreement completion is required for protected customer and business workflows where applicable.
3. Explain that admins can review agreement completion from the admin portal.

## Customer Walkthrough

### Customer Sign In

Route: `/signin`

Steps:

1. Open customer sign in.
2. Sign in as a customer.
3. If the account has required agreements pending, complete them before continuing.
4. Confirm that the customer lands on the dashboard.

### Required Agreements

Route: `/agreements/required`

Steps:

1. Show the agreement gate when a user has not accepted required documents.
2. Review the agreement text.
3. Sign or accept the required agreements.
4. Continue to the customer dashboard.

### Dashboard

Route: `/dashboard`

Photo to capture: customer dashboard.

Steps:

1. Show the wallet summary.
2. Show available points, credits, or wallet status.
3. Show onboarding checklist items.
4. Use the primary action to drive the customer toward their Member QR or required verification.
5. Show recent activity.

### Customer Bottom Navigation

Visible on mobile.

Steps:

1. Show the fixed bottom navigation.
2. Explain the four primary customer actions: Home, Businesses, QR, and Activity.
3. Show the verification status banner above the nav.
4. Tap the verification status to jump to the ID verification section when needed.

### Member QR and Profile

Route: `/profile`

Photo to capture: profile page with active Member QR.

Steps:

1. Open profile.
2. Show member status.
3. Show the Member QR area.
4. If the customer is verified, show the active QR.
5. Copy the QR link.
6. Explain that the QR opens a business sale screen for staff.
7. If the customer is not verified, show the locked QR state.
8. Update profile fields: full name, phone number, home business or location, and favorite order.
9. Save changes.

### ID Verification

Route: `/profile#id-verification`

Steps:

1. Scroll to ID Verification.
2. Enter verification ID number.
3. Upload a photo or PDF of the ID.
4. Submit the verification.
5. Explain status changes: required, submitted, verified, rejected.
6. Explain that earning, redeeming, and QR activation depend on verification.

### Partner Businesses

Route: `/shop`

Photo: `../public/walkthrough-screenshots/public-map.png`

Steps:

1. Open Businesses.
2. Search or browse partner businesses.
3. Select a business.
4. Review business details, map placement, and products if available.
5. Add available products to cart when product commerce is enabled.
6. Explain that the current primary in-person flow is still QR sales, even if product browsing exists.

### Promotions

Route: `/promotions`

Steps:

1. Open promotions.
2. Browse active campaigns.
3. Explain that campaigns can be created by business owners or admins.
4. Explain that promotions help customers choose where to shop.

### Cart

Route: `/cart`

Steps:

1. Open cart.
2. Review added products.
3. Increase or decrease item quantity.
4. Remove an item if needed.
5. Review order summary.
6. Continue to checkout.
7. If empty, use the Browse businesses action.

### Checkout

Route: `/checkout`

Steps:

1. Open checkout from cart.
2. Review checkout summary.
3. Select simulated payment method.
4. Apply available credits when allowed.
5. Add optional front-desk or receptionist referral code if present.
6. Place the order.
7. Confirm navigation to the order confirmation page.

### Order Confirmation

Route: `/order-confirmation`

Steps:

1. Review the confirmed order.
2. Show order details.
3. Use Explore businesses to continue shopping.
4. Use View Orders to open order history.

### Orders

Route: `/orders`

Steps:

1. Open order history.
2. Review previous orders and order status.
3. If there are no orders, use Browse businesses.

### Membership

Route: `/membership`

Steps:

1. Open monthly membership.
2. Explain the `$25/mo` demo membership.
3. Subscribe when the account is eligible.
4. Renew an existing membership.
5. Cancel an existing membership.
6. Explain that verification can lock reward-related membership actions.

### Rewards

Route: `/rewards`

Current behavior: customers are redirected away from this route because the rewards shop is hidden from the customer flow.

Steps:

1. Mention that the route exists but is not part of the current customer navigation.
2. Explain that the current customer priority is the Member QR.
3. If this route is re-enabled later, show reward browsing and reward redemption.

### Redeem Reward

Route: `/redeem/:rewardId`

Current behavior: customers are redirected away from this route because reward redemption is hidden from the customer flow.

Steps:

1. Mention that the route exists for reward redemption.
2. Explain that it is currently gated out of the customer demo.
3. If re-enabled later, show reward details, pickup notes, and redemption confirmation.

### Gift Cards

Route: `/gift-cards`

Photo to capture: customer gift cards page.

Steps:

1. Open gift cards.
2. Review gift card summary.
3. Browse featured gift cards.
4. Select a gift card.
5. Confirm issuance when eligible.
6. Explain that verification can lock issuing gift cards.

### Wallet Gift Cards

Routes: `/wallet/gift-cards`, `/wallet/gift-cards/:id`

Steps:

1. Open wallet gift cards.
2. Review issued gift cards.
3. Open a gift card detail page.
4. Copy or share the public gift card link.
5. Show the gift card QR/display.
6. Explain that staff redeem the gift card in the business Transactions page.
7. Explain that gift cards reduce the customer total, while reward points are still calculated from the eligible bill before tax and service charge.

### Activity

Route: `/activity`

Steps:

1. Open Activity.
2. Show the activity metrics: visits, points earned, redemptions.
3. Review timeline entries.
4. Explain that QR sales, orders, redemptions, and admin actions can contribute to activity history.

### Reset Password

Route: `/reset-password`

Steps:

1. Open password reset from a recovery link.
2. Enter a new password.
3. Save the new password.
4. Return to sign in.

## Business Staff Walkthrough

### Business Login

Route: `/business/login`

Photo: `../public/walkthrough-screenshots/business-login.png`

Steps:

1. Open business login.
2. Sign in as business staff.
3. Confirm staff lands on `/business/dashboard`.
4. Explain that staff access is operational and excludes owner-only configuration areas.

### Staff Navigation

Accessible staff routes:

- `/business/dashboard`
- `/business/member-sale/:token`
- `/business/redemptions`
- `/business/members`
- `/business/partners`
- `/business/guide`

Steps:

1. Open the side navigation.
2. Show QR Sales, Transactions, Customers, Partners, and Guia.
3. Explain that staff do not see Products, Rewards, Promotions, Gift Cards setup, or Settings.

### QR Sales Dashboard

Route: `/business/dashboard`

Photo to capture: business dashboard.

Steps:

1. Show business overview.
2. Explain Customer QR Sales.
3. Review commission model.
4. Review metrics: members recruited, orders completed, revenue, active campaigns, partner referrals, partner credits, outstanding credits, QR transactions, QR revenue, commission owed, pending fulfillment.
5. Show points issued and points redeemed.
6. Show signup portal QR.
7. Show reward credit scanner.
8. Show partner referrals.
9. Show fulfillment queue.

### Record Member Sale

Route: `/business/member-sale/:token`

Photo to capture: member sale page opened from a customer QR.

Steps:

1. Scan or open the customer's Member QR.
2. Confirm the member name and verification state.
3. Enter purchase amount.
4. Add optional receipt number or cashier note.
5. Review preview: reward rate, reward value, points awarded, commission owed.
6. Record sale.
7. Confirm transaction recorded.
8. Explain that the customer receives points and admin can later review commission.

### Transactions and Gift Card Redemptions

Route: `/business/redemptions`

Steps:

1. Open Transactions.
2. Explain that this page handles normal member purchases and gift-card purchases.
3. For a normal sale, scan or paste the customer's Member QR.
4. Enter the bill before tax and service charge.
5. Enter the receipt or bill number.
6. Review the preview: reward rate, reward value, points awarded, tax, service charge, customer total, and commission.
7. Click Process Without Gift Card.
8. For a gift-card sale, scan, upload, paste, or enter the gift card code/public URL.
9. Validate the gift card.
10. Review the preview again:
   - Gift card discount reduces the customer total.
   - Tax is added only when the business setting says it is charged to the customer.
   - Service charge is added only when enabled.
   - Points are based on the bill before tax and service charge.
11. Click Process With Gift Card.
12. Click New Transaction to continue with the next customer.
13. Review Transaction History and confirm it shows receipt, customer, total, gift-card discount, final price, points, and gift-card code.
14. Explain that transaction history includes both normal sales and gift-card sales.

### Customers

Route: `/business/members`

Steps:

1. Open Customers.
2. Search customers.
3. Filter by verification status.
4. Review customer list.
5. Award points manually by customer ID where allowed.
6. Enter purchase amount or points details.
7. Add an internal note.
8. Register a new customer from the business portal.
9. Explain that QR sales are preferred, but manual/customer management tools remain available.

### Partners

Route: `/business/partners`

Steps:

1. Open Partners.
2. Show ambassador page link.
3. Copy ambassador or referral link.
4. Review ambassador leads.
5. Add receptionist code.
6. Enter contact name, optional email, and notes.
7. Review partner contacts.
8. Copy or manage referral links.
9. Review attributed customers.
10. Review outstanding partner credits.
11. Mark credits redeemed when appropriate.

### Business Guide

Route: `/business/guide`

Steps:

1. Open the guide from the business portal.
2. Use it for staff training.
3. Show the QR sale chapter and admin handoff explanation.

## Business Owner Walkthrough

Business owners can access all business staff routes plus owner-only configuration routes.

Owner-only routes:

- `/business/products`
- `/business/rewards`
- `/business/promotions`
- `/business/gift-cards`
- `/business/settings`

### Owner Login

Route: `/business/login`

Steps:

1. Sign in as business owner.
2. Confirm access to the full business navigation.
3. Explain the distinction between staff operational access and owner management access.

### Products

Route: `/business/products`

Steps:

1. Open Products.
2. Search products.
3. Create a product.
4. Enter title, description, category, price, inventory, and highlight.
5. Save the product.
6. Edit an existing product.
7. Delete an existing product.
8. Explain that products support commerce and catalog display.

### Rewards Catalog

Route: `/business/rewards`

Steps:

1. Open Rewards Catalog.
2. Search rewards.
3. Create a reward.
4. Enter title, description, category, points cost, inventory, and highlight.
5. Save the reward.
6. Edit an existing reward.
7. Delete an existing reward.
8. Explain that reward redemption is currently less prominent than the QR sale flow.

### Campaigns / Promotions

Route: `/business/promotions`

Steps:

1. Open Campaigns.
2. Search campaigns.
3. Create a promotion.
4. Enter title, description, badge, call to action, and audience.
5. Save the promotion.
6. Edit an existing promotion.
7. Delete an existing promotion.
8. Explain that promotions appear to customers on the promotions surface.

### Business Gift Card Catalog

Route: `/business/gift-cards`

Steps:

1. Open Gift Card Catalog.
2. Create a gift card catalog item.
3. Enter title, description, price/value, and availability details.
4. Save the gift card item.
5. Edit an existing item.
6. Delete an existing item.
7. Explain that customers can issue gift cards and staff can redeem them from the Transactions page.

### Settings

Route: `/business/settings`

Steps:

1. Open Settings.
2. Review business details.
3. Update business fields available to the owner.
4. Review Rewards Rate. This is the percentage used to calculate points from the eligible bill.
5. Review tax settings:
   - If the business does not charge tax, leave tax off.
   - If tax is charged to the customer, turn on tax included in customer bill.
6. Review service charge settings if the business uses service charge.
7. Save settings.
8. Explain that rewards are based on the bill before tax and service charge.
9. Explain that admin manages platform-level partner assignment and deeper operations fields.

## Admin Walkthrough

### Admin Login

Route: `/admin`

Photo: `../public/walkthrough-screenshots/admin-login.png`

Steps:

1. Open admin login.
2. Sign in as platform admin.
3. Confirm navigation to `/admin/portal`.

### Admin Navigation

Routes:

- `/admin/portal`
- `/admin/gift-cards`
- `/admin/guide`

Admin portal sections:

- Members
- Catalog
- Products
- Promotions
- Partners
- Ambassadors
- Early Access
- Referrals
- Agreements
- Activity
- Commissions

Steps:

1. Open the admin side navigation.
2. Show Guia, then each admin portal section.
3. Explain that admin is the operational control layer across customers, partners, rewards, referrals, legal status, activity, and commissions.

### Members

Route: `/admin/portal#members`

Photo to capture: admin members screen.

Steps:

1. Open Members.
2. Review overview metrics.
3. Use Award Points.
4. Select a member.
5. Enter point adjustment and reason.
6. Submit the adjustment.
7. Use Use Credit.
8. Select a member and apply available credit when relevant.
9. Use ID verification.
10. Select a member under review.
11. Review ID document/status.
12. Approve ID.
13. Reject ID with a rejection reason.
14. Search members.
15. Filter members by all, under review, approved, missing ID, or rejected.

### Catalog

Route: `/admin/portal#catalog`

Steps:

1. Open Catalog.
2. Select a partner business.
3. Search rewards.
4. Create a reward for the selected partner.
5. Enter reward title, description, category, points cost, inventory, and highlight.
6. Save the reward.
7. Edit or delete existing rewards.

### Products

Route: `/admin/portal#products`

Steps:

1. Open Products.
2. Select a partner business.
3. Search products.
4. Create a product for the selected partner.
5. Enter product title, description, category, price, inventory, and highlight.
6. Save the product.
7. Edit or delete products.

### Promotions

Route: `/admin/portal#promotions`

Steps:

1. Open Promotions.
2. Select a partner business.
3. Search campaigns.
4. Create a promotion for the selected partner.
5. Enter title, description, badge, call to action, and audience.
6. Save the promotion.
7. Edit or delete promotions.

### Partners

Route: `/admin/portal#partners`

Photo to capture: admin partners screen.

Steps:

1. Open Partners.
2. Create a partner business.
3. Enter business name, slug, description, address, latitude, longitude, logo URL, reward rate, commission rate, tax rate, tax-included setting, service charge setting, currency, active status, and owner email if available.
4. Save the partner.
5. Search partners.
6. Filter partners by all, active, inactive, pinned, missing coordinates, or missing owner.
7. Edit partner fields.
8. Assign owner.
9. Add staff.
10. Review partner status, coordinates, and business access assignment.

### Ambassadors

Route: `/admin/portal#ambassadors`

Steps:

1. Open Ambassadors.
2. Review ambassador leads.
3. Update ambassador lead status.
4. Use this section to manage outbound or community acquisition.

### Early Access

Route: `/admin/portal#early-access`

Steps:

1. Open Early Access.
2. Review early access leads.
3. Update lead status.
4. Use this section to manage invitation and waitlist follow-up.

### Referrals

Route: `/admin/portal#referrals`

Steps:

1. Open Referrals.
2. Review partner referrals and customer referrals.
3. Approve pending referrals.
4. Reject referrals when needed.
5. Explain that referral records connect customer acquisition and partner attribution.

### Agreements

Route: `/admin/portal#agreements`

Steps:

1. Open Agreements.
2. Review signed and unsigned agreement statuses.
3. Filter by all, unsigned, or signed.
4. Explain that agreement completion controls access for protected workflows.

### Activity

Route: `/admin/portal#activity`

Steps:

1. Open Activity.
2. Review fulfillment queue.
3. Fulfill ready reward claims.
4. Review admin logs.
5. Review recent platform activity.

### Commissions

Route: `/admin/portal#commissions`

Photo to capture: admin commissions screen.

Steps:

1. Open Commissions.
2. Review Member QR Transactions.
3. Confirm each row includes date, business, member, purchase, reward value, points, and commission amount.
4. Confirm gift-card transactions still show points and commission when applicable.
5. Identify unpaid commission rows.
6. Click Mark paid after payment is collected.
7. Explain that this closes the loop: customer QR sale, business points award, and Guatemala Rewards commission tracking.

### Admin Gift Cards

Route: `/admin/gift-cards`

Steps:

1. Open Gift Cards.
2. Filter by business.
3. Review catalog items.
4. Review issued gift cards.
5. Open an issued gift card.
6. Explain that admin can audit platform gift card issuance and usage.
7. Explain that staff redemption activity also appears in business Transaction History and member transaction/commission records.

### Admin Guide

Route: `/admin/guide`

Steps:

1. Open Guia from admin navigation.
2. Use the guide as internal training.
3. Explain the recommended demo order: customer QR, business sale, admin controls.

## Translation Notes

Recommended terms to keep consistent:

- Guatemala Rewards
- Member QR
- QR Sales
- Business Portal
- Admin Portal
- Commission Owed
- Mark paid
- Partner
- Ambassador
- Receptionist Code
- Gift Card

Recommended demo framing:

1. Customer value: one personal QR and a member account.
2. Business value: staff can record in-person purchases and points quickly.
3. Guatemala Rewards value: commissions are tracked from QR sales.
4. Admin value: operations can verify members, manage partners, manage campaigns, and audit activity.

## Feature Coverage Checklist

Public:

- Guide
- Partner map
- Promotions
- For Businesses
- Cost calculator
- Join/invitation
- Promo registration
- Ambassadors
- Public gift card link
- Legal pages
- Reset password

Customer:

- Sign in
- Required agreements
- Dashboard
- Mobile bottom nav
- Profile
- Member QR
- ID verification
- Partner businesses
- Promotions
- Cart
- Checkout
- Order confirmation
- Orders
- Membership
- Hidden rewards route
- Hidden redeem route
- Gift card catalog
- Gift card wallet
- Gift card detail
- Activity

Business staff:

- Business login
- QR Sales dashboard
- Member sale from scanned QR
- Transactions with or without gift cards
- Gift card validation and redemption
- Transaction history
- Customers
- Register new customer
- Manual points/customer tools
- Partners
- Ambassador leads
- Receptionist codes
- Attributed customers
- Partner credits
- Business guide

Business owner:

- All staff features
- Products
- Rewards catalog
- Campaigns
- Business gift card catalog
- Rewards rate, tax, and service charge settings
- Settings

Admin:

- Admin login
- Operations portal
- Members
- Award points
- Use credit
- ID verification approval/rejection
- Catalog rewards
- Products
- Promotions
- Partners
- Create partner
- Assign owner
- Add staff
- Ambassadors
- Early access
- Referrals
- Agreements
- Activity
- Fulfillment
- Admin logs
- Commissions
- Mark commission paid
- Admin gift cards
- Gift card transaction audit
- Admin guide
