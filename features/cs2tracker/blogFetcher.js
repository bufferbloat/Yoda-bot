const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function fetchCS2BlogUpdates() {
  try {
    const response = await fetch('https://blog.counter-strike.net/index.php/feed/');
    const text = await response.text();
    
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

module.exports = {
  fetchCS2BlogUpdates
}; 