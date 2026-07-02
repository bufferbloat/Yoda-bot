const {
  cs2UpdateConfig,
  saveCS2Config,
  getServerConfig,
  init,
} = require("../features/cs2tracker/tracker");

module.exports = {
  data: {
    name: "cs2updates",
    description: "Configure CS2 update notifications for this server",
    dm_permission: false,
    options: [
      {
        name: "action",
        description: "Enable or disable CS2 update notifications",
        type: 3,
        required: true,
        choices: [
          {
            name: "Enable",
            value: "enable",
          },
          {
            name: "Disable",
            value: "disable",
          },
          {
            name: "Status",
            value: "status",
          },
        ],
      },
      {
        name: "channel",
        description: "Channel to send CS2 update notifications to",
        type: 7,
        required: false,
      },
    ],
  },
  async execute(interaction) {
    if (!interaction.member.permissions.has("ADMINISTRATOR")) {
      return interaction.reply({
        content: "You need administrator permissions to use this command.",
        ephemeral: true,
      });
    }

    const guildId = interaction.guildId;
    const serverConfig = getServerConfig(guildId);

    const action = interaction.options.getString("action");

    if (action === "status") {
      const statusMessage = serverConfig.enabled
        ? `CS2 update notifications are currently **enabled** and will be sent to <#${serverConfig.channelId}>.`
        : "CS2 update notifications are currently **disabled** for this server.";

      return interaction.reply({
        content: statusMessage,
        ephemeral: true,
      });
    }

    if (action === "enable") {
      const channel = interaction.options.getChannel("channel");

      if (!channel) {
        return interaction.reply({
          content:
            "You need to specify a channel when enabling CS2 update notifications.",
          ephemeral: true,
        });
      }

      if (!channel.permissionsFor(interaction.guild.me).has("SEND_MESSAGES")) {
        return interaction.reply({
          content: `I don't have permission to send messages in ${channel}.`,
          ephemeral: true,
        });
      }

      serverConfig.enabled = true;
      serverConfig.channelId = channel.id;
      saveCS2Config();

      init(interaction.client);

      return interaction.reply({
        content: `CS2 update notifications have been enabled and will be sent to ${channel}.`,
        ephemeral: true,
      });
    }

    if (action === "disable") {
      serverConfig.enabled = false;
      saveCS2Config();

      if (global.cs2UpdateInterval) {
        clearInterval(global.cs2UpdateInterval);
        global.cs2UpdateInterval = null;
      }

      return interaction.reply({
        content: "CS2 update notifications have been disabled for this server.",
        ephemeral: true,
      });
    }
  },
};
