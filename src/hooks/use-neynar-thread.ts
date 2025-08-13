"use client";

import { useState, useCallback } from "react";
import { Cast, UnrolledThread, ThreadSegment } from "~/lib/types";

interface NeynarCast {
  hash: string;
  parent_hash?: string;
  parent_url?: string;
  root_parent_url?: string;
  parent_author?: {
    fid: number;
    username: string;
    display_name?: string;
    pfp_url?: string;
  };
  author: {
    fid: number;
    username: string;
    display_name?: string;
    pfp_url?: string;
    verified_addresses?: {
      eth_addresses: string[];
      sol_addresses: string[];
    };
  };
  text: string;
  timestamp: string;
  embeds: Array<{
    url?: string;
    cast?: {
      hash: string;
      author: {
        fid: number;
        username: string;
        display_name?: string;
        pfp_url?: string;
      };
    };
    metadata?: {
      content_type?: string;
      _status?: string;
      image?: {
        url: string;
        width_px: number;
        height_px: number;
      };
    };
  }>;
  replies: {
    count: number;
  };
  reactions: {
    likes_count: number;
    recasts_count: number;
    likes: Array<{
      fid: number;
      fname: string;
    }>;
    recasts: Array<{
      fid: number;
      fname: string;
    }>;
  };
  channel?: {
    id: string;
    name: string;
    image_url?: string;
  };
}

interface NeynarThreadResponse {
  result: {
    casts: NeynarCast[];
  };
}

const NEYNAR_API_URL = "https://api.neynar.com/v2/farcaster";
const NEYNAR_API_KEY = process.env.NEXT_PUBLIC_NEYNAR_API_KEY || process.env.NEYNAR_API_KEY;

function extractCastHashFromUrl(url: string): string | null {
  // Handle various Farcaster cast URL formats
  const patterns = [
    /\/([a-f0-9]{40})$/i, // Direct hash
    /\/cast\/([a-f0-9]{40})/i, // /cast/hash format
    /0x([a-f0-9]{40})/i, // 0x prefixed hash
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

function convertNeynarCast(neynarCast: NeynarCast): Cast {
  return {
    hash: neynarCast.hash,
    parent_hash: neynarCast.parent_hash,
    parent_url: neynarCast.parent_url,
    root_parent_url: neynarCast.root_parent_url,
    parent_author: neynarCast.parent_author,
    author: neynarCast.author,
    text: neynarCast.text,
    timestamp: neynarCast.timestamp,
    embeds: neynarCast.embeds,
    replies: neynarCast.replies,
    reactions: neynarCast.reactions,
    channel: neynarCast.channel,
  };
}

function createThreadSegments(casts: Cast[]): ThreadSegment[] {
  const segments: ThreadSegment[] = [];
  let currentSegment: ThreadSegment | null = null;
  
  for (const cast of casts) {
    const imageCount = cast.embeds.filter(embed => 
      embed.metadata?.image || embed.metadata?.content_type?.startsWith('image/')
    ).length;
    
    // Check if this cast should be merged with the current segment
    const shouldMerge = currentSegment && 
      currentSegment.author.fid === cast.author.fid &&
      currentSegment.casts[currentSegment.casts.length - 1].hash === cast.parent_hash;
    
    if (shouldMerge && currentSegment) {
      // Merge consecutive casts from the same author
      currentSegment.text += "\n\n" + cast.text;
      currentSegment.casts.push(cast);
      currentSegment.embeds.push(...cast.embeds);
      currentSegment.totalCharacters += cast.text.length + 2; // +2 for \n\n
      currentSegment.imageCount += imageCount;
    } else {
      // Start a new segment
      currentSegment = {
        id: cast.hash,
        author: cast.author,
        text: cast.text,
        timestamp: cast.timestamp,
        embeds: [...cast.embeds],
        casts: [cast],
        totalCharacters: cast.text.length,
        imageCount,
      };
      segments.push(currentSegment);
    }
  }
  
  return segments;
}

export function useNeynarThread() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThread = useCallback(async (castUrl: string, limit = 50): Promise<UnrolledThread | null> => {
    if (!NEYNAR_API_KEY) {
      throw new Error("Neynar API key is required");
    }

    const castHash = extractCastHashFromUrl(castUrl);
    if (!castHash) {
      throw new Error("Invalid cast URL format");
    }

    setLoading(true);
    setError(null);

    try {
      // First, get the root cast
      const castResponse = await fetch(`${NEYNAR_API_URL}/cast?identifier=${castHash}&type=hash`, {
        headers: {
          'api_key': NEYNAR_API_KEY,
        },
      });

      if (!castResponse.ok) {
        throw new Error(`Failed to fetch cast: ${castResponse.statusText}`);
      }

      const castData = await castResponse.json();
      const rootCast = convertNeynarCast(castData.cast);

      // Then get the conversation thread
      const threadResponse = await fetch(
        `${NEYNAR_API_URL}/cast/conversation?identifier=${castHash}&type=hash&reply_depth=10&include_chronological_parent_casts=true&limit=${limit}`,
        {
          headers: {
            'api_key': NEYNAR_API_KEY,
          },
        }
      );

      if (!threadResponse.ok) {
        throw new Error(`Failed to fetch thread: ${threadResponse.statusText}`);
      }

      const threadData: NeynarThreadResponse = await threadResponse.json();
      const allCasts = threadData.result.casts.map(convertNeynarCast);
      
      // Sort casts chronologically
      const sortedCasts = allCasts.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const segments = createThreadSegments(sortedCasts);
      
      const totalCharacters = segments.reduce((sum, segment) => sum + segment.totalCharacters, 0);
      const totalImages = segments.reduce((sum, segment) => sum + segment.imageCount, 0);
      
      const thread: UnrolledThread = {
        url: castUrl,
        rootCast,
        segments,
        totalCasts: allCasts.length,
        totalCharacters,
        totalImages,
        hasMore: allCasts.length === limit,
      };

      setLoading(false);
      return thread;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch thread";
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  return {
    fetchThread,
    loading,
    error,
  };
}