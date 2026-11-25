# Firestore Security Specification — Quran Qiraeti Admin & Analytics

## 1. Data Invariants
1. **Default Deny**: All unmatched Firestore paths are denied by default (`/{document=**}`).
2. **Verified Admin RBAC**: Reading or querying `/admins`, `/page_events`, or `/page_health` requires an authenticated Google user with `request.auth.token.email_verified == true` AND either an existing `/admins/{uid}` document or bootstrapped admin email `mahir1999a@gmail.com`.
3. **Anti-Privilege Escalation**: No non-admin user can create, update, or delete `/admins/{adminUid}` or assign themselves `role: "admin"`.
4. **Telemetry Schema Integrity**: Public/visitor `create` on `/page_events/{eventId}` is strictly append-only (no `update`, `delete`, or `read`/`list` by non-admins) and validates every field type, regex (`eventId`, `path`, `sessionId`), enum allowlist (`pageKey`, `status`, `referrerType`), numeric bounds (`loadTimeMs`, `httpStatus`), exact allowed keys (`hasAll` + `hasOnly`), and server timestamp (`createdAt == request.time`).
5. **Health Snapshot Ownership**: `/page_health/{pageKey}` can only be read, created, updated, or deleted by verified admins, with `checkedByUid == request.auth.uid` and `lastCheckedAt == request.time`.
6. **Telegram Subscription Event Privacy**: `/telegram_sub_events/{eventId}` is append-only (`create` strictly validated with regex, `encryptedPayload` ciphertext <= 1024 chars, `active is bool`, `hourBaku` int 0..23, and `createdAt == request.time`). Only verified admins can `get`, `list`, or `delete`, and `update` is strictly forbidden. Raw Telegram `chatId` is never stored in plaintext.
7. **User Ayah Notes Ownership & Schema Integrity**: `/users/{userId}/ayah_notes/{noteId}` is strictly isolated to the authenticated Google account (`isVerifiedUser() && request.auth.uid == userId`), with `noteId` matching `^[0-9]{1,3}_[0-9]{1,3}$`, `ownerUid == userId`, bounded lengths (`note <= 500`, `arabicText <= 4000`, `translation <= 4000`, `surahName 1..80`), bounded numbers (`surahNumber 1..114`, `ayahNumber 1..286`, `pageNumber 0..604`), immutable `createdAt == request.time`, and `updatedAt == request.time`.

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated read (`get`/`list`) on `/page_events` or `/page_events/ev-1`.
2. Signed-in non-admin user read (`list`) on `/page_events`.
3. Signed-in non-admin user trying to read `/admins/someone`.
4. Signed-in user trying to self-assign admin role via `create` on `/admins/{uid}`.
5. Email spoofing: user with `email == "mahir1999a@gmail.com"` and `email_verified == false` trying to read `/page_events`.
6. Shadow field injection on `/page_events`: adding `"isAdmin": true` alongside valid telemetry fields.
7. Invalid `pageKey` (e.g., `"hacked_route"`) on `/page_events`.
8. Resource poisoning: 1.5KB path string (`path.size() > 180`) on `/page_events`.
9. Oversized/invalid `eventId` containing `/` or spaces on `/page_events/{eventId}` or `/telegram_sub_events/{eventId}`.
10. Forged client timestamp (`createdAt != request.time`) on `/page_events` or `/telegram_sub_events` create.
11. Unauthenticated or non-admin `read`/`list`/`update`/`delete` on `/telegram_sub_events/{eventId}` or shadow field injection (`role: "admin"`).
12. Non-admin `create` or `update` on `/page_health/home`, or admin writing `checkedByUid != request.auth.uid`.
13. Cross-user access or oversized note (`note.size() > 500`) on `/users/{otherUid}/ayah_notes/2_255`.
