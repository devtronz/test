export async function onRequest(context) {
  const { request, env } = context;

  try {
    const ip =
      request.headers.get("CF-Connecting-IP") ||
      request.headers.get("X-Forwarded-For") ||
      "unknown";

    const ua = request.headers.get("User-Agent") || "unknown";
    const url = new URL(request.url);

    await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.CHAT_ID,
        text:
`🌐 New Visit
📍 IP: ${ip}
📄 Path: ${url.pathname}
🖥 UA: ${ua}
🕒 ${new Date().toLocaleString()}`
      })
    });
  } catch (err) {
    console.log("Middleware error:", err);
  }

  return context.next();
}
