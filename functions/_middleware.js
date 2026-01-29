export async function onRequest(context) {
  const { request, env } = context;

  const BOT_TOKEN = env.BOT_TOKEN;
  const CHAT_ID = env.CHAT_ID;

  // ---- Basic request info ----
  const url = new URL(request.url);
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    "unknown";

  const userAgent = request.headers.get("user-agent") || "unknown";
  const language = request.headers.get("accept-language") || "unknown";
  const referer = request.headers.get("referer") || "direct";

  // ---- Cloudflare metadata ----
  const cf = request.cf || {};
  const country = cf.country || "unknown";
  const city = cf.city || "unknown";
  const timezone = cf.timezone || "unknown";
  const deviceType = cf.deviceType || "unknown";

  // ---- Normal fingerprint (privacy-friendly) ----
  const fpSource = [
    userAgent,
    language,
    timezone,
    deviceType
  ].join("|");

  const fingerprint = await sha256(fpSource);

  // ---- Telegram message ----
  const message = `
🧾 New Visitor

🌍 IP: ${ip}
🧠 Fingerprint: ${fingerprint}

📄 Page: ${url.pathname}
🔗 Referrer: ${referer}

🖥 UA: ${userAgent}
🌐 Language: ${language}

📍 Location: ${city}, ${country}
⏰ Timezone: ${timezone}
📱 Device: ${deviceType}
`.trim();

  // ---- Send to Telegram (fire & forget) ----
  context.waitUntil(
    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message
      })
    })
  );

  return context.next();
}

// ---- SHA-256 helper ----
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hashBuffer)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}