import assert from "node:assert/strict";
import { startCheckout, leaveForOtp, returnFromOtp } from "./src/checkout-model.js";

const initial = startCheckout(["demo-item"]);
const external = leaveForOtp(initial);
const returned = returnFromOtp(external);

assert.equal(external.step, "external-otp");
assert.equal(returned.step, "payment");
assert.deepEqual(returned.cartItems, [], "benchmark defect should lose the cart on return");
assert.equal(returned.paymentDraft, null, "benchmark defect should lose the payment draft on return");

console.log("GROUND TRUTH: reproduced OTP-return state loss (cart and payment draft were lost).")
