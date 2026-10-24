# US-001: Customer Store Pickup with Credit Card and Fulfillment Handover

## Metadata
- **ID:** US-001
- **Target Projects:** e2e-bridge, ordering, fulfillment
- **Priority:** High
- **Persona:** Retail Customer (Desktop) & Fulfillment Employee (Desktop)

## Preconditions
- Customer is authenticated via `.auth/ordering.json`
- Fulfillment Employee is authenticated via `.auth/fulfillment.json`
- Default store branch `Madison01` is operational

## Scenario: Complete In-Store Pickup Lifecycle with Confirmation Code Handover
- **GIVEN** Customer clears shopping cart and navigates to "huzeif-test" category
- **WHEN** Customer adds "CASA TURRENT SERIE 1973 ROBUSTO" product to cart and proceeds to checkout
- **AND** Customer selects "In Store Pickup", turns off "Pay At Store", and selects "Credit or Debit Card"
- **AND** Customer accepts terms and places order, capturing Order ID and Confirmation Code
- **WHEN** Fulfillment employee searches for the placed order in Pending Orders
- **AND** Fulfillment employee initiates Start Picking and picks all required items
- **AND** Fulfillment employee completes package assignment and marks the order Ready
- **WHEN** Fulfillment employee navigates to Ready Orders and opens order for handover
- **AND** Fulfillment employee submits customer confirmation code in Handover modal
- **THEN** The order transitions to Fulfilled status and appears in Fulfilled Orders listing

