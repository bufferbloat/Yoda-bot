const fs = require('fs');
const path = require('path');

// Path to store Minecraft configuration
const configPath = path.join(__dirname, '../../data/minecraft_config.json');

// Default Minecraft configuration
const defaultConfig = {
  rcon: {
    host: 'localhost',
    port: 25575,
    password: '',
    timeout: 5000
  },
  autoConnect: false, // Whether to auto-connect on bot startup
  logCommands: true   // Whether to log RCON commands
};

// Current configuration
let minecraftConfig = { ...defaultConfig };

// Load configuration from file
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      minecraftConfig = { ...defaultConfig, ...data };
      console.log('Loaded Minecraft configuration:', {
        ...minecraftConfig,
        rcon: {
          ...minecraftConfig.rcon,
          password: minecraftConfig.rcon.password ? '[REDACTED]' : '[NOT SET]'
        }
      });
    } else {
      // Create default config file
      saveConfig();
      console.log('Created new Minecraft configuration file');
    }
  } catch (error) {
    console.error('Error loading Minecraft configuration:', error);
    minecraftConfig = { ...defaultConfig };
  }
}

// Save configuration to file
function saveConfig() {
  try {
    // Ensure the directory exists
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(minecraftConfig, null, 2));
    console.log('Saved Minecraft configuration');
  } catch (error) {
    console.error('Error saving Minecraft configuration:', error);
  }
}

// Get configuration
function getConfig() {
  return minecraftConfig;
}

// Update configuration
function updateConfig(newConfig) {
  minecraftConfig = { ...minecraftConfig, ...newConfig };
  saveConfig();
  return minecraftConfig;
}

// Update RCON configuration specifically
function updateRconConfig(rconConfig) {
  minecraftConfig.rcon = { ...minecraftConfig.rcon, ...rconConfig };
  saveConfig();
  return minecraftConfig.rcon;
}

// Check if RCON is configured
function isRconConfigured() {
  return minecraftConfig.rcon.host &&
         minecraftConfig.rcon.port &&
         minecraftConfig.rcon.password;
}

// Get RCON connection info (without password for logging)
function getRconInfo() {
  return {
    host: minecraftConfig.rcon.host,
    port: minecraftConfig.rcon.port,
    timeout: minecraftConfig.rcon.timeout,
    configured: isRconConfigured(),
    autoConnect: minecraftConfig.autoConnect
  };
}

// Load configuration on module initialization
loadConfig();

module.exports = {
  getConfig,
  updateConfig,
  updateRconConfig,
  isRconConfigured,
  getRconInfo,
  saveConfig,
  loadConfig
};