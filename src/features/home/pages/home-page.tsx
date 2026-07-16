import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'

import carRewards from '@/assets/landing/car-rewards-clean.png'
import coffeeMember from '@/assets/landing/coffee-member.png'
import coffeeRewards from '@/assets/landing/coffee-rewards.png'
import dinnerRewards from '@/assets/landing/dinner-rewards.png'
import realEstateRewards from '@/assets/landing/real-estate-rewards.png'
import salonRewards from '@/assets/landing/salon-rewards.png'
import vacationBanner from '@/assets/landing/vacation-beach-clean.webp'

import './home-page.css'

const valueItems = [
  {
    icon: '🏠',
    title: 'Support local, automatically',
    body: 'Support the local businesses you already love, every single time you spend.',
  },
  {
    icon: '📊',
    title: 'Earn 20% – 100% back',
    body: 'Simply spend at amazing businesses within our platform to start earning.',
  },
  {
    icon: '🛒',
    title: 'Almost anything counts',
    body: 'Earn from purchasing almost any type of product or service - from Restaurants, hotels, coffee shops, hair and nail salons, cars, even real estate and more.',
  },
] as const

const categoryImages = [
  {
    src: coffeeRewards,
    alt: 'Member earning rewards at a local coffee shop',
    className: 'figma-home__category-card--coffee',
  },
  {
    src: dinnerRewards,
    alt: 'Friends dining together in Guatemala',
    className: 'figma-home__category-card--dining',
  },
  {
    src: salonRewards,
    alt: 'Member enjoying a day at a local hair salon',
    className: 'figma-home__category-card--salon',
  },
  {
    src: carRewards,
    alt: 'Family celebrating a car purchase',
    className: 'figma-home__category-card--cars',
  },
  {
    src: realEstateRewards,
    alt: 'Couple earning rewards on a real estate purchase',
    className: 'figma-home__category-card--real-estate',
  },
] as const

const freeBenefits = [
  'Earn 10% back automatically on every purchase',
  'Upgrade any time as you spend more',
] as const

const regularBenefits = [
  'Earn minimum 20% – 100% back on almost all purchases',
  'Earn $10 USD in rewards for every member you refer that joins',
  'Earn a minimum of $50 USD in Rewards for referring a business that joins',
] as const

const processSteps = [
  {
    number: '01',
    title: 'Join',
    body: 'Sign up as a member — free, in under a minute.',
  },
  {
    number: '02',
    title: 'Spend & earn',
    body: 'Shop, dine, and buy at any business in our network. Earn 10% back for free, or 20–100% back on our paid tier.',
  },
  {
    number: '03',
    title: 'Redeem',
    body: 'Use your Rewards to purchase your dream vacation, or on anything available in our Rewards Store.',
  },
] as const

const faqs = [
  {
    icon: '📍',
    question: 'Where can I use my Rewards?',
    answer: 'You can use your Rewards with many partnered businesses, either by going to the Rewards Store or by messaging us for more options.',
  },
  {
    icon: '👤',
    question: 'Can I have more than one Rewards account?',
    answer: 'No. Each person can have one Rewards account, tied to your full name, email, and phone number.',
    open: true,
  },
  {
    icon: '✅',
    question: 'Can I transfer Rewards to another account?',
    answer: 'Rewards are tied to your member account and must be used and cannot be transferred.',
  },
  {
    icon: '$',
    question: 'Can Rewards be exchanged for money?',
    answer: 'No, Rewards are designed for member benefits, purchases, travel, experiences, and partner offers within the Guatemala Rewards Program - not cash exchange.',
  },
] as const

function Brand() {
  return (
    <span className="figma-home__brand">
      <img src="/favicon.svg" alt="" aria-hidden="true" />
      <span>GUATEMALA REWARDS</span>
    </span>
  )
}

function SectionEyebrow({ children }: { children: string }) {
  return <p className="figma-home__eyebrow">{children}</p>
}

export function HomePage() {
  return (
    <main className="figma-home" id="top">
      <div className="figma-home__paper">
        <header className="figma-home__header">
          <div className="figma-home__container figma-home__header-inner">
            <a href="#top" className="figma-home__brand-link" aria-label="Guatemala Rewards home">
              <Brand />
            </a>

            <nav className="figma-home__nav" aria-label="Primary navigation">
              <a href="#how-it-works">How it works</a>
              <Link to="/business">Businesses</Link>
              <a href="#faq">FAQ</a>
            </nav>

            <Link className="figma-home__button figma-home__button--header" to="/join">
              Join now
            </Link>
          </div>
        </header>

        <section className="figma-home__hero" aria-labelledby="home-hero-title">
          <div className="figma-home__container figma-home__hero-grid">
            <div className="figma-home__hero-copy">
              <h1 id="home-hero-title">
                Earn Amazing
                <br />
                Rewards While
                <br />
                <em>Supporting Local</em>
                <br />
                Businesses
              </h1>

              <div className="figma-home__hero-text">
                <p>
                  Every time you shop, dine, or spend at a business in our network, you're supporting a local business
                  {' '}— and earning Rewards you can actually use.
                </p>
                <p>
                  Join free and earn 10% back automatically — or upgrade to earn between 20% and 100% back — every
                  time you spend with the businesses in our network.
                </p>
              </div>

              <div className="figma-home__hero-actions">
                <Link className="figma-home__button" to="/join">Join Guatemala Rewards</Link>
                <a className="figma-home__button figma-home__button--secondary" href="#how-it-works">See how it works</a>
              </div>

              <ul className="figma-home__hero-pills" aria-label="Membership benefits">
                <li>Everyday spending</li>
                <li>20% – 100% back</li>
                <li>Any business, anywhere</li>
              </ul>
            </div>

            <div className="figma-home__hero-visual">
              <img src={coffeeMember} alt="Member enjoying rewards at a local coffee shop" />
              <div className="figma-home__reward-badge" aria-label="More than fifty percent back today">
                <strong>+50%</strong>
                <span>BACK<br />TODAY</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="figma-home__rewards" id="rewards" aria-labelledby="rewards-title">
        <div className="figma-home__container">
          <h2 id="rewards-title">Every purchase becomes a<br />Reward</h2>

          <div className="figma-home__value-grid">
            {valueItems.map((item) => (
              <article className="figma-home__value-card" key={item.title}>
                <span className="figma-home__value-icon" aria-hidden="true">{item.icon}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>

          <div className="figma-home__category-grid">
            {categoryImages.map((item) => (
              <figure className={`figma-home__category-card ${item.className}`} key={item.alt}>
                <img src={item.src} alt={item.alt} />
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="figma-home__membership" id="membership" aria-labelledby="membership-title">
        <div className="figma-home__container">
          <SectionEyebrow>MEMBERSHIP</SectionEyebrow>
          <h2 id="membership-title">Choose how you earn</h2>
          <p className="figma-home__section-intro">Start free, or upgrade and get 100% of it back in Rewards credit.</p>

          <div className="figma-home__membership-grid">
            <article className="figma-home__membership-card">
              <div className="figma-home__membership-heading">
                <h3>Free Membership</h3>
                <span className="figma-home__percentage">10%</span>
              </div>
              <p className="figma-home__price">$0</p>
              <p className="figma-home__price-note">No cost to join</p>
              <ul className="figma-home__benefit-list">
                {freeBenefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
              </ul>
              <Link className="figma-home__membership-button figma-home__membership-button--free" to="/join">
                Join Free →
              </Link>
            </article>

            <article className="figma-home__membership-card figma-home__membership-card--regular">
              <span className="figma-home__free-ribbon">WORKS OUT TO BE FREE</span>
              <div className="figma-home__membership-heading">
                <h3>Regular Membership</h3>
                <span className="figma-home__percentage figma-home__percentage--regular">100%</span>
              </div>
              <p className="figma-home__price">$25 USD</p>
              <p className="figma-home__price-note">Earn $25 USD back in rewards</p>
              <ul className="figma-home__benefit-list">
                {regularBenefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
              </ul>
              <Link className="figma-home__membership-button" to="/join">Upgrade →</Link>
            </article>
          </div>
        </div>
      </section>

      <section className="figma-home__process" id="how-it-works" aria-labelledby="process-title">
        <div className="figma-home__container">
          <SectionEyebrow>THE PROCESS</SectionEyebrow>
          <h2 id="process-title">How it works</h2>

          <div className="figma-home__process-grid">
            {processSteps.map((step) => (
              <article className="figma-home__process-step" key={step.number}>
                <span className="figma-home__step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="figma-home__vacation"
        id="vacation"
        aria-labelledby="vacation-title"
        style={{ '--vacation-art': `url(${vacationBanner})` } as CSSProperties}
      >
        <div className="figma-home__vacation-shade" />
        <div className="figma-home__container figma-home__vacation-content">
          <SectionEyebrow>REDEEM</SectionEyebrow>
          <h2 id="vacation-title">Your dream vacation.<br />Already paid for.</h2>
          <p>Every Reward you earn stacks toward the Rewards Store<br />— including the trip you've been putting off.</p>
          <Link className="figma-home__button" to="/join">Start earning today</Link>
        </div>
      </section>

      <section className="figma-home__faq" id="faq" aria-labelledby="faq-title">
        <div className="figma-home__container">
          <SectionEyebrow>GOOD TO KNOW</SectionEyebrow>
          <h2 id="faq-title">Frequently asked questions</h2>

          <div className="figma-home__faq-list">
            {faqs.map((faq) => (
              <details key={faq.question} open={'open' in faq && faq.open}>
                <summary>
                  <span><span aria-hidden="true">{faq.icon}</span>{faq.question}</span>
                  <span className="figma-home__faq-toggle" aria-hidden="true" />
                </summary>
                {'answer' in faq && faq.answer ? <p>{faq.answer}</p> : null}
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="figma-home__suggest" aria-labelledby="suggest-title">
        <div className="figma-home__container figma-home__suggest-inner">
          <div>
            <h2 id="suggest-title">Don't see one of your favourite<br />businesses?</h2>
            <p>Refer them to us, and if they join, you'll earn Rewards.</p>
          </div>
          <Link className="figma-home__button figma-home__suggest-button" to="/business">Suggest a business →</Link>
        </div>
      </section>

      <footer className="figma-home__footer">
        <div className="figma-home__container">
          <div className="figma-home__footer-top">
            <div>
              <a href="#top" className="figma-home__brand-link" aria-label="Back to the top">
                <Brand />
              </a>
              <p>Earn amazing rewards while supporting<br />local businesses.</p>
            </div>
            <nav aria-label="Footer navigation">
              <Link to="/privacy">Privacy policy</Link>
              <Link to="/terms">Contact</Link>
            </nav>
          </div>
          <div className="figma-home__footer-bottom">
            <p>© 2026 Guatemala Rewards. All rights reserved.</p>
            <p>Made for members in Guatemala</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
