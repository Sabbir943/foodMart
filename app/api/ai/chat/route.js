import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { name: "Chicken", emoji: "🍗" },
  { name: "Beef", emoji: "🥩" },
  { name: "Seafood", emoji: "🦐" },
  { name: "Dessert", emoji: "🍰" },
  { name: "Pasta", emoji: "🍝" },
  { name: "Vegetarian", emoji: "🥗" },
  { name: "Breakfast", emoji: "🍳" },
  { name: "Lamb", emoji: "🍖" },
  { name: "Pork", emoji: "🥓" },
  { name: "Vegan", emoji: "🌱" },
];

function getGreetingReply(name) {
  const greetings = [
    `Hey${name ? " " + name : ""}! 👋 Welcome to FoodMart. I can help you find food, track orders, or answer questions. What are you in the mood for?`,
    `Hi${name ? " " + name : ""}! 😊 Great to see you! Ready to discover something delicious?`,
    `Hello${name ? " " + name : ""}! 🍽️ What can I help you with today?`,
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

function getFoodReply(message) {
  const lower = message.toLowerCase();

  // Pizza
  if (lower.includes("pizza")) {
    return "🍕 Pizza lover! Check out our Pasta Kitchen for delicious pizza options. Browse Pasta category for Italian classics like Spaghetti Carbonara and more! Visit /restaurants?category=Pasta to explore.";
  }

  // Chicken
  if (lower.includes("chicken")) {
    return "🍗 Great choice! Our Chicken Kitchen has amazing options like Butter Chicken, Garlic Naan, and more. Visit /restaurants?category=Chicken to explore all chicken dishes!";
  }

  // Burger
  if (lower.includes("burger")) {
    return "🍔 Craving a burger? Try our Beef Kitchen for the best burgers in town! Visit /restaurants?category=Beef to see what's available.";
  }

  // Seafood
  if (lower.includes("seafood") || lower.includes("fish") || lower.includes("shrimp")) {
    return "🦐 Seafood is always a great choice! Our Seafood Kitchen has fresh grilled fish, shrimp, and more. Visit /restaurants?category=Seafood to explore!";
  }

  // Dessert
  if (lower.includes("dessert") || lower.includes("cake") || lower.includes("sweet")) {
    return "🍰 Time for something sweet! Our Dessert Kitchen has amazing treats. Visit /restaurants?category=Dessert to satisfy your sweet tooth!";
  }

  // Vegan
  if (lower.includes("vegan") || lower.includes("plant")) {
    return "🌱 Going plant-based? We have great Vegan and Vegetarian options! Check out /restaurants?category=Vegan or /restaurants?category=Vegetarian for healthy, delicious meals.";
  }

  // Healthy
  if (lower.includes("healthy") || lower.includes("light") || lower.includes("salad")) {
    return "🥗 Great choice eating healthy! Our Vegetarian Kitchen has fresh salads and wholesome meals. Visit /restaurants?category=Vegetarian for lighter options!";
  }

  // Breakfast
  if (lower.includes("breakfast") || lower.includes("morning")) {
    return "🍳 Perfect for breakfast! Visit /restaurants?category=Breakfast for pancakes, eggs, and morning favorites!";
  }

  // Spicy
  if (lower.includes("spic")) {
    return "🌶️ Love the heat! Try our Chicken Kitchen or Beef Kitchen for spicy options. Use the AI Search on the Restaurants page — just type something like 'spicy chicken' and it'll find the best matches!";
  }

  // Cheap / budget / affordable
  if (lower.includes("cheap") || lower.includes("budget") || lower.includes("affordable")) {
    return "💰 Looking for budget-friendly meals? Most of our dishes start from just ৳6! Visit /restaurants to browse all categories and find affordable options.";
  }

  return null;
}

function getOrderReply(message) {
  const lower = message.toLowerCase();

  if (lower.includes("track") || lower.includes("where") || lower.includes("status")) {
    return "📦 To track your order, visit your Orders page at /orders. You'll see real-time updates on all your active and past orders!";
  }

  if (lower.includes("order") && (lower.includes("my") || lower.includes("history") || lower.includes("past"))) {
    return "📋 You can view all your orders — active and past — at /orders. Each order shows its current status and delivery details.";
  }

  if (lower.includes("cancel")) {
    return "❌ To cancel an order, go to /orders and select the order you want to cancel. You can cancel orders that haven't been marked as 'out for delivery' yet.";
  }

  return null;
}

function getCouponReply(message) {
  const lower = message.toLowerCase();

  if (lower.includes("coupon") || lower.includes("discount") || lower.includes("promo") || lower.includes("code")) {
    return "🎟️ To apply a coupon code, go to your Cart (/cart) and enter the coupon code in the discount section. Valid coupons will be applied to your order total!";
  }

  return null;
}

function getPaymentReply(message) {
  const lower = message.toLowerCase();

  if (lower.includes("pay") || lower.includes("payment")) {
    return "💳 We accept multiple payment methods: Cash on Delivery (COD), Card payments, and Mobile Banking (bKash/Nagad). Choose your preferred method at checkout!";
  }

  return null;
}

function getHelpReply(message) {
  const lower = message.toLowerCase();

  if (lower.includes("help") || lower.includes("how") || lower.includes("what can you do")) {
    return `🤖 Here's what I can help you with:

• 🍽️ **Find food** — Tell me what you're craving and I'll suggest dishes
• 📦 **Track orders** — Ask about your order status
• 🎟️ **Coupons** — Learn how to apply discount codes
• 💳 **Payments** — Info about payment methods
• 🔍 **Smart Search** — Use the AI Search bar on the Restaurants page

Just type naturally and I'll do my best to help!`;
  }

  return null;
}

function getAboutReply(message) {
  const lower = message.toLowerCase();

  if (lower.includes("about") && (lower.includes("foodmart") || lower.includes("you") || lower.includes("app"))) {
    return "📱 FoodMart is a food delivery platform connecting you with the best local kitchens. We offer 500+ restaurants, 45-minute delivery guarantee, and multiple payment options. Visit /about to learn more!";
  }

  return null;
}

function getContactReply(message) {
  const lower = message.toLowerCase();

  if (lower.includes("contact") || lower.includes("support") || lower.includes("reach")) {
    return "📞 You can reach our support team at /contact. We have a contact form and FAQ section to help with any issues!";
  }

  return null;
}

function getThankYouReply() {
  const replies = [
    "You're welcome! 😊 Enjoy your meal!",
    "Happy to help! 🍽️ Let me know if you need anything else.",
    "Anytime! 🙌 Hope you find something delicious!",
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}

function getRestaurantReply(message) {
  const lower = message.toLowerCase();

  if (lower.includes("restaurant") || (lower.includes("where") && lower.includes("eat"))) {
    return "🏪 We have restaurants for every craving! Browse all restaurants at /restaurants, or explore by cuisine category. You can filter by rating, open status, and more!";
  }

  return null;
}

function getFallbackReply(message) {
  const lower = message.toLowerCase();

  // Try to find any food-related keywords
  const foodKeywords = ["food", "eat", "hungry", "meal", "dish", "taste", "flavor", "crave"];
  const hasFoodKeyword = foodKeywords.some((kw) => lower.includes(kw));

  if (hasFoodKeyword) {
    return `🍽️ I'd love to help you find something! Here are some popular categories:

${CATEGORIES.map((c) => `${c.emoji} ${c.name}`).join(" | ")}

Tell me what type of food you're in the mood for, or browse restaurants at /restaurants!`;
  }

  return `🤔 I'm not sure I understand. Here's what I can help with:

• Ask about specific foods (pizza, chicken, seafood, etc.)
• Track your orders
• Find coupons and discounts
• Payment information
• Restaurant recommendations

Just type your question and I'll do my best!`;
}

function ruleBasedReply(message, userName) {
  const lower = message.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|yo|sup|good morning|good afternoon|good evening|as-salamu|salam)/i.test(lower)) {
    return getGreetingReply(userName);
  }

  // Thank you
  if (/^(thanks?|thank you|ty|thx|appreciate|shukriya)/i.test(lower)) {
    return getThankYouReply();
  }

  // Try each category of replies
  const reply =
    getOrderReply(message) ||
    getCouponReply(message) ||
    getPaymentReply(message) ||
    getHelpReply(message) ||
    getAboutReply(message) ||
    getContactReply(message) ||
    getRestaurantReply(message) ||
    getFoodReply(message);

  if (reply) return reply;

  return getFallbackReply(message);
}

async function openAIReply(message, history, userContext) {
  // Dynamically import to avoid build errors if openai is not installed
  try {
    const { getOpenAI, CHAT_SYSTEM_PROMPT } = await import("@/lib/ai.js");
    const openai = getOpenAI();

    const messages = [
      { role: "system", content: CHAT_SYSTEM_PROMPT + userContext },
      ...history.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 300,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || null;
  } catch (err) {
    console.log("OpenAI unavailable, using rule-based fallback:", err?.message);
    return null;
  }
}

export async function POST(req) {
  try {
    const { message, history = [] } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get current user context if logged in
    let userContext = "";
    let userName = null;
    try {
      const { getAuthUser } = await import("@/lib/server-auth.js");
      const user = await getAuthUser();
      if (user) {
        userName = user.name;
        userContext = `\n\nCurrent user: ${user.name} (${user.email}), role: ${user.role}`;
      }
    } catch {
      // Ignore auth errors
    }

    // Try OpenAI first, fall back to rule-based
    const aiReply = await openAIReply(message, history, userContext);

    if (aiReply) {
      return NextResponse.json({ reply: aiReply, source: "ai" });
    }

    // Rule-based fallback
    const fallbackReply = ruleBasedReply(message, userName);
    return NextResponse.json({ reply: fallbackReply, source: "fallback" });
  } catch (error) {
    console.error("AI Chat error:", error?.message || error);
    return NextResponse.json({
      reply: "I'm having a small issue right now. In the meantime, you can browse our restaurants at /restaurants or check your orders at /orders. How else can I help?",
      source: "error-fallback",
    });
  }
}
