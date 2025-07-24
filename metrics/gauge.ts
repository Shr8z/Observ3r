import { Gauge } from 'prom-client';

export const correlationFactor = new Gauge({
  name: 'correlation_factor',
  help: 'Correlation Factor',
  labelNames: ['address']
});

export const collateralBalanceUsd = new Gauge({
  name: 'collateral_balance_usd',
  help: 'Collateral Balance USD',
  labelNames: ['address', 'token']
});

export const borrowAvailableUsd = new Gauge({
  name: 'borrow_available_usd',
  help: 'Borrow Available USD',
  labelNames: ['address']
});

export const supplyBalance = new Gauge({
  name: 'supply_balance',
  help: 'Supply Balance',
  labelNames: ['address', 'token']
});

export const supplyBalanceUsd = new Gauge({
  name: 'supply_balance_usd',
  help: 'Supply Balance USD',
  labelNames: ['address', 'token']
});

export const borrowBalance = new Gauge({
  name: 'borrow_balance',
  help: 'Borrow Balance',
  labelNames: ['address', 'token']
});

export const borrowBalanceUsd = new Gauge({
  name: 'borrow_balance_usd',
  help: 'Borrow Balance USD',
  labelNames: ['address', 'token']
});

export const vaultBalance = new Gauge({
  name: 'vault_balance',
  help: 'Vault Balance',
  labelNames: ['address', 'vault']
});

export const vaultBalanceUsd = new Gauge({
  name: 'vault_balance_usd',
  help: 'Vault Balance USD',
  labelNames: ['address', 'vault']
});

export const rewardBalance = new Gauge({
  name: 'reward_balance',
  help: 'Reward Balance',
  labelNames: ['address', 'token']
});

export const rewardBalanceUsd = new Gauge({
  name: 'reward_balance_usd',
  help: 'Reward Balance USD',
  labelNames: ['address', 'token']
});

export const marketSupplyAPY = new Gauge({
  name: 'market_supply_apy',
  help: 'Market Supply APY',
  labelNames: ['market', 'token']
});

export const marketBorrowAPY = new Gauge({
  name: 'market_borrow_apy',
  help: 'Market Borrow APY',
  labelNames: ['market', 'token']
});