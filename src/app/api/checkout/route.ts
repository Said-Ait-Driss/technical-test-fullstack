import { stripe, stripePriceId } from "@lib/stripe";
import { NextRequest, NextResponse } from "next/server";

/**
 * TODO:
 * - Créer une session Stripe Checkout côté serveur
 * - Rediriger l'utilisateur vers l'URL de paiement
 * - Utiliser STRIPE_PRICE_ID si fourni, sinon un prix inline 19.99 EUR
 */
export const runtime = "nodejs";

export async function POST(_req: NextRequest) {
  try {
    const DOMAIN = process.env.NEXT_PUBLIC_APP_URL;
    const lineItems = stripePriceId
      ? [{ price: stripePriceId + "", quantity: 1 }]
      : [
          {
            price_data: {
              currency: "usd",
              product_data: { name: "Produit numérique – Pack Visionyze" },
              unit_amount: 1999, // 19.99 USD
            },
            quantity: 1,
          },
        ];

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `${DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${DOMAIN}/`,
    });

    // raw Response with 303 redirect (safe for CloudFront used by stripe)
    return new Response(null, {
      status: 303,
      headers: {
        Location: checkoutSession.url!,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to creating checkout session :" },
      { status: 500 }
    );
  }
}
