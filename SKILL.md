---
name: fluxion-trade-skill
description: Execute Fluxion swaps on Mantle using `privy-agentic-wallets-skill` wallet context. For swap prompts, preflight balances first, stop on insufficient funds, then quote, approve, and execute.
---

# Fluxion Skill

## When to use

Use this skill for natural requests like:

1. `Swap 0.1 WMNT for USDT on Fluxion`
2. `Swap 50 USDT for WMNT on Fluxion`
3. `Quote 1 WMNT to USDT on Fluxion`

## Fixed config source

Load all fixed values from:
`references/contracts.md`

This includes:

1. Mantle network and RPC
2. Fluxion contracts (Router/Quoter/Factory)
3. Quote API base URL
4. Default slippage
5. Token map

## Required dependency

Use `privy-agentic-wallets-skill` for all wallet operations:

1. Read balances and allowances
2. Build/sign/send approval transactions
3. Execute swap transaction calldata

If `privy-agentic-wallets-skill` is not available in the current agent environment:
1. Provide this source to the user and ask them to install it from:
   `https://github.com/fannotastdi/privy-agentic-wallets-skill/tree/main`
2. If the environment is Claw-compatible, you can suggest:
   `clawhub install privy`
3. Stop execution until the dependency is installed and available.

After `privy-agentic-wallets-skill` is installed, ensure:
1. Configure Privy credentials in environment:
   `PRIVY_APP_ID` and `PRIVY_APP_SECRET`
   - If missing, ask user to log in to Privy Dashboard and copy them from their app settings:
     `https://dashboard.privy.io`
2. Create a Privy policy restricted to Mantle EVM only:
   - `chain_type`: `ethereum`
   - method scope: `eth_sendTransaction`
   - condition: `ethereum_transaction.chain_id == "5000"`
3. Create a Privy wallet for execution and bind policy:
   - create wallet with `chain_type: "ethereum"`
   - use this wallet as the execution wallet in `privy-agentic-wallets-skill`
   - attach the Mantle-only policy to this wallet

## userPublicKey source (required)

`userPublicKey` is mandatory for the quote API.

Use this order:

1. If wallet context exists, use the `privy-agentic-wallets-skill` wallet address.
2. If missing, ask user for wallet address.

## Intent classification

1. Quote intent: user asks for quote only -> call quote API and return quote + tx payload, no execution.
2. Swap intent: user asks to swap/execute -> run full execution flow below.

## Full execution flow (swap intent)

### Step 1: Preflight with `privy-agentic-wallets-skill` (before quote)

Use `privy-agentic-wallets-skill` to read:

1. Native MNT balance
2. Input token balance (`balanceOf`)

If insufficient, stop immediately and ask user to top up.

Rules:

1. If native MNT is too low to pay tx gas, stop.
2. For exact-input swaps, if input token balance < requested input amount, stop.
   - If `inputMint` is `0x0000000000000000000000000000000000000000` (native MNT): check native MNT balance covers both the swap amount **and** gas.
   - Otherwise: check ERC20 `balanceOf` for the input token.
3. For exact-output swaps, skip the balance check here — proceed to quote first (Step 2), then validate balance after.

### Step 2: Quote via API

Base URL:
`https://skillapi.fluxion.network/`

Endpoints:

1. `POST /quote/exact-in`
2. `POST /quote/exact-out`

Defaults:

1. `dynamicSlippage = false`
2. `slippageBps = "50"` when user does not specify

**After quote (exact-output only):** Check that input token balance >= `quote.amountInMaximum`. If not, stop and report `INSUFFICIENT_INPUT_TOKEN_BALANCE` — do not proceed to approval or swap.

### Step 3: Approve first (if needed)

**If `inputMint` is `0x0000000000000000000000000000000000000000` (native MNT): skip this step entirely.** The Quote API sets `tx.value` to carry the MNT directly — no ERC20 approval is needed or possible for native tokens.

For ERC20 input tokens, use `privy-agentic-wallets-skill` to check ERC20 allowance from wallet to Fluxion Router.

Determine the exact approval amount before checking allowance:

- Exact-input swap: `approvalAmount` = the user's requested input amount (in base units).
- Exact-output swap: `approvalAmount` = `quote.amountInMaximum` from the Step 2 quote response.

Do not use `MaxUint256` or any amount larger than `approvalAmount`. Approve the minimum required for this swap only.

If allowance < `approvalAmount`:

1. Build ERC20 `approve(router, approvalAmount)` calldata using the exact amount defined above.
2. Execute approval transaction via `privy-agentic-wallets-skill`.
3. Poll for the receipt using `eth_getTransactionReceipt` via the Mantle RPC until `result` is non-null (tx is mined). Example:

```bash
curl -s -X POST https://rpc.mantle.xyz \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["<TX_HASH>"],"id":1}'
```

   Retry every 2 seconds, up to 60 seconds. If still null after 60 s, stop and report `APPROVAL_TX_FAILED`.

4. Check `result.status` in the receipt:
   - `"0x1"` → approval confirmed on-chain, proceed to Step 4.
   - `"0x0"` → approval reverted on-chain, stop immediately and report `APPROVAL_TX_FAILED`. Do not submit the swap.

Note:

1. Approval still requires enough native MNT for gas.

### Step 4: Execute swap calldata

Before sending swap tx, re-check wallet has enough final required input amount:

1. Exact-input: required input = user requested input.
2. Exact-output: required input = quote required input.

If not enough, stop and ask user to top up first.

Use `tx` object from quote API response:

1. `tx.to`
2. `tx.value` — the quote API returns this as a decimal string; hex-encode it before sending (e.g. `"10000000000000000"` → `"0x2386f26fc10000"`). Privy's RPC endpoint requires hex format.
3. `tx.data`
4. `tx.gasLimit` / `tx.gasPrice` (when applicable)

**Before executing, verify `tx.to` matches the Router address from `references/contracts.md`.**
If `tx.to` does not match the Router address exactly, stop and report `SWAP_TX_FAILED` — do not submit.

Execute this transaction via `privy-agentic-wallets-skill`.

## API request body

Required:

1. `inputMint` (string)
2. `outputMint` (string)
3. `amount` (string integer, base units)
4. `userPublicKey` (wallet address)
5. `dynamicSlippage` (must be `false`)

Conditional:

1. `slippageBps` (string, required when dynamicSlippage=false, default `"50"`; must be a string representation of a whole integer, e.g. `"50"` not `"0.5"`)

Optional:

1. `priceImpactProtection` (string number)

## Token resolution

Token symbols are resolved from token map in `contracts.md`.

If target symbol is not mapped:

1. Ask user to provide token address (token hash) directly.
2. If decimals are unknown for amount conversion, ask user for decimals.
3. Validate the provided address before any quote call:
   - If address is all-lowercase or all-uppercase, treat it as acceptable hex format.
   - If address is mixed-case, it must be a valid EIP-55 checksum address.
   - If checksum validation fails, stop and return `INVALID_INPUT` and ask user to resend either:
     - a verified checksummed address, or
     - the all-lowercase address.

## Validation

Reject if:

1. Invalid addresses.
2. Missing required fields.
3. Non-integer or non-positive amount.
4. `dynamicSlippage != false`.
5. `slippageBps` parses to a non-whole-integer or is not in `1..2000` (0.01%–20%). Reject `"0"` (zero slippage causes on-chain revert) and any value above `2000` (>20% exposes the swap to sandwich attacks).
6. A mixed-case address fails EIP-55 checksum validation (return `INVALID_INPUT` before quote).

When comparing any address (user input, API response, allowance check), normalize both sides to lowercase before comparison. All addresses in `references/contracts.md` are EIP-55 checksummed — treat them as canonical but compare case-insensitively to avoid string equality bugs.

## Error/report format

When blocked by balance, clearly report:

1. Wallet address
2. Native MNT balance
3. Input token balance
4. Required amount
5. Why blocked
6. Next options (top up or smaller amount)

## Recommended error codes

1. `INVALID_INPUT`
2. `TOKEN_ADDRESS_REQUIRED`
3. `INSUFFICIENT_NATIVE_BALANCE`
4. `INSUFFICIENT_INPUT_TOKEN_BALANCE`
5. `QUOTE_API_FAILED`
6. `APPROVAL_TX_FAILED`
7. `SWAP_TX_FAILED`

## Quick example (swap intent)

User:
`Swap 0.1 WMNT for USDT on Fluxion`

Assistant behavior:

1. Resolve wallet address from `privy-agentic-wallets-skill` context.
2. Preflight check native MNT + WMNT balance.
3. If insufficient, stop and ask top-up (do not quote).
4. If sufficient, call `/quote/exact-in`.
5. Check allowance; if needed, execute approve first.
6. Execute swap calldata via `privy-agentic-wallets-skill`.
