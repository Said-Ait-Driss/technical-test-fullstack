import { prisma } from "@lib/prisma";
import { stripe, stripeWebHook } from "@lib/stripe";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

/**
 * TODO:
 * - Vérifier la signature Stripe (STRIPE_WEBHOOK_SECRET)
 * - Gérer checkout.session.completed
 * - Enregistrer en base (Payment) en idempotence (upsert par stripeSessionId)
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, stripeWebHook);
  } catch (error) {
    return NextResponse.json(
      { error: "Error creating event" },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const customerEmail: string = session.customer_details?.email || "N/A";
      const amount: number = session.amount_total ? session.amount_total : 0;
      const currency: string = session.currency ? session.currency : "usd";
      const stripeSessionId: string = session.id;

      if (!session.id) {
        throw new Error("Missing stripeSessionId");
      }

      // Upsert payment for idempotency (prevents duplicate payments)
      const payment = await prisma.payment.upsert({
        where: {
          stripeSessionId: stripeSessionId,
        },
        create: {
          amount,
          currency,
          status: "completed",
          stripeSessionId,
          customerEmail,
        },
        update: {
          status: "completed",
          amount,
          currency,
        },
      });
      console.log("Payment recorded:", payment);

      // we can enhance this by send email :)
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Error proccessing webhook" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
