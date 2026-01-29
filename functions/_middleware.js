export async function onRequest(context) {
  const { request, env } = context;

  // Only log real page visits
  const accept = request.headers.get("accept") || "";
  if (!accept.includes("text/html")) {
    return context.next();
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const ua = request.headers.get("User-Agent") || "unknown";
  const url = new URL(request.url);

  const cf = request.cf || {};

  const country = cf.country || "N/A";
  const city = cf.city || "N/A";              // often unavailable
  const asn = cf.asn || "N/A";                // often unavailable
  const isp = cf.asOrganization || "N/A";     // often unavailable

  const message =
`👤 Visitor
━━━━━━━━━━
📍 IP: ${ip}
🌍 Country: ${country}
🏙 City: ${city}
🛜 ISP: ${isp}
🔢 ASN: ${asn}
📄 Page: ${url.pathname}
🖥 UA: ${ua}
🕒 ${new Date().toLocaleString()}`;

  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.CHAT_ID,
      text: message
    })
  });

  return context.next();
}
