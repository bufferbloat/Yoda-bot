const { streamingStatus } = require("../utils/streamingStatus");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag}!`);

    try {
      console.log("Started refreshing application (/) commands.");

      // get command
      const commands = [];
      client.commands.forEach((command) => {
        commands.push(command.data);
      });

      // slash commands
      await client.application.commands.set(commands);

      console.log(
        "Successfully registered application commands:",
        commands.map((cmd) => cmd.name).join(", "),
      );
    } catch (error) {
      console.error("Error registering slash commands:", error);
    }

    // streaming
    streamingStatus.set(client);

    // refresh the streaming status
    setInterval(() => streamingStatus.set(client), 30 * 60 * 1000);
  },
};
