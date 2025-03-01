const streamingStatus = {
  set: (client) => {
    client.user.setActivity('sleepy', { type: 'STREAMING', url: 'https://www.twitch.tv/wayclient' });
    console.log('Streaming status refreshed.');
  }
};

module.exports = { streamingStatus }; 