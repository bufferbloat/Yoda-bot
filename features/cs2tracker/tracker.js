const fs = require('fs');
const path = require('path');
const { fetchSteamNews } = require('./steamApi');
const { fetchCS2BlogUpdates } = require('./blogFetcher');

const dataFilePath = path.join(__dirname, '../../data/cs2_last_update.json');

let cs2UpdateConfig = {
  servers: {},
  checkInterval: 5 * 60 * 1000
};

try {
  if (fs.existsSync(dataFilePath)) {
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    cs2UpdateConfig = { 
      ...cs2UpdateConfig, 
      ...data,
      enabled: data.channelId ? true : false
    };
    console.log('Loaded CS2 update configuration:', cs2UpdateConfig);
  } else {
    saveCS2Config();
    console.log('Created new CS2 update configuration file');
  }
} catch (error) {
  console.error('Error loading CS2 update configuration:', error);
}

function saveCS2Config() {
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (cs2UpdateConfig.channelId) {
      cs2UpdateConfig.enabled = true;
    }
    
    fs.writeFileSync(dataFilePath, JSON.stringify(cs2UpdateConfig, null, 2));
    console.log('Saved CS2 update configuration:', cs2UpdateConfig);
  } catch (error) {
    console.error('Error saving CS2 update configuration:', error);
  }
}

function getServerConfig(guildId) {
  if (!cs2UpdateConfig.servers[guildId]) {
    cs2UpdateConfig.servers[guildId] = {
      enabled: false,
      channelId: null,
      lastUpdateTitle: null,
      lastUpdateDate: null
    };
  }
  return cs2UpdateConfig.servers[guildId];
}

async function checkCS2Updates(client, forceUpdate = false, channelOverride = null, guildId = null) {
  if (!guildId) {
    const results = [];
    for (const [serverId, config] of Object.entries(cs2UpdateConfig.servers)) {
      if (config.enabled) {
        const result = await checkCS2Updates(client, forceUpdate, config.channelId, serverId);
        results.push(result);
      }
    }
    return results;
  }

  const serverConfig = getServerConfig(guildId);
  const channelId = channelOverride || serverConfig.channelId;
  
  if (channelId && !serverConfig.enabled) {
    serverConfig.enabled = true;
    serverConfig.channelId = channelId;
    saveCS2Config();
    console.log('CS2 update tracking automatically enabled for channel:', channelId);
  }

  if (!channelId) {
    console.log('No channel configured for CS2 updates');
    return { success: false, message: 'No channel configured for CS2 updates' };
  }
  
  try {
    console.log('Checking for CS2 updates...', {
      enabled: serverConfig.enabled,
      channelId: channelId,
      lastUpdateTitle: serverConfig.lastUpdateTitle
    });
    
    const steamNews = await fetchSteamNews(10, 2000);
    
    console.log(`Steam API returned ${steamNews.length} news items`);
    
    if (steamNews.length > 0) {
      const updateKeywords = ['update', 'patch', 'release notes', 'changelog', 'counter-strike 2 update'];
      let updateNews = steamNews.filter(item => {
        const title = item.title.toLowerCase();
        return updateKeywords.some(keyword => title.toLowerCase().includes(keyword));
      });
      
      console.log('Filtered update news:', {
        total: steamNews.length,
        filtered: updateNews.length,
        titles: updateNews.map(n => n.title)
      });
      
      if (updateNews.length === 0) {
        console.log('No update-specific news found, using latest news item');
        updateNews = [steamNews[0]];
      } else {
        console.log(`Found ${updateNews.length} update-related news items`);
      }
      
      const latestNews = updateNews[0];
      const updateTitle = latestNews.title;
      let updateContent = latestNews.contents;
      
      updateContent = updateContent.replace(/<\/?[^>]+(>|$)/g, '');
      
      console.log('Parsed update title:', updateTitle);
      console.log('Content sample:', updateContent.substring(0, 100) + '...');
      
      if (forceUpdate || updateTitle !== serverConfig.lastUpdateTitle || latestNews.date !== serverConfig.lastUpdateDate) {
        console.log('New CS2 update found or force enabled:', {
          updateTitle,
          lastUpdateTitle: serverConfig.lastUpdateTitle,
          updateDate: new Date(latestNews.date * 1000),
          lastUpdateDate: serverConfig.lastUpdateDate ? new Date(serverConfig.lastUpdateDate * 1000) : null,
          forceUpdate,
          channelId
        });
        
        let summary = '';
        
        const bulletPoints = updateContent.split(/[\n\r]+/).filter(line => {
          const trimmed = line.trim();
          return trimmed.startsWith('•') || 
                 trimmed.startsWith('-') || 
                 trimmed.startsWith('*') ||
                 /^\[\*\]/.test(trimmed) ||
                 /^\d+\./.test(trimmed);
        });
        
        if (bulletPoints.length > 0) {
          summary = bulletPoints.slice(0, 5).join('\n');
        } else {
          const paragraphs = updateContent.split(/[\n\r]+/).filter(p => p.trim().length > 0);
          if (paragraphs.length > 0) {
            summary = paragraphs.slice(0, 2).join('\n\n');
            if (summary.length > 500) {
              summary = summary.substring(0, 500) + '...';
            }
          } else {
            summary = updateContent.substring(0, 500) + '...';
          }
        }
        
        const channel = await client.channels.fetch(channelId);
        if (channel) {
          const embed = {
            title: `Counter-Strike 2 Update: ${updateTitle}`,
            description: summary || 'New update available!',
            color: 0xF56C2D,
            url: latestNews.url || 'https://www.counter-strike.net/news/updates',
            thumbnail: {
              url: 'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/730/69f7ebe2735c366c65c0b33dae00e12dc40edbe4.jpg'
            },
            footer: {
              text: forceUpdate ? 'Debug mode - View the full update notes on Steam' : 'View the full update notes on Steam'
            },
            timestamp: new Date(latestNews.date * 1000)
          };
          
          await channel.send({ embeds: [embed] });
          
          if (!forceUpdate) {
            serverConfig.lastUpdateTitle = updateTitle;
            serverConfig.lastUpdateDate = latestNews.date;
            saveCS2Config();
          }
          
          return { 
            success: true, 
            message: 'Update notification sent successfully',
            title: updateTitle,
            summary: summary
          };
        }
      } else {
        console.log('No new CS2 updates found:', {
          updateTitle,
          lastUpdateTitle: serverConfig.lastUpdateTitle,
          updateDate: new Date(latestNews.date * 1000),
          lastUpdateDate: serverConfig.lastUpdateDate ? new Date(serverConfig.lastUpdateDate * 1000) : null,
          forceUpdate
        });
        return { 
          success: false, 
          message: 'No new updates found',
          title: updateTitle,
          lastSeen: serverConfig.lastUpdateTitle
        };
      }
    } else {
      console.log('No news items found in Steam API response');
      
      if (forceUpdate) {
        const channel = await client.channels.fetch(channelId);
        if (channel) {
          const embed = {
            title: 'Counter-Strike 2 Update',
            description: 'A new update might be available. Check the official CS2 website for details.',
            color: 0xF56C2D,
            url: 'https://www.counter-strike.net/news/updates',
            thumbnail: {
              url: 'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/730/69f7ebe2735c366c65c0b33dae00e12dc40edbe4.jpg'
            },
            footer: {
              text: 'Debug mode - Unable to fetch detailed update information'
            },
            timestamp: new Date()
          };
          
          await channel.send({ embeds: [embed] });
          
          return { 
            success: true, 
            message: 'Generic update notification sent (debug mode)',
            title: 'CS2 Update'
          };
        }
      }
      
      return { success: false, message: 'No news items found in Steam API response' };
    }
  } catch (error) {
    console.error('Error checking for CS2 updates:', error);
    

    if (forceUpdate) {
      try {
        const channel = await client.channels.fetch(channelId);
        if (channel) {
          const embed = {
            title: 'Counter-Strike 2 Update',
            description: 'A new update might be available. Check the official CS2 website for details.\n\n*Error occurred while fetching update details.*',
            color: 0xF56C2D,
            url: 'https://www.counter-strike.net/news/updates',
            thumbnail: {
              url: 'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/730/69f7ebe2735c366c65c0b33dae00e12dc40edbe4.jpg'
            },
            footer: {
              text: 'Debug mode - Error occurred while fetching update details'
            },
            timestamp: new Date()
          };
          
          await channel.send({ embeds: [embed] });
          
          return { 
            success: true, 
            message: 'Error fallback notification sent (debug mode)',
            error: error.message
          };
        }
      } catch (fallbackError) {
        console.error('Error in fallback notification:', fallbackError);
      }
    }
    
    return { success: false, message: `Error: ${error.message}` };
  }
}

function init(client) {
  console.log('CS2 tracker init called with config:', cs2UpdateConfig);

  for (const [guildId, serverConfig] of Object.entries(cs2UpdateConfig.servers)) {
    if (serverConfig.enabled && serverConfig.channelId) {
      console.log(`Initializing tracker for server ${guildId}`);
      
      checkCS2Updates(client, false, null, guildId);
    }
  }
  
  if (global.cs2UpdateInterval) {
    clearInterval(global.cs2UpdateInterval);
  }
  
  global.cs2UpdateInterval = setInterval(() => {
    checkCS2Updates(client);
  }, cs2UpdateConfig.checkInterval);
  
  console.log('CS2 update tracker initialized');
}

module.exports = {
  init,
  checkCS2Updates,
  cs2UpdateConfig,
  saveCS2Config,
  getServerConfig
}; 