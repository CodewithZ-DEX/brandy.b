import { createRecord } from "./db.js";
import { subscribeAuth } from "./auth.js";
import { showToast } from "./components.js";

let activeUser = null;
subscribeAuth((u) => {
  activeUser = u;
});

/**
 * Initialize interactive carousel widgets on Proof of Work / Home
 */
export function initCarousels() {
  document.querySelectorAll("[data-carousel]").forEach((carousel) => {
    const slides = Array.from(carousel.querySelectorAll(".carousel-slide"));
    const indicator = carousel.querySelector("[data-carousel-indicator]");
    const prevBtn = carousel.querySelector("[data-carousel-prev]");
    const nextBtn = carousel.querySelector("[data-carousel-next]");
    if (!slides.length) return;

    let idx = 0;
    const render = () => {
      slides.forEach((s, i) => s.classList.toggle("active", i === idx));
      if (indicator) indicator.textContent = `${idx + 1} / ${slides.length}`;
    };

    prevBtn?.addEventListener("click", () => {
      idx = (idx - 1 + slides.length) % slides.length;
      render();
    });
    nextBtn?.addEventListener("click", () => {
      idx = (idx + 1) % slides.length;
      render();
    });
    render();
  });
}

/**
 * Initialize Short-Form Reel Preview Modal
 */
export function initReelModal() {
  const modal = document.getElementById("reel-modal");
  if (!modal) return;

  const titleEl = modal.querySelector("#reel-modal-title");
  const clientEl = modal.querySelector("#reel-modal-client");
  const hookEl = modal.querySelector("#reel-modal-hook");
  const summaryEl = modal.querySelector("#reel-modal-summary");
  const closeBtn = modal.querySelector("[data-close-modal]");

  document.querySelectorAll("[data-reel-trigger]").forEach((btn) => {
    btn.addEventListener("click", () => {
      titleEl.textContent = btn.dataset.title || "Short-Form Reel";
      clientEl.textContent = btn.dataset.client || "";
      hookEl.textContent = `"${btn.dataset.hook || ""}"`;
      summaryEl.textContent = btn.dataset.summary || "";
      modal.showModal();
    });
  });

  closeBtn?.addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.close();
  });
}

/**
 * Initialize PayPal QR Checkout Modal
 */
export function initCheckoutModal() {
  const modal = document.getElementById("qr-checkout-modal");
  if (!modal) return;

  const planNameEl = modal.querySelector("#checkout-plan-name");
  const planPriceEl = modal.querySelector("#checkout-plan-price");
  const planIdInput = modal.querySelector("#checkout-plan-id");
  const emailInput = modal.querySelector("#checkout-email");
  const form = modal.querySelector("#qr-checkout-form");
  const closeBtn = modal.querySelector("[data-close-modal]");

  document.querySelectorAll("[data-select-plan]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const planId = btn.dataset.selectPlan || "weekly_100";
      planNameEl.textContent = "Weekly Growth Sprint";
      planPriceEl.textContent = "$100 / week";
      planIdInput.value = planId;
      if (activeUser?.email && emailInput && !emailInput.value) {
        emailInput.value = activeUser.email;
      }
      modal.showModal();
    });
  });

  closeBtn?.addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.close();
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Recording Payment...";

    const planId = "weekly_100";
    const amountUsd = 100;
    const payload = {
      userId: activeUser?.uid || "guest",
      userEmail: emailInput.value.trim(),
      brandName: modal.querySelector("#checkout-brand").value.trim(),
      planId,
      amountUsd,
      paypalTxId: modal.querySelector("#checkout-tx").value.trim(),
      status: "pending_verification",
    };

    try {
      await createRecord("orders", payload);
      fetch("/api/submit-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "order", payload }),
      }).catch(() => {});

      showToast("Payment reference submitted! Admin will verify shortly.");
      form.reset();
      modal.close();
    } catch (err) {
      showToast("Error submitting payment: " + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Confirm QR Payment";
    }
  });
}
