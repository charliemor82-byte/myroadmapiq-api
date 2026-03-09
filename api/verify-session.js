// api/verify-session.js
// Vercel serverless function — verifies a Stripe Checkout session is paid
// Environment variable required: STRIPE_SECRET_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://myroadmapiq.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { session_id } = req.query;

  if (!session_id || !session_id.startsWith('cs_')) {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  try {
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session_id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      }
    });

    const session = await response.json();

    if (session.error) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Only return success if payment is confirmed paid
    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Payment not completed' });
    }

    const archetype = session.metadata?.archetype || session.client_reference_id;

    const validArchetypes = [
      'strategic-builder', 'analytical-strategist', 'creative-visionary',
      'people-connector', 'systems-optimizer', 'expert-specialist',
      'impact-cultivator', 'guardian-operator'
    ];

    if (!archetype || !validArchetypes.includes(archetype)) {
      return res.status(400).json({ error: 'Invalid archetype in session' });
    }

    return res.status(200).json({
      paid: true,
      archetype,
      customer_email: session.customer_details?.email || null,
    });

  } catch (err) {
    console.error('Verify error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
