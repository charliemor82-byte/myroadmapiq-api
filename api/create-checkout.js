// api/create-checkout.js
// Vercel serverless function — creates a Stripe Checkout session
// Environment variable required: STRIPE_SECRET_KEY

export default async function handler(req, res) {
  // Allow CORS from your domain
  res.setHeader('Access-Control-Allow-Origin', 'https://myroadmapiq.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { archetype } = req.body;

  const validArchetypes = [
    'strategic-builder', 'analytical-strategist', 'creative-visionary',
    'people-connector', 'systems-optimizer', 'expert-specialist',
    'impact-cultivator', 'guardian-operator'
  ];

  if (!archetype || !validArchetypes.includes(archetype)) {
    return res.status(400).json({ error: 'Invalid archetype' });
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': 'MyRoadmapIQ Full Career Report',
        'line_items[0][price_data][product_data][description]': 'Your personalized 13-page career roadmap with salary data, skill gaps, 90-day action plan, and more.',
        'line_items[0][price_data][unit_amount]': '2999',
        'line_items[0][quantity]': '1',
        'mode': 'payment',
        'client_reference_id': archetype,
        'success_url': `https://myroadmapiq.com/premium-report/?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `https://myroadmapiq.com/career-assessment/`,
        'metadata[archetype]': archetype,
      }).toString()
    });

    const session = await response.json();

    if (session.error) {
      console.error('Stripe error:', session.error);
      return res.status(500).json({ error: session.error.message });
    }

    return res.status(200).json({ url: session.url });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
