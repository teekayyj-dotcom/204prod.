# Feature Specification: Wishlist & Cart

**Feature Branch**: `[004-wishlist-cart]`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "hãy thực hiện các tính năng wishlist và cart cho tôi"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add to Wishlist (Priority: P1)

As a User, I want to be able to save items I'm interested in to a Wishlist, so that I can easily find and review them later.

**Why this priority**: Core functionality for user engagement and retaining interest before purchasing or requesting a quote.

**Independent Test**: Navigate to an item page, click the "Add to Wishlist" button (heart icon), and verify the item appears in the Wishlist page.

**Acceptance Scenarios**:

1. **Given** I am logged in, **When** I click the wishlist icon on an item, **Then** the icon visually updates (e.g., fills with color) and the item is added to my saved list.
2. **Given** an item is in my wishlist, **When** I click the icon again, **Then** it is removed from my wishlist.

---

### User Story 2 - Add to Cart and Checkout (Priority: P1)

As a User, I want to add items to my Shopping Cart and proceed to Checkout, so that I can formally request, purchase, or reserve those items.

**Why this priority**: Essential for converting user interest into actionable transactions or requests.

**Independent Test**: Add multiple items to the cart, review the cart summary, and click checkout to place the order/inquiry.

**Acceptance Scenarios**:

1. **Given** I want an item, **When** I click "Add to Cart", **Then** the cart counter increases and the item is visible in the cart drawer/page.
2. **Given** I have items in my cart, **When** I proceed to checkout, **Then** my request is successfully recorded in the system.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow authenticated users to add or remove items to/from a personal Wishlist.
- **FR-002**: System MUST allow users to add items to a Cart, change quantities (if applicable), and remove items.
- **FR-003**: System MUST [NEEDS CLARIFICATION: What exactly are users adding to the wishlist and cart? Are these digital media assets, physical merchandise, or production service packages?]
- **FR-004**: System MUST [NEEDS CLARIFICATION: Does the checkout process require a real payment gateway (like Stripe/VNPay) to pay online, or does it simply generate an "Order/Quote Request" for the Admin to process offline?]

### Key Entities

- **WishlistItem**: Maps a User to an Item.
- **CartItem**: Maps a User's temporary session to an Item with a quantity.
- **Order / Quote**: The final entity generated after successful checkout.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Wishlist adds/removes respond instantly on the UI.
- **SC-002**: The Cart maintains state securely even if the user refreshes the page.
- **SC-003**: Users can successfully complete a checkout flow without errors.

## Assumptions

- We are building this for authenticated users (Clients/Users) within the 204PROD ecosystem.
- Items have a price or some form of value to be summed up in the cart.
