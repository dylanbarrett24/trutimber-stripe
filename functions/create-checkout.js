const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "https://trutimberharvesting.com",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body);
    const { total, name, phone, address, town, woodType, cords, tumbled, email } = data;

    const amountInCents = Math.round(parseFloat(total) * 100);
    if (!amountInCents || amountInCents <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid order total." }),
      };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Firewood Order – True Timber Harvesting",
              description: `${cords} cord(s) of ${woodType}${tumbled === "yes" ? " (tumbled)" : ""} — Delivery to ${town}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: email || undefined,
      metadata: { name, phone, address, town, woodType, cords, tumbled },
      success_url: "https://trutimberharvesting.com/firewood",
      cancel_url: "https://trutimberharvesting.com/firewood",
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("Stripe error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Payment setup failed. Please try again or call (603) 229-7128." }),
    };
  }
};
