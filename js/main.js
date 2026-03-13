class DiagnosticsCollector {
  constructor() {
    this.resultEl = document.getElementById("result");
    this.consentEl = document.getElementById("consent");
    this.startBtn = document.getElementById("startBtn");
    this.apiUrl = "/api/diagnostics"; // change if your Worker is on another host

    this.startBtn.addEventListener("click", () => this.handleStart());
  }

  getBotSignals() {
    return {
      webdriver: navigator.webdriver === true,
      userAgent: navigator.userAgent,
      language: navigator.language || null,
      platform: navigator.userAgentData?.platform || navigator.platform || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      hardwareConcurrency: navigator.hardwareConcurrency ?? null,
      deviceMemory: navigator.deviceMemory ?? null,
      touchPoints: navigator.maxTouchPoints ?? 0,
      cookieEnabled: navigator.cookieEnabled === true,
      screen: {
        width: window.screen?.width ?? null,
        height: window.screen?.height ?? null,
        pixelRatio: window.devicePixelRatio ?? 1
      }
    };
  }

  show(message, isError = false) {
    this.resultEl.style.display = "block";
    this.resultEl.innerHTML = `
      <h3>${isError ? "Diagnostics Failed" : "Diagnostics Stored"}</h3>
      <p>${message}</p>
    `;
  }

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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      this.show("Your diagnostic record was stored successfully.");
    } catch (err) {
      console.error("Diagnostics submit failed:", err);
      this.show(err.message || "Unable to store diagnostics.", true);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new DiagnosticsCollector();
});
