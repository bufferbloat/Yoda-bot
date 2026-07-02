const { Rcon } = require('rcon-client');
const { getConfig, getRconInfo } = require('./config');

// RCON configuration - loaded from config module
let rconConfig = {
  host: process.env.MINECRAFT_HOST || 'localhost',
  port: parseInt(process.env.MINECRAFT_RCON_PORT) || 25575,
  password: process.env.MINECRAFT_RCON_PASSWORD || '',
  timeout: 5000
};

// Connected RCON instance
let rcon = null;
let isConnected = false;

/**
 * Connect to the Minecraft RCON server
 * @returns {Promise<boolean>} - true if connection successful
 */
async function connectRcon() {
  try {
    if (isConnected && rcon) {
      return true;
    }

    console.log('Connecting to Minecraft RCON:', {
      host: rconConfig.host,
      port: rconConfig.port,
      timeout: rconConfig.timeout
    });

    rcon = new Rcon(rconConfig);

    rcon.on('connect', () => {
      console.log('Connected to Minecraft RCON server');
      isConnected = true;
    });

    rcon.on('error', (error) => {
      console.error('RCON connection error:', error);
      isConnected = false;
    });

    rcon.on('end', () => {
      console.log('RCON connection ended');
      isConnected = false;
    });

    await rcon.connect();

    // Test the connection with a simple command
    const testResponse = await rcon.send('list');
    console.log('RCON connection test successful:', testResponse.trim());

    return true;
  } catch (error) {
    console.error('Failed to connect to Minecraft RCON:', error);
    isConnected = false;
    rcon = null;
    return false;
  }
}

/**
 * Disconnect from the Minecraft RCON server
 */
async function disconnectRcon() {
  if (rcon) {
    try {
      await rcon.end();
      console.log('Disconnected from Minecraft RCON');
    } catch (error) {
      console.error('Error disconnecting from RCON:', error);
    }
    rcon = null;
    isConnected = false;
  }
}

/**
 * Send a command to the Minecraft server via RCON
 * @param {string} command - The command to send
 * @returns {Promise<{success: boolean, response: string, error?: string}>}
 */
async function sendCommand(command) {
  try {
    if (!isConnected || !rcon) {
      const connected = await connectRcon();
      if (!connected) {
        return {
          success: false,
          error: 'Failed to connect to Minecraft server'
        };
      }
    }

    console.log('Sending command to Minecraft:', command);
    const response = await rcon.send(command);

    return {
      success: true,
      response: response.trim()
    };
  } catch (error) {
    console.error('Error sending command to Minecraft:', error);

    // Try to reconnect if connection was lost
    if (error.message.includes('Not connected') || error.message.includes('ECONNRESET')) {
      isConnected = false;
      const reconnected = await connectRcon();
      if (reconnected) {
        return sendCommand(command); // Retry once after reconnection
      }
    }

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Whitelist a player on the Minecraft server
 * @param {string} username - The player's username to whitelist
 * @returns {Promise<{success: boolean, response: string, error?: string}>}
 */
async function whitelistAdd(username) {
  // Validate username (Minecraft usernames are 3-16 characters, alphanumeric + underscore)
  if (!username || !/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
    return {
      success: false,
      error: 'Invalid username. Must be 3-16 characters, letters, numbers, and underscores only.'
    };
  }

  const command = `whitelist add ${username}`;
  const result = await sendCommand(command);

  if (result.success) {
    // Check if the response indicates the player was already whitelisted
    if (result.response.includes('already whitelisted') || result.response.includes('already on the whitelist')) {
      return {
        success: true,
        response: `${username} is already whitelisted.`,
        alreadyWhitelisted: true
      };
    }

    return {
      success: true,
      response: `Successfully whitelisted ${username}!`
    };
  }

  return result;
}

/**
 * Remove a player from the whitelist
 * @param {string} username - The player's username to remove
 * @returns {Promise<{success: boolean, response: string, error?: string}>}
 */
async function whitelistRemove(username) {
  const command = `whitelist remove ${username}`;
  const result = await sendCommand(command);

  if (result.success) {
    return {
      success: true,
      response: `Successfully removed ${username} from the whitelist!`
    };
  }

  return result;
}

/**
 * Check if a player is whitelisted
 * @param {string} username - The player's username to check
 * @returns {Promise<{success: boolean, whitelisted: boolean, response: string, error?: string}>}
 */
async function whitelistCheck(username) {
  const listCommand = 'whitelist list';
  const result = await sendCommand(listCommand);

  if (result.success) {
    const whitelistedPlayers = result.response
      .replace(/whitelist:?\s*/i, '')
      .split(/[\s,]+/)
      .filter(name => name.length > 0);

    const isWhitelisted = whitelistedPlayers.some(player =>
      player.toLowerCase() === username.toLowerCase()
    );

    return {
      success: true,
      whitelisted: isWhitelisted,
      response: isWhitelisted
        ? `${username} is whitelisted.`
        : `${username} is not whitelisted.`
    };
  }

  return {
    success: false,
    whitelisted: false,
    error: result.error
  };
}

/**
 * Get the current whitelist
 * @returns {Promise<{success: boolean, players: string[], response: string, error?: string}>}
 */
async function whitelistList() {
  const command = 'whitelist list';
  const result = await sendCommand(command);

  if (result.success) {
    const players = result.response
      .replace(/whitelist:?\s*/i, '')
      .split(/[\s,]+/)
      .filter(name => name.length > 0);

    return {
      success: true,
      players: players,
      response: players.length > 0
        ? `Whitelisted players (${players.length}): ${players.join(', ')}`
        : 'No players are currently whitelisted.'
    };
  }

  return {
    success: false,
    players: [],
    error: result.error
  };
}

/**
 * Update RCON configuration
 * @param {object} newConfig - New RCON configuration
 */
function updateConfig(newConfig) {
  rconConfig = { ...rconConfig, ...newConfig };
  console.log('Updated RCON configuration:', {
    host: rconConfig.host,
    port: rconConfig.port,
    timeout: rconConfig.timeout
    // Don't log password
  });
}

/**
 * Get current connection status
 * @returns {boolean} - true if connected
 */
function getConnectionStatus() {
  return isConnected;
}

module.exports = {
  connectRcon,
  disconnectRcon,
  sendCommand,
  whitelistAdd,
  whitelistRemove,
  whitelistCheck,
  whitelistList,
  updateConfig,
  getConnectionStatus
};