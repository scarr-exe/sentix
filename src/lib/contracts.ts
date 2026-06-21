export const SENTIX_LOGGER_ADDRESS =
  (process.env.NEXT_PUBLIC_SENTIX_LOGGER_ADDRESS as `0x${string}`) ||
  "0x0000000000000000000000000000000000000000";

export const SENTIX_LOGGER_ABI = [
  {
    type: "function",
    name: "logBacktest",
    stateMutability: "nonpayable",
    inputs: [
      { name: "symbol",       type: "string"  },
      { name: "timeframe",    type: "string"  },
      { name: "period",       type: "string"  },
      { name: "strategyText", type: "string"  },
      { name: "totalPnLBps",  type: "int256"  },
      { name: "winRateBps",   type: "uint256" },
      { name: "totalTrades",  type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getRecordsByUser",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "user",         type: "address" },
          { name: "symbol",       type: "string"  },
          { name: "timeframe",    type: "string"  },
          { name: "period",       type: "string"  },
          { name: "strategyText", type: "string"  },
          { name: "totalPnLBps",  type: "int256"  },
          { name: "winRateBps",   type: "uint256" },
          { name: "totalTrades",  type: "uint256" },
          { name: "timestamp",    type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "totalRecords",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "event",
    name: "BacktestLogged",
    inputs: [
      { name: "user",         type: "address", indexed: true  },
      { name: "symbol",       type: "string",  indexed: false },
      { name: "timeframe",    type: "string",  indexed: false },
      { name: "totalPnLBps",  type: "int256",  indexed: false },
      { name: "winRateBps",   type: "uint256", indexed: false },
      { name: "totalTrades",  type: "uint256", indexed: false },
      { name: "timestamp",    type: "uint256", indexed: false },
      { name: "recordIndex",  type: "uint256", indexed: false },
    ],
  },
] as const;