# 0verice App Integration Plan

## Files to CREATE (4)

### 1. `apps/web/abi/OvericeEscrow.ts`
Full ABI from contract artifact. Functions: `deposit`, `withdraw`, `getEscrowBalance`, `releaseEscrow`, `escrowBalances` + constants + events.

### 2. `apps/web/abi/USDC.ts`
Minimal ERC20 ABI: `balanceOf`, `decimals`, `approve`, `allowance`, `transferFrom`.

### 3. `apps/web/app/api/agents/register/route.ts`
- **GET** — return current user's agent record (or 404 if not registered)
- **POST** — create agent profile: `{ fullName, address, currency }`, validates role=agent, no duplicate

### 4. `apps/web/app/apps/agent/register/page.tsx`
Registration form (fullName, address, currency select). On mount, checks if agent exists → redirects to `/apps/agent` if already registered. After submit → POST `/api/agents/register` → redirects to `/apps/agent`.

---

## Files to MODIFY (4)

### 5. `apps/web/app/api/exchanges/[id]/cash-received/route.ts`
- Accept `{ nonce, expiresAt, signature }` in body
- If signature provided: validate expiry, store nonce+expiry+signature, set status to `cash_received`
- If no signature (current): generate nonce+expiry, return them, DON'T change status yet

**New flow:**
1. Agent clicks "Cash Received"
2. API call 1 (init): `POST /api/exchanges/[id]/cash-received` → returns `{ nonce, expiresAt }`, status stays `accepted`
3. Agent's wallet signs `keccak256(exchangeId, nonce, expiresAt)` via `personal_sign`
4. API call 2 (confirm): `POST /api/exchanges/[id]/cash-received` with `{ nonce, expiresAt, signature }` → stores qrNonce, qrExpiresAt, qrSignature, sets status to `cash_received`

### 6. `apps/web/app/api/exchanges/[id]/scan/route.ts`
- Accept `{ txHash }` in body
- Validate exchange is in `cash_received` status
- Verify nonce not used, not expired
- Store txHash, set status to `completed`, mark nonce as used

### 7. `apps/web/app/apps/agent/page.tsx` (agent dashboard)
**Changes:**

a) **Agent redirect** — on mount, check `/api/agents/register` GET. If 404, redirect to `/apps/agent/register`

b) **Deposit modal** — new component:
   - Agent inputs USDC amount
   - Step 1: `useWriteContract` → `approve(escrowAddress, amount * 1_000_000)`
   - Step 2: `useWriteContract` → `deposit(amount * 1_000_000)`
   - After both confirmed: `POST /api/agents/deposit` to sync DB balance

c) **QR signing** — modify `handleCashReceived`:
   1. Call API (init) → get `{ nonce, expiresAt }`
   2. Sign `keccak256(exchangeId, nonce, expiresAt)` with `useSignMessage`
   3. Call API (confirm) with `{ nonce, expiresAt, signature }`
   4. Show QR

### 8. `apps/web/app/apps/tourist/page.tsx` (tourist dashboard)
**Changes to ScanQRView:**

a) Fetch exchange data to get qrNonce, qrExpiresAt, qrSignature
b) On "Scan" click:
   1. Calculate agentMargin: `Math.min(amount * 5 / 100, 1) * 1_000_000`
   2. Calculate touristAmount: `(amount * 1_000_000) - platformFee - agentMargin`
   3. Call `useWriteContract` → `escrow.releaseEscrow(exchangeId, touristAddress, touristAmount, agentMargin, nonce, expiry, signature)`
   4. After tx confirmed: `POST /api/exchanges/[id]/scan` with `{ txHash }`

---

## Contract Constants Reference

| Constant | Value | Description |
|----------|-------|-------------|
| `ESCROW_ADDRESS` | `0x2d8308205d60a0a5B608bC60d35580d0f89F34Be` | Deployed OvericeEscrow |
| `USDC_ADDRESS` | `0x534b2f3A21130d7a60830c2Df862319e593943A3` | Monad testnet USDC |
| `PLATFORM_FEE` | `50_000` | 0.05 USDC (6 decimals) |
| `MAX_AGENT_MARGIN` | `1_000_000` | 1 USDC (6 decimals) |
| `MARGIN_BPS` | `500` | 5% |
| `USDC_DECIMALS` | `1_000_000` | 6 decimals multiplier |

## On-chain Unit Conversion

DB stores in whole USD (e.g. 10 = $10). On-chain uses 6 decimals (e.g. 10 USDC = 10_000_000).
- To chain: `amount * 1_000_000`
- From chain: `balance / 1_000_000`
