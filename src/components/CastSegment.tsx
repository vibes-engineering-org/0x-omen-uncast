"use client";

import { useState } from "react";
import { ThreadSegment, Cast } from "~/lib/types";
import { Avatar } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Heart, MessageCircle, Repeat2 } from "lucide-react";
import { cn } from "~/lib/utils";

interface CastSegmentProps {
  segment: ThreadSegment;
  isLiked: (castHash: string) => boolean;
  onToggleLike: (castHash: string, castData?: { author: string; text: string }) => void;
  className?: string;
}

export function CastSegment({ segment, isLiked, onToggleLike, className }: CastSegmentProps) {
  const [expandedImages, setExpandedImages] = useState<Set<string>>(new Set());

  const toggleImageExpanded = (imageUrl: string) => {
    const newExpanded = new Set(expandedImages);
    if (newExpanded.has(imageUrl)) {
      newExpanded.delete(imageUrl);
    } else {
      newExpanded.add(imageUrl);
    }
    setExpandedImages(newExpanded);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const renderEmbeds = (embeds: ThreadSegment["embeds"]) => {
    if (embeds.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        {embeds.map((embed, index) => (
          <div key={index}>
            {embed.metadata?.image && (
              <div className="relative">
                <img
                  src={embed.metadata.image.url}
                  alt="Cast embed"
                  className={cn(
                    "rounded-lg cursor-pointer transition-all",
                    expandedImages.has(embed.metadata.image.url) 
                      ? "w-full" 
                      : "max-w-sm max-h-64 object-cover"
                  )}
                  onClick={() => toggleImageExpanded(embed.metadata!.image!.url)}
                />
              </div>
            )}
            {embed.url && !embed.metadata?.image && (
              <a
                href={embed.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="text-sm text-muted-foreground truncate">
                  {embed.url}
                </div>
              </a>
            )}
          </div>
        ))}
      </div>
    );
  };

  const handleLikeClick = (cast: Cast) => {
    onToggleLike(cast.hash, {
      author: cast.author.username,
      text: cast.text,
    });
  };

  // For segments with multiple casts, show individual like buttons
  const renderCastActions = (cast: Cast) => {
    const liked = isLiked(cast.hash);
    
    return (
      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleLikeClick(cast)}
          className={cn(
            "flex items-center gap-1 h-8 px-2",
            liked && "text-red-500"
          )}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-current")} />
          {cast.reactions.likes_count > 0 && (
            <span>{cast.reactions.likes_count}</span>
          )}
        </Button>
        
        <div className="flex items-center gap-1">
          <MessageCircle className="h-4 w-4" />
          {cast.replies.count > 0 && (
            <span>{cast.replies.count}</span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Repeat2 className="h-4 w-4" />
          {cast.reactions.recasts_count > 0 && (
            <span>{cast.reactions.recasts_count}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <img 
            src={segment.author.pfp_url || "/api/placeholder/40/40"} 
            alt={`@${segment.author.username}`}
            className="w-full h-full object-cover"
          />
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="font-semibold truncate">
              {segment.author.display_name || segment.author.username}
            </div>
            <div className="text-sm text-muted-foreground">
              @{segment.author.username}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatTimestamp(segment.timestamp)}
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Main text content */}
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {segment.text}
            </div>
            
            {/* Embeds */}
            {renderEmbeds(segment.embeds)}
            
            {/* Individual cast actions if multiple casts */}
            {segment.casts.length > 1 ? (
              <div className="space-y-2 border-t pt-3">
                <div className="text-xs text-muted-foreground mb-2">
                  This segment contains {segment.casts.length} consecutive casts
                </div>
                {segment.casts.map((cast, index) => (
                  <div key={cast.hash} className="pl-4 border-l-2 border-muted">
                    <div className="text-xs text-muted-foreground mb-1">
                      Cast {index + 1} • {formatTimestamp(cast.timestamp)}
                    </div>
                    {renderCastActions(cast)}
                  </div>
                ))}
              </div>
            ) : (
              // Single cast actions
              renderCastActions(segment.casts[0])
            )}
          </div>
        </div>
      </div>
      
      {/* Segment metadata */}
      <div className="mt-4 pt-3 border-t text-xs text-muted-foreground flex justify-between">
        <div>
          {segment.totalCharacters} characters
          {segment.imageCount > 0 && ` • ${segment.imageCount} image${segment.imageCount === 1 ? '' : 's'}`}
        </div>
        {segment.casts.length > 1 && (
          <div>
            {segment.casts.length} casts merged
          </div>
        )}
      </div>
    </Card>
  );
}