export const checkoutJourney = {
  route: "/checkout",
  steps: ["cart", "payment", "confirmation"],
  capabilities: ["payment", "retry", "validation", "confirmation"]
};
