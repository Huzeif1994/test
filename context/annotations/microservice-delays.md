# ⏱️ Microservice Sync & Eventual Consistency Annotations

## Discovered Delays on Dev Environment (`ftx.dev.ftxcommerce.com`)

### 1. Storefront Order Placement ➔ Fulfillment Pending Orders
* **Observed Delay:** 5 to 15 seconds.
* **Mechanism:** Orders placed on Storefront publish an asynchronous Kafka/RabbitMQ event consumed by the Fulfillment service.
* **Resilient Pattern:**
  - Upon navigating to `PendingOrdersPage`, if the order is not immediately visible, poll and reload up to 6 times with a 3-second wait between attempts.
  - Always ensure the brand dropdown is set to `"All Brands"`.

### 2. Fulfillment Handover ➔ Storefront Gift Card "Activated" Status
* **Observed Delay:** 10 to 20 seconds.
* **Mechanism:** When fulfillment staff clicks "Submit" on the Handover dialog, the physical gift card number is assigned and an activation webhook triggers the Storefront card ledger.
* **Resilient Pattern:**
  - Navigate to Storefront `manage-gift-cards` page.
  - Click the **"Activated"** tab.
  - If card does not appear on first load, wait 4 seconds, click "Newly Purchased" tab, and click back to "Activated" tab, or refresh the page.
  - Max polling window: 30 seconds.

