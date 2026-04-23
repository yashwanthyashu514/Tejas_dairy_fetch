# 🥛 MilkFlow — Dairy Management App

A React-based dairy collection management system with dual-page layout for daily operations and management analytics.

## Project Structure

```
src/
├── App.jsx                          # Root — navbar + page routing
├── index.css                        # Tailwind directives + Outfit font
├── data/
│   └── mockData.js                  # Sample farmers & entries + helpers
├── pages/
│   ├── OperatorDashboard.jsx        # Page 1: Daily Operations
│   └── ManagementPage.jsx           # Page 2: Farmers & Analytics
└── components/
    ├── IdentitySearch.jsx           # Section 1: Farmer lookup
    ├── CollectionEntry.jsx          # Section 2: Milk entry form
    ├── PaymentBilling.jsx           # Section 3: Payment tracking
    ├── StatementOverview.jsx        # Section 4: Records table + CSV export
    ├── FarmerRegistration.jsx       # Component 5: Register new farmer
    └── BusinessAnalytics.jsx        # Component 6: Charts & stats
```

## Required npm packages

```bash
npm install framer-motion lucide-react recharts
```

## Dev Dependencies (if not already installed)

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## Setup

1. Copy all files into your Vite + React project
2. Install packages above
3. Replace `tailwind.config.js` with the provided one
4. Add `@import './index.css'` in your `main.jsx`
5. `npm run dev`

## Rate Formula

```
Rate (₹/L) = Fat% × 3.5 + SNF% × 2.0
Amount (₹)  = Liters × Rate
```

Adjust multipliers in `src/data/mockData.js` → `calculateRate()`.

## Primary Color

`#1D6AE5` — set in `tailwind.config.js` as `primary`.  
Usage: `bg-primary`, `text-primary`, `border-primary`, `shadow-blue-200`

## Features

- ✅ Auto-focus farmer search with live dropdown
- ✅ AM/PM shift toggle with animated buttons
- ✅ Auto-calculated rate and amount
- ✅ Date-range payment tracking with "Clear Account"
- ✅ Sortable statement table with CSV export
- ✅ Farmer registration with route badge selector
- ✅ Line chart (collection trend) + Pie chart (fat distribution)
- ✅ Animated page transitions (Framer Motion)
- ✅ Fully responsive (2-col desktop, stacked mobile)
