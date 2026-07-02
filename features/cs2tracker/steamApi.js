const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function fetchSteamNews(count = 10, maxLength = 2000) {
  try {
    const response = await fetch(`https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=730&count=${count}&maxlength=${maxLength}&format=json`);
    const data = await response.json();
    
    if (data && data.appnews && data.appnews.newsitems) {
      return data.appnews.newsitems;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching Steam news:', error);
    return [];
  }
}

module.exports = {
  fetchSteamNews
}; 