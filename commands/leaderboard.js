const { getLeaderboard } = require("../features/userStats/userStats");

module.exports = {
  data: {
    name: "leaderboard",
    description: "Show the lock-in leaderboard",
    dm_permission: true,
    options: [
      {
        name: "limit",
        description: "Number of users to show (default: 10)",
        type: 4,
        required: false,
        min_value: 1,
        max_value: 25,
      },
    ],
  },
  async execute(interaction) {
    const limit = interaction.options.getInteger("limit") || 10;
    const leaderboard = getLeaderboard(limit);

    if (leaderboard.length === 0) {
      return interaction.reply({
        content: "No lock-ins recorded yet! Be the first to `/lockin`",
        ephemeral: true,
      });
    }

    // medals
    function getMedal(rank) {
      switch (rank) {
        case 1:
          return "🥇";
        case 2:
          return "🥈";
        case 3:
          return "🥉";
        default:
          return "▫️";
      }
    }

    const embed = {
      title: "Lock-in Leaderboard",
      description: leaderboard
        .map((entry, index) => {
          const rank = index + 1;
          const medal = getMedal(rank);
          return `${medal} #${rank} ${entry.name}\n└ ${entry.lockins} lock-ins • Streak: ${entry.currentStreak} • Best: ${entry.highestStreak}`;
        })
        .join("\n\n"),
      color: 0xffd700,
      footer: {
        text: "Lock-in daily to climb the ranks ( ͡° ͜ʖ ͡°)",
      },
    };

    await interaction.reply({ embeds: [embed] });
  },
};
