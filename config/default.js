module.exports = {
  bot: {
    token: process.env.BOT_TOKEN,
  },

  ethereum: {
    privateKey: process.env.ETH_PRIVATE_KEY,
    endpoint: "ws://srv02.apyos.com:8546",
  },

  faucet: {
    sprinkle: {
      gsana: 500000000000000000000n,
      eth: 50000000000000000n,
    },
    launchBlockHeight: 4461700,
    channel: "867708173355188224",
  },

  contracts: {
    gsana: "0x4c6dc9393ff65b09035dd108f2d8c4155a77786e",
    sw3: "0xf0277caffea72734853b834afc9892461ea18474",
    faucet: "0x731a3e790DeF2712C19bf905A725538779AD4eB5",
  },

  // Can be filtered by names or ids
  // Matches any of the ids or names
  permissions: [
    {
      names: ["@everyone"],
      sprinkles: 3,
    },
    {
      ids: ["868013155228463144"],
      names:["sana-team"],
      sprinkles: Infinity,
      forceSprinkle: true,
    },
    {
      ids: ["868013155228463144"],
      names: ["sana-team"],
      sprinkles: 0,
      cleaner: true,
    },
  ],

  redis: {
    host: "127.0.0.1",
    port: 16379,
    db: 0,
  },

  server: "867682120410595329",

  jobs: {
    fund: {
      checkInterval: 1000, // In ms
      maxFundInterval: 60 * 1000, // In ms
      minQueue: 1, // Number of addresses in queue to force a transaction
      maxBatch: 50, // Maximum number of transactions to do at the same time
      maxGasPrice: 1000, // In gwei
    },
  },
};
