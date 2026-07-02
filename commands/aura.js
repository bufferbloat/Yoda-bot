module.exports = {
  data: {
    name: "aura",
    description: "Check your aura or someone else's aura",
    dm_permission: true,
    options: [
      {
        name: "user",
        description: "The user to check the aura of (leave empty for yourself)",
        type: 6,
        required: false,
      },
    ],
  },
  async execute(interaction) {
    // target user
    const targetUser = interaction.options.getUser("user") || interaction.user;

    // random aura
    const auraPercentage = Math.floor(Math.random() * 11) * 10;

    // aura quality
    let auraQuality;
    let auraColor;

    if (auraPercentage >= 90) {
      auraQuality = "Goated";
      auraColor = 0xffd700; // Gold
    } else if (auraPercentage >= 70) {
      auraQuality = "Excellent";
      auraColor = 0x9b30ff; // Purple
    } else if (auraPercentage >= 50) {
      auraQuality = "Great";
      auraColor = 0x1e90ff; // Blue
    } else if (auraPercentage >= 30) {
      auraQuality = "Good";
      auraColor = 0x32cd32; // Green
    } else if (auraPercentage >= 20) {
      auraQuality = "Average";
      auraColor = 0xffff00; // Yellow
    } else if (auraPercentage >= 10) {
      auraQuality = "Poop";
      auraColor = 0xffa500; // Orange
    } else {
      auraQuality = "Super Poop";
      auraColor = 0xff0000; // Red
    }

    // embed
    const embed = {
      title: `${targetUser.username}'s Aura Reading`,
      description: `Yoda has analyzed ${targetUser.username}'s aura...`,
      color: auraColor,
      fields: [
        {
          name: "Aura Strength",
          value: `${auraPercentage}%`,
          inline: true,
        },
        {
          name: "Quality",
          value: auraQuality,
          inline: true,
        },
      ],
      thumbnail: {
        url: targetUser.displayAvatarURL({ dynamic: true }),
      },
      footer: {
        text: "Aura readings by Yoda",
      },
      timestamp: new Date(),
    };

    await interaction.reply({ embeds: [embed] });
  },
};
