# US-003: Physical Gift Card End-to-End Purchase, Barcode Assignment, and POS Sync

## Metadata
- **ID:** US-003
- **Target Projects:** e2e-bridge, ordering, fulfillment, admin
- **Priority:** Critical
- **Persona:** Retail Customer (Desktop), Fulfillment Employee (Desktop), Admin Auditor

## Preconditions
- Customer is authenticated via `.auth/ordering.json`
- Fulfillment Employee is authenticated via `.auth/fulfillment.json`
- Unique 12-digit barcode is generated dynamically

## Scenario: Physical Gift Card Purchase to POS Barcode Activation
- **GIVEN** Customer selects Physical Gift Card with customized design amount
- **WHEN** Customer completes checkout with Credit Card and captures order reference
- **WHEN** Fulfillment employee opens order in Picking screen
- **AND** Fulfillment employee scans and binds dynamic 12-digit barcode into Item Info drawer
- **AND** Fulfillment employee marks order Ready and performs Handover
- **THEN** Customer navigates to Gift Cards tab and confirms newly bound physical card appears in Active Cards list

