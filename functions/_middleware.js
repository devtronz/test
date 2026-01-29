export async function onRequest(context) {
  const { request, env } = context;

  const BOT_TOKEN = env.BOT_TOKEN;
  const CHAT_ID = env.CHAT_ID;

  const url = new URL(request.url);

  // ─── Site info ───
  const site = url.hostname;
  const page = url.pathname;
  const fullUrl = url.href;

  // ─── Network ───
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    "unknown";

  const referer = request.headers.get("referer") || "direct";

  // ─── Browser ───
  const userAgent = request.headers.get("user-agent") || "unknown";
  const language = request.headers.get("accept-language") || "unknown";

  // ─── Cloudflare meta ───
  const cf = request.cf || {};
  const country = cf.country || "unknown";
  const city = cf.city || "unknown";
  const timezone = cf.timezone || "unknown";

  // ─── Device detection ───
  const deviceType = getDeviceType(userAgent);

  // ─── Privacy-friendly fingerprint ───
  const fpSource = [
    userAgent,
    language,
    timezone,
    deviceType
  ].join("|");

  const fingerprint = await sha256(fpSource);

  // ─── Telegram formatted message ───
  const message = `
━━━━━━━━━━━━━━━
🧾 *NEW VISIT*
━━━━━━━━━━━━━━━

🌐 *Site*
• ${site}

📄 *Page*
• ${page}
• ${fullUrl}

🌍 *Visitor*
• IP: \`${ip}\`
• Device: ${deviceType}
• Country: ${country}
• City: ${city}
• Timezone: ${timezone}

🧠 *Fingerprint*
• \`${fingerprint}\`

↩️ *Referrer*
• ${referer}

🖥 *User-Agent*
• ${userAgent}
`.trim();

  // ─── Send to Telegram ───
  context.waitUntil(
    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "Markdown"
      })
    })
  );

  return context.next();
}

// ───────────────── HELPERS ─────────────────

// Apache/Nginx-style device detection
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