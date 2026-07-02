const { updateUserStats } = require("../features/userStats/userStats");

module.exports = {
  data: {
    name: "lockin",
    description: "Lock the fuck in",
    dm_permission: true,
  },
  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const username = interaction.user.username;

      const stats = updateUserStats(userId, username);

      if (stats.alreadyLockedIn) {
        return await interaction.reply({
          content:
            "You've already locked in today! Come back tomorrow to continue your streak!",
          ephemeral: true,
        });
      }

      const now = new Date();
      const dateString = now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Europe/Paris",
      });
      const timeString = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Europe/Paris",
      });

      const embed = {
        title: "৻(  •̀ ᗜ •́  ৻) Daily Lock-in",
        description: `<@${userId}> has locked in for today!`,
        fields: [
          {
            name: "Total Lock-ins",
            value: `${stats.lockins}`,
            inline: true,
          },
          {
            name: "Current Streak",
            value: `${stats.currentStreak} day`,
            inline: true,
          },
          {
            name: "Highest Streak",
            value: `${stats.highestStreak} day`,
            inline: true,
          },
        ],
        color: 0x00ff00,
        footer: {
          text: `Come back tomorrow to continue your streak! • ${dateString} ${timeString}`,
        },
      };

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in lockin command:", error);
      await interaction.reply({
        content:
          "There was an error processing your lock-in. Please try again later.",
        ephemeral: true,
      });
    }
  },
};
