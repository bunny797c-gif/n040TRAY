export const metadata = { title: 'Privacy Policy — The Tray Microgreens' };

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="legal-meta">Last updated: 9 June 2026</p>

      <p>
        The Tray Microgreens ("we", "us", or "our") respects your privacy. This policy explains what
        personal data we collect, how we use it, and the choices you have. It applies to the
        thetraymicrogreens.in website and all related services.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li><strong>Account details</strong> — name, email, phone number you provide at signup or checkout.</li>
        <li><strong>Delivery details</strong> — address, pincode, optional delivery instructions.</li>
        <li><strong>Payment details</strong> — handled and stored by Razorpay; we receive only the order ID, payment ID, and status.</li>
        <li><strong>Usage data</strong> — pages visited, device type, IP address, timestamps. Used for security and product improvement.</li>
        <li><strong>Cookies</strong> — essential cookies for authentication. We do not use third-party advertising cookies.</li>
      </ul>

      <h2>2. How we use your information</h2>
      <ul>
        <li>Process your subscription, payments, and deliveries.</li>
        <li>Send transactional messages (order confirmations, delivery reminders, OTP) by email or SMS.</li>
        <li>Provide customer support and resolve disputes.</li>
        <li>Comply with applicable laws (e.g., tax records, fraud prevention).</li>
        <li>Improve our products and customer experience.</li>
      </ul>

      <h2>3. Sharing of information</h2>
      <p>We do not sell your data. We share limited information with:</p>
      <ul>
        <li><strong>Razorpay</strong> — for payment processing.</li>
        <li><strong>Supabase</strong> — for hosting our database and authentication.</li>
        <li><strong>Resend / Twilio / MSG91</strong> — for transactional email and SMS.</li>
        <li><strong>Delivery partners</strong> — name, address and phone, only for the upcoming delivery.</li>
        <li><strong>Legal authorities</strong> — if compelled by valid legal process.</li>
      </ul>

      <h2>4. Data retention</h2>
      <p>
        We retain order, address, and payment records for a minimum of 7 years to comply with tax and
        accounting law. You may request deletion of optional data (preferences, marketing consent) by
        contacting us. Authentication records are deleted within 30 days of account closure.
      </p>

      <h2>5. Your rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you.</li>
        <li>Request correction of inaccurate data.</li>
        <li>Request deletion of data (subject to legal retention requirements).</li>
        <li>Withdraw consent for marketing communications at any time.</li>
        <li>File a complaint with the Data Protection Board of India.</li>
      </ul>

      <h2>6. Security</h2>
      <p>
        All data is transmitted over TLS. Passwords are stored hashed (never plaintext). OTPs are
        salted-hashed and expire in 10 minutes. Database access is restricted by row-level security
        policies. We follow industry-standard practices appropriate for the scale of our operations.
      </p>

      <h2>7. Children's privacy</h2>
      <p>
        Our services are not directed at children under 18. We do not knowingly collect data from
        minors. If you believe a minor has provided us data, contact us and we will delete it.
      </p>

      <h2>8. Changes to this policy</h2>
      <p>
        We may update this policy occasionally. The "Last updated" date above reflects the most
        recent revision. Material changes will be notified by email to active subscribers.
      </p>

      <h2>9. Contact us</h2>
      <p>
        For privacy queries: <a href="mailto:hello@thetraymicrogreens.in">hello@thetraymicrogreens.in</a><br/>
        The Tray Microgreens, Tirupati, Andhra Pradesh, India.
      </p>
    </>
  );
}
