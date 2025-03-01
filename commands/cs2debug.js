const { checkCS2Updates } = require('../features/cs2tracker/tracker');
const { fetchSteamNews } = require('../features/cs2tracker/steamApi');
const { fetchCS2BlogUpdates } = require('../features/cs2tracker/blogFetcher');

module.exports = {
  data: {
    name: 'cs2debug',
    description: 'Debug command to test CS2 update notifications',
    options: [
      {
        name: 'force',
        description: 'Force send the latest update even if already seen',
        type: 5, // BOOLEAN
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
    
    await interaction.deferReply({ ephemeral: false }); // Make visible to everyone
    
    const force = interaction.options.getBoolean('force') || false;
    
    try {
      // Fetch from both sources
      const steamNews = await fetchSteamNews();
      const blogUpdates = await fetchCS2BlogUpdates();
      
      // Filter Steam news for update-related items
      const updateKeywords = ['update', 'patch', 'release notes', 'changelog'];
      const updateNews = steamNews.filter(item => {
        const title = item.title.toLowerCase();
        return updateKeywords.some(keyword => title.includes(keyword));
      });
      
      // Use the first update news or the latest news if no updates found
      const latestSteamNews = updateNews.length > 0 ? updateNews[0] : (steamNews.length > 0 ? steamNews[0] : null);
      const latestBlogUpdate = blogUpdates.length > 0 ? blogUpdates[0] : null;
      
      // Create an embed for the response
      const embed = {
        title: 'Latest Counter-Strike 2 Update',
        color: 0xF56C2D, // Orange color
        thumbnail: {
          url: 'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/730/69f7ebe2735c366c65c0b33dae00e12dc40edbe4.jpg'
        },
        fields: [],
        footer: {
          text: 'CS2 Update Tracker • Today at ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        },
        timestamp: new Date()
      };
      
      // Add Steam news to the embed if available
      if (latestSteamNews) {
        const date = new Date(latestSteamNews.date * 1000).toLocaleString();
        embed.fields.push({
          name: '🎮 Steam Update',
          value: `**${latestSteamNews.title}**\n${date}\n[View on Steam](${latestSteamNews.url})`
        });
      }
      
      // Add blog update to the embed if available
      if (latestBlogUpdate) {
        embed.fields.push({
          name: '📰 Official Blog',
          value: `**${latestBlogUpdate.title}**\n${latestBlogUpdate.date.toLocaleString()}\n[Read More](${latestBlogUpdate.link})`
        });
      }
      
      // If no updates found
      if (embed.fields.length === 0) {
        embed.description = 'No recent updates found for Counter-Strike 2.';
      }
      
      await interaction.editReply({
        embeds: [embed]
      });
      
      // If force is true, also send the update notification
      if (force) {
        const { cs2UpdateConfig } = require('../features/cs2tracker/tracker');
        const channelToUse = cs2UpdateConfig.channelId || interaction.channelId;
        const result = await checkCS2Updates(interaction.client, true, channelToUse);
        
        if (result.success) {
          await interaction.followUp({
            content: `✅ Update notification sent to <#${channelToUse}>`,
            ephemeral: true // Keep this as ephemeral
          });
        } else {
          await interaction.followUp({
            content: `❌ Failed to send update notification: ${result.message}`,
            ephemeral: true // Keep this as ephemeral
          });
        }
      }
    } catch (error) {
      console.error('Error in cs2debug command:', error);
      await interaction.editReply({
        content: `❌ Error fetching CS2 updates: ${error.message}`
      });
    }
  }
}; 