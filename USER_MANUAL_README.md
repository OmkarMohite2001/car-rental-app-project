# RentX Car Rental App - User Manual

## 1. Purpose
RentX is a web-based admin panel for car-rental operations.  
It provides a single place to manage:
- day-to-day bookings,
- vehicle and master data,
- customer records,
- branch operations,
- inspections, maintenance, and reports.

This manual explains how to run the project and how to use each part of the UI.

## 2. Tech and Runtime
- Framework: Angular 20 (standalone components)
- UI: Angular Material + Bootstrap utility classes
- Language: TypeScript
- Theme engine: custom `ThemeService` with persisted light/dark + brand presets

## 3. Prerequisites
Install the following before running the project:
- Node.js 20.x (recommended)
- npm 10.x or higher
- Angular CLI (optional globally): `npm i -g @angular/cli`

## 4. Project Setup
From project root:

```bash
npm install
```

Run development server:

```bash
npm start
```

Open in browser:

```text
http://localhost:4200
```

Production build:

```bash
npm run build
```

Unit tests:

```bash
npm test
```

## 5. Quick Access (Demo Login)
Current authentication is demo-mode.

- Username: `a`
- Password: `a`

Steps:
1. Open `/login`.
2. Either fill credentials manually or click **Use Demo Credentials**.
3. Click **Sign In**.
4. On success, app navigates to `/layout/dashboard`.

## 6. Application Route Flow

### 6.1 Entry flow
1. `/` redirects to `/login`.
2. Successful login sends user to `/layout`.
3. `/layout` default child route is `/layout/dashboard`.

### 6.2 Main pages under `/layout`
- `/layout/dashboard`
- `/layout/cars`
- `/layout/manage-bookings`
- `/layout/customers`
- `/layout/reports`
- `/layout/car-master`
- `/layout/branches`
- `/layout/maintenance`
- `/layout/return-inspection`
- `/layout/users-roles`
- `/layout/profile`
- `/layout/settings` (currently mapped to profile page as demo)

### 6.3 Unknown routes
- Any invalid URL redirects to `/login`.

## 7. Login Page Guide
Login page has 3 flows:

### 7.1 Sign In tab
- Fields: username/email, password, remember checkbox.
- Validation:
  - username/email required, min 3 characters
  - password required
- Demo credential validation currently checks only `a / a`.

### 7.2 Create Account tab
- Fields: full name, email, password, confirm password.
- Includes password strength meter.
- Register flow is currently demo-only and redirects user back to Sign In.

### 7.3 Forgot Password flow
- Step 1: enter account email.
- Step 2: enter 6-digit code + new password + confirm password.
- Reset flow is mocked for UI/UX demonstration.

### 7.4 Theme controls on login
- Toggle light/dark mode.
- Select brand preset: `Ocean`, `Sand`, `Slate`.
- Preferences are saved in local storage and persist across refresh.

## 8. Layout and Navigation Guide

### 8.1 Top navbar (desktop)
- Brand button (RentX logo) opens dashboard.
- Primary links: Dashboard, Cars, Bookings.
- More button opens mega panel.
- Optional search input (toggle-based).
- Utility actions:
  - brand preset picker,
  - light/dark toggle,
  - notifications,
  - cart,
  - profile,
  - logout.

### 8.2 Mega panel
Organized links by category:
- Operations
- Masters
- Analytics
- System

Includes quick-action buttons:
- New Booking
- Add Customer
- Add Car
- View Reports

### 8.3 Mobile menu
- Hamburger opens full mobile navigation block.
- Includes all major routes.
- Includes theme toggle + brand presets.
- Includes profile and logout buttons.

### 8.4 Floating command button (FAB)
Bottom command FAB provides quick links:
- New Booking
- Add Customer
- Add Car
- Reports

## 9. Dashboard Usage

### 9.1 KPI cards
Dashboard shows high-level KPIs:
- Revenue (today)
- Active rentals
- New bookings
- Fleet utilization

### 9.2 Operational insights
- Fleet by location with usage progress bars.
- Revenue sparkline for last 7 days.

### 9.3 Smart widgets
- Fleet Health widget
- Activity Timeline widget

### 9.4 Recent bookings table
- Displays booking id, customer, car, pickup/drop time, status.
- Row menu includes view/cancel actions (currently placeholder logic).

## 10. Theme and Color System
Theme state is managed by `ThemeService`.

### 10.1 Available modes
- `dark`
- `light`

### 10.2 Available brand presets
- `ocean`
- `sand`
- `slate`

### 10.3 Persistence keys
- Theme key: `rentx-theme`
- Brand key: `rentx-brand`

### 10.4 Body/document flags
Service sets:
- body classes: `theme-dark` / `theme-light`
- body classes: `brand-ocean` / `brand-sand` / `brand-slate`
- document attributes: `data-theme`, `data-brand`

## 11. Current Data Behavior (Important)
Most screens currently use mock/demo data and placeholder handlers.  
This is expected for UI-first development.

Examples:
- Dashboard cards/table values are static mock signals.
- Refresh/create/cancel handlers are placeholder methods.
- Register and password recovery are demo workflows.

## 12. Suggested User Workflow
For demo usage, follow this order:
1. Sign in from `/login`.
2. Check dashboard KPIs and activity widgets.
3. Open mega panel to jump to operational modules.
4. Use FAB for quick actions.
5. Try mobile navigation by resizing browser width.
6. Toggle dark/light mode and switch brand presets.
7. Visit profile/settings and logout.

## 13. Developer Extension Notes
To connect real backend APIs:
1. Replace demo auth checks with API login endpoint.
2. Move mock dashboard signals to service-based API calls.
3. Add guards/interceptors for authenticated routes.
4. Connect create/update/delete actions in bookings/customers/cars modules.
5. Add error/toast handling and loading states where placeholders exist.

## 14. Folder-Level Map
High-level structure:

```text
src/app/
  components/
    dashboard/
      activity-timeline/
      fleet-health/
    layout/
      command-fab/
  core/
    theme.service.ts
  pages/
    login/
    layout/
    dashboard/
    cars/
    bookings/
    customer/
    reports/
    car-master/
    branches/
    maintenance/
    return-inspection/
    users-roles/
    profile/
```

## 15. Troubleshooting
- If dependencies fail to install, remove `node_modules` and run `npm install` again.
- If styles look broken, confirm Angular Material and Bootstrap dependencies are installed.
- If theme does not reset as expected, clear browser local storage keys:
  - `rentx-theme`
  - `rentx-brand`
- If route opens blank page, confirm path exists in `src/app/app.routes.ts`.

## 16. Support Note
This project is currently UI-driven and demo-ready.  
Before production rollout, connect API integrations, auth security, and test coverage.
