# Production Testing Checklist
**Date:** 2025-10-06
**Environment:** https://4e53c522.fieldforce-crm-new.pages.dev
**API:** https://crm-api.raunakbohra.com

## 🔐 Authentication & Security
- [ ] Login with valid credentials works
- [ ] Invalid login shows appropriate error
- [ ] Session persists after page reload
- [ ] Protected routes redirect to login when not authenticated
- [ ] Logout works correctly
- [ ] CSRF tokens are being sent with forms

---

## 📊 Dashboard
- [ ] Dashboard loads without errors
- [ ] All stats cards display correct data
- [ ] Charts/graphs render properly
- [ ] Navigation links work

---

## 👥 Contacts Management

### List View (ContactsList)
- [ ] **Loading State**: Skeleton loaders appear while data loads
- [ ] Contacts table displays with all columns
- [ ] Pagination works (Previous/Next buttons)
- [ ] Page indicator shows correct page numbers
- [ ] **Search Filter**: Search by name filters contacts (with debouncing)
- [ ] **Category Filter**: Filter by Distribution/Medical works
- [ ] **City Filter**: Filter by city works (with debouncing)
- [ ] **Reset Filters**: Clears all active filters
- [ ] Edit button navigates to edit form
- [ ] Delete button shows confirmation and deletes contact
- [ ] Stats cards show correct totals

### Create/Edit
- [ ] Add Contact button navigates to form
- [ ] Form validation works (required fields)
- [ ] Creating new contact succeeds
- [ ] Editing existing contact succeeds
- [ ] Cancel button returns to list

---

## 🏥 Visits Management

### List View (VisitsList)
- [ ] **Loading State**: Skeleton loaders appear while data loads
- [ ] Visits table displays with all columns
- [ ] Pagination works correctly
- [ ] **Search Filter**: Search by contact name works (debounced)
- [ ] **Status Filter**: Filter by visit status works
- [ ] **Type Filter**: Filter by visit type works
- [ ] **Outcome Filter**: Filter by outcome works
- [ ] **Date Range**: Start/end date filters work
- [ ] **Reset Filters**: Clears all filters
- [ ] Stats cards show correct metrics
- [ ] View/Edit/Delete buttons work

### Create/Edit (VisitForm)
- [ ] Add Visit button navigates to form
- [ ] **Searchable Contact Dropdown**: Search contacts works (debounced)
- [ ] Search shows "No contacts found" when no matches
- [ ] GPS location capture works
- [ ] All form fields save correctly
- [ ] Follow-up section toggles correctly
- [ ] Form submission succeeds

---

## 🛒 Orders Management

### List View (OrdersList)
- [ ] **Loading State**: Skeleton loaders appear while data loads
- [ ] Orders table displays with all columns
- [ ] Pagination works correctly
- [ ] **Status Filter**: Filter by order status works
- [ ] Stats cards show correct totals and revenue
- [ ] View Details button works
- [ ] Cancel Order button works for eligible orders
- [ ] Record Payment button navigates correctly
- [ ] Payment status badges display correctly

### Create (OrderForm)
- [ ] Create Order button navigates to form
- [ ] **Searchable Contact Dropdown**: Search contacts works (debounced)
- [ ] **Searchable Product Dropdown**: Search products works (debounced)
- [ ] Add Product button adds new line item
- [ ] Remove item button works
- [ ] Price auto-fills when product selected
- [ ] Quantity changes update subtotal
- [ ] Total amount calculates correctly
- [ ] Form submission creates order

---

## 📦 Products Management

### List View (ProductsList)
- [ ] **Loading State**: Skeleton loaders appear while data loads
- [ ] Products table displays with all columns
- [ ] Pagination works correctly
- [ ] **Search Filter**: Search by product name works (debounced)
- [ ] **Category Filter**: Filter by category works
- [ ] Inline editing works (click Edit icon)
- [ ] Save button saves changes
- [ ] Cancel button discards changes
- [ ] Stock levels color-coded correctly

### Create/Edit
- [ ] Add Product button navigates to form
- [ ] All fields validate correctly
- [ ] Creating new product succeeds
- [ ] Editing existing product succeeds

---

## 💰 Payments Management

### List View (PaymentsList) - **Enhanced with New Filters**
- [ ] **Loading State**: Skeleton loaders appear while data loads
- [ ] Payments table displays with all columns
- [ ] Pagination works correctly
- [ ] **Search Bar**: Search by contact/order/payment/reference number works (debounced)
- [ ] **Active Filters Badge**: Shows "Active" when filters applied
- [ ] **Date Range**: Start date and end date filters work
- [ ] **Payment Mode**: Filter by CASH/UPI/NEFT/RTGS/CHEQUE/CARD works
- [ ] **Min Amount**: Minimum amount filter works
- [ ] **Max Amount**: Maximum amount filter works
- [ ] **Amount Range**: Min + Max together filters correctly
- [ ] **Reset Filters Button**: Clears all active filters at once
- [ ] **Filter Labels**: All inputs have clear labels
- [ ] Stats cards show correct totals and averages
- [ ] Payment Mode Breakdown chart displays correctly
- [ ] View Pending button navigates to pending payments
- [ ] Record Payment button navigates to form

### Pending Payments
- [ ] **Loading State**: Skeleton loaders appear while data loads
- [ ] Pending orders table displays correctly
- [ ] Priority badges (HIGH/MEDIUM/LOW) show based on days pending
- [ ] Summary cards show correct totals
- [ ] Record Payment button navigates correctly
- [ ] Send Reminder button shows placeholder alert

### Create Payment
- [ ] Record Payment form loads
- [ ] Order dropdown populates correctly
- [ ] Payment amount validates against order total
- [ ] Payment mode selection works
- [ ] Reference number saves correctly
- [ ] Form submission succeeds

---

## 🎨 UI/UX Features

### Loading Skeletons (All Pages)
- [ ] **ContactsList**: Shows 5 animated skeleton rows
- [ ] **VisitsList**: Shows 5 animated skeleton rows
- [ ] **OrdersList**: Shows 5 animated skeleton rows
- [ ] **ProductsList**: Shows 5 animated skeleton rows
- [ ] **PaymentsList**: Shows 5 animated skeleton rows
- [ ] **PendingPayments**: Shows 5 animated skeleton rows
- [ ] Skeleton structure matches actual table columns
- [ ] Pulse animation is smooth and visible

### Pagination (All List Pages)
- [ ] Shows "Page X of Y" correctly
- [ ] Previous button disabled on first page
- [ ] Next button disabled on last page
- [ ] Page changes update URL (if applicable)
- [ ] Data loads correctly after page change

### Searchable Dropdowns
- [ ] **OrderForm Contacts**: Typing filters contact list
- [ ] **OrderForm Products**: Typing filters product list
- [ ] **VisitForm Contacts**: Typing filters contact list
- [ ] 300ms debounce prevents excessive API calls
- [ ] "No items found" message shows when no matches
- [ ] Dropdown resets properly when cleared

---

## 📱 Responsive Design
- [ ] Mobile view works correctly (< 768px)
- [ ] Tablet view works correctly (768px - 1024px)
- [ ] Desktop view works correctly (> 1024px)
- [ ] Tables scroll horizontally on small screens
- [ ] Filter forms stack vertically on mobile
- [ ] Navigation menu is accessible on all screen sizes

---

## ⚡ Performance

### API Response Times
- [ ] Contact list loads in < 1 second
- [ ] Visit list loads in < 1 second
- [ ] Order list loads in < 1 second
- [ ] Product list loads in < 1 second
- [ ] Payment list loads in < 1 second
- [ ] Dashboard loads in < 1.5 seconds

### Search/Filter Debouncing
- [ ] Search doesn't trigger API calls on every keystroke
- [ ] 500ms delay is noticeable but not annoying
- [ ] Multiple rapid filter changes don't cause API spam

### Caching
- [ ] Stats don't refetch unnecessarily
- [ ] Previously loaded pages load faster

---

## 🐛 Error Handling
- [ ] Network errors show user-friendly messages
- [ ] 404 errors handled gracefully
- [ ] 500 errors show appropriate message
- [ ] Form validation errors are clear
- [ ] Failed API calls don't crash the app
- [ ] CORS errors don't occur (check browser console)

---

## 🔍 Browser Compatibility
- [ ] Chrome (latest version)
- [ ] Firefox (latest version)
- [ ] Safari (latest version)
- [ ] Edge (latest version)

---

## 📊 Data Accuracy

### Stats Verification
- [ ] Contact stats match actual count
- [ ] Visit stats match actual count
- [ ] Order revenue calculations are correct
- [ ] Payment totals and averages are accurate
- [ ] Outstanding amounts calculate correctly

### Filter Accuracy
- [ ] Filtered results match filter criteria
- [ ] Date range filters include correct dates
- [ ] Amount range filters show payments in range
- [ ] Payment mode filter shows only selected mode
- [ ] Search returns relevant results

---

## 🎯 Critical User Flows

### New Contact → Visit → Order → Payment
1. [ ] Create new contact
2. [ ] Create visit for that contact
3. [ ] Create order for that contact
4. [ ] Record payment for that order
5. [ ] Verify payment shows in PaymentsList
6. [ ] Verify order status updates
7. [ ] Verify outstanding amount decreases

### Filter → Paginate → View Details
1. [ ] Apply filters on any list page
2. [ ] Navigate to page 2
3. [ ] Filters persist across pagination
4. [ ] Click view/edit on an item
5. [ ] Return to list
6. [ ] Filters still applied

---

## ✅ Testing Summary

**Total Tests**: _____ / 150+
**Pass Rate**: _____ %
**Critical Failures**: _____
**Minor Issues**: _____

### Critical Issues Found
1.
2.
3.

### Minor Issues Found
1.
2.
3.

### Recommendations
1.
2.
3.

---

## 📝 Notes
- Test with realistic data volumes (100+ records per entity)
- Test with slow network connection (throttle in DevTools)
- Check browser console for any errors or warnings
- Verify all network requests use HTTPS
- Check that sensitive data isn't logged to console

---

**Tester**: _____________
**Date Completed**: _____________
**Sign-off**: _____________
