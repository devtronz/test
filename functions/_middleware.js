export async function onRequest(context) {
  const { request, env } = context;

  // Only log real page loads
  const accept = request.headers.get("accept") || "";
  if (!accept.includes("text/html")) {
    return context.next();
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const site = request.headers.get("Host") || "unknown-site";
  const url = new URL(request.url);
  const page = url.pathname;

  // Referrer (domain only)
  const rawRef = request.headers.get("Referer");
  let referrer = "Direct";
  if (rawRef) {
    try {
      referrer = new URL(rawRef).hostname;
    } catch {
      referrer = "Unknown";
    }
  }

  // Country (best available on free plan)
  const cf = request.cf || {};
  const country = cf.country || "N/A";

  const message =
`👤 Visitor
━━━━━━━━━━━━
🌐 Site: ${site}
📍 IP: ${ip}
🌍 Country: ${country}
📄 Page: ${page}
🔗 Referrer: ${referrer}
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