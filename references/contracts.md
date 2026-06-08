# Fluxion V3 Contracts (Fixed)

## Network

- `chainId`: 5000
- `caip2`: `eip155:5000`
- `name`: `Mantle Network`
- `rpc`: `https://rpc.mantle.xyz`

## Quote API

- `baseUrl`: `https://skillapi.fluxion.network/`
- `exactInPath`: `/quote/exact-in`
- `exactOutPath`: `/quote/exact-out`
- `defaultDynamicSlippage`: `false`
- `defaultSlippageBps`: `"50"` (0.50%)

## Core Contracts

| Contract | Address |
| --- | --- |
| Router | `0x5628a59dF0ECAC3f3171f877A94bEb26BA6DFAa0` |
| QuoterV2 | `0x3E4eE18Ac7280813236a1EB850679Da5322E14CE` |
| Factory | `0xF883162Ed9c7E8EF604214c964c678E40c9B737C` |

## Token Map

Use this table for symbol-to-address resolution in natural prompts.

| Symbol | Address | Decimals |
| --- | --- | --- |
| MNT | `0x0000000000000000000000000000000000000000` | 18 |
| WMNT | `0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8` | 18 |
| USDT0 | `0x779Ded0c9e1022225f8E0630b35a9b54bE713736` | 6 |
| USDC | `0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9` | 6 |
| BSB | `0xe5c330ADdf7aa9C7838dA836436142c56a15aa95` | 18 |
| ELSA | `0x29cC30f9D113B356Ce408667aa6433589CeCBDcA` | 18 |
| VOOI | `0xd81a4aDea9932a6BDba0bDBc8C5Fd4C78e5A09f1` | 18 |

If target symbol is not listed, ask user to provide token address (token hash) directly.

## Token Aliases

When a user uses an alias, resolve it to the canonical symbol in the Token Map above.

| Alias | Resolves to |
| --- | --- |
| USDT | USDT0 |
