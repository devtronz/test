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

  // ---- Reliable device detection ----
  const deviceType = getDeviceType(userAgent);

  // ---- Privacy-friendly fingerprint ----
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

  // ---- Send log to Telegram ----
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

// ================= HELPERS =================

// Device detection (Apache/Nginx style)
function getDeviceType(ua) {
  ua = ua.toLowerCase();

  if (/bot|crawler|spider|crawling/.test(ua)) return "Bot";
  if (/tablet|ipad/.test(ua)) return "Tablet";
  if (/mobile|android|iphone|ipod/.test(ua)) return "Mobile";
  return "Desktop";
}

// SHA-256 hash
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hashBuffer)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}