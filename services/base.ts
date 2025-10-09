import { createPublicClient, formatEther, getAddress, parseAbi, webSocket, Address, http, PublicClient } from "viem";
import { base } from "viem/chains";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

export class BaseService {

  private rpcUrl = Deno.env.get("RPC_URL") || "https://mainnet.base.org";

  private publicClient = createPublicClient({
    chain: base,
    transport: http(this.rpcUrl),
    batch: { multicall: { batchSize: 10, wait: 250 } },
  });

  public async getUserPosition(address: Address): Promise<bigint> {
    return this.publicClient.getBalance({ address });
  }

  private erc20Abi = parseAbi([
    'function balanceOf(address owner) external view returns (uint256)'
  ])

  public async getBaseBalances(address: Address) {
    // VIEM MULTICALL PATTERN (Saves 90% RPC calls)
    const results = await this.publicClient.multicall({
      contracts: this.tokens.map(token => ({
        address: token.address,
        abi: this.erc20Abi,
        functionName: 'balanceOf',
        args: [address]
      }))
    })

    return {
      tokens: this.tokens.map((token, i) => ({
        symbol: token.symbol,
        balance:  Number(results[i].result) / 10**token.decimals,
        address: token.address,
        name: token.name
      }))
    }
  }

  private tokens = [
    {
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      name: "Ethereum",
      symbol: "ETH"
    },
    {
      address: "0x4200000000000000000000000000000000000006",
      decimals: 18,
      name: "Wrapped Ethereum",
      symbol: "WETH"
    },
    {
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      decimals: 6,
      name: "USD Coin",
      symbol: "USDC"
    },
    {
      address: "0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22",
      decimals: 8,
      name: "Moonwell USDC",
      symbol: "mUSDC"
    },
    {
      address: "0x628ff693426583D9a7FB391E54366292F509D457",
      decimals: 8,
      name: "Moonwell ETH",
      symbol: "mWETH"
    },
    {
      address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
      decimals: 18,
      name: "Coinbase Staked Ethereum",
      symbol: "cbETH"
    },
    {
      address: "0x3bf93770f2d4a794c3d9EBEfBAeBAE2a8f09A5E5",
      decimals: 8,
      name: "Moonwell cbETH",
      symbol: "mcbETH"
    },
    {
      address: "0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452",
      decimals: 18,
      name: "Lido Staked Ethereum",
      symbol: "wstETH"
    },
    {
      address: "0x627Fe393Bc6EdDA28e99AE648fD6fF362514304b",
      decimals: 8,
      name: "Moonwell wstETH",
      symbol: "mwstETH"
    },
    {
      address: "0xb6fe221fe9eef5aba221c348ba20a1bf5e73624c",
      decimals: 18,
      name: "Rocket Pool Staked Ethereum",
      symbol: "rETH"
    },
    {
      address: "0xCB1DaCd30638ae38F2B94eA64F066045B7D45f44",
      decimals: 8,
      name: "Moonwell rETH",
      symbol: "mrETH"
    },
    {
      address: "0x04c0599ae5a44757c0af6f9ec3b93da8976c150a",
      decimals: 18,
      name: "EtherFi Restaked Ethereum",
      symbol: "weETH"
    },
    {
      address: "0xb8051464C8c92209C92F3a4CD9C73746C4c3CFb3",
      decimals: 8,
      name: "Moonwell weETH",
      symbol: "mweETH"
    },
    {
      address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      decimals: 8,
      name: "Coinbase Bitcoin",
      symbol: "cbBTC"
    },
    {
      address: "0xF877ACaFA28c19b96727966690b2f44d35aD5976",
      decimals: 8,
      name: "Moonwell cbBTC",
      symbol: "mcbBTC"
    },
    {
      address: "0x940181a94A35A4569E4529A3CDfB74e38FD98631",
      decimals: 18,
      name: "Aerodrome",
      symbol: "AERO"
    },
    {
      address: "0x73902f619CEB9B31FD8EFecf435CbDf89E369Ba6",
      decimals: 8,
      name: "Moonwell AERO",
      symbol: "mAERO"
    },
    {
      address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
      decimals: 18,
      name: "DAI",
      symbol: "DAI"
    },
    {
      address: "0x73b06D8d18De422E269645eaCe15400DE7462417",
      decimals: 8,
      name: "Moonwell DAI",
      symbol: "mDAI"
    },
    {
      address: "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca",
      decimals: 6,
      name: "USD Coin",
      symbol: "USDbC"
    },
    {
      address: "0x703843C3379b52F9FF486c9f5892218d2a065cC8",
      decimals: 8,
      name: "Moonwell USDbC",
      symbol: "mUSDC"
    },
    {
      address: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
      decimals: 6,
      name: "Euro Coin",
      symbol: "EURC"
    },
    {
      address: "0xb682c840B5F4FC58B20769E691A6fa1305A501a2",
      decimals: 8,
      name: "Moonwell EURC",
      symbol: "mEURC"
    },
    {
      address: "0xa0E430870c4604CcfC7B38Ca7845B1FF653D0ff1",
      decimals: 18,
      name: "Moonwell Flagship ETH",
      symbol: "mwETH"
    },
    {
      address: "0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca",
      decimals: 18,
      name: "Moonwell Flagship USDC",
      symbol: "mwUSDC"
    },
    {
      address: "0xf24608E0CCb972b0b0f4A6446a0BBf58c701a026",
      decimals: 18,
      name: "Moonwell Flagship EURC",
      symbol: "mwEURC"
    },
    {
      address: "0x543257eF2161176D7C8cD90BA65C2d4CaEF5a796",
      decimals: 18,
      name: "Moonwell Frontier cbBTC",
      symbol: "mwcbBTC"
    },
    {
      address: "0xA88594D404727625A9437C3f886C7643872296AE",
      decimals: 18,
      name: "Moonwell",
      symbol: "WELL"
    },
    {
      address: "0xFF8adeC2221f9f4D8dfbAFa6B9a297d17603493D",
      decimals: 18,
      name: "WELL (Wormhole)",
      symbol: "WELL"
    },
    {
      address: "0xe66E3A37C3274Ac24FE8590f7D84A2427194DC17",
      decimals: 18,
      name: "stkWELL",
      symbol: "stkWELL"
    },
    {
      address: "0xEDfa23602D0EC14714057867A78d01e94176BEA0",
      decimals: 18,
      name: "KelpDAO Restaked Ethereum",
      symbol: "wrsETH"
    },
    {
      address: "0xfC41B49d064Ac646015b459C522820DB9472F4B5",
      decimals: 8,
      name: "Moonwell wrsETH",
      symbol: "mwrsETH"
    },
    {
      address: "0xdC7810B47eAAb250De623F0eE07764afa5F71ED1",
      decimals: 8,
      name: "Moonwell WELL",
      symbol: "mWELL"
    },
    {
      address: "0x5d746848005507DA0b1717C137A10C30AD9ee307",
      decimals: 8,
      name: "PT Lombard LBTC 29MAY2025",
      symbol: "PT_LBTC_29MAY2025"
    },
    {
      address: "0xecAc9C5F704e954931349Da37F60E39f515c11c1",
      decimals: 8,
      name: "Lombard Staked Bitcoin",
      symbol: "LBTC"
    },
    {
      address: "0x820C137fa70C8691f0e44Dc420a5e53c168921Dc",
      decimals: 18,
      name: "Sky Dollar",
      symbol: "USDS"
    },
    {
      address: "0xb6419c6C2e60c4025D6D06eE4F913ce89425a357",
      decimals: 8,
      name: "Moonwell USDS",
      symbol: "mUSDS"
    },
    {
      address: "0x236aa50979D5f3De3Bd1Eeb40E81137F22ab794b",
      decimals: 18,
      name: "Threshold Bitcoin",
      symbol: "tBTC"
    },
    {
      address: "0x9A858ebfF1bEb0D3495BB0e2897c1528eD84A218",
      decimals: 8,
      name: "Moonwell tBTC",
      symbol: "mtBTC"
    },
    {
      address: "0x10fF57877b79e9bd949B3815220eC87B9fc5D2ee",
      decimals: 8,
      name: "Moonwell LBTC",
      symbol: "mLBTC"
    },
    {
      address: "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b",
      decimals: 18,
      name: "Virtuals Protocol",
      symbol: "VIRTUAL"
    },
    {
      address: "0xdE8Df9d942D78edE3Ca06e60712582F79CFfFC64",
      decimals: 8,
      name: "Moonwell Virtual",
      symbol: "mVIRTUAL"
    },
    {
      address: "0xBAa5CC21fd487B8Fcc2F632f3F4E8D37262a0842",
      decimals: 18,
      name: "Morpho",
      symbol: "MORPHO"
    },
    {
      address: "0x6308204872BdB7432dF97b04B42443c714904F3E",
      decimals: 8,
      name: "Moonwell MORPHO",
      symbol: "mMORPHO"
    },
    {
      address: "0xcb585250f852C6c6bf90434AB21A00f02833a4af",
      decimals: 6,
      name: "Coinbase XRP",
      symbol: "cbXRP"
    },
    {
      address: "0xb4fb8fed5b3AaA8434f0B19b1b623d977e07e86d",
      decimals: 8,
      name: "Moonwell cbXRP",
      symbol: "mcbXRP"
    },
    { address: "0xacfe6019ed1a7dc6f7b508c02d1b04ec88cc21bf",
      decimals: 18,
      name: "Venice Token",
      symbol: "VVV"
      
    },
    { address: "0x321b7ff75154472b18edb199033ff4d116f340ff",
      decimals: 18,
      name: "Stack Venice Token",
      symbol: "sVVV"
    }
  ] as const;

}