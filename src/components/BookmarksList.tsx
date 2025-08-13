"use client";

import { ThreadBookmark } from "~/lib/types";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Trash2, ExternalLink, Clock } from "lucide-react";
import { cn } from "~/lib/utils";

interface BookmarksListProps {
  bookmarks: ThreadBookmark[];
  onNavigateToBookmark: (bookmark: ThreadBookmark) => void;
  onRemoveBookmark: (bookmarkId: string) => void;
  className?: string;
}

export function BookmarksList({ 
  bookmarks, 
  onNavigateToBookmark, 
  onRemoveBookmark,
  className 
}: BookmarksListProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const formatLastRead = (lastRead: string) => {
    const date = new Date(lastRead);
    return date.toLocaleDateString();
  };

  if (bookmarks.length === 0) {
    return (
      <Card className={cn("p-8 text-center", className)}>
        <div className="text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="font-medium mb-2">No bookmarks yet</h3>
          <p className="text-sm">
            Start reading a thread and bookmark your position to save it for later.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Your Bookmarks</h3>
        <Badge variant="secondary">
          {bookmarks.length} bookmark{bookmarks.length === 1 ? '' : 's'}
        </Badge>
      </div>
      
      {bookmarks.map((bookmark) => (
        <Card key={bookmark.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate" title={bookmark.title}>
                  {bookmark.title}
                </h4>
                <p className="text-sm text-muted-foreground truncate" title={bookmark.url}>
                  {bookmark.url}
                </p>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigateToBookmark(bookmark)}
                  className="h-8 w-8 p-0"
                  title="Go to bookmark"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveBookmark(bookmark.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  title="Remove bookmark"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>Segment {bookmark.segmentIndex + 1}</span>
                <span>Created {formatTimestamp(bookmark.timestamp)}</span>
              </div>
              
              {bookmark.lastRead !== bookmark.timestamp && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last read {formatLastRead(bookmark.lastRead)}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}