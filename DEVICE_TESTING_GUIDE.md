# Device Testing Guide

## Overview
This guide provides instructions for testing the CommutAI applications on actual physical devices to ensure proper mobile responsiveness and functionality.

## Test Devices
Recommended devices for testing:
- **iOS**: iPhone 12, iPhone 14, iPad Pro
- **Android**: Pixel 5, Samsung Galaxy S21, various tablets
- **Desktop**: Chrome, Firefox, Safari (responsive design mode)

## Pre-Testing Setup

### 1. Build Applications
```bash
# Build all apps
npm run build

# Or build individual apps
cd apps/conductor && npm run build
cd apps/customer-service && npm run build
cd apps/operator && npm run build
cd apps/sys-admin && npm run build
cd apps/public-dashboard && npm run build
```

### 2. Local Testing Server
```bash
# Start development server for specific app
npm run dev -- --workspace=apps/conductor
npm run dev -- --workspace=apps/customer-service
npm run dev -- --workspace=apps/operator
npm run dev -- --workspace=apps/sys-admin
npm run dev -- --workspace=apps/public-dashboard
```

### 3. Network Access
Ensure your development machine and test devices are on the same network:
- Find your machine's local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Update Vite config to use `host: '0.0.0.0'` (already configured)
- Access from device: `http://YOUR_IP:PORT`

## Testing Checklist

### Conductor App (Mobile-First)
- [ ] **Login Flow**
  - [ ] Email/password input works on mobile keyboard
  - [ ] Login button is tappable (44px min touch target)
  - [ ] Loading states display correctly
  - [ ] Error messages are readable

- [ ] **Dashboard**
  - [ ] Cards display properly on mobile
  - [ ] Bottom navigation is accessible
  - [ ] Profile avatar loads correctly
  - [ ] Stats are readable

- [ ] **QR Scanning**
  - [ ] Camera permissions requested correctly
  - [ ] Scanner frame displays properly
  - [ ] QR codes scan successfully
  - [ ] Success/failure feedback is clear

- [ ] **Passenger List**
  - [ ] List scrolls smoothly
  - [ ] Passenger details are readable
  - [ ] Search/filter works on mobile

- [ ] **Offline Functionality**
  - [ ] Offline banner displays
  - [ ] App remains functional offline
  - [ ] Data syncs when back online

### Customer Service App
- [ ] **Login Flow**
  - [ ] Mobile-friendly login form
  - [ ] Touch targets are adequate
  - [ ] Form validation works

- [ ] **Sidebar Navigation**
  - [ ] Mobile menu toggle works
  - [ ] Overlay appears on mobile
  - [ ] Menu closes after navigation
  - [ ] All navigation items are tappable

- [ ] **Dashboard**
  - [ ] KPI cards stack properly on mobile
  - [ ] Charts are readable
  - [ ] Data loads correctly

- [ ] **Forms (QR Cards, Reload, etc.)**
  - [ ] Input fields are usable on mobile
  - [ ] Modals display correctly
  - [ ] Submit buttons work
  - [ ] Validation messages are clear

### Operator App
- [ ] **Login Flow**
  - [ ] Mobile-friendly login
  - [ ] Touch targets adequate

- [ ] **Sidebar Navigation**
  - [ ] Mobile menu toggle works
  - [ ] Overlay appears
  - [ ] Navigation smooth

- [ ] **Dashboard**
  - [ ] Video feeds display on mobile
  - [ ] KPI cards stack properly
  - [ ] Data is readable

- [ ] **Live Operations**
  - [ ] Map displays correctly
  - [ ] Bus markers are tappable
  - [ ] Route information is readable

- [ ] **Tables (Buses, Conductors, etc.)**
  - [ ] Tables are scrollable on mobile
  - [ ] Row actions are accessible
  - [ ] Filters work on mobile

### Sys-Admin App
- [ ] **Login Flow**
  - [ ] Mobile-friendly login
  - [ ] Touch targets adequate

- [ ] **Dashboard**
  - [ ] Cards stack properly
  - [ ] Video feeds display
  - [ ] Data is readable

### Public Dashboard
- [ ] **Hero Section**
  - [ ] Search input works on mobile
  - [ ] Departure board displays correctly
  - [ ] Stats are readable

- [ ] **Live Status**
  - [ ] Bus cards stack properly
  - [ ] Status indicators are clear

- [ ] **Live Map**
  - [ ] Map displays correctly
  - [ ] Markers are tappable
  - [ ] Zoom controls work

- [ ] **Routes Table**
  - [ ] Table is scrollable on mobile
  - [ ] Data is readable

- [ ] **Navigation**
  - [ ] Mobile menu toggle works
  - [ ] Anchor links scroll smoothly
  - [ ] All sections accessible

## Performance Testing

### Load Time Testing
- [ ] Initial load < 3 seconds on 4G
- [ ] First contentful paint < 1.5 seconds
- [ ] Time to interactive < 3.5 seconds

### Memory Testing
- [ ] No memory leaks during extended use
- [ ] App remains responsive after 30 minutes
- [ ] Memory usage stays within reasonable limits

### Battery Testing
- [ ] Battery drain is minimal during normal use
- [ ] Background operations don't drain battery excessively

## Network Testing

### Different Network Conditions
- [ ] Works on Wi-Fi
- [ ] Works on 4G/LTE
- [ ] Works on 3G (degraded but acceptable)
- [ ] Handles network interruptions gracefully
- [ ] Offline functionality works as expected

## Accessibility Testing

### Touch Targets
- [ ] All interactive elements ≥ 44px
- [ ] Buttons are easily tappable
- [ ] Links are easily tappable

### Text Readability
- [ ] Font sizes are readable (minimum 16px)
- [ ] Contrast ratios meet WCAG AA standards
- [ ] Text doesn't overlap or get cut off

### Orientation
- [ ] Works in portrait mode
- [ ] Works in landscape mode
- [ ] Transitions smoothly between orientations

## Browser Testing

### iOS Safari
- [ ] All features work correctly
- [ ] No iOS-specific bugs
- [ ] Safari-specific features (like Reader mode) don't break the app

### Android Chrome
- [ ] All features work correctly
- [ ] No Android-specific bugs
- [ ] Chrome-specific features don't break the app

### Other Mobile Browsers
- [ ] Firefox Mobile (if applicable)
- [ ] Samsung Internet (if applicable)

## Issue Reporting

### Bug Report Template
```
**Device**: [Device model, OS version]
**Browser**: [Browser name, version]
**App**: [conductor/customer-service/operator/sys-admin/public-dashboard]
**Issue**: [Description of the problem]
**Steps to Reproduce**:
1. 
2. 
3. 
**Expected Behavior**: [What should happen]
**Actual Behavior**: [What actually happens]
**Screenshots/Videos**: [If applicable]
```

### Severity Levels
- **Critical**: App crashes or core functionality broken
- **High**: Major feature not working
- **Medium**: Minor feature not working or UI issue
- **Low**: Cosmetic issue or minor UX problem

## Sign-Off

### Tester Information
- **Tester Name**: ___________________
- **Date**: ___________________
- **Devices Tested**: ___________________

### Results
- **Total Issues Found**: _____
- **Critical**: _____
- **High**: _____
- **Medium**: _____
- **Low**: _____

### Approval
- [ ] Approved for staging deployment
- [ ] Requires fixes before deployment
- [ ] Blocked - critical issues found

### Notes
_________________________________________________________________________
_________________________________________________________________________
_________________________________________________________________________
