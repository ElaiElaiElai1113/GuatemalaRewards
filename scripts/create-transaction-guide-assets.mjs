import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

import { chromium } from 'playwright'

const outDir = 'docs/transaction-guide-screenshots'

const baseStyles = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    width: 1360px;
    min-height: 860px;
    font-family: Manrope, Arial, sans-serif;
    color: #24160f;
    background: #fff4e6;
  }
  .page { padding: 28px 36px; }
  .topbar {
    height: 58px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #e6bc8b;
    background: #fff8ef;
    padding: 0 30px;
  }
  .brand { font-size: 21px; font-weight: 800; }
  .nav { display: flex; gap: 10px; align-items: center; }
  .nav span, .pill {
    border: 1px solid #e4bd90;
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .04em;
    background: #fffaf2;
  }
  .nav .active, .button.primary { background: #a66b1d; color: #fffaf2; border-color: #a66b1d; }
  h1, h2, h3 { font-family: "Cormorant Garamond", Georgia, serif; color: #7a4218; margin: 0; }
  h1 { font-size: 48px; line-height: 1; }
  h2 { font-size: 28px; }
  h3 { font-size: 24px; }
  p { margin: 0; color: #8a6a52; }
  .card {
    border: 1px solid #e5bd8d;
    border-radius: 24px;
    background: #fffaf2;
    box-shadow: 0 18px 45px rgba(105, 61, 24, .10);
  }
  .section { padding: 24px; }
  .grid { display: grid; gap: 18px; }
  .two { grid-template-columns: 1.05fr .95fr; }
  .three { grid-template-columns: repeat(3, 1fr); }
  .input {
    height: 50px;
    border: 1px solid #e1b887;
    border-radius: 16px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    background: #fffdf8;
    color: #24160f;
    font-size: 16px;
  }
  .button {
    height: 46px;
    border-radius: 999px;
    border: 1px solid #e1b887;
    padding: 0 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 14px;
    background: #fffaf2;
  }
  .metric {
    border: 1px solid #e1b887;
    border-radius: 14px;
    background: #f7e4ce;
    padding: 16px;
    min-height: 86px;
  }
  .label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: .18em;
    color: #a4775a;
    font-weight: 900;
  }
  .value { margin-top: 9px; font-size: 20px; font-weight: 800; color: #050505; }
  .scanner {
    height: 185px;
    border: 1px dashed #d9ad7b;
    border-radius: 16px;
    background: #f5dfc6;
    display: grid;
    place-items: center;
    text-align: center;
    color: #8a4b1b;
  }
  .badge {
    display: inline-flex;
    border-radius: 999px;
    background: #f1d8bd;
    border: 1px solid #d9ad7b;
    color: #050505;
    padding: 7px 13px;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .row { display: flex; align-items: center; gap: 12px; }
`

function shell(content) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseStyles}</style></head><body>${content}</body></html>`
}

const views = [
  {
    file: 'transactions-overview.png',
    html: shell(`
      <div class="topbar"><div class="brand">Guatemala Rewards</div><div class="nav"><span>Dashboard</span><span class="active">Transactions</span><span>Customers</span></div></div>
      <div class="page">
        <div class="row" style="justify-content:space-between;margin-bottom:18px;">
          <div><h1>Transactions</h1><p>Use one page for normal member QR sales and gift-card transactions.</p></div>
          <span class="pill">Business Staff</span>
        </div>
        <div class="card section grid two">
          <div>
            <div class="label">Scan customer or gift card QR</div>
            <h2 style="margin:8px 0 10px;">Transaction Scanner</h2>
            <p style="margin-bottom:14px;">The same scanner accepts a member QR or a gift-card QR.</p>
            <div class="scanner"><div><div style="font-size:42px;font-weight:900;">QR</div><strong>Point the camera at the QR</strong><br>or upload a screenshot.</div></div>
            <div class="row" style="margin-top:14px;"><button class="button primary">Start Camera</button><button class="button">Upload QR</button><button class="button">Stop</button></div>
          </div>
          <div class="grid">
            <div><div class="label">Member QR link or token</div><div class="input">https://.../business/member-sale/token</div></div>
            <button class="button primary" style="width:160px;">Load Member</button>
            <div class="metric"><div class="label">Loaded customer</div><div class="value">E2E Verified Customer</div></div>
            <div class="metric"><div class="label">Next step</div><div class="value">Enter sale details</div></div>
          </div>
        </div>
      </div>
    `),
  },
  {
    file: 'normal-transaction.png',
    html: shell(`
      <div class="topbar"><div class="brand">Guatemala Rewards</div><div class="nav"><span>Dashboard</span><span class="active">Transactions</span></div></div>
      <div class="page">
        <h1 style="margin-bottom:6px;">Normal transaction</h1>
        <p style="margin-bottom:18px;">Gift card field is empty, so staff process without gift card.</p>
        <div class="card section grid two">
          <div class="grid">
            <div><div class="label">Bill before tax/service</div><div class="input">$230.00</div></div>
            <div><div class="label">Receipt / bill number</div><div class="input">123456</div></div>
            <div class="metric"><div class="label">Optional gift card</div><div class="value" style="color:#a4775a;">Empty</div></div>
            <button class="button primary" style="width:220px;">Process Without Gift Card</button>
          </div>
          <div class="grid">
            <h2>Reward Calculation</h2>
            <div class="metric"><div class="label">Customer total with tax</div><div class="value">$258.98</div></div>
            <div class="metric"><div class="label">Rewardable bill</div><div class="value">$230.00</div></div>
            <div class="metric"><div class="label">Reward rate</div><div class="value">20%</div></div>
            <div class="metric"><div class="label">Points awarded</div><div class="value">46</div></div>
          </div>
        </div>
      </div>
    `),
  },
  {
    file: 'gift-card-transaction.png',
    html: shell(`
      <div class="topbar"><div class="brand">Guatemala Rewards</div><div class="nav"><span>Dashboard</span><span class="active">Transactions</span></div></div>
      <div class="page">
        <h1 style="margin-bottom:6px;">Gift-card transaction</h1>
        <p style="margin-bottom:18px;">When a valid gift card is present, only the gift-card button is available.</p>
        <div class="card section grid two">
          <div class="grid">
            <div><div class="label">Optional gift card</div><div class="input">GC-260701-B3A4BB</div></div>
            <div class="row"><span class="badge">Active</span><button class="button primary">Validate Gift Card</button></div>
            <div><div class="label">Bill before tax/service</div><div class="input">$230.00</div></div>
            <div><div class="label">Receipt / bill number</div><div class="input">123456</div></div>
            <button class="button primary" style="width:210px;">Process With Gift Card</button>
          </div>
          <div class="grid">
            <h2>Reward Calculation</h2>
            <div class="metric"><div class="label">Gift card discount</div><div class="value">-$230.00</div></div>
            <div class="metric"><div class="label">Tax added to customer total</div><div class="value">+$28.98</div></div>
            <div class="metric"><div class="label">Customer total</div><div class="value">$28.98</div></div>
            <div class="metric"><div class="label">Points awarded</div><div class="value">46</div></div>
          </div>
        </div>
      </div>
    `),
  },
  {
    file: 'transaction-history.png',
    html: shell(`
      <div class="topbar"><div class="brand">Guatemala Rewards</div><div class="nav"><span>Dashboard</span><span class="active">Transactions</span></div></div>
      <div class="page">
        <div class="row" style="justify-content:space-between;margin-bottom:18px;"><div><h1>Transaction History</h1><p>Shows all purchases, whether or not a gift card was used.</p></div><span class="pill">4 transactions</span></div>
        <div class="card" style="overflow:hidden;">
          ${['Gift Card Redeemed','Normal Transaction','Gift Card Redeemed'].map((status, index) => `
            <div class="section grid" style="grid-template-columns: 1.2fr 1fr 1fr 1fr 1.4fr; border-top:${index ? '1px solid #e4bd90' : '0'};">
              <div><span class="badge">${status}</span><div class="label" style="margin-top:16px;">Receipt</div><div class="value">${index === 1 ? '789012' : '123456'}</div><p>Jul 2, 2026</p></div>
              <div class="metric"><div class="label">Total</div><div class="value">USD ${index === 1 ? '115' : '230'}</div></div>
              <div class="metric"><div class="label">Gift Card Discount</div><div class="value">${index === 1 ? 'USD 0' : '-USD 230'}</div></div>
              <div class="metric"><div class="label">Final Price</div><div class="value">USD ${index === 1 ? '128.8' : '28.98'}</div></div>
              <div class="metric"><div class="label">Points</div><div class="value">${index === 1 ? '23' : '46'}</div></div>
            </div>
          `).join('')}
        </div>
      </div>
    `),
  },
]

mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1360, height: 860 }, deviceScaleFactor: 1 })

for (const view of views) {
  await page.setContent(view.html, { waitUntil: 'load' })
  await page.screenshot({ path: join(outDir, view.file), fullPage: false })
}

await browser.close()
console.log(outDir)
