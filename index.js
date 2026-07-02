const { Client, Intents, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");

// intents
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
  ],
  partials: ["CHANNEL", "MESSAGE", "REACTION"],
});

// collection for commands
client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    console.log(`Loaded command: ${command.data.name}`);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
    );
  }
}

// event handlers
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// cs2 tracker feature
const cs2Tracker = require("./features/cs2tracker/tracker");
cs2Tracker.init(client);

// streaming status
function setStreamingStatus() {
  client.user.setActivity("sleepy", {
    type: "STREAMING",
    url: "https://www.twitch.tv/wayclient",
  });
  console.log("Streaming status refreshed.");
}

// refresh status
client.on("shardReconnecting", () => {
  console.log("Reconnecting to Discord...");
});

client.on("shardResume", () => {
  console.log("Reconnected to Discord, refreshing status...");
  setStreamingStatus();
});

// log in
client.login(process.env.DISCORD_TOKEN);
