const config = require("config");
const { formatDistanceToNow } = require("date-fns");
const { utils } = require("ethers");

// Lib
const { execute, getOption } = require("../lib");
const { getUserId, getPermissions } = require("../../lib/permissions");
const { getDuplicates } = require("../../lib/tools");

// Command
const CONFIG = {
  name: "faucet",
  description: "Interact with the testnet faucet",
  options: [
    {
      name: "sprinkle",
      description: "Funds your test nodes with gSANA",
      type: "SUB_COMMAND",
      options: [
        {
          name: "addresses",
          type: "STRING",
          description: "The space-separated Ethereum addresses of your nodes",
          required: true,
        },
        {
          name: "force",
          type: "BOOLEAN",
          description:
            "Force the transaction without checking for allowance or status",
        },
      ],
    },
    {
      name: "allowance",
      description: "Returns the maximal number of pending sprinkles",
      type: "SUB_COMMAND",
    },
    {
      name: "remaining",
      description: "Returns the number of available sprinkles",
      type: "SUB_COMMAND",
    },
    {
      name: "pending",
      description:
        "Lists nodes that you have sprinkled but have not been deployed yet",
      type: "SUB_COMMAND",
    },
    {
      name: "queue",
      description: "Displays the number of addresses in the sprinkle queue",
      type: "SUB_COMMAND",
    },
  ],
};

// Redis keys
const sprinklesKey = (message) => `user:${getUserId(message)}:sprinkles`;
const deployedKey = (message) => `user:${getUserId(message)}:deployed`;
const addressKey = (address) => `address:${address}:sprinkle`;
const QUEUE_KEY = "spinkles:queue";

// Functions
const getPending = async (interaction, { redis }) => {
  return await redis.sdiff(sprinklesKey(interaction), deployedKey(interaction));
};

const getAllowance = async (interaction) => {
  const permissions = await getPermissions(interaction);
  return Math.max(...permissions.map(({ sprinkles }) => sprinkles));
};

const getRemaining = async (interaction, { redis }) => {
  const allowance = await getAllowance(interaction, { redis });
  const pending = await getPending(interaction, { redis });
  return allowance - pending.length;
};

const decorate = (interaction) => {
  // Get faucet channel
  const channel = interaction.guild.channels.cache.get(
    config.get("faucet.channel")
  );

  // Get current user
  const user = interaction.user.toString();

  // Some state
  const date = new Date();
  let previous;

  // Overwrite the ephemeral function
  interaction._ephemeral = interaction.ephemeral;
  interaction.ephemeral = async (message, { keep = false, timing } = {}) => {
    // Remove the previous message and only keep the last one
    previous && previous.then((message) => message.delete());
    const msg = channel.send(
      [
        user,
        message,
        timing && `(${formatDistanceToNow(date, { includeSeconds: true })})`,
      ]
        .filter(Boolean)
        .join(" ")
    );
    previous = !keep && msg;

    // Forward to the original function
    return interaction._ephemeral(message);
  };
};

const canForce = async (interaction) => {
  const permissions = await getPermissions(interaction);
  return permissions.some(({ forceSprinkle }) => forceSprinkle);
};

// Commands
const pending = async (interaction, _, { redis }) => {
  const pending = await getPending(interaction, { redis });
  interaction.ephemeral(
    pending.length
      ? `The following address${
          pending.length > 1 ? "es are" : " is"
        } still pending: ${pending.join(" ")} :sweat_drops: `
      : "You don't have any pending deploys! :love_you_gesture: "
  );
};

const allowance = async (interaction) => {
  const allowance = await getAllowance(interaction);
  interaction.ephemeral(`You can have ${allowance} pending sprinkles at most :whale:`);
};

const remaining = async (interaction, _, { redis }) => {
  const remaining = await getRemaining(interaction, { redis });
  interaction.ephemeral(
    remaining
      ? `You have ${remaining} sprinkle${remaining === 1 ? "" : "s"} left. :money_mouth::money_mouth_face:`
      : "You do not have any sprinkles left. Deploy sprinkled nodes to get sprinkles back. :sun_with_face:"
  );
};

const sprinkle = async (interaction, options, { redis }) => {
  // Validate addresses
  const addresses = getOption(options, "addresses")
    .value.split(/[ ,;]/)
    .map((address) => {
      try {
        return utils.getAddress(address);
      } catch (err) {
        return address;
      }
    });
  const invalid = addresses.flatMap((address) =>
    !utils.isAddress(address) ? address : []
  );

  if (invalid.length) {
    interaction.ephemeral(
      `The following address${
        invalid.length > 1 ? "es are" : " is"
      } invalid: ${invalid.join(" ")} :u7121:`
    );
    return;
  }

  // Check if there are no duplicates
  const duplicates = getDuplicates(addresses);
  if (duplicates.length) {
    interaction.ephemeral(
      `Duplicated address${
        duplicates.length > 1 ? "es" : ""
      } found: ${duplicates.join(" ")}`
    );
    return;
  }

  // Check if the user has enough sprinkles left
  const remaining = await getRemaining(interaction, { redis });
  if (addresses.length > remaining) {
    interaction.ephemeral(
      remaining
        ? `You can only sprinkle ${remaining} more addresses. :u6709:`
        : "You don't have any sprinkles left, please deploy your sprinkled nodes to be gifted more! :u7121:"
    );
    return;
  }

  // Check if the user is allowed to force a sprinkle
  const force = getOption(options, "force");
  if (force && !(await canForce(interaction))) {
    interaction.ephemeral("We know what you're up to... :detective:");
    return;
  }

  const multi = await redis.multi();
  for (const address of addresses) {
    multi.rpush(QUEUE_KEY, address);
    multi.hset(
      addressKey(address),
      "interaction",
      interaction.id,
      "user",
      getUserId(interaction),
      "guild",
      interaction.guildID,
      "date",
      Date.now()
    );
  }
  await multi.exec();

  console.log(`Funding ${addresses.join(" ")}`);
  interaction.ephemeral(
    `${
      addresses.length > 1
        ? `${addresses.length} addresses were`
        : `${addresses[0]} was`
    } queued... :hourglass_flowing_sand:`
  );
};

const queue = async (interaction, _, { redis }) => {
  const count = await redis.llen(QUEUE_KEY);
  interaction.ephemeral(
    `There are currently ${count} addresses waiting to be sprinkled :watch:`
  );
};

const commands = { sprinkle, remaining, allowance, pending, queue };
module.exports = {
  CONFIG,
  execute: execute.bind(null, commands, { decorate }),
};
