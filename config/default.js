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
      gsana: 10000000000000000n,
      eth: 50000000000000000n,
    },
    launchBlockHeight: 4461700,
    channel: "867708173355188224",
  },

  contracts: {
    gsana: "0x4c6dc9393ff65b09035dd108f2d8c4155a77786e",
    sw3: "0xf0277caffea72734853b834afc9892461ea18474",
    faucet: "0xf16Ef286ff34008cf643C016851f4c242f49e2C5",
  },

  // Can be filtered by names or ids
  // Matches any of the ids or names
  permissions: [
    {
      names: ["@everyone"],
      sprinkles: 3,
    },
    {
      // ids: ["840931347370737695", "840931856467492885"],
      ids: ["849091312798924870"],
      // names: ["swarm-team", "support-team"],
      names:["sana-team"],
      sprinkles: Infinity,
      forceSprinkle: true,
    },
    {
      ids: ["849091312798924870"],
      names: ["sana-team"],
      cleaner: true,
    },
  ],

  redis: {
    // host: "redis",
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
