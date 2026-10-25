# User Story: US-004 - Customer Loyalty Points Redemption at Checkout

**ID:** US-004  
**Title:** Customer Loyalty Points Redemption at Checkout  
**Priority:** High  
**Sprint:** Sprint  
**Target Domain:** Storefront Ordering, Cross-App Bridge

## Business Description

As a registered customer with accumulated loyalty points,  
I want to apply my loyalty balance during checkout,  
So that I can receive a discount on my eligible order total.

## Preconditions

- The customer is authenticated and has an active loyalty account.
- The cart contains at least one qualifying item.
- The minimum eligible order total is $10.00.
- The Store Pickup fulfillment option is active.
- The customer has a sufficient loyalty points balance to redeem the equivalent of $0.01.

## Acceptance Criteria (Gherkin Scenarios)

### Scenario 1: Verify Partial Loyalty Points Redemption During Checkout and After Order Placement

**Given** the customer is logged in to the storefront and navigates to the product catalog  
**When** the customer adds the product **"Clipper Refillable Lighter"** to the cart  
**And** navigates to the Cart page  
**And** enters **$0.01** in the Loyalty Points Redemption section  
**Then** the checkout summary should display a loyalty discount of **$0.01**  
**When** the customer accepts the terms and conditions and submits the order  
**Then** the order should be placed successfully  
**And** the order confirmation details should reflect the **$0.01** loyalty discount  
**And** the customer's Orders page should display the same **$0.01** loyalty discount for the placed order.