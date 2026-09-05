import test from "node:test";
import assert from "node:assert/strict";
import { startCheckout, completeHappyPath } from "../src/checkout-state.js";

test("checkout happy path reaches confirmation", () => {
  const initial = startCheckout(["demo-item"]);
  const completed = completeHappyPath(initial);

  assert.equal(completed.step, "confirmation");
  assert.equal(completed.orderConfirmed, true);
  assert.deepEqual(completed.cartItems, ["demo-item"]);
});
