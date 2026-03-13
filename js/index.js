function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "https://YOUR-FRONTEND-DOMAIN.example",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

function pickSignals(input = {}) {
  return {
    webdriver: input.webdriver === true,
    userAgent: typeof input.userAgent === "string" ? input.userAgent.slice(0, 512) : null,
    language: typeof input.language === "string" ? input.language.slice(0, 32) : null,
    platform: typeof input.platform === "string" ? input.platform.slice(0, 64) : null,
    timezone: typeof input.timezone === "string" ? input.timezone.slice(0, 64) : null,
    hardwareConcurrency: Number.isFinite(input.hardwareConcurrency) ? input.hardwareConcurrency : null,
    deviceMemory: Number.isFinite(input.deviceMemory) ? input.deviceMemory : null,
    touchPoints: Number.isFinite(input.touchPoints) ? input.touchPoints : null,
    cookieEnabled: input.cookieEnabled === true,
    screen: {
      width: Number.isFinite(input.screen?.width) ? input.screen.width : null,
      height: Number.isFinite(input.screen?.height) ? input.screen.height : null,
      pixelRatio: Number.isFinite(input.screen?.pixelRatio) ? input.screen.pixelRatio : null
    }
  };
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return json({ ok: true });
    }

    if (url.pathname !== "/api/diagnostics" || request.method !== "POST") {
      return json({ ok: false, error: "Not found" }, 404);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "Invalid JSON" }, 400);
    }

    if (body?.consent !== true) {
      return json({ ok: false, error: "Consent required" }, 400);
    }

    const ip = request.headers.get("CF-Connecting-IP") || "";
    const ipHash = await sha256Hex(`${env.IP_SALT}:${ip}`);

    const record = {
      storedAt: new Date().toISOString(),
      consentVersion: typeof body.consentVersion === "string" ? body.consentVersion : "unknown",
      sessionId: typeof body.sessionId === "string" ? body.sessionId : crypto.randomUUID(),
      timestamp: typeof body.timestamp === "string" ? body.timestamp : null,
      ipHash,
      botSignals: pickSignals(body.botSignals || {})
    };

    const day = new Date().toISOString().slice(0, 10);
    const key = `diagnostics/${day}/${record.sessionId}.json`;

    await env.DIAG_BUCKET.put(key, JSON.stringify(record), {
      httpMetadata: {
        contentType: "application/json"
      }
    });

    return json({ ok: true, key });
  }
};
