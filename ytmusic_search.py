#!/usr/bin/env python3
"""
YouTube Music Search using ytmusicapi
Returns proper YouTube Music results with complete metadata
"""

import json
import sys
from ytmusicapi import YTMusic

def search_ytmusic(query, limit=10):
    """
    Search YouTube Music and return results with proper URLs
    
    Args:
        query: Search query string
        limit: Maximum number of results
        
    Returns:
        JSON array of tracks with videoId, title, artist, album, etc.
    """
    try:
        # Initialize YTMusic (no auth needed for search)
        ytmusic = YTMusic()
        
        # Search with filter="songs" to get music tracks (not videos)
        results = ytmusic.search(query, filter="songs", limit=limit)
        
        tracks = []
        for item in results:
            # Extract videoId (required for YouTube URL)
            video_id = item.get('videoId')
            if not video_id:
                continue
            
            # Extract artist(s)
            artists = item.get('artists', [])
            artist_name = artists[0]['name'] if artists else 'Unknown Artist'
            
            # Extract album
            album_data = item.get('album', {})
            album_name = album_data.get('name') if album_data else None
            
            # Extract duration (in seconds)
            duration_text = item.get('duration')
            duration_seconds = 0
            if duration_text:
                # Parse duration like "3:45" to seconds
                parts = duration_text.split(':')
                if len(parts) == 2:
                    duration_seconds = int(parts[0]) * 60 + int(parts[1])
                elif len(parts) == 3:
                    duration_seconds = int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
            
            # Extract thumbnail
            thumbnails = item.get('thumbnails', [])
            thumbnail_url = thumbnails[-1]['url'] if thumbnails else None
            
            # Extract year from album if available
            year = album_data.get('year') if album_data else None
            
            track = {
                'id': video_id,
                'videoId': video_id,
                'title': item.get('title', 'Unknown Title'),
                'artist': artist_name,
                'album': album_name,
                'duration': duration_seconds,
                'url': f'https://music.youtube.com/watch?v={video_id}',
                'thumbnailUrl': thumbnail_url,
                'year': year,
                'resultType': item.get('resultType', 'song')
            }
            
            tracks.append(track)
        
        return tracks
        
    except Exception as e:
        # Return error as JSON
        return {'error': str(e)}

if __name__ == '__main__':
    # Get query from command line
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No query provided'}))
        sys.exit(1)
    
    query = ' '.join(sys.argv[1:])
    limit = 10
    
    # Perform search
    results = search_ytmusic(query, limit)
    
    # Output JSON
    print(json.dumps(results, ensure_ascii=False, indent=2))
