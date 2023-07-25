require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const env = require("./config/env");
const express = require("express");
const cors = require("cors");
const { verifyKeyMiddleware, verifyKey } = require("discord-interactions");
const app = express();

app.use(cors());

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

app.post(
  "/interactions",
  verifyKeyMiddleware(env.bot.publicKey),
  (req, res) => {
    const message = req.body;

    const signature = req.get("X-Signature-Ed25519");
    const timestamp = req.get("X-Signature-Timestamp");
    const isValidRequest = verifyKey(
      req.rawBody,
      signature,
      timestamp,
      env.bot.publicKey
    );
    if (!isValidRequest) {
      return res.status(401).end("Bad request signature");
    }
    if (message.type === InteractionType.APPLICATION_COMMAND) {
      res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "Hello world",
        },
      });
    }
  }
);

app.get("/", async (req, res) => {
  res.send("ok");
});

app.listen(env.port, async () => {
  await client.login(env.bot.token);
  console.log(`Server is listening on port ${env.port}`);
});
