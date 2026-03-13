async handleStart() {
  if (!this.consentEl.checked) {
    this.show("You need to check the consent box before continuing.", true);
    return;
  }

  const payload = {
    consent: true,
    consentVersion: "2026-03-13",
    sessionId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    botSignals: this.getBotSignals()
  };

  try {
    const res = await fetch(this.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const contentType = res.headers.get("content-type") || "";
    const raw = await res.text();

    if (!contentType.includes("application/json")) {
      throw new Error(
        `API returned ${res.status} ${res.statusText} and not JSON. Body starts with: ${raw.slice(0, 120)}`
      );
    }

    const data = JSON.parse(raw);

    if (!res.ok || !data.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    this.show("Your diagnostic record was stored successfully.");
  } catch (err) {
    console.error("Diagnostics submit failed:", err);
    this.show(err.message || "Unable to store diagnostics.", true);
  }
}
