# TODO — Before publishing to Play Store

## Google OAuth (native sign-in)

- [ ] Create **Android OAuth client** in Google Cloud Console (APIs & Services → Credentials)
  - Type: Android
  - Package name: `com.kenmoh.sellmoh`
  - SHA-1: **Play App Signing key** SHA-1 (Play Console → Release → Setup → App signing → App signing key certificate)
  - Also add the SHA-1 of the upload key used for signed builds
- [ ] Create **iOS OAuth client** (Type: iOS)
  - Bundle ID + Apple Team ID
- [ ] Copy the two client IDs and set:
  - Expo `.env`: `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
  - Backend env: `GOOGLE_ANDROID_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID`
- [ ] Send the two client IDs to @kenne so the `com.googleusercontent.apps.<reversed-id>` URL scheme gets registered in `app.json` (android intent-filters + iOS `CFBundleURLTypes`)
- [ ] Rebuild the app (native redirect only works in dev/standalone builds, not Expo Go) and test Google sign-in end-to-end
- [ ] Google Console → OAuth consent screen: publish it (or confirm scopes `openid email profile`); without publishing, new external users may hit the unverified-app warning
- [ ] Optionally remove the custom redirect URI `storeflow://google` from the Web client (no longer used on mobile; keep Web client for possible web builds)
- [ ] Confirm backend env still has `GOOGLE_CLIENT_ID` (Web client ID) — token audience now accepts any of web/android/ios IDs

## Apple Sign-In (iOS only, later)

- [ ] Enable "Sign in with Apple" capability for the app identifier (Apple Developer)
- [ ] Set backend `APPLE_CLIENT_ID` to the Services/App ID used for the iOS bundle

## Reminder

- Google native redirect URIs are derived automatically from the Android/iOS client configs (reversed client ID + `/oauthredirect`) — nothing to paste into the console.


 One factual item to verify: Privacy §8 still promises 14 days' notice for material policy changes and the app-vs-email channel claim — confirm       30000ms
     that's how you'd actually notify users, or I can soften it.