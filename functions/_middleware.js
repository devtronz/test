export async function onRequest(context) {
  const { request, env } = context;

  // Only log real page visits (HTML)
  const accept = request.headers.get("accept") || "";
  if (!accept.includes("text/html")) {
    return context.next();
  }

  const ip =
    request.headers.get("CF-Connecting-IP") ||
    "unknown";

  const ua = request.headers.get("User-Agent") || "unknown";
  const url = new URL(request.url);

  // Cloudflare geo details
  const cf = request.cf || {};
  const country = cf.country || "N/A";
  const city = cf.city || "N/A";
  const asn = cf.asn || "N/A";
  const isp = cf.asOrganization || "N/A";

  const message = `
👤 New Visitor
━━━━━━━━━━━━
📍 IP: ${ip}
🌍 Country: ${country}
🏙 City: ${city}
🛜 ISP: ${isp}
🔢 ASN: ${asn}
📄 Page: ${url.pathname}
🖥 Device: ${ua}
🕒 Time: ${new Date().toLocaleString()}
  `;

  try {
    await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.CHAT_ID,
        text: message
      })
    });
  } catch (e) {
    console.log("Telegram error:", e);
  }

  return context.next();
}
