const { cs2UpdateConfig, saveCS2Config } = require('../features/cs2tracker/tracker');

module.exports = {
  data: {
    name: 'cs2updates',
    description: 'Configure CS2 update notifications',
    options: [
      {
        name: 'action',
        description: 'Enable or disable CS2 update notifications',
        type: 3, // STRING
        required: true,
        choices: [
          {
            name: 'Enable',
            value: 'enable'
          },
          {
            name: 'Disable',
            value: 'disable'
          },
          {
            name: 'Status',
            value: 'status'
          }
        ]
      },
      {
        name: 'channel',
        description: 'Channel to send CS2 update notifications to',
        type: 7, // CHANNEL
        required: false
      }
    ]
  },
  async execute(interaction) {
    // Check if user has admin permissions
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        content: 'You need administrator permissions to use this command.',
        ephemeral: true
      });
    }

    const action = interaction.options.getString('action');
    
    if (action === 'status') {
      const statusMessage = cs2UpdateConfig.enabled
        ? `CS2 update notifications are currently **enabled** and will be sent to <#${cs2UpdateConfig.channelId}>.`
        : 'CS2 update notifications are currently **disabled**.';
      
      return interaction.reply({
        content: statusMessage,
        ephemeral: true
      });
    }
    
    if (action === 'enable') {
      const channel = interaction.options.getChannel('channel');
      
      if (!channel) {
        return interaction.reply({
          content: 'You need to specify a channel when enabling CS2 update notifications.',
          ephemeral: true
        });
      }
      
      // Check if the bot has permission to send messages in the channel
      if (!channel.permissionsFor(interaction.guild.me).has('SEND_MESSAGES')) {
        return interaction.reply({
          content: `I don't have permission to send messages in ${channel}.`,
          ephemeral: true
        });
      }
      
      cs2UpdateConfig.enabled = true;
      cs2UpdateConfig.channelId = channel.id;
      saveCS2Config();
      
      // Start checking for CS2 updates if not already running
      if (!global.cs2UpdateInterval) {
        const { checkCS2Updates } = require('../features/cs2tracker/tracker');
        checkCS2Updates(interaction.client);
        global.cs2UpdateInterval = setInterval(() => checkCS2Updates(interaction.client), cs2UpdateConfig.checkInterval);
      }
      
      return interaction.reply({
        content: `CS2 update notifications have been enabled and will be sent to ${channel}.`,
        ephemeral: true
      });
    }
    
    if (action === 'disable') {
      cs2UpdateConfig.enabled = false;
      saveCS2Config();
      
      // Clear the interval if it exists
      if (global.cs2UpdateInterval) {
        clearInterval(global.cs2UpdateInterval);
        global.cs2UpdateInterval = null;
      }
      
      return interaction.reply({
        content: 'CS2 update notifications have been disabled.',
        ephemeral: true
      });
    }
  }
}; 