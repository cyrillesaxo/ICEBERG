export function startCheckout(items = ["demo-item"]) {
  return {
    step: "payment",
    cartItems: [...items],
    paymentDraft: { method: "card" },
    externalVerification: false
  };
}

export function completeHappyPath(state) {
  return {
    ...state,
    step: "confirmation",
    orderConfirmed: true
  };
}

export function leaveForOtp(state) {
  return {
    ...state,
    externalVerification: true,
    step: "external-otp"
  };
}

export function returnFromOtp(_state) {
  // Intentional benchmark defect: checkout context is reconstructed from an
  // incomplete source after the external verification detour.
  return {
    step: "payment",
    cartItems: [],
    paymentDraft: null,
    externalVerification: false
  };
}
