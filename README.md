# Fluxion Trade Skill

Swap tokens on [Fluxion](https://fluxion.network) — a concentrated liquidity DEX on [Mantle Network](https://mantle.xyz) — using an AI agent with a Privy-controlled wallet.

## Install

```bash
npx skills add https://github.com/Fluxion-Exchange/Fluxion-trade-skill --skill fluxion-trade-skill
```

---

## What This Is

A skill (structured instructions + reference docs) that teaches AI agents how to:

- **Quote swaps** — get a price and transaction payload before committing
- **Execute swaps** — approve, sign, and submit the swap transaction on Mantle
- **Preflight balances** — check native MNT and token balances before quoting
- **Handle approvals** — automatically approve ERC20 spending for the Fluxion Router when needed

Built on top of [privy-agentic-wallets-skill](https://github.com/privy-io/privy-agentic-wallets-skill) for wallet operations, and the [Fluxion Quote API](https://skillapi.fluxion.network/) for routing and calldata generation.

---

## The Story

Your agent needs to swap 50 USDT for WMNT. It doesn't ask for a private key. It doesn't open MetaMask. It just… does it.

It checks your balance first. If you don't have enough, it stops and tells you. If you do, it fetches a quote, checks the Router allowance, approves if needed, waits for confirmation on-chain, then executes the swap — all in one flow, with structured error codes at every step.

That's what this skill enables.

---

## Dependencies

This skill **requires** `privy-agentic-wallets-skill` to be installed and configured. It handles all wallet operations: reading balances, sending approvals, executing swap transactions.

→ Install it from: [github.com/privy-io/privy-agentic-wallets-skill](https://github.com/privy-io/privy-agentic-wallets-skill)

Once installed, set your Privy credentials:

```bash
export PRIVY_APP_ID="your-app-id"
export PRIVY_APP_SECRET="your-app-secret"
```

Create a Privy wallet restricted to Mantle (chainId `5000`) and attach it to your agent. That wallet is the execution wallet for all swaps.

---

## What's Included

```
fluxion/
├── README.md              # This file
├── SKILL.md               # Full agent instructions — execution flow, validation, error codes
└── references/
    └── contracts.md       # Fixed config: chain, RPC, contract addresses, token map, API base URL
```

### `SKILL.md`

The main instruction set for the agent. Covers:

- When to use this skill
- How to classify intent (quote vs swap)
- Full execution flow: preflight → quote → approve → swap
- API request body fields and defaults
- Token resolution from symbol to address
- Validation rules and error codes

### `references/contracts.md`

The ground truth for all fixed values the agent should never guess:

- Mantle RPC and chainId
- Fluxion Router, QuoterV2, and Factory addresses
- Quote API base URL
- Default slippage (50 bps)
- Token map: MNT, WMNT, USDT, USDC, BSB, ELSA, VOOI

---

## Example Prompts

### Quote only

> "Quote 100 USDT for WMNT on Fluxion"

The agent fetches a price and returns the expected output amount — no transaction submitted.

### Execute a swap

> "Swap 0.5 WMNT for USDT on Fluxion"

The agent will:

1. Resolve the wallet address from `privy-agentic-wallets-skill`
2. Check native MNT balance (for gas) and WMNT balance
3. Call `/quote/exact-in` on the Fluxion Quote API
4. Check ERC20 allowance for WMNT → Router
5. If needed, submit and confirm an `approve` transaction on-chain
6. Execute the swap calldata via `privy-agentic-wallets-skill`

### Exact-output swap

> "Buy exactly 50 USDT using WMNT on Fluxion"

Uses `/quote/exact-out` — the agent will determine the max WMNT required and validate balance after quoting before proceeding.

---

## Execution Flow at a Glance

```
User prompt
    │
    ▼
Classify intent (quote / swap)
    │
    ▼
[Swap] Preflight: check MNT gas + input token balance
    │
    ▼
Quote API → /quote/exact-in or /quote/exact-out
    │
    ▼
[Exact-out] Validate input balance ≥ amountInMaximum
    │
    ▼
[ERC20 input] Check allowance → approve if needed → wait for confirmation
    │
    ▼
Verify tx.to == Router address
    │
    ▼
Execute swap → return tx hash
```

---

## Links

- [Fluxion](https://fluxion.network)
- [Mantle Network](https://mantle.xyz)
- [Privy Agentic Wallets Skill](https://github.com/privy-io/privy-agentic-wallets-skill)
- [Privy Dashboard](https://dashboard.privy.io)

---

## License

MIT
