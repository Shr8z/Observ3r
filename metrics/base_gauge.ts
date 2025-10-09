import { Gauge } from 'prom-client';

export const token_balance = new Gauge({
  name: 'base_token_balance',
  help: 'Base token balance for each token',
  labelNames: ['address', 'token']
});
