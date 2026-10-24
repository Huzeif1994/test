# US-002: Curbside Pickup with Mobile Emulation and Live Vehicle Arrival

## Metadata
- **ID:** US-002
- **Target Projects:** e2e-bridge, ordering, fulfillment
- **Priority:** High
- **Persona:** Mobile Customer (Pixel 5) & Fulfillment Employee (Desktop)

## Preconditions
- Customer is authenticated via `.auth/ordering.json`
- Fulfillment Employee is authenticated via `.auth/fulfillment.json`
- Mobile device emulation uses `Pixel 5` viewport

## Scenario: Complete Curbside Mobile Arrival and Vehicle Verification
- **GIVEN** Customer clears shopping cart and navigates to "huzeif-test" category
- **WHEN** Customer adds product to cart, proceeds to checkout, and selects "Curbside Pickup"
- **AND** Customer turns off "Pay At Store", selects Credit Card, places order, and captures Order ID and Confirmation Code
- **WHEN** Fulfillment employee opens Pending Orders, picks all items, and marks order Ready
- **WHEN** Customer opens order in Mobile Device View (Pixel 5)
- **AND** Customer verifies "Ready For Pickup" status and completes mobile vehicle arrival submission with Spot "Spot - A", Color "Black", Maker "Acura", Model "CL"
- **WHEN** Fulfillment employee navigates to Ready Orders and opens the curbside order
- **THEN** Fulfillment employee verifies Curbside Pickup method and Parking Spot / Car Info blocks
- **AND** Fulfillment employee completes handover with confirmation code transitioning order to Fulfilled

