const { checkCS2Updates } = require("../features/cs2tracker/tracker");
const { fetchSteamNews } = require("../features/cs2tracker/steamApi");
const { fetchCS2BlogUpdates } = require("../features/cs2tracker/blogFetcher");

module.exports = {
  data: {
    name: "cs2debug",
    description: "Debug command to test CS2 update notifications",
    dm_permission: false,
    options: [
      {
        name: "force",
        description: "Force send the latest update even if already seen",
        type: 5,
        required: false,
      },
    ],
  },
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const guildId = interaction.guildId;

      const result = await checkCS2Updates(
        interaction.client,
        true,
        null,
        guildId,
      );

      if (result && result.success) {
        await interaction.editReply({
          content: "Debug update notification sent successfully",
          ephemeral: true,
        });
      } else {
        await interaction.editReply({
          content: `❌ Failed to send debug notification: ${result?.message || "Unknown error"}`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error("Error in cs2debug command:", error);
      await interaction.editReply({
        content: `❌ Error executing debug command: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
