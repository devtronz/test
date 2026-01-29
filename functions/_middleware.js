export async function onRequest(context) {
  const { request, env } = context;

  const BOT_TOKEN = env.BOT_TOKEN;
  const CHAT_ID = env.CHAT_ID;

  const url = new URL(request.url);

  // ---- Site info ----
  const site = url.hostname;
  const page = url.pathname;
  const fullUrl = url.href;

  // ---- Network ----
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    "unknown";

  const referer = request.headers.get("referer") || "direct";

  // ---- Browser ----
  const userAgent = request.headers.get("user-agent") || "unknown";
  const language = request.headers.get("accept-language") || "unknown";

  // ---- Cloudflare meta ----
  const cf = request.cf || {};
  const country = cf.country || "unknown";
  const city = cf.city || "unknown";
  const timezone = cf.timezone || "unknown";
  const deviceType = cf.deviceType || "unknown";

  // ---- Normal fingerprint ----
  const fpSource = [
    userAgent,
    language,
    timezone,
    deviceType
  ].join("|");

  const fingerprint = await sha256(fpSource);

  // ---- Telegram message ----
  const message = `
🧾 New Visit

🌐 Site: ${site}
📄 Page: ${page}
🔗 Full URL: ${fullUrl}

🧠 Fingerprint: ${fingerprint}
🌍 IP: ${ip}

↩️ Referrer: ${referer}

📍 Location: ${city}, ${country}
⏰ Timezone: ${timezone}
📱 Device: ${deviceType}

🖥 UA: ${userAgent}
`.trim();

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