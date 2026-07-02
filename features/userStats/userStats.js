const fs = require('fs');
const path = require('path');

const dataFilePath = path.join('/app/data/user_stats.json');

// global stats
let userStats = {
  users: {},
  lastReset: null
};

// load stats
try {
  if (fs.existsSync(dataFilePath)) {
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    userStats = { ...userStats, ...data };
    console.log('Loaded user stats:', userStats);
  } else {
    saveStats();
    console.log('Created new user stats file');
  }
} catch (error) {
  console.error('Error loading user stats:', error);
}

function saveStats() {
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(userStats, null, 2));
  } catch (error) {
    console.error('Error saving user stats:', error);
    throw error;
  }
}

function getUserStats(userId) {
  if (!userStats.users[userId]) {
    userStats.users[userId] = {
      lockins: 0,
      lastLockin: null,
      currentStreak: 0,
      highestStreak: 0,
      name: null
    };
  }
  return userStats.users[userId];
}

function hasLockedInToday(lastLockin) {
  if (!lastLockin) return false;
  
  const last = new Date(lastLockin);
  const now = new Date();
  
  return last.getDate() === now.getDate() &&
         last.getMonth() === now.getMonth() &&
         last.getFullYear() === now.getFullYear();
}

function updateUserStats(userId, username) {
  const stats = getUserStats(userId);
  
  // check locked in
  if (hasLockedInToday(stats.lastLockin)) {
    return { ...stats, alreadyLockedIn: true };
  }

  // update lock in
  stats.lockins++;
  
  // update streak
  const now = new Date();
  const lastLockin = stats.lastLockin ? new Date(stats.lastLockin) : null;
  
  if (lastLockin) {
    const dayDiff = Math.floor((now - lastLockin) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 1) {
      stats.currentStreak++;
    } else if (dayDiff > 1) {
      stats.currentStreak = 1;
    }
  } else {
    stats.currentStreak = 1;
  }
  
  stats.highestStreak = Math.max(stats.currentStreak, stats.highestStreak || 0);
  
  stats.lastLockin = now.toISOString();
  stats.name = username;
  
  saveStats();
  return stats;
}

function getLeaderboard(limit = 10) {
  return Object.entries(userStats.users)
    .map(([userId, stats]) => ({
      userId,
      name: stats.name,
      lockins: stats.lockins,
      lastLockin: stats.lastLockin,
      currentStreak: stats.currentStreak,
      highestStreak: stats.highestStreak
    }))
    .sort((a, b) => b.lockins - a.lockins)
    .slice(0, limit);
}

function resetStats() {
  userStats = {
    users: {},
    lastReset: new Date().toISOString()
  };
  saveStats();
}

module.exports = {
  getUserStats,
  updateUserStats,
  getLeaderboard,
  resetStats
}; 