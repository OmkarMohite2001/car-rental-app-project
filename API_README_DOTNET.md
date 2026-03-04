# RentX Backend API README (.NET)

## 1. Purpose
This document is the backend API contract for the current Angular RentX UI.
You can use this as the implementation checklist for ASP.NET Core Web API.

It includes:
- complete API list by module,
- why each API is needed,
- request payloads,
- response payloads,
- query parameters,
- expected status codes.

## 2. Base Conventions

### 2.1 Base URL
- `https://your-domain.com/api/v1`

### 2.2 Auth
- Use JWT Bearer token.
- Header: `Authorization: Bearer <access_token>`

### 2.3 Date and Time
- Always use ISO 8601 UTC for API (`2026-03-04T10:30:00Z`).
- UI can convert to local timezone.

### 2.4 Standard Success Response
```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 134
  }
}
```

### 2.5 Standard Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "code": "InvalidEmail",
      "message": "Email format is invalid."
    }
  ],
  "traceId": "00-abc-xyz-01"
}
```

### 2.6 Common Status Codes
- `200 OK` read/update success
- `201 Created` create success
- `204 No Content` delete success
- `400 Bad Request` validation fail
- `401 Unauthorized` invalid or expired token
- `403 Forbidden` missing permission
- `404 Not Found` resource missing
- `409 Conflict` duplicate or overlap rule break
- `422 Unprocessable Entity` business rule fail
- `500 Internal Server Error`

## 3. Enums and Validation Rules

### 3.1 Enums
- `CarType`: `hatchback | sedan | suv | luxury`
- `Transmission`: `manual | automatic`
- `Fuel`: `petrol | diesel | ev | hybrid`
- `MaintenanceType`: `service | repair | insurance | puc | other`
- `DamageSeverity`: `minor | moderate | major`
- `Role`: `admin | ops | agent | viewer`
- `KycType`: `aadhaar | passport | pan | dl`

### 3.2 Booking Status Note (Important)
UI currently has mixed naming:
- Bookings page uses `pending | approved | ongoing | completed | cancelled`
- Dashboard/Reports page uses `confirmed` in some places

Recommended backend canonical status:
- `pending | approved | ongoing | completed | cancelled`

Frontend can map:
- `approved -> confirmed` for display where needed.

## 4. API Modules Overview

### 4.1 Mandatory Modules
- Auth
- Dashboard
- Cars (browse)
- Bookings
- Customers
- Car Master (admin fleet)
- Branches
- Maintenance
- Return Inspection
- Reports
- Users and Roles
- Profile/Settings
- Utility (global search, notifications, lookups)

## 5. Auth APIs

### 5.1 `POST /auth/login`
Use:
- Login from `/login` page.

Request:
```json
{
  "usernameOrEmail": "admin",
  "password": "admin",
  "rememberMe": true
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "expiresInSeconds": 3600,
    "user": {
      "id": "U-1004",
      "name": "Admin User",
      "email": "admin@demo.com",
      "role": "admin"
    }
  }
}
```

### 5.2 `POST /auth/register`
Use:
- Create Account tab.

Request:
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "Strong@123",
  "confirmPassword": "Strong@123"
}
```

### 5.3 `POST /auth/forgot-password/send-code`
Use:
- Recovery step 1.

Request:
```json
{
  "email": "john@example.com"
}
```

### 5.4 `POST /auth/forgot-password/reset`
Use:
- Recovery step 2.

Request:
```json
{
  "email": "john@example.com",
  "code": "123456",
  "newPassword": "NewPass@123",
  "confirmNewPassword": "NewPass@123"
}
```

### 5.5 `POST /auth/refresh`
Request:
```json
{
  "refreshToken": "refresh-token"
}
```

### 5.6 `POST /auth/logout`
Use:
- Logout action in layout.

### 5.7 `GET /auth/me`
Use:
- Fetch current user profile/role for guards and permissions.

## 6. Dashboard APIs

### 6.1 `GET /dashboard/summary`
Use:
- KPI cards (revenue today, active rentals, new bookings, fleet utilization).

Query params:
- `from` (optional)
- `to` (optional)
- `branchCodes` (optional, comma separated)

Response:
```json
{
  "success": true,
  "data": {
    "totalRevenueToday": 128500,
    "activeRentals": 23,
    "newBookings": 14,
    "fleetUtilizationPercent": 78
  }
}
```

### 6.2 `GET /dashboard/fleet-by-location`
Use:
- Fleet by location progress bars.

Response:
```json
{
  "success": true,
  "data": [
    { "locationName": "Pune", "used": 26, "total": 32 },
    { "locationName": "Mumbai", "used": 18, "total": 25 },
    { "locationName": "Nagpur", "used": 9, "total": 14 }
  ]
}
```

### 6.3 `GET /dashboard/revenue-trend?days=7`
Use:
- Revenue sparkline.

Response:
```json
{
  "success": true,
  "data": {
    "days": 7,
    "points": [84, 92, 70, 110, 105, 130, 125]
  }
}
```

### 6.4 `GET /dashboard/recent-bookings?limit=10`
Use:
- Recent bookings table on dashboard.

### 6.5 `GET /dashboard/activity-timeline?limit=20`
Use:
- Activity timeline widget.

### 6.6 `GET /dashboard/fleet-health`
Use:
- Fleet health gauge widget.

Response:
```json
{
  "success": true,
  "data": {
    "score": 86,
    "metrics": [
      { "label": "Ready for dispatch", "value": 90, "tone": "good" },
      { "label": "Service due soon", "value": 28, "tone": "warn" },
      { "label": "Critical alerts", "value": 8, "tone": "risk" }
    ]
  }
}
```

## 7. Lookup APIs
Use these for dropdowns to avoid hardcoded values.

### 7.1 `GET /lookups/branches`
Response:
```json
{
  "success": true,
  "data": [
    { "code": "PNQ", "name": "Pune" },
    { "code": "BOM", "name": "Mumbai" },
    { "code": "NAG", "name": "Nagpur" }
  ]
}
```

### 7.2 `GET /lookups/enums`
Response:
```json
{
  "success": true,
  "data": {
    "carTypes": ["hatchback", "sedan", "suv", "luxury"],
    "transmissions": ["manual", "automatic"],
    "fuels": ["petrol", "diesel", "ev", "hybrid"],
    "bookingStatuses": ["pending", "approved", "ongoing", "completed", "cancelled"],
    "maintenanceTypes": ["service", "repair", "insurance", "puc", "other"],
    "roles": ["admin", "ops", "agent", "viewer"],
    "kycTypes": ["aadhaar", "passport", "pan", "dl"]
  }
}
```

## 8. Cars Browse APIs (`/layout/cars`)

### 8.1 `GET /cars`
Use:
- Cars listing page with filters, sort, pagination.

Query params:
- `q`
- `type`
- `transmission`
- `fuel`
- `seatsMin`
- `priceMax`
- `locationCode`
- `sortKey` (`price|rating|seats`)
- `sortDir` (`asc|desc`)
- `page`
- `pageSize`

Response item:
```json
{
  "id": "CAR-1001",
  "brand": "Honda",
  "model": "City",
  "type": "sedan",
  "seats": 5,
  "transmission": "automatic",
  "fuel": "petrol",
  "dailyPrice": 2700,
  "rating": 4.6,
  "imageUrl": "https://cdn.example.com/cars/city.jpg",
  "locationCodes": ["BOM", "PNQ"],
  "active": true
}
```

### 8.2 `GET /cars/{carId}`
Use:
- Car details modal/page.

### 8.3 `GET /cars/{carId}/availability`
Use:
- Check if selected car is available for a pickup/drop range.

Query params:
- `pickupAt`
- `dropAt`
- `locationCode`

## 9. Bookings APIs (`/layout/manage-bookings`)

### 9.1 `GET /bookings`
Use:
- Booking table with filters and search.

Query params:
- `from`
- `to`
- `statuses` (comma separated)
- `types` (comma separated)
- `locations` (comma separated)
- `q`
- `page`
- `pageSize`

Response item:
```json
{
  "id": "BK-1045",
  "pickAt": "2026-03-10T10:00:00Z",
  "dropAt": "2026-03-12T10:00:00Z",
  "locationCode": "PNQ",
  "customerId": "CUS-1001",
  "customerName": "A. Kulkarni",
  "carId": "CAR-1001",
  "carName": "Honda City",
  "carType": "sedan",
  "status": "pending",
  "days": 2,
  "dailyPrice": 2700,
  "cancelReason": null
}
```

### 9.2 `POST /bookings`
Use:
- Create booking (new booking flow).

Request:
```json
{
  "customerId": "CUS-1001",
  "carId": "CAR-1001",
  "locationCode": "PNQ",
  "pickAt": "2026-03-10T10:00:00Z",
  "dropAt": "2026-03-12T10:00:00Z",
  "dailyPrice": 2700,
  "notes": "Airport pickup"
}
```

### 9.3 `GET /bookings/{bookingId}`
Use:
- View booking details from row actions.

### 9.4 `PATCH /bookings/{bookingId}/status`
Use:
- Approve, start trip, complete trip, cancel trip.

Request:
```json
{
  "action": "cancel",
  "reason": "Customer requested cancellation"
}
```

Allowed actions:
- `approve`
- `start`
- `complete`
- `cancel`

### 9.5 `POST /bookings/bulk-status`
Use:
- Bulk approve / bulk cancel selected rows.

Request:
```json
{
  "bookingIds": ["BK-1045", "BK-1044"],
  "action": "approve",
  "reason": null
}
```

### 9.6 `GET /bookings/export?format=csv`
Use:
- CSV export.

## 10. Customers APIs (`/layout/customers`)

### 10.1 `GET /customers`
Use:
- Customer list and search.

Query params:
- `q`
- `type`
- `city`
- `page`
- `pageSize`

### 10.2 `POST /customers`
Use:
- Add customer form submit.

Request:
```json
{
  "type": "individual",
  "name": "Rahul Sharma",
  "phone": "9876543210",
  "email": "rahul@example.com",
  "dob": "1994-08-21",
  "kycType": "aadhaar",
  "kycNumber": "123412341234",
  "dlNumber": "DL0420110149646",
  "dlExpiry": "2028-12-31",
  "address": "Koregaon Park",
  "city": "Pune",
  "state": "MH",
  "pincode": "411001"
}
```

### 10.3 `GET /customers/{customerId}`
Use:
- Open customer details.

### 10.4 `PUT /customers/{customerId}`
Use:
- Edit customer.

### 10.5 `DELETE /customers/{customerId}`
Use:
- Remove customer.

Validation expected from UI:
- phone pattern `^[6-9]\\d{9}$`
- pincode `^\\d{6}$`
- age >= 18 years
- `dlExpiry` must be future date when provided

## 11. Car Master APIs (`/layout/car-master`)

### 11.1 `GET /admin/cars`
Use:
- Car master table with filters.

Query params:
- `q`
- `branchId`
- `type`
- `fuel`
- `transmission`
- `active`
- `page`
- `pageSize`

### 11.2 `POST /admin/cars`
Use:
- Add car.

Request:
```json
{
  "brand": "Honda",
  "model": "City",
  "type": "sedan",
  "fuel": "petrol",
  "transmission": "manual",
  "seats": 5,
  "dailyPrice": 2700,
  "regNo": "MH12-AB-1234",
  "odometer": 42000,
  "branchId": "PNQ",
  "active": true,
  "imageUrls": [
    "https://cdn.example.com/cars/city-1.jpg"
  ]
}
```

### 11.3 `PUT /admin/cars/{carId}`
Use:
- Update car details.

### 11.4 `PATCH /admin/cars/{carId}/active`
Use:
- Toggle active/inactive.

Request:
```json
{
  "active": false
}
```

### 11.5 `DELETE /admin/cars/{carId}`
Use:
- Delete car record.

### 11.6 `POST /admin/cars/{carId}/images` (multipart/form-data)
Use:
- Upload car images.

Response:
```json
{
  "success": true,
  "data": [
    {
      "fileId": "FIL-1001",
      "url": "https://cdn.example.com/cars/CAR-1001-1.jpg"
    }
  ]
}
```

Validation expected from UI:
- `regNo` pattern similar to `MH12-AB-1234`
- `seats` between 2 and 8
- `dailyPrice >= 300`
- `odometer >= 0`

## 12. Branches APIs (`/layout/branches`)

### 12.1 `GET /branches`
Use:
- Branch listing and search.

Query params:
- `q`
- `active`
- `page`
- `pageSize`

### 12.2 `POST /branches`
Use:
- Add branch.

Request:
```json
{
  "id": "PNQ",
  "name": "Pune",
  "phone": "020-11112222",
  "email": "pune@company.com",
  "address": "Airport Road",
  "city": "Pune",
  "state": "MH",
  "pincode": "411001",
  "openAt": "09:00",
  "closeAt": "21:00",
  "active": true
}
```

### 12.3 `PUT /branches/{branchId}`
Use:
- Update branch.

### 12.4 `PATCH /branches/{branchId}/active`
Use:
- Active toggle.

### 12.5 `DELETE /branches/{branchId}`
Use:
- Delete branch.

Validation expected from UI:
- `id` uppercase pattern `^[A-Z0-9]{2,6}$`
- `email` valid
- `pincode` 6 digits when provided

## 13. Maintenance APIs (`/layout/maintenance`)

### 13.1 `GET /maintenance/blocks`
Use:
- Maintenance table with filters.

Query params:
- `carId`
- `types` (comma separated)
- `from`
- `to`
- `q`
- `page`
- `pageSize`

### 13.2 `POST /maintenance/blocks`
Use:
- Create maintenance block.

Request:
```json
{
  "carId": "CAR-1001",
  "type": "service",
  "from": "2026-03-10",
  "to": "2026-03-12",
  "notes": "60k km service"
}
```

Business rules:
- `to >= from`
- no overlapping block allowed for same car and date range

On overlap return `409 Conflict`:
```json
{
  "success": false,
  "message": "Overlaps with existing maintenance block MT-1003"
}
```

### 13.3 `GET /maintenance/blocks/{maintenanceId}`
Use:
- Block details.

### 13.4 `DELETE /maintenance/blocks/{maintenanceId}`
Use:
- Remove maintenance block.

### 13.5 `GET /maintenance/overlap-check`
Use:
- Optional pre-check while filling form.

Query params:
- `carId`
- `from`
- `to`

## 14. Return Inspection APIs (`/layout/return-inspection`)

### 14.1 `POST /return-inspections/calculate`
Use:
- Optional: calculate totals before save.

Request:
```json
{
  "fuelPercent": 74,
  "cleaningRequired": true,
  "lateHours": 2,
  "lateFeePerHour": 200,
  "deposit": 5000,
  "damages": [
    { "part": "Front bumper", "severity": "moderate", "estCost": 2500 }
  ]
}
```

Response:
```json
{
  "success": true,
  "data": {
    "totalDamage": 2500,
    "fuelCharge": 780,
    "cleaningCharge": 500,
    "lateFee": 400,
    "subTotal": 4180,
    "deposit": 5000,
    "netPayable": 0,
    "refund": 820
  }
}
```

### 14.2 `POST /return-inspections`
Use:
- Save return inspection.

Request:
```json
{
  "bookingId": "BK-1045",
  "carId": "CAR-1001",
  "odometer": 45890,
  "fuelPercent": 74,
  "cleaningRequired": true,
  "lateHours": 2,
  "lateFeePerHour": 200,
  "deposit": 5000,
  "notes": "Minor exterior scratches",
  "damages": [
    {
      "part": "Front bumper",
      "severity": "moderate",
      "estCost": 2500,
      "notes": "Paint peel",
      "photoUrls": [
        "https://cdn.example.com/inspections/DMG-1001-1.jpg"
      ]
    }
  ]
}
```

### 14.3 `GET /return-inspections/{inspectionId}`
Use:
- Read inspection details.

### 14.4 `GET /return-inspections`
Use:
- List inspections.

Query params:
- `bookingId`
- `carId`
- `from`
- `to`
- `page`
- `pageSize`

### 14.5 `PUT /return-inspections/{inspectionId}`
Use:
- Edit inspection record.

## 15. Reports APIs (`/layout/reports`)

### 15.1 `GET /reports/bookings`
Use:
- Report table data.

Query params:
- `from`
- `to`
- `locations` (comma separated)
- `types` (comma separated)
- `statuses` (comma separated)
- `q`
- `page`
- `pageSize`

Response row:
```json
{
  "id": "BK-1042",
  "date": "2026-03-01",
  "locationCode": "PNQ",
  "customerName": "A. Kulkarni",
  "carName": "Honda City",
  "carType": "sedan",
  "status": "ongoing",
  "days": 2,
  "dailyPrice": 2700
}
```

### 15.2 `GET /reports/bookings/summary`
Use:
- KPI cards on reports screen.

Response:
```json
{
  "success": true,
  "data": {
    "totalBookings": 58,
    "totalRevenue": 265400,
    "cancelled": 5,
    "avgTicket": 4576
  }
}
```

### 15.3 `GET /reports/bookings/export?format=csv`
Use:
- CSV export with same filters.

## 16. Users and Roles APIs (`/layout/users-roles`)

### 16.1 `GET /users`
Use:
- Users table with search/filter.

Query params:
- `q`
- `role`
- `active`
- `page`
- `pageSize`

### 16.2 `POST /users`
Use:
- Add user.

Request:
```json
{
  "name": "Ops Lead",
  "email": "ops@company.com",
  "phone": "9876543210",
  "role": "ops",
  "active": true,
  "password": "Temp@123"
}
```

### 16.3 `GET /users/{userId}`
Use:
- User details page/modal.

### 16.4 `PUT /users/{userId}`
Use:
- Update user basic details.

### 16.5 `PATCH /users/{userId}/active`
Use:
- Toggle active/inactive.

Request:
```json
{
  "active": false
}
```

### 16.6 `POST /users/{userId}/reset-password`
Use:
- Reset password dialog.

Request:
```json
{
  "temporaryPassword": "Demo@123"
}
```

### 16.7 `DELETE /users/{userId}`
Use:
- Delete user.

### 16.8 `GET /roles/permissions`
Use:
- Load role-permission matrix tab.

Response:
```json
{
  "success": true,
  "data": {
    "admin": {
      "Bookings": { "view": true, "create": true, "edit": true, "delete": true, "approve": true },
      "Cars": { "view": true, "create": true, "edit": true, "delete": true, "approve": true },
      "Customers": { "view": true, "create": true, "edit": true, "delete": true, "approve": true },
      "Branches": { "view": true, "create": true, "edit": true, "delete": true, "approve": true },
      "Maintenance": { "view": true, "create": true, "edit": true, "delete": true, "approve": true },
      "Reports": { "view": true, "create": true, "edit": true, "delete": true, "approve": true }
    }
  }
}
```

### 16.9 `PUT /roles/{role}/permissions`
Use:
- Save changed permissions for selected role.

Request:
```json
{
  "Bookings": { "view": true, "create": true, "edit": true, "delete": false, "approve": true },
  "Cars": { "view": true, "create": true, "edit": true, "delete": false, "approve": false },
  "Customers": { "view": true, "create": true, "edit": true, "delete": false, "approve": false },
  "Branches": { "view": true, "create": false, "edit": true, "delete": false, "approve": false },
  "Maintenance": { "view": true, "create": true, "edit": true, "delete": false, "approve": false },
  "Reports": { "view": true, "create": false, "edit": false, "delete": false, "approve": false }
}
```

### 16.10 `POST /roles/{role}/reset-default`
Use:
- Reset role matrix to default template.

## 17. Profile and Settings APIs (`/layout/profile`, `/layout/settings`)

### 17.1 `GET /me/profile`
Use:
- Load profile form.

Response:
```json
{
  "success": true,
  "data": {
    "fullName": "Admin User",
    "username": "admin",
    "email": "admin@demo.com",
    "phone": "9876543210",
    "gender": "male",
    "dob": "1992-01-10",
    "address": "Baner",
    "city": "Pune",
    "state": "MH",
    "pincode": "411045",
    "notifEmail": true,
    "notifSms": false,
    "notifWhatsApp": false,
    "avatarUrl": "https://cdn.example.com/avatar/U-1004.png"
  }
}
```

### 17.2 `PUT /me/profile`
Use:
- Save profile changes.

Request:
```json
{
  "fullName": "Admin User",
  "username": "admin",
  "email": "admin@demo.com",
  "phone": "9876543210",
  "gender": "male",
  "dob": "1992-01-10",
  "address": "Baner",
  "city": "Pune",
  "state": "MH",
  "pincode": "411045",
  "notifEmail": true,
  "notifSms": false,
  "notifWhatsApp": false
}
```

### 17.3 `PUT /me/password`
Use:
- Password change section.

Request:
```json
{
  "currentPassword": "Old@123",
  "newPassword": "New@1234",
  "confirmPassword": "New@1234"
}
```

### 17.4 `POST /me/avatar` (multipart/form-data)
Use:
- Avatar upload.

Response:
```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://cdn.example.com/avatar/U-1004-v2.png"
  }
}
```

## 18. Utility APIs for Layout

### 18.1 `GET /search/global?q=<text>`
Use:
- Navbar global search.

Response:
```json
{
  "success": true,
  "data": [
    { "type": "booking", "id": "BK-1045", "title": "BK-1045 - A. Kulkarni", "route": "/layout/manage-bookings" },
    { "type": "customer", "id": "CUS-1001", "title": "Rahul Sharma", "route": "/layout/customers" }
  ]
}
```

### 18.2 `GET /notifications/unread-count`
Use:
- Notification badge count.

### 18.3 `GET /notifications?page=1&pageSize=20`
Use:
- Notification list/menu.

### 18.4 `PATCH /notifications/{id}/read`
Use:
- Mark single notification as read.

### 18.5 `PATCH /notifications/mark-all-read`
Use:
- Mark all as read.

## 19. Recommended ASP.NET Core Structure

### 19.1 Suggested Projects
- `RentX.Api` (controllers)
- `RentX.Application` (use cases, validators)
- `RentX.Domain` (entities, enums)
- `RentX.Infrastructure` (EF Core, repositories, services)

### 19.2 Suggested Controllers
- `AuthController`
- `DashboardController`
- `LookupsController`
- `CarsController`
- `BookingsController`
- `CustomersController`
- `AdminCarsController`
- `BranchesController`
- `MaintenanceController`
- `ReturnInspectionsController`
- `ReportsController`
- `UsersController`
- `RolesController`
- `MeController`
- `NotificationsController`
- `SearchController`

## 20. Build Order (Fastest Practical Sequence)
Implement in this order:
1. Auth (`login`, `me`, JWT)
2. Lookups (`branches`, enums)
3. Car Master + Branches
4. Customers
5. Bookings + booking status transitions + bulk status
6. Dashboard from booking/car data
7. Maintenance
8. Return inspection
9. Reports + CSV export
10. Users/Roles
11. Profile + notifications + global search

## 21. Frontend-Backend Field Mapping Reference

### 21.1 Bookings page fields
- `id`
- `pickAt`
- `dropAt`
- `locationCode`
- `customerName`
- `carName`
- `carType`
- `status`
- `days`
- `dailyPrice`
- `cancelReason`

### 21.2 Cars browse fields
- `id`
- `brand`
- `model`
- `type`
- `seats`
- `transmission`
- `fuel`
- `dailyPrice`
- `rating`
- `imageUrl`
- `locationCodes`

### 21.3 Customer fields
- `id`
- `type`
- `name`
- `phone`
- `email`
- `dob`
- `kycType`
- `kycNumber`
- `dlNumber`
- `dlExpiry`
- `address`
- `city`
- `state`
- `pincode`

### 21.4 Car Master fields
- `id`
- `brand`
- `model`
- `type`
- `fuel`
- `transmission`
- `seats`
- `dailyPrice`
- `regNo`
- `odometer`
- `branchId`
- `imageUrls`
- `active`

### 21.5 Branch fields
- `id`
- `name`
- `phone`
- `email`
- `address`
- `city`
- `state`
- `pincode`
- `openAt`
- `closeAt`
- `active`

### 21.6 Maintenance fields
- `id`
- `carId`
- `type`
- `from`
- `to`
- `days`
- `notes`

### 21.7 Return Inspection fields
- `bookingId`
- `carId`
- `odometer`
- `fuelPercent`
- `cleaningRequired`
- `lateHours`
- `lateFeePerHour`
- `deposit`
- `notes`
- `damages[]`

Damage item:
- `part`
- `severity`
- `estCost`
- `notes`
- `photoUrls[]`

### 21.8 User fields
- `id`
- `name`
- `email`
- `phone`
- `role`
- `active`
- `createdAt`
- `lastLogin`

## 22. Final Note
If you keep this contract as OpenAPI (Swagger) from day 1, frontend integration will be much faster.
You can now directly implement these endpoints in .NET and replace current mock data page by page.
