# Security Specification & Threat Model

## 1. Data Invariants & Zero-Trust Architecture
1. **Confidentiality Invariant (Sender & Admin ONLY)**:
   A `Feedback` document can NEVER be read, listed, or inspected by any user other than the document's `authorId` (`request.auth.uid`) or a verified administrator (`admin@example.com` with `email_verified == true` or UID present in `/admins/{uid}`).
2. **Identity Integrity**:
   The `authorId` on creation MUST strictly match `request.auth.uid`. A user cannot submit on behalf of another user.
3. **Immutability of Author & Timestamps**:
   `authorId`, `authorEmail`, and `createdAt` are strictly immutable once written.
4. **Role Separation on Updates**:
   - The original author can update `title`, `content`, `category`, `targetModule`, and `updatedAt`.
   - The author CANNOT modify `status` to anything arbitrary or edit `adminNote`.
   - The administrator can update `status`, `adminNote`, and `updatedAt`.
5. **Anti-Denial-of-Wallet & Boundary Limits**:
   Every field is strictly checked for type and size boundaries (`title` <= 100, `content` <= 2000, `adminNote` <= 1000).

---

## 2. The "Dirty Dozen" Threat Payloads (Must Return PERMISSION_DENIED)

1. **Anonymous / Unauthenticated Create**: An unauthenticated user attempts to create a feedback.
2. **Identity Spoofing**: User `attacker_uid` attempts to create a feedback setting `authorId: 'victim_uid'`.
3. **Unverified Email Impersonation**: Attacker sets email to `admin@example.com` but with `email_verified: false` to claim admin rights.
4. **Cross-Tenant Snoop (Get)**: User B attempts to `get` User A's feedback document.
5. **Cross-Tenant List Scraping**: User B executes a collection query without `where('authorId', '==', 'user_b')` attempting to enumerate User A's feedback.
6. **Shadow Field Injection**: Attacker sends a creation payload containing an extra unapproved field `{ injectedField: 'exploit' }`.
7. **Oversized String (Wallet Exhaustion)**: Attacker attempts to submit `content` with a 200KB payload exceeding the 2000-character ceiling.
8. **Invalid Enum Poisoning**: Attacker passes `category: 'hacked_category'` or `status: 'superadmin_escalation'`.
9. **Author Tampering**: Attacker attempts an update operation changing `authorId` from `author_1` to `author_2`.
10. **Created Timestamp Manipulation**: Attacker attempts to set `createdAt` to a spoofed backdated timestamp instead of `request.time`.
11. **Non-Admin Status Hijack**: Non-admin author attempts to update `adminNote` or change `status` to `resolved`.
12. **Self-Promotion Admin Injection**: Regular user attempts to write to `/admins/{their_uid}` with `{ role: 'admin' }`.
