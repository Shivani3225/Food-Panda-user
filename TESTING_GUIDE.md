## 🚀 Quick Start Testing Guide

### Step 1: Clear Everything & Restart
```bash
# Kill the app
adb shell pm clear com.newwasseny.user

# Reinstall
npx react-native run-android
```

### Step 2: App Startup
- You should see **Splash Screen** briefly
- Then **Language Select** or **OnBoarding**
- Then **Login Screen** (because you're not logged in)

### Step 3: Login
1. On Login Screen use:
   - Email: `lakshykod@gmail.com`
   - Password: `Hii@123456`
   
2. Click **"Login"** button

3. Watch logs for:
   ```
   [AuthContext] 🔐 Login attempt for: lakshykod@gmail.com
   [AuthContext] ✅ Auth token saved to AsyncStorage
   [AuthContext] ✅ Token verified in AsyncStorage
   [AuthContext] 🚀 Bootstrapping realtime and push...
   [Socket] 🔌 Connecting to: https://api.wasseny.de
   [Socket] ✅ Connected successfully! ID: ...
   [FCM] 🔔 Initializing push notifications...
   [FCM] ✅ Token generated: ...
   ```

### Step 4: Verify App Loaded
- Should automatically navigate to **MainTabs** (Home/Orders/etc)
- No more 401 errors!
- Favorites should load

### Step 5: Check Token Persists
1. Go to **Profile** tab
2. Tap **"🔐 Token Debug (Dev)"**
3. Should show:
   - ✅ Token Status: **PRESENT**
   - Token Length: ~150+ characters
   - User Data: Your name, email, role

### Step 6: Restart App (Hard Restart)
1. Force stop app: `adb shell am force-stop com.newwasseny.user`
2. Tap app icon to reopen
3. Should go DIRECTLY to Home (not login screen)
4. Token should still be there
5. Go to Profile → Token Debug → Should still show ✅ PRESENT

---

## ✅ Expected Success Signs
- ✅ Login succeeds
- ✅ Redirects to MainTabs
- ✅ Token saved to AsyncStorage
- ✅ API calls have token in Authorization header
- ✅ No more 401 errors
- ✅ Favorites load
- ✅ Socket connects
- ✅ App survives restart with token intact

## ❌ Problem Signs (Come back if this happens)
- ❌ Login fails with error message
- ❌ Stays on Login screen after login
- ❌ Token shows as MISSING in Token Debug
- ❌ 401 errors still appear
- ❌ Socket doesn't connect
- ❌ App goes back to Login after restart

---

## 🔍 Live Monitoring

Open DevTools console to see real-time logs:

```
[AuthContext] 🔐 Login attempt for: ...
[AuthContext] ✅ Auth token saved to AsyncStorage
[API] 📤 Token added to GET /api/user/profile
[API] 📡 Request: GET /api/user/profile
[Socket] ✅ Connected successfully!
```

If you see token-related errors instead, let me know!
