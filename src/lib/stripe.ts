/**
 * TODO:
 * - Initialiser le client Stripe avec STRIPE_SECRET_KEY
 * - Utiliser la version d'API stable
 */

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const stripePriceId = [process.env.STRIPE_PRICE_ID as string];
const stripeWebHook = process.env.STRIPE_WEBHOOK_SECRET as string;

export { stripe, stripePriceId, stripeWebHook };
