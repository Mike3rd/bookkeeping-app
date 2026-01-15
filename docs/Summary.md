# App Overview & Background

## Purpose

This application is a personal finance and contribution tracking tool designed to help a single user (or small group of users) clearly understand income, expenses, donations, and net profit over time. The core goal is **clarity and accountability**, not complex accounting or bookkeeping.

The app prioritizes:

- Simple data entry
- Clear summaries by month and year
- Mobile-first usability
- Minimal configuration and low cognitive load

It is not intended to replace accounting software; instead, it provides a lightweight, transparent view of financial activity and giving.

---

## Core Features

### Income Tracking

- Supports multiple income sources (e.g. subscriptions, book sales, donations received).
- Income is grouped and summarized by month and year.
- Monthly and yearly totals are calculated server-side and displayed in summary views.

### Expense Tracking

- Expenses are stored as individual transactions.
- Used to calculate net profit.
- Expenses can be reviewed in a transaction list with mobile-friendly layout.

### Donation Tracking

- Tracks outgoing donations with:
  - Date
  - Amount
  - Charity
  - Donation type
  - Optional receipt URL
- Year-based filtering.
- Displays total donated per year.
- Supports donation target comparison (target vs actual).

### Financial Summaries

- Monthly and yearly summaries include:
  - Total income
  - Expenses
  - Donation target
  - Actual donated
  - Donation status (on track / behind)
  - Net profit after donations
- Visual grouping is done via subtle background shading rather than dividers to preserve compact layouts.

---

## UI & UX Principles

- **Mobile-first design**  
  Lists convert to stacked card layouts on mobile and tables on desktop.
- **Consistency**  
  Transaction lists, donation lists, and income lists follow the same layout patterns.
- **Low visual noise**  
  No unnecessary borders or lines; grouping is handled with spacing and background tone.
- **Readable dates**  
  Dates are formatted using a shared utility to avoid raw ISO strings and ensure consistency across the app.

---

## Technical Overview

### Frontend

- Built with **Next.js (App Router)** and **React**
- Client components used where user session and interactivity are required
- Tailwind CSS for styling and responsive layouts
- Shared utility functions (e.g. date formatting) live in `/lib`

### Backend / Data

- **Supabase** is used for:
  - Authentication
  - Database
- Data is user-scoped via `user_id`
- Tables include (but are not limited to):
  - transactions / expenses
  - income
  - donations
  - summary-related aggregates (computed at runtime)

### Data Philosophy

- No destructive updates to historical data
- Past records remain accessible even if summaries or logic evolve
- New rows are created for new activity rather than overwriting old data

---

## Design Constraints & Intentional Decisions

- No complex category hierarchies
- No multi-currency support (assumes single currency)
- No external accounting integrations
- Emphasis on **readability over density**
- Changes should favor consistency over novelty

---

## Future Considerations

- Additional summary visualizations (charts)
- Export options (CSV / PDF)
- Premium features layered on top of existing summaries
- More granular donation insights (monthly breakdowns, trends)
- Improved admin views without changing core data structures

---

## Guiding Principle

When adding features or refactoring:

> “Does this make the financial picture clearer without making the app harder to use?”

If the answer is no, it likely does not belong in this app.
