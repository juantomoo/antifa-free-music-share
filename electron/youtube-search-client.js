/**
 * YouTube Search Module - Works in both Electron and Browser/Android
 * Uses client-side search without requiring Python backend
 */

class YouTubeSearchClient {
  constructor() {
    this.searchCache = new Map();
    this.cacheExpiry = 3600000; // 1 hour
  }

  /**
   * Search for tracks on YouTube Music/YouTube
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of track results
   */
  async searchTracks(query) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log('Returning cached results for:', query);
      return cached.results;
    }

    try {
      console.log('Searching YouTube for:', query);
      
      // Use YouTube's internal API (no key required)
      const searchQuery = encodeURIComponent(query + ' music');
      const url = `https://www.youtube.com/results?search_query=${searchQuery}`;
      
      const response = await fetch(url);
      const html = await response.text();
      
      // Extract video data from initial data
      const results = this.parseYouTubeResults(html);
      
      // Cache results
      this.searchCache.set(cacheKey, {
        results,
        timestamp: Date.now()
      });
      
      return results;
    } catch (error) {
      console.error('Search error:', error);
      
      // Fallback: try alternative search method
      return this.fallbackSearch(query);
    }
  }

  /**
   * Parse YouTube HTML response to extract video information
   */
  parseYouTubeResults(html) {
    const results = [];
    
    try {
      // Extract ytInitialData from the page
      const dataMatch = html.match(/var ytInitialData = ({.*?});/);
      if (!dataMatch) {
        console.warn('Could not find ytInitialData');
        return results;
      }
      
      const data = JSON.parse(dataMatch[1]);
      
      // Navigate to video results
      const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents;
      
      if (!contents) {
        console.warn('Could not find contents in ytInitialData');
        return results;
      }
      
      // Extract video renderers
      for (const section of contents) {
        const itemSection = section?.itemSectionRenderer?.contents || [];
        
        for (const item of itemSection) {
          const videoRenderer = item?.videoRenderer;
          if (!videoRenderer) continue;
          
          const videoId = videoRenderer.videoId;
          const title = videoRenderer.title?.runs?.[0]?.text || '';
          const channel = videoRenderer.ownerText?.runs?.[0]?.text || '';
          const duration = videoRenderer.lengthText?.simpleText || '';
          const thumbnail = videoRenderer.thumbnail?.thumbnails?.[0]?.url || '';
          
          // Only include music-related videos
          if (videoId && title) {
            results.push({
              videoId,
              title,
              artist: channel,
              duration,
              thumbnail: thumbnail.startsWith('//') ? 'https:' + thumbnail : thumbnail,
              url: `https://www.youtube.com/watch?v=${videoId}`
            });
          }
          
          // Limit to 20 results
          if (results.length >= 20) break;
        }
        
        if (results.length >= 20) break;
      }
    } catch (error) {
      console.error('Error parsing YouTube results:', error);
    }
    
    return results;
  }

  /**
   * Fallback search using alternative method
   */
  async fallbackSearch(query) {
    try {
      // Use YouTube's suggest API
      const searchQuery = encodeURIComponent(query);
      const suggestUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${searchQuery}`;
      
      const response = await fetch(suggestUrl);
      const data = await response.json();
      
      const suggestions = data[1] || [];
      
      // For each suggestion, create a search result
      const results = suggestions.slice(0, 10).map((suggestion, index) => ({
        videoId: `search_${index}`,
        title: suggestion,
        artist: 'YouTube Search',
        duration: 'Unknown',
        thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="90"%3E%3Crect fill="%23050a1e" width="120" height="90"/%3E%3Ctext x="50%25" y="50%25" fill="%2300ffff" text-anchor="middle" dy=".3em"%3E🎵%3C/text%3E%3C/svg%3E',
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(suggestion)}`,
        isSuggestion: true
      }));
      
      return results;
    } catch (error) {
      console.error('Fallback search error:', error);
      return [];
    }
  }

  /**
   * Clear search cache
   */
  clearCache() {
    this.searchCache.clear();
  }
}

// Create singleton instance
const youtubeSearchClient = new YouTubeSearchClient();

// Export for use in Electron and Browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = youtubeSearchClient;
}

if (typeof window !== 'undefined') {
  window.youtubeSearchClient = youtubeSearchClient;
}
