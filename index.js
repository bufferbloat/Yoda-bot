// Import the necessary classes from discord.js
const { Client, Intents, Collection } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const path = require('path');

// Create a new client instance with v13 intents
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES
  ]
});

// Create a collection for commands
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Load event handlers
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// Load the CS2 tracker feature
const cs2Tracker = require('./features/cs2tracker/tracker');
cs2Tracker.init(client);

// Path to store the last update data
const dataFilePath = path.join(__dirname, 'cs2_last_update.json');

// CS2 update tracking data
let cs2UpdateConfig = {
  enabled: false,
  channelId: null,
  lastUpdateTitle: null,
  checkInterval: 30 * 60 * 1000 // 30 minutes
};

// Load existing configuration if available
try {
  if (fs.existsSync(dataFilePath)) {
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    cs2UpdateConfig = { ...cs2UpdateConfig, ...data };
    console.log('Loaded CS2 update configuration:', cs2UpdateConfig);
  }
} catch (error) {
  console.error('Error loading CS2 update configuration:', error);
}

// Save configuration to file
function saveCS2Config() {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(cs2UpdateConfig, null, 2));
    console.log('Saved CS2 update configuration');
  } catch (error) {
    console.error('Error saving CS2 update configuration:', error);
  }
}

// Function to set streaming status
function setStreamingStatus() {
  client.user.setActivity('sleepy', { type: 'STREAMING', url: 'https://www.twitch.tv/wayclient' });
  console.log('Streaming status refreshed.');
}

// Function to check for CS2 updates with optional force parameter and channel override
async function checkCS2Updates(forceUpdate = false, channelOverride = null) {
  // Use override channel or configured channel
  const channelId = channelOverride || cs2UpdateConfig.channelId;
  
  if (!channelId) {
    console.log('No channel configured for CS2 updates');
    return { success: false, message: 'No channel configured for CS2 updates' };
  }
  
  try {
    console.log('Checking for CS2 updates...');
    
    // Get more news items to filter for actual updates
    const response = await fetch('https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=730&count=10&maxlength=2000&format=json');
    const data = await response.json();
    
    console.log(`Steam API returned ${data?.appnews?.newsitems?.length || 0} news items`);
    
    if (data && data.appnews && data.appnews.newsitems && data.appnews.newsitems.length > 0) {
      // Filter for items that are likely to be updates (contain keywords in title)
      const updateKeywords = ['update', 'patch', 'release notes', 'changelog'];
      let updateNews = data.appnews.newsitems.filter(item => {
        const title = item.title.toLowerCase();
        return updateKeywords.some(keyword => title.includes(keyword));
      });
      
      // If no update-specific news found, just use the latest news
      if (updateNews.length === 0) {
        console.log('No update-specific news found, using latest news item');
        updateNews = [data.appnews.newsitems[0]];
      } else {
        console.log(`Found ${updateNews.length} update-related news items`);
      }
      
      const latestNews = updateNews[0];
      const updateTitle = latestNews.title;
      let updateContent = latestNews.contents;
      
      // Remove HTML tags from content
      updateContent = updateContent.replace(/<\/?[^>]+(>|$)/g, '');
      
      console.log('Parsed update title:', updateTitle);
      console.log('Content sample:', updateContent.substring(0, 100) + '...');
      
      // If this is a new update we haven't seen before or force is true
      if (forceUpdate || updateTitle !== cs2UpdateConfig.lastUpdateTitle) {
        console.log('New CS2 update found or force enabled:', updateTitle);
        
        // Create a summary from the content
        let summary = '';
        
        // Try to extract bullet points if they exist
        const bulletPoints = updateContent.split(/[\n\r]+/).filter(line => {
          const trimmed = line.trim();
          return trimmed.startsWith('•') || 
                 trimmed.startsWith('-') || 
                 trimmed.startsWith('*') ||
                 /^\[\*\]/.test(trimmed) ||  // [*] format
                 /^\d+\./.test(trimmed);     // Numbered lists
        });
        
        if (bulletPoints.length > 0) {
          summary = bulletPoints.slice(0, 5).join('\n');
        } else {
          // If no bullet points, create a summary from paragraphs
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
        
        // Get the channel and send the update
        const channel = await client.channels.fetch(channelId);
        if (channel) {
          const embed = {
            title: `Counter-Strike 2 Update: ${updateTitle}`,
            description: summary || 'New update available!',
            color: 0xF56C2D, // Orange color
            url: latestNews.url || 'https://www.counter-strike.net/news/updates',
            thumbnail: {
              url: 'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/730/69f7ebe2735c366c65c0b33dae00e12dc40edbe4.jpg'
            },
            footer: {
              text: forceUpdate ? 'Debug mode - View the full update notes on Steam' : 'View the full update notes on Steam'
            },
            timestamp: new Date(latestNews.date * 1000) // Convert Unix timestamp to Date
          };
          
          await channel.send({ embeds: [embed] });
          
          // Update the last seen update if not in debug mode
          if (!forceUpdate) {
            cs2UpdateConfig.lastUpdateTitle = updateTitle;
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
        console.log('No new CS2 updates found');
        return { 
          success: false, 
          message: 'No new updates found',
          title: updateTitle,
          lastSeen: cs2UpdateConfig.lastUpdateTitle
        };
      }
    } else {
      console.log('No news items found in Steam API response');
      
      // Fallback to a simpler approach - just create a generic update notification
      if (forceUpdate) {
        const channel = await client.channels.fetch(channelId);
        if (channel) {
          const embed = {
            title: 'Counter-Strike 2 Update',
            description: 'A new update might be available. Check the official CS2 website for details.',
            color: 0xF56C2D, // Orange color
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
    
    // Fallback for debug mode
    if (forceUpdate) {
      try {
        const channel = await client.channels.fetch(channelId);
        if (channel) {
          const embed = {
            title: 'Counter-Strike 2 Update',
            description: 'A new update might be available. Check the official CS2 website for details.\n\n*Error occurred while fetching update details.*',
            color: 0xF56C2D, // Orange color
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

// Add this function to fetch from the CS2 blog
async function fetchCS2BlogUpdates() {
  try {
    // Fetch the CS2 blog RSS feed
    const response = await fetch('https://blog.counter-strike.net/index.php/feed/');
    const text = await response.text();
    
    // Simple parsing of the RSS feed
    const items = [];
    const itemMatches = text.match(/<item>([\s\S]*?)<\/item>/g);
    
    if (itemMatches) {
      for (const itemXml of itemMatches) {
        const titleMatch = itemXml.match(/<title>(.*?)<\/title>/);
        const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
        const dateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
        const contentMatch = itemXml.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/);
        
        if (titleMatch && linkMatch) {
          items.push({
            title: titleMatch[1],
            link: linkMatch[1],
            date: dateMatch ? new Date(dateMatch[1]) : new Date(),
            content: contentMatch ? contentMatch[1] : ''
          });
        }
      }
    }
    
    return items;
  } catch (error) {
    console.error('Error fetching CS2 blog updates:', error);
    return [];
  }
}

// Also refresh status on reconnection
client.on('shardReconnecting', () => {
  console.log('Reconnecting to Discord...');
});

client.on('shardResume', () => {
  console.log('Reconnected to Discord, refreshing status...');
  setStreamingStatus();
});

// Log in to Discord with your bot token
client.login(process.env.DISCORD_TOKEN);