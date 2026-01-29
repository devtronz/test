export async function onRequest(context) {
  const { request, env } = context;

  // Log only real page visits (skip assets)
  const accept = request.headers.get("accept") || "";
  if (!accept.includes("text/html")) {
    return context.next();
  }

  const ip =
    request.headers.get("CF-Connecting-IP") ||
    "unknown";

  try {
    await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.CHAT_ID,
        text: `👤 Visitor IP: ${ip}`
      })
    });
  } catch (e) {
    console.log("Telegram error:", e);
  }

  return context.next();
}
