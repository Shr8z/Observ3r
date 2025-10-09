import { Gauge } from 'prom-client';

export const correlationFactor = new Gauge({
  name: 'moonwell_correlation_factor',
  help: 'Correlation Factor',
  labelNames: ['address']
});

export const collateralBalanceUsd = new Gauge({
  name: 'moonwell_collateral_balance_usd',
  help: 'Collateral Balance USD',
  labelNames: ['address', 'token']
});

export const borrowAvailableUsd = new Gauge({
  name: 'moonwell_borrow_available_usd',
  help: 'Borrow Available USD',
  labelNames: ['address']
});

export const supplyBalance = new Gauge({
  name: 'moonwell_supply_balance',
  help: 'Supply Balance',
  labelNames: ['address', 'token']
});

export const supplyBalanceUsd = new Gauge({
  name: 'moonwell_supply_balance_usd',
  help: 'Supply Balance USD',
  labelNames: ['address', 'token']
});

export const borrowBalance = new Gauge({
  name: 'moonwell_borrow_balance',
  help: 'Borrow Balance',
  labelNames: ['address', 'token']
});

export const borrowBalanceUsd = new Gauge({
  name: 'moonwell_borrow_balance_usd',
  help: 'Borrow Balance USD',
  labelNames: ['address', 'token']
});

export const vaultBalance = new Gauge({
  name: 'moonwell_vault_balance',
  help: 'Vault Balance',
  labelNames: ['address', 'vault']
});

export const vaultBalanceUsd = new Gauge({
  name: 'moonwell_vault_balance_usd',
  help: 'Vault Balance USD',
  labelNames: ['address', 'vault']
});

export const rewardBalance = new Gauge({
  name: 'moonwell_reward_balance',
  help: 'Reward Balance',
  labelNames: ['address', 'token']
});

export const rewardBalanceUsd = new Gauge({
  name: 'moonwell_reward_balance_usd',
  help: 'Reward Balance USD',
  labelNames: ['address', 'token']
});

export const marketSupplyAPY = new Gauge({
  name: 'moonwell_market_supply_apy',
  help: 'Market Supply APY',
  labelNames: ['market', 'token']
});

export const marketBorrowAPY = new Gauge({
  name: 'moonwell_market_borrow_apy',
  help: 'Market Borrow APY',
  labelNames: ['market', 'token']
});