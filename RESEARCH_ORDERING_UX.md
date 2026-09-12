# Production Ordering UX Findings

The review of Baymard checkout research and Olo restaurant-ordering guidance supports the following redesign decisions.

| Finding | Design implication for Radhe Radhe |
|---|---|
| Mobile checkout should minimize friction and form fields. | Use a compact, single-screen checkout with visible labels and clear inline errors. |
| Guest checkout should be prominent rather than forcing account creation. | Let customers order without signing in; offer sign-in as an optional convenience for saved details. |
| Customers need to review and edit cart quantities before submitting. | Keep a persistent cart drawer with multiple line items, quantity controls, subtotal, fulfillment, payment, and final review. |
| Fulfillment options should be explicit. | Show delivery and pickup as radio/select choices and only allow compatible payment methods. |
| Phone fields and restricted inputs benefit from validation and clear explanation. | Validate a realistic phone format, require a real name, and show the reason a phone number is needed. |
| Errors should explain how to fix the problem. | Never silently accept arbitrary values; keep the form open and show actionable error text. |
| Mobile orders require cross-device QA and regular testing. | Test customer and owner flows at phone and desktop widths before each delivery. |

Sources reviewed: Baymard Institute, “Checkout UX 2025: 10 Pitfalls and Best Practices,” https://baymard.com/blog/current-state-of-checkout-ux; Olo, “How to Reduce Cart Abandonment and Boost Repeat Orders,” https://www.olo.com/blog/how-to-reduce-cart-abandonment-and-boost-repeat-orders.
