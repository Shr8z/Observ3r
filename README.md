# Observ3r

A Deno-based on-chain observer API for the Base network that tracks and monitors DeFi positions across Aerodrome, Moonwell, and Chainlink protocols.

---

## Functional Description

Observ3r is a REST API service that provides real-time data fetching and tracking of DeFi positions on the Base blockchain network.

### Core Features

#### 1. **Aerodrome Pool Tracking**
- Endpoint: `GET /api/aerodrome/pool/:poolAddress?walletaddress=<address>`
- Tracks liquidity pool data including:
  - Pool reserves and total value locked (TVL)
  - User LP share and staked balance
  - Earned rewards from gauge contracts
  - Support for VFAT Sickle contracts for automated position detection
- Persists all queries to MongoDB for historical analysis

#### 2. **Moonwell Position Tracking**
- Endpoint: `GET /api/moonwell?walletaddress=<address>`
- Monitors user lending/borrowing positions including:
  - Core market positions (supply/borrow balances)
  - Morpho vault positions
  - Collateral value and available borrowing capacity
  - Accrued rewards across protocols
  - Collateral factor calculations

#### 3. **Chainlink Price Feeds**
- Real-time token price feeds for accurate position valuations
- Supports Base network tokens: ETH, USDC, AERO, cbBTC, and more
- Integrated into all position calculations for USD valuations

### Supported Protocols

| Protocol | Capabilities |
|----------|-------------|
| **Aerodrome** | Pool reserves, gauge staking, LP position tracking, reward monitoring |
| **Moonwell** | Core market lending/borrowing, Morpho vault positions, collateral tracking |
| **Chainlink** | Real-time price oracles for token valuations |
| **Base Network** | Multi-call RPC queries for efficient on-chain data fetching |

### Data Architecture

- **API Server**: Express.js running on Deno runtime
- **Database**: MongoDB stores historical Aerodrome pool data for tracking trends
- **Smart Contract Interactions**: Reads from Base network via RPC for on-chain state
- **Price Oracle**: Chainlink feeds provide real-time USD valuations

---

## Architecture

### High-Level Overview

```mermaid
flowchart LR
    Client([Client])
    API[Observ3r API<br/>Express Server]
    RPC[Base Network<br/>RPC Endpoint]
    DB[(MongoDB)]

    Client -->|HTTP Requests| API
    API -->|Multicall RPC| RPC
    API -->|Persist Data| DB
    RPC -->|On-chain Data| API
```

### Services & Smart Contract Interactions

```mermaid
flowchart TB
    Client([Client])
    
    subgraph API[Observ3r API]
        Express[Express Router]
        AeroService[AerodromeService]
        MoonService[MoonwellService]
        ChainService[ChainlinkService]
        BaseService[BaseService]
    end

    subgraph Base[Base Network]
        subgraph Aerodrome
            PoolGauge[Pool Gauge Contract]
            Pool[Pool Contract]
            Sickle[Sickle Factory]
        end
        subgraph Moonwell
            CoreMarkets[Core Markets]
            MorphoVaults[Morpho Vaults]
        end
        subgraph Chainlink
            PriceFeeds[Price Feed Contracts]
        end
        ERC20[ERC20 Tokens]
    end

    DB[(MongoDB)]

    Client --> Express
    Express --> AeroService
    Express --> MoonService
    AeroService --> PoolGauge
    AeroService --> Pool
    AeroService --> Sickle
    MoonService --> CoreMarkets
    MoonService --> MorphoVaults
    ChainService --> PriceFeeds
    BaseService --> ERC20
    AeroService --> ChainService
    Express --> DB
```

---

## Prerequisites

- [Deno](https://deno.land/) v2.0+ installed
- MongoDB instance (local or cloud)
- Base network RPC URL (optional, defaults to public endpoint)
- Node.js 18+ (for npm package support via Deno)

---

## Quick Start

### Prerequisites Verification

Before starting, ensure you have:

```bash
# Check Deno installation
deno --version    # Should be v2.0+

# Check Node.js (for npm package support)
node --version    # Should be v18+
```

### MongoDB Setup

#### Option 1: Local MongoDB (using Docker)

```bash
docker run --name mongodb -d -p 27017:27017 mongo:latest
```

#### Option 2: Cloud MongoDB (Atlas)

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Get your connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/`)

---

## Run Locally

### 1. Clone and navigate to the project

```bash
git clone <repository-url>
cd Observ3r
```

### 2. Install dependencies

```bash
deno install
```

This installs all dependencies defined in `deno.json` including:
- **express** - Web server framework
- **mongodb** - Database driver
- **viem** - Ethereum utilities for address validation and formatting
- **moonwell-sdk** - Moonwell protocol SDK

### 3. Configure environment variables

Create a `.env` file in the project root or export variables:

```bash
# Required
export MONGODB_CONNECTION_STRING="mongodb://localhost:27017/Observ3r"

# Optional (defaults to public Base RPC)
export RPC_URL="https://mainnet.base.org"


```

**For Docker/production environments**, ensure these variables are passed as environment variables to the container.

### 4. Start the server

Using Deno task:
```bash
deno task start
```

Or run directly with permissions:
```bash
deno run --allow-net --allow-env main.ts
```

The API server will start at:
```
http://localhost:8000
```

### 5. Verify the server is running

```bash
curl http://localhost:8000/
# Response: Welcome to Observ3r API!
```

### Available Deno Tasks

| Task | Command | Description |
|------|---------|-------------|
| **start** | `deno task start` | Run the API server |
| **test** | `deno task test` | Run test suite |
| **lint** | `deno task lint` | Run code linter |

### Debugging

Enable more detailed logging by running with debug output:

```bash
deno run --allow-net --allow-env --log-level=debug main.ts
```

---

## API Endpoints

### Base Endpoint

```http
GET /
```

Health check endpoint. Returns a welcome message.

### Aerodrome Pool Data

Fetch real-time data from Aerodrome liquidity pools including reserves, TVL, user positions, and earned rewards.

```http
GET /api/aerodrome/pool/:poolAddress?walletaddress=0x...
```

**Parameters:**
- `poolAddress` (path, required) - Aerodrome pool/gauge contract address
- `walletaddress` (query, required) - Wallet address to check LP balance and rewards

**Example:**
```bash
curl "http://localhost:8000/api/aerodrome/pool/0x4f09bab2f0e15e2a078a227fe1537665f55b8360?walletaddress=0xfbcbe7ad86b277a05fe260f037758cd5985e9c37"
```

**Response:** (200 OK)
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "blockNumber": 12345678,
  "poolName": "vAMM-USDC/AERO",
  "poolAddress": "0x4f09bab2f0e15e2a078a227fe1537665f55b8360",
  "walletAddress": "0xfbcbe7ad86b277a05fe260f037758cd5985e9c37",
  "token0": "0x833589fcd6edb6e08f4c7c32d4f71b3566c8662e",
  "token1": "0x940181a94a35a4569e400762a40db3f6a6f64b50",
  "res0": 1500000000000,
  "res1": 2500000000000000000000000,
  "price0": 1.0,
  "price1": 0.85,
  "rewardToken": "0x940181a94a35a4569e400762a40db3f6a6f64b50",
  "rewardEarned": 12.5,
  "poolTVL": 1500000,
  "positionShare": 0.00015,
  "positionPrice": 225
}
```

**Notes:**
- All token amounts are stored in raw units (not decimal-adjusted)
- `positionPrice` = `positionShare × poolTVL`
- Automatically checks VFAT Sickle contracts if wallet has no direct LP balance
- Data is persisted to MongoDB for historical tracking

---

### Moonwell Positions

Fetch user positions across Moonwell lending markets and Morpho vaults.

```http
GET /api/moonwell?walletaddress=0x...
```

**Parameters:**
- `walletaddress` (query, required) - Wallet address to check Moonwell positions

**Example:**
```bash
curl "http://localhost:8000/api/moonwell?walletaddress=0xfbcbe7ad86b277a05fe260f037758cd5985e9c37"
```

**Response:** (200 OK)
```
Done !
```

**Returns (via console logs):**
```
------- Moonwell Summary -------
Address:            0xfbcbe7ad86b277a05fe260f037758cd5985e9c37
Vault Balance:      50000
Supply Balance:     $125000
Collateral Balance: $200000
Borrow Balance:     $75000
Borrow Available:   $125000
Correlation Factor: 0.625
--------------------------------
```

**Data Included:**
- **Core Market Positions**: Supply and borrow balances for each market
- **Morpho Vault Positions**: Supplied amounts to Morpho vaults
- **Collateral Information**: Total collateral value
- **Rewards**: Accrued supply and borrow rewards
- **Health Metrics**: Collateral factor and available borrowing capacity

---

## Build

### Build for Development

No build step required for Deno. The TypeScript is compiled on-the-fly:

```bash
deno run --allow-net --allow-env main.ts
```

### Build Docker Image

Build a production-ready Docker image:

```bash
docker build -t observ3r:latest .
```

**Dockerfile details:**
- **Base image**: `denoland/deno:alpine-2.4.0` (lightweight Alpine Linux)
- **Runtime user**: Runs as non-root `deno` user for security
- **Exposed port**: 8000 (can be remapped)
- **Working directory**: `/app`

### Verify the Docker Image

```bash
docker images | grep observ3r
```

---

## Deploy

### Local Docker Deployment

1. **Start MongoDB** (if using local):
   ```bash
   docker run --name mongodb -d -p 27017:27017 mongo:latest
   ```

2. **Run the application**:
   ```bash
   docker run -p 8000:8000 \
     -e MONGODB_CONNECTION_STRING="mongodb://host.docker.internal:27017/Observ3r" \
     -e RPC_URL="https://mainnet.base.org" \
     observ3r:latest
   ```

   **Note:** On Linux, use `mongodb://172.17.0.1:27017` instead of `host.docker.internal`

### Cloud Deployment (Azure Container Registry)

This project includes GitHub Actions CI/CD for automated deployment to Azure.

**GitHub Actions Workflow** (`.github/workflows/deno.yml`):

1. **Trigger**: Push to `develop` or `master` branch
2. **Steps**:
   - Lint code on all branches
   - Build and push to Azure Container Registry on `master` only
   - Deploy to Azure Container Apps

**Required GitHub Secrets** (set in repo settings):

| Secret | Value |
|--------|-------|
| `AZURE_CREDENTIALS` | JSON service principal credentials |
| `REGISTRY_LOGIN_SERVER` | Azure Container Registry URL (e.g., `myregistry.azurecr.io`) |
| `REGISTRY_USERNAME` | ACR username |
| `REGISTRY_PASSWORD` | ACR password |

**Setting up GitHub Secrets:**

```bash
# 1. Create Azure service principal
az ad sp create-for-rbac --name "observ3r-github" --role contributor \
  --scopes /subscriptions/<subscription-id> > credentials.json

# 2. Add to GitHub:
# Settings → Secrets and variables → Actions → New repository secret
# Copy the JSON from credentials.json as AZURE_CREDENTIALS value
```

**Deployment to Azure Container Apps:**

After successful image push to ACR:

```bash
az containerapp create \
  --name observ3r \
  --resource-group <resource-group> \
  --image <registry-url>/observ3r:latest \
  --cpu 0.5 --memory 1Gi \
  --environment <container-app-env> \
  --ingress external --target-port 8000 \
  --env-vars MONGODB_CONNECTION_STRING="<connection-string>" RPC_URL="https://mainnet.base.org"
```

### Environment Variables for Deployment

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_CONNECTION_STRING` | ✅ Yes | — | MongoDB connection string |
| `RPC_URL` | ❌ No | `https://mainnet.base.org` | Base network RPC endpoint |

### Health Checks

Add a health check endpoint to your container service:

```bash
curl http://localhost:8000/

# Expected response: "Welcome to the Dinosaur API!"
```

---

## Project Structure

```
Observ3r/
├── main.ts                              # Express server & API routes
├── 
├── Services/
│   ├── Aerodrome/
│   │   ├── AerodromeService.ts          # Pool & gauge data fetching logic
│   │   ├── AerodromeSchema.ts           # MongoDB document schema
│   │   └── AerodromePoolGauge.ts        # Pool address & name mappings
│   │
│   ├── Base/
│   │   ├── BaseService.ts               # RPC utilities, block numbers, balances
│   │   └── BaseTokens.ts                # Token metadata (decimals, symbols)
│   │
│   ├── Chainlink/
│   │   ├── ChainlinkService.ts          # Price feed contract queries
│   │   └── DataFeeds.ts                 # Chainlink feed address mappings
│   │
│   └── Moonwell/
│       └── MoonwellService.ts           # Moonwell SDK wrapper & transformations
│
├── Interfaces/                          # TypeScript interfaces (if any)
├── data/
│   ├── data.json                        # Static data (tokens, pools, etc.)
│   └── documentDB.json                  # Document schema examples
│
├── .github/
│   └── workflows/
│       └── deno.yml                     # GitHub Actions CI/CD pipeline
│
├── Dockerfile                           # Container build configuration
├── deno.json                            # Dependencies & task definitions
├── deno.lock                            # Lock file for reproducible builds
├── README.md                            # This file
└── LICENSE
```

---

## Troubleshooting

### MongoDB Connection Errors

```
Error: MONGODB_CONNECTION_STRING is not set in environment variables
```

**Solution**: Set the environment variable before running:
```bash
export MONGODB_CONNECTION_STRING="mongodb://localhost:27017/Observ3r"
```

### Port 8000 Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use a different port by modifying main.ts (line ~160):
# app.listen(3000);  # change from 8000
```

### RPC Rate Limiting

If you see frequent RPC errors, increase your RPC provider's rate limit or use a private RPC:

```bash
export RPC_URL="https://rpc.zerion.io/base"  # Alternative Base RPC
```

### Invalid Wallet Address Format

Ensure wallet addresses are valid Ethereum addresses (0x prefix + 40 hex characters):

```bash
# Valid
curl "http://localhost:8000/api/aerodrome/pool/0x4f09bab2f0e15e2a078a227fe1537665f55b8360?walletaddress=0xfbcbe7ad86b277a05fe260f037758cd5985e9c37"

# Invalid
curl "http://localhost:8000/api/aerodrome/pool/0x4f09bab2f0e15e2a078a227fe1537665f55b8360?walletaddress=fbcbe7ad86b277a05fe260f037758cd5985e9c37"
```

---

## License

See [LICENSE](LICENSE) file for details.

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your fork
5. Open a Pull Request

Ensure your code passes linting:
```bash
deno task lint
```

---
