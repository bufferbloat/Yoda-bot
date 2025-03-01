module.exports = {
  data: {
    name: 'aura',
    description: 'Check your aura or someone else\'s aura',
    options: [
      {
        name: 'user',
        description: 'The user to check the aura of (leave empty for yourself)',
        type: 6, // USER
        required: false
      }
    ]
  },
  async execute(interaction) {
    // Get the target user (mentioned user or the command user)
    const targetUser = interaction.options.getUser('user') || interaction.user;
    
    // Generate a random aura percentage (0-100)
    const auraPercentage = Math.floor(Math.random() * 101);
    
    // Determine aura quality based on percentage
    let auraQuality;
    let auraColor;
    
    if (auraPercentage >= 90) {
      auraQuality = "Goated";
      auraColor = 0xFFD700; // Gold
    } else if (auraPercentage >= 75) {
      auraQuality = "Excellent";
      auraColor = 0x9B30FF; // Purple
    } else if (auraPercentage >= 60) {
      auraQuality = "Great";
      auraColor = 0x1E90FF; // Blue
    } else if (auraPercentage >= 40) {
      auraQuality = "Good";
      auraColor = 0x32CD32; // Green
    } else if (auraPercentage >= 20) {
      auraQuality = "Average";
      auraColor = 0xFFFF00; // Yellow
    } else if (auraPercentage >= 10) {
      auraQuality = "Weak";
      auraColor = 0xFFA500; // Orange
    } else {
      auraQuality = "Nul";
      auraColor = 0xFF0000; // Red
    }
    
    // Create an embed for the response
    const embed = {
      title: `${targetUser.username}'s Aura Reading`,
      description: `Yoda has analyzed ${targetUser.username}'s aura...`,
      color: auraColor,
      fields: [
        {
          name: 'Aura Strength',
          value: `${auraPercentage}%`,
          inline: true
        },
        {
          name: 'Quality',
          value: auraQuality,
          inline: true
        }
      ],
      thumbnail: {
        url: targetUser.displayAvatarURL({ dynamic: true })
      },
      footer: {
        text: 'Aura readings by Yoda'
      },
      timestamp: new Date()
    };
    
    await interaction.reply({ embeds: [embed] });
  }
}; 