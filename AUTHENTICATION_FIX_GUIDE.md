# Authentication & API Calls Fix - Testing Guide

## Problems Fixed

### 1. **FavouritesContext was fetching immediately on app startup**
   - **Issue**: `FavouritesProvider` called `fetchFavourites()` in a `useEffect` without checking authentication
   - **Result**: Repeated 401 errors for `/api/user/favorites/*` endpoints
   - **Fix**: Now only fetches when `isAuthenticated === true`

### 2. **HomePage was making API calls without auth check**
   - **Issue**: `HomePage` called `getHomeData()` and `fetchUserData()` immediately on mount
   - **Result**: 401 errors even though HomePage shouldn't be visible when unauthenticated
   - **Fix**: Now only fetches when `isAuthenticated === true`

### 3. **ConflictModal logging was unsafe**
   - **Issue**: Console logs accessed optional properties without proper guards
   - **Result**: Warning messages like `"newRestaurant: undefined"`
   - **Fix**: Only logs when modal is actually visible and properties are safe

---

## What Changed

### FavouritesContext.jsx
```javascript
// BEFORE: Called fetchFavourites() unconditionally
useEffect(() => {
  fetchFavourites();
}, [fetchFavourites]);

// AFTER: Only fetches when authenticated
useEffect(() => {
  if (isAuthenticated && !isInitialized) {
    fetchFavourites();
  } else if (!isAuthenticated) {
    clearFavourites();
  }
}, [isAuthenticated, isInitialized, fetchFavourites, clearFavourites]);
```

### HomePage.jsx
```javascript
// BEFORE: Called fetchHomeData unconditionally
useEffect(() => {
  fetchHomeData();
  fetchUserData();
}, [fetchHomeData, fetchUserData]);

// AFTER: Only fetches when authenticated
useEffect(() => {
  if (isAuthenticated) {
    fetchHomeData();
    fetchUserData();
  } else {
    setIsLoadingRestaurants(false);
  }
}, [fetchHomeData, fetchUserData, isAuthenticated]);
```

---

## Testing Instructions

### Step 1: Clean Start
```bash
# Clear app data
adb shell pm clear com.newwasseny.user

# Rebuild
npx react-native run-android
```

### Step 2: Verify Login Screen Appears
**Expected:**
- App shows Splash → OnBoarding → Login Screen
- **NO** "No token found" warnings in logs
- **NO** 401 errors for favorites
- **NO** API calls attempting

**Check console for:**
```
✅ [AppNavigator] Auth State: { isAuthenticated: false, isLoading: false, hasUser: false }
✅ [FavouritesContext] Skipping fetch - isLoading: false isAuthenticated: false
✅ [HomePage] 🔒 User not authenticated, skipping API calls
```

### Step 3: Login
**Credentials:**
- Email: `lakshykod@gmail.com`
- Password: `Hii@123456`

**Expected after login:**
- Auto-redirect to MainTabs
- No "No token found" warnings
- **DO** see:
  ```
  ✅ [AppNavigator] Auth State: { isAuthenticated: true, isLoading: false, hasUser: true }
  ✅ [FavouritesContext] 🔄 User authenticated, fetching favorites...
  ✅ [HomePage] 🔐 User authenticated, fetching home data...
  ✅ [FavouritesContext] ✅ Favorites loaded: N
  ```

### Step 4: Verify Favorites Load
- Go to Profile → Favorites/Wishlist
- Should show any saved favorites (if available)
- **NO** 401 errors

### Step 5: Verify Home Data Loads
- Check Home tab
- Should show restaurants, banners, categories
- **NO** 401 errors for favorites

### Step 6: Verify Token Persistence
- Hard close app: `adb shell am force-stop com.newwasseny.user`
- Reopen app
- Should skip login and go directly to MainTabs
- Token should still be in AsyncStorage
- Favorites should load immediately

---

## Console Logging Reference

### Good Signs (No Action Needed)
```
[AppNavigator] Auth State: { isAuthenticated: true, ... }
[FavouritesContext] 🔄 User authenticated, fetching favorites...
[HomePage] 🔐 User authenticated, fetching home data...
[FavouritesContext] ✅ Favorites loaded: 3
[API] 📡 Request: GET /api/user/favorites/restaurants
```

### Bad Signs (Issues Remain)
```
[API] ⚠️ No token found for GET /api/user/favorites/restaurants
🚫 [ApiClient] 401 Unauthorized - Token missing or expired
❌ No token in AsyncStorage - user not logged in
[HomePage] 🔒 User not authenticated, skipping API calls (when logged in!)
```

---

## If Issues Persist

### 1. Token Not Being Saved
**Check:**
```
[AuthContext] ✅ Auth token saved to AsyncStorage
[AuthContext] ✅ Token verified in AsyncStorage
```

**Fix if missing:**
- Backend must return `token` field in login response
- Check Backend authController.js returns token

### 2. Auth State Not Changing
**Check:**
- AuthContext `isAuthenticated` becomes `true` after login
- AppNavigator shows correct stack based on auth state

**Debug:**
```javascript
// In AuthContext.jsx login() function
console.log('[AuthContext] Login response:', response.data);
console.log('[AuthContext] Setting user:', authenticatedUser);
```

### 3. Still Getting 401 Errors After Login
**Common causes:**
- Token expired (JWT expires in 7 days by default)
- Token format wrong (should be: `Authorization: Bearer <token>`)
- apiClient.js not injecting token properly

**Check apiClient logs:**
```
[API] Token added to request header ✅
[API] 📡 Request: GET /api/user/favorites/restaurants
```

### 4. App Not Redirecting to MainTabs After Login
**Check:**
- Login response should include `user` object with `_id`, `name`, etc.
- `setUser(authenticatedUser)` should be called in AuthContext
- AppNavigator should see `isAuthenticated: true` and render App Stack

---

## Testing Checklist

- [ ] App starts with Login screen (no API errors)
- [ ] No "No token found" warnings on startup
- [ ] Can login successfully
- [ ] App auto-redirects to MainTabs after login
- [ ] Home page loads restaurants
- [ ] Favorites load without 401 errors
- [ ] Hard restart preserves login state
- [ ] Logout clears favorites
- [ ] Can login again after logout

---

## Files Modified

1. **src/context/FavouritesContext.jsx** - Added auth gating
2. **src/screens/Home/HomePage.jsx** - Added auth gating  
3. **src/components/ConflictModal.jsx** - Improved logging
4. **App.tsx** - No changes (context order is correct)

---

## Summary

The app now follows this flow:

```
App Starts
  ↓
[AuthContext] Check stored token/user
  ↓
[AppNavigator] Show Login IF !isAuthenticated
  ↓
User Logs In
  ↓
[AuthContext] Save token + user data
  ↓
[AppNavigator] Show MainTabs IF isAuthenticated
  ↓
[HomePage] Fetch home data (auth already verified)
  ↓
[FavouritesContext] Fetch favorites (auth already verified)
  ↓
No 401 errors!
```

Instead of the broken old flow:

```
App Starts
  ↓
[FavouritesContext] Try to fetch favorites (NO TOKEN YET!)
  ❌ 401 Error
  ↓
[HomePage] Try to fetch data (NO TOKEN YET!)
  ❌ 401 Error
  ↓
[AppNavigator] Shows login screen (but errors already happening)
```
