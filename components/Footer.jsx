import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Image src="/logo/logo.png" alt="№40 TRAY" width={200} height={80} className="footer-logo" />
          <p className="footer-tagline">Nature's Finest.<br/>40 Times Over.</p>
          <div className="footer-social">
            <a href="#" aria-label="Instagram" className="social-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="#" aria-label="WhatsApp" className="social-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            </a>
            <a href="#" aria-label="YouTube" className="social-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>
            </a>
          </div>
        </div>
        <div className="footer-col">
          <h4>Shop</h4>
          <Link href="/microgreens">All Microgreens</Link>
          <Link href="/subscription">Subscriptions</Link>
          <Link href="/#why-micro">Why Microgreens</Link>
          <Link href="/#standards">Our Standards</Link>
          <Link href="/#nutrition">Nutrition</Link>
          <Link href="/#faq">FAQ</Link>
        </div>
        <div className="footer-col">
          <h4>Subscriptions</h4>
          <Link href="/subscription">Single Plans</Link>
          <Link href="/subscription">Couple Plans</Link>
          <Link href="/subscription">Family Plans</Link>
          <a href="#">Bulk &amp; Restaurant Supply</a>
          <a href="#">Gift a Subscription</a>
        </div>
        <div className="footer-col">
          <h4>Company</h4>
          <Link href="/">Our Story</Link>
          <Link href="/">How We Grow</Link>
          <Link href="/">Health &amp; Nutrition</Link>
          <a href="#">Blog</a>
          <a href="#">Contact Us</a>
        </div>
        <div className="footer-col">
          <h4>Contact</h4>
          <p className="footer-contact-item">📧 hello@thetraymicrogreens.in</p>
          <p className="footer-contact-item">📱 +91 98765 43210</p>
          <p className="footer-contact-item">📍 Tirupati, Andhra Pradesh</p>
          <p className="footer-contact-item">🕐 Mon–Sat, 9am – 6pm</p>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <p>© 2025 <span className="brand-name"><Image src="/logo/n40.png" alt="№40" width={35} height={35} className="hero-logo-img" /><span className="brand-tray">TRAY</span></span>. All rights reserved.</p>
          <div className="footer-legal">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/refund">Refund Policy</Link>
            <Link href="/shipping">Shipping & Delivery</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
