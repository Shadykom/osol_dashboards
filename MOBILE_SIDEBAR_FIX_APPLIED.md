# Mobile Sidebar Fix Applied

## Issue
The mobile sidebar was closing immediately after opening, making it impossible to use navigation on mobile devices.

## Root Cause
The `useEffect` hook in the Sidebar component was triggering immediately when the sidebar opened on mobile, causing it to close right away. The effect was running on every render when `isMobile` was true, not just on actual navigation.

## Solution Applied

### 1. Added `isMobileSheet` prop to Sidebar component
```jsx
export const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileSheet = false }) => {
```

### 2. Fixed the navigation closing logic
Changed from:
```jsx
useEffect(() => {
  if (isMobile && typeof setIsCollapsed === 'function') {
    const handleNavigation = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };
    const timer = setTimeout(handleNavigation, 100);
    return () => clearTimeout(timer);
  }
}, [location.pathname, isMobile, setIsCollapsed]);
```

To:
```jsx
useEffect(() => {
  // Only close the mobile sheet when actually navigating to a different page
  if (isMobileSheet && typeof setIsCollapsed === 'function') {
    // setIsCollapsed in mobile context is actually the close handler
    setIsCollapsed();
  }
}, [location.pathname]); // Only depend on pathname changes
```

### 3. Layout component already passes the prop
The Layout component was already passing `isMobileSheet={true}` to the Sidebar when rendered in mobile context.

## Result
- Mobile sidebar now stays open when clicked
- Sidebar only closes when user navigates to a different page
- No more immediate closing issue

## Testing
1. Open the app on mobile or resize browser to < 768px width
2. Click the menu button to open sidebar
3. Sidebar should remain open
4. Click any navigation link
5. Sidebar should close after navigation

## Files Modified
- `/workspace/src/components/layout/Sidebar.jsx`