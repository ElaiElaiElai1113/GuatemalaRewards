# Guatemala Rewards Walkthrough - Simple Version for Translation Team

Hi team, please translate this walkthrough into Spanish.

Please keep the instructions simple and clear. This guide is for people who may not know the app yet, so avoid complicated wording. The most important idea is:

The customer has their own QR code. The business scans that QR code when the customer buys something. The system gives the customer points and tracks the commission for Guatemala Rewards.

## Photos to Use

Use these photos in the walkthrough:

Public guide:
`../public/walkthrough-screenshots/guide.png`

Public business map:
`../public/walkthrough-screenshots/public-map.png`

Business page:
`../public/walkthrough-screenshots/business-page.png`

Business login:
`../public/walkthrough-screenshots/business-login.png`

Admin login:
`../public/walkthrough-screenshots/admin-login.png`

Some pages need new screenshots after logging in:

- Customer dashboard: `/dashboard`
- Customer QR page: `/profile`
- Customer ID verification: `/profile#id-verification`
- Customer activity: `/activity`
- Business dashboard: `/business/dashboard`
- Business QR sale page: `/business/member-sale/:token`
- Business transactions page: `/business/redemptions`
- Admin members page: `/admin/portal#members`
- Admin partners page: `/admin/portal#partners`
- Admin commissions page: `/admin/portal#commissions`

## Very Short Explanation

Guatemala Rewards has 4 main user types:

1. Public visitors.
2. Customers.
3. Business staff and business owners.
4. Admin team.

The main workflow is:

1. Customer creates an account.
2. Customer verifies their ID.
3. Customer gets an active Member QR.
4. Customer shows the QR at a partner business.
5. Business staff scans the QR.
6. Staff enters the purchase amount.
7. The app gives points to the customer.
8. The app tracks commission owed to Guatemala Rewards.
9. Admin can review everything later.

## Public Visitor Walkthrough

### 1. Public Guide

Page: `/guide`

Photo: `../public/walkthrough-screenshots/guide.png`

What to explain:

This page explains how the platform works.

Steps:

1. Open the Guide page.
2. Explain that Guatemala Rewards connects customers, businesses, and the admin team.
3. Explain that the customer has a QR code.
4. Explain that businesses scan the QR code.
5. Explain that admins can review customers, businesses, and commissions.

### 2. Business Map

Page: `/shop`

Photo: `../public/walkthrough-screenshots/public-map.png`

What to explain:

This page shows partner businesses.

Steps:

1. Open the business map.
2. Show the list of businesses.
3. Click one business.
4. Show the business information.
5. Explain that customers use this page to find places where they can earn points.

### 3. Business Information Page

Page: `/business`

Photo: `../public/walkthrough-screenshots/business-page.png`

What to explain:

This page is for businesses that want to join Guatemala Rewards.

Steps:

1. Open the business page.
2. Explain that businesses can join the rewards platform.
3. Explain that staff can scan customer QR codes.
4. Explain that the system tracks customer points and business commission.
5. Show the business login button.

### 4. Cost Calculator

Page: `/cost-calculator`

What to explain:

This page helps explain the value to a business.

Steps:

1. Open the calculator.
2. Enter example numbers.
3. Show the result.
4. Explain that this helps businesses understand the reward model.

### 5. Promotions

Page: `/promotions`

What to explain:

This page shows current offers from partner businesses.

Steps:

1. Open Promotions.
2. Show the active offers.
3. Explain that promotions help customers decide where to shop.

### 6. Join and Invitation Pages

Pages:

- `/`
- `/invitation`
- `/join`

What to explain:

These pages help new people join or request access.

Steps:

1. Open the invitation page.
2. Explain that new customers can start from here.
3. Explain that old join links may redirect to this page.

### 7. Referral Pages

Pages:

- `/promo`
- `/promo/register`

What to explain:

These pages are used when a customer joins from a referral link.

Steps:

1. Open the promo link.
2. Register a customer.
3. Explain that the app can remember who referred the customer.

### 8. Legal Pages

Pages:

- `/terms`
- `/privacy`
- `/reward-terms`
- `/verification-policy`

What to explain:

These pages explain the rules, privacy, rewards, and verification policy.

## Customer Walkthrough

This is the most important section.

The customer should understand:

My QR code is my main tool. I show it at a business. The business scans it. I get points.

### 1. Customer Sign In

Page: `/signin`

Steps:

1. Customer opens the sign in page.
2. Customer signs in or creates an account.
3. If agreements appear, customer signs them.
4. Customer goes to the dashboard.

### 2. Customer Dashboard

Page: `/dashboard`

Photo to capture later.

What to explain:

This is the customer's home page.

Steps:

1. Show the customer points.
2. Show the wallet summary.
3. Show the checklist.
4. Explain the checklist:
   - Account created.
   - Verify ID.
   - Unlock Member QR.
   - Make first QR sale.
   - Review activity.
5. Show the quick buttons:
   - Show member QR.
   - Verify ID.
   - View history.

### 3. Mobile Bottom Menu

What to explain:

On a phone, the customer uses the bottom menu.

Buttons:

- Home.
- Businesses.
- QR.
- Activity.

Steps:

1. Tap Home to go to the dashboard.
2. Tap Businesses to see partner businesses.
3. Tap QR to open the customer QR page.
4. Tap Activity to see points and history.
5. Tap the verification message if the customer still needs to verify their ID.

### 4. Customer Profile and QR Code

Page: `/profile`

Photo to capture later.

What to explain:

This is where the customer sees their personal QR code.

Steps:

1. Open Profile.
2. Show the Member QR section.
3. If the customer is verified, the QR code is active.
4. If the customer is not verified, the QR code is locked.
5. Explain that businesses scan this QR code to give points.
6. Show the Copy QR Link button.
7. Show the profile fields:
   - Full name.
   - Phone number.
   - Home business or location.
   - Favorite order.
8. Save changes.

### 5. ID Verification

Page: `/profile#id-verification`

Photo to capture later.

What to explain:

The customer must verify their ID before the QR code and rewards fully work.

Steps:

1. Go to ID Verification.
2. Enter the ID number.
3. Upload a photo or PDF of the ID.
4. Click Submit ID.
5. Explain the possible statuses:
   - Required: customer still needs to submit ID.
   - Under review: admin is checking the ID.
   - Verified: customer is approved.
   - Needs resubmission: customer must upload again.

### 6. How the Customer Earns Points

This is the main flow.

Steps:

1. Customer goes to a partner business.
2. Customer opens their QR code.
3. Customer shows QR code to staff.
4. Staff scans the QR code.
5. Staff enters the purchase amount.
6. Staff enters the receipt number.
7. Staff records the sale.
8. Customer receives points.
9. Customer can check Activity to see the points.

### 7. Partner Businesses

Page: `/shop`

Photo: `../public/walkthrough-screenshots/public-map.png`

Steps:

1. Customer opens Businesses.
2. Customer browses partner businesses.
3. Customer selects a business.
4. Customer checks business information.
5. Customer decides where to shop.

### 8. Promotions

Page: `/promotions`

Steps:

1. Customer opens Promotions.
2. Customer sees current offers.
3. Customer chooses where they want to shop.

### 9. Cart, Checkout, and Orders

Pages:

- `/cart`
- `/checkout`
- `/order-confirmation`
- `/orders`

What to explain:

This is the online shopping flow. It exists, but the main in-person flow is still the QR scan.

Steps:

1. Customer adds a product to cart.
2. Customer opens Cart.
3. Customer reviews items.
4. Customer goes to Checkout.
5. Customer reviews the order.
6. Customer places the order.
7. Customer sees Order Confirmation.
8. Customer opens Orders to see order history.

### 10. Membership

Page: `/membership`

Steps:

1. Customer opens Membership.
2. Customer reviews the monthly membership.
3. Customer can subscribe in demo mode.
4. Customer can renew or cancel if available.
5. Explain that some reward actions need ID verification.

### 11. Gift Cards

Pages:

- `/gift-cards`
- `/wallet/gift-cards`
- `/wallet/gift-cards/:id`

Photo to capture later.

Steps:

1. Customer opens Gift Cards.
2. Customer browses gift cards.
3. Customer issues a gift card if eligible.
4. Customer opens Wallet Gift Cards.
5. Customer opens one gift card.
6. Customer can copy or share the gift card link.
7. Business staff can redeem the gift card.
8. Explain that the gift card can reduce what the customer pays, but the app still calculates points from the correct bill amount.

### 12. Activity

Page: `/activity`

Photo to capture later.

What to explain:

This page shows customer history.

Steps:

1. Open Activity.
2. Show points earned.
3. Show redemptions.
4. Show QR visits or purchases.
5. Explain that this is where the customer checks what happened on their account.

### 13. Hidden Rewards Pages

Pages:

- `/rewards`
- `/redeem/:rewardId`

What to explain:

These pages exist, but they are hidden from the current customer flow.

Important:

Do not make the rewards shop the main explanation. The main explanation is the customer QR code.

## Business Staff Walkthrough

Business staff use the portal to help customers in person.

### 1. Business Login

Page: `/business/login`

Photo: `../public/walkthrough-screenshots/business-login.png`

Steps:

1. Staff opens the business login page.
2. Staff signs in.
3. Staff goes to the business dashboard.

### 2. What Staff Can Access

Staff can access:

- QR Sales dashboard.
- QR sale page.
- Transactions.
- Customers.
- Partners.
- Business guide.

Staff cannot access:

- Products setup.
- Rewards setup.
- Promotions setup.
- Gift card setup.
- Settings.

### 3. QR Sales Dashboard

Page: `/business/dashboard`

Photo to capture later.

What to explain:

This is the main business staff page.

Steps:

1. Show Customer QR Sales.
2. Explain that staff scan customer QR codes from here.
3. Show commission model.
4. Show QR transactions.
5. Show QR revenue.
6. Show commission owed.
7. Show pending fulfillment.
8. Show signup QR for new customers.
9. Show reward credit scanner.

### 4. Record a Member Sale

Page: `/business/member-sale/:token`

Photo to capture later.

This is the most important staff workflow.

Steps:

1. Customer shows QR code.
2. Staff scans QR code.
3. Member sale page opens.
4. Staff checks customer name.
5. Staff checks customer verification status.
6. Staff enters purchase amount.
7. Staff adds optional receipt note.
8. Staff checks preview:
   - Reward value.
   - Points awarded.
   - Commission owed.
9. Staff clicks Record Sale.
10. Sale is saved.
11. Customer gets points.
12. Commission is tracked for Guatemala Rewards.

### 5. Transactions Page

Page: `/business/redemptions`

Steps:

1. Staff opens Transactions.
2. Staff can process a normal transaction without a gift card.
3. Staff scans or pastes the customer's Member QR.
4. Staff enters the bill before tax and service charge.
5. Staff enters the receipt or bill number.
6. Staff checks the reward preview:
   - Bill before tax or service.
   - Gift card discount if used.
   - Tax added if the business setting says tax is included.
   - Service charge if the business uses service charge.
   - Customer total.
   - Rewardable bill.
   - Points awarded.
7. Staff clicks Process Without Gift Card for a normal sale.
8. If the customer has a gift card, staff scans or pastes the gift card code.
9. Staff validates the gift card.
10. Staff clicks Process With Gift Card.
11. Staff clicks New Transaction to continue with the next customer.

Important:

- The gift card reduces the customer total.
- Points are based on the bill before tax and service charge.
- Tax and service charge do not create reward points.
- Transaction History shows normal sales and gift card sales together.
- Transaction History shows receipt, customer, total, discount, final price, points, and gift card code.

### 6. Customers

Page: `/business/members`

Steps:

1. Staff opens Customers.
2. Staff searches for a customer.
3. Staff reviews customer details.
4. Staff can award points manually if needed.
5. Staff can register a new customer.
6. Explain that QR sale is still the preferred method.

### 7. Partners

Page: `/business/partners`

Steps:

1. Staff opens Partners.
2. Staff copies referral or ambassador links.
3. Staff adds receptionist codes.
4. Staff reviews attributed customers.
5. Staff reviews partner credits.
6. Staff marks credits redeemed if needed.

## Business Owner Walkthrough

Business owners can do everything staff can do. They also manage business setup.

### 1. Owner Dashboard

Page: `/business/dashboard`

Steps:

1. Owner signs in.
2. Owner reviews QR sales.
3. Owner reviews points.
4. Owner reviews commission owed.
5. Owner reviews performance metrics.
6. Owner can review transaction history, including normal sales and gift-card sales.

### 2. Products

Page: `/business/products`

Steps:

1. Owner opens Products.
2. Owner creates a product.
3. Owner enters title, description, price, inventory, and category.
4. Owner saves the product.
5. Owner can edit or delete products.

### 3. Rewards

Page: `/business/rewards`

Steps:

1. Owner opens Rewards.
2. Owner creates a reward.
3. Owner enters title, description, points cost, inventory, and category.
4. Owner saves the reward.
5. Owner can edit or delete rewards.

### 4. Promotions

Page: `/business/promotions`

Steps:

1. Owner opens Promotions.
2. Owner creates a promotion.
3. Owner enters title, description, badge, call to action, and audience.
4. Owner saves the promotion.
5. Owner can edit or delete promotions.

### 5. Gift Card Catalog

Page: `/business/gift-cards`

Steps:

1. Owner opens Gift Cards.
2. Owner creates a gift card item.
3. Owner enters gift card details.
4. Owner saves the item.
5. Owner can edit or delete gift card items.
6. Explain that customers can issue these gift cards and staff redeem them from Transactions.

### 6. Settings

Page: `/business/settings`

Steps:

1. Owner opens Settings.
2. Owner reviews business information.
3. Owner updates business information.
4. Owner checks Rewards Rate.
5. Owner checks tax settings:
   - If tax is not charged, leave tax off.
   - If tax is charged to the customer, turn on tax included in customer bill.
6. Owner checks service charge settings if the business uses service charge.
7. Owner saves changes.

Important:

- Rewards Rate is a percentage.
- Example: bill is 230 and Rewards Rate is 20%. Customer earns 46 points.
- Tax and service charge can be added to the customer total, but rewards are based on the bill before tax and service charge.

## Admin Walkthrough

Admin controls the platform.

### 1. Admin Login

Page: `/admin`

Photo: `../public/walkthrough-screenshots/admin-login.png`

Steps:

1. Admin opens admin login.
2. Admin signs in.
3. Admin goes to admin portal.

### 2. Admin Portal Sections

Page: `/admin/portal`

Admin sections:

- Members.
- Catalog.
- Products.
- Promotions.
- Partners.
- Ambassadors.
- Early Access.
- Referrals.
- Agreements.
- Activity.
- Commissions.

### 3. Members and ID Verification

Page: `/admin/portal#members`

Photo to capture later.

Steps:

1. Admin opens Members.
2. Admin searches for a customer.
3. Admin reviews customer details.
4. Admin reviews ID verification.
5. Admin approves the ID if correct.
6. Admin rejects the ID if there is a problem.
7. If rejected, admin writes the reason.
8. When approved, the customer's QR code becomes active.

### 4. Award Points and Use Credit

Page: `/admin/portal#members`

Steps:

1. Admin selects a member.
2. Admin chooses Award Points.
3. Admin enters points and reason.
4. Admin submits.
5. Admin can also use reward credit when available.

### 5. Catalog, Products, and Promotions

Pages:

- `/admin/portal#catalog`
- `/admin/portal#products`
- `/admin/portal#promotions`

Steps:

1. Admin selects a partner business.
2. Admin creates rewards, products, or promotions.
3. Admin enters details.
4. Admin saves.
5. Admin can edit or delete items.

### 6. Partners

Page: `/admin/portal#partners`

Photo to capture later.

Steps:

1. Admin opens Partners.
2. Admin creates a partner business.
3. Admin enters business information:
   - Name.
   - Slug.
   - Description.
   - Address.
   - Coordinates.
   - Logo.
   - Earn rate.
   - Rewards rate.
   - Tax rate.
   - Tax included in customer bill.
   - Service charge settings.
   - Currency.
   - Owner email.
4. Admin saves the partner.
5. Admin can edit partner details.
6. Admin can assign business owner.
7. Admin can add business staff.

### 7. Ambassadors and Early Access

Pages:

- `/admin/portal#ambassadors`
- `/admin/portal#early-access`

Steps:

1. Admin reviews ambassador leads.
2. Admin updates lead status.
3. Admin reviews early access leads.
4. Admin updates lead status.

### 8. Referrals

Page: `/admin/portal#referrals`

Steps:

1. Admin reviews referrals.
2. Admin approves valid referrals.
3. Admin rejects invalid referrals.
4. Explain that referrals help track who brought in the customer.

### 9. Agreements

Page: `/admin/portal#agreements`

Steps:

1. Admin opens Agreements.
2. Admin checks who signed.
3. Admin checks who has not signed.
4. Admin reviews signatures if available.

### 10. Activity

Page: `/admin/portal#activity`

Steps:

1. Admin opens Activity.
2. Admin reviews fulfillment queue.
3. Admin fulfills ready reward claims.
4. Admin reviews admin logs.
5. Admin reviews recent platform activity.

### 11. Commissions

Page: `/admin/portal#commissions`

Photo to capture later.

This is very important.

Steps:

1. Admin opens Commissions.
2. Admin reviews QR transactions.
3. Admin checks:
   - Date.
   - Business.
   - Customer.
   - Purchase amount.
   - Points awarded.
   - Commission amount.
   - Gift card code if used.
4. Admin finds unpaid commission.
5. Admin clicks Mark paid after payment is collected.
6. Explain that this is how Guatemala Rewards tracks money owed from businesses.

### 12. Admin Gift Cards

Page: `/admin/gift-cards`

Steps:

1. Admin opens Gift Cards.
2. Admin filters by business.
3. Admin reviews gift card catalog items.
4. Admin reviews issued gift cards.
5. Admin audits gift card usage.

## Final Simple Explanation

Use this explanation if someone gets confused:

The customer has a QR code. The customer shows it at a business. The business scans it and enters the purchase amount. The app gives points to the customer. The app also tracks commission owed to Guatemala Rewards. Admin can verify customers, manage businesses, and review commissions.

## Words to Keep Consistent

Please keep these words consistent in Spanish:

- Guatemala Rewards
- Member QR
- QR Sales
- Business Portal
- Admin Portal
- Partner Business
- Commission Owed
- Mark paid
- Gift Card
- Reward Credit
- Receptionist Code
- Ambassador
- Verification required
- Under review
- Verified
- Needs resubmission
