export const metadata = { title: 'Refund & Cancellation Policy — The Tray Microgreens' };

export default function RefundPage() {
  return (
    <>
      <h1>Refund & Cancellation Policy</h1>
      <p className="legal-meta">Last updated: 9 June 2026</p>

      <p>
        Because microgreens are a perishable, harvest-to-order product, our refund policy is
        designed to be fair to customers while preventing food waste. Please read this carefully
        before subscribing.
      </p>

      <h2>1. Subscription cancellation</h2>
      <ul>
        <li>Subscriptions run their full chosen term (1, 3, 6, or 12 months) and cannot be cancelled mid-term.</li>
        <li>You may choose not to renew at the end of your term — auto-renewal does not apply until you opt in.</li>
        <li>To skip a single Sunday delivery, use the <em>Skip This Sunday</em> option in your account before Friday midnight.</li>
        <li>To pause deliveries indefinitely, use the <em>Pause Subscription</em> option before Friday midnight. Paused deliveries are saved, not refunded.</li>
      </ul>

      <h2>2. Missed deliveries</h2>
      <p>
        If you are unavailable on Sunday and have not paused or skipped in time, the delivery is
        forfeit. <strong>No refund or reschedule is offered for missed deliveries</strong> because the
        produce has already been harvested for you and cannot be re-routed.
      </p>

      <h2>3. Quality issues</h2>
      <p>
        If the product is visibly damaged, spoiled, or significantly underweight on receipt, report
        it within <strong>6 hours of delivery</strong> via:
      </p>
      <ul>
        <li>📧 <a href="mailto:hello@thetraymicrogreens.in">hello@thetraymicrogreens.in</a></li>
        <li>📱 WhatsApp +91 98765 43210</li>
      </ul>
      <p>
        Include a photograph of the issue. Upon verification, we will provide a replacement box on
        your next scheduled delivery at no extra cost.
      </p>

      <h2>4. Payment failures</h2>
      <p>
        If your payment is debited but you do not receive an order confirmation within 30 minutes,
        Razorpay will automatically refund the amount within 5–7 business days. Contact us if the
        refund is not received within that window.
      </p>

      <h2>5. Service area limitations</h2>
      <p>
        If, after subscription, we are unable to deliver to your address due to expansion of
        restrictions in your area, you will receive a prorated refund for the undelivered portion.
      </p>

      <h2>6. Refund method</h2>
      <p>
        Approved refunds are processed to the original payment method via Razorpay within 5–7
        business days. UPI refunds typically arrive within 2 business days.
      </p>

      <h2>7. Contact</h2>
      <p>
        For refund requests or disputes: <a href="mailto:hello@thetraymicrogreens.in">hello@thetraymicrogreens.in</a>
      </p>
    </>
  );
}
