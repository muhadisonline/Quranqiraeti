# Firestore Security Specification — Quran Qiraeti Admin & Analytics

## 1. Data Invariants
1. **Default Deny**: All unmatched Firestore paths are denied by default (`/{document=**}`).
2. **Verified Admin RBAC**: Reading or querying `/admins`, `/page_events`, or `/page_health` requires an authenticated Google user with `request.auth.token.email_verified == true` AND either an existing `/admins/{uid}` document or bootstrapped admin email `mahir1999a@gmail.com`.
3. **Anti-Privilege Escalation**: No non-admin user can create, update, or delete `/admins/{adminUid}` or assign themselves `role: "admin"`.
4. **Telemetry Schema Integrity**: Public/visitor `create` on `/page_events/{eventId}` is strictly append-only (no `update`, `delete`, or `read`/`list` by non-admins) and validates every field type, regex (`eventId`, `path`, `sessionId`), enum allowlist (`pageKey`, `status`, `referrerType`), numeric bounds (`loadTimeMs`, `httpStatus`), exact allowed keys (`hasAll` + `hasOnly`), and server timestamp (`createdAt == request.time`).
5. **Health Snapshot Ownership**: `/page_health/{pageKey}` can only be read, created, updated, or deleted by verified admins, with `checkedByUid == request.auth.uid` and `lastCheckedAt == request.time`.

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated read (`get`/`list`) on `/page_events` or `/page_events/ev-1`.
2. Signed-in non-admin user read (`list`) on `/page_events`.
3. Signed-in non-admin user trying to read `/admins/someone`.
4. Signed-in user trying to self-assign admin role via `create` on `/admins/{uid}`.
5. Email spoofing: user with `email == "mahir1999a@gmail.com"` and `email_verified == false` trying to read `/page_events`.
6. Shadow field injection on `/page_events`: adding `"isAdmin": true` alongside valid telemetry fields.
7. Invalid `pageKey` (e.g., `"hacked_route"`) on `/page_events`.
8. Resource poisoning: 1.5KB path string (`path.size() > 180`) on `/page_events`.
9. Oversized/invalid `eventId` containing `/` or spaces on `/page_events/{eventId}`.
10. Forged client timestamp (`createdAt != request.time`) on `/page_events` create.
11. Unauthenticated or non-admin `update`/`delete` on `/page_events/{eventId}` (immutable telemetry log).
12. Non-admin `create` or `update` on `/page_health/home`, or admin writing `checkedByUid != request.auth.uid`.
