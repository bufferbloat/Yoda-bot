const { streamingStatus } = require('../utils/streamingStatus');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag}!`);

    try {
      console.log('Started refreshing application (/) commands.');
      
      // Get all command data
      const commands = [];
      client.commands.forEach(command => {
        commands.push(command.data);
      });

      // Register slash commands for all guilds the bot is in
      await client.application?.commands.set(commands);

      console.log('Successfully registered application commands.');
    } catch (error) {
      console.error('Error registering slash commands:', error);
    }

    // Set the bot's activity to Streaming
    streamingStatus.set(client);
    
    // Refresh the streaming status every 30 minutes
    setInterval(() => streamingStatus.set(client), 30 * 60 * 1000);
  }
}; 