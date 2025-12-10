# Observ3r

Observ3r is a small Deno-based on-chain observer for the Base network. It fetches token balances, Chainlink feed prices, Aerodrome pool/gauge data and Moonwell positions/rewards for a configured address.

**Key features:**
- Query token balances and ETH balance for an address
- Read Chainlink price feeds and pair prices
- Inspect Aerodrome pool/gauge data (reserves, TVL, user share, earned rewards)
- Fetch Moonwell user positions, rewards and vault information

**Runtime:** Deno (see `deno.json`)

## Quick Start

Set an address and run the main script (allow network and environment access):

```bash
ETH_ADDRESS=0xYourAddress RPC_URL=https://mainnet.base.org deno run --allow-net --allow-env main.ts
```

You can run without `ETH_ADDRESS` for development, but `main.ts` will validate the address and exit if it is invalid.

Docker (build + run):

```bash
docker build -t observ3r:latest .
docker run --env ETH_ADDRESS=0xYourAddress --env RPC_URL=https://mainnet.base.org observ3r:latest
```

## Configuration

- `ETH_ADDRESS` (optional but required for useful output): Ethereum/Base address to inspect. Example: `0x742d35Cc6634C0532925a3b844Bc454e4438f44e`.
- `RPC_URL` (optional): RPC endpoint for the Base network. Example: `https://mainnet.base.org`. Services default to a public RPC if unset.

## Permissions

- `--allow-net` to query RPC and external endpoints
- `--allow-env` to read `ETH_ADDRESS` and other env vars

## Project structure

- `main.ts`: entrypoint. Validates `ETH_ADDRESS`, calls services and prints a summary (Chainlink pair price, token balances, Aerodrome gauge data, Moonwell summary).
- `services/`:
  - `base.ts`: RPC helpers and token balance utilities (multicall / balance formatting).
  - `aerodrome.ts`: Fetches Aerodrome pool & gauge data (reserves, reward token, earned, stake balances).
  - `chainlink.ts`: Reads Chainlink feeds (pair prices) and maps token addresses to USD prices.
  - `moonwell.ts`: Wraps Moonwell client functionality: user positions, rewards and vault data.
- `data/`:
  - `Tokens.ts`: Token metadata (address, decimals, symbol) used to format balances and look up tokens.
  - `DataFeeds.ts`: Chainlink feed mappings used by Chainlink service for price lookups.
  - `data.json`: Additional data (not required by `main.ts` by default).

## Example output patterns (what to expect)

- Chainlink pair prints: `ETH/USD $<value>`
- Token balances: `USDC Balance: 123.45`
- Aerodrome Pool Gauge Data: a block with Token0/Token1, reserves and $TVL
- Moonwell Summary: Vault Balance, Supply/Collateral/Borrow balances and a correlation factor

## Development

- Update dependencies with `deno outdated` and `deno outdated --update`.
- Use `deno run --allow-net --allow-env main.ts` during development.

## Notes & Next steps

- The repo includes a `Dockerfile` for containerized runs. You can add a `deno task start` entry in `deno.json` to simplify running.
- If you'd like, I can add a `deno task` to `deno.json`, example outputs, or a small test harness.

## License

See the `LICENSE` file in the repository for license terms.

---

If you'd like, I can now run the app with your address (if you provide it), add badges, or create a `deno task` entry for `start` in `deno.json`.