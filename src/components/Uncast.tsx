"use client";

import { useState } from "react";
import { useUncast } from "~/hooks/use-uncast";
import { CastSegment } from "./CastSegment";
import { ThreadNavigation } from "./ThreadNavigation";
import { BookmarksList } from "./BookmarksList";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Loader2, Search, AlertCircle, Book } from "lucide-react";
import { Alert, AlertDescription } from "~/components/ui/alert";

export function Uncast() {
  const [castUrl, setCastUrl] = useState("");
  const [activeTab, setActiveTab] = useState("read");
  
  const {
    currentThread,
    visibleSegments,
    loading,
    error,
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    bookmarks,
    loadThread,
    goToPage,
    nextPage,
    previousPage,
    toggleLike,
    isLiked,
    bookmarkCurrentPosition,
    navigateToBookmark,
    removeBookmark,
    getBookmarkForThread,
    getProgress,
  } = useUncast();

  const handleLoadThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!castUrl.trim()) return;
    
    await loadThread(castUrl.trim());
    setActiveTab("read");
  };

  const handleBookmark = () => {
    if (!currentThread) return;
    
    const title = `Thread from @${currentThread.rootCast.author.username}`;
    bookmarkCurrentPosition(title);
  };

  const isCurrentThreadBookmarked = currentThread ? 
    Boolean(getBookmarkForThread(currentThread.url)) : false;

  const progress = getProgress();

  const renderUrlInput = () => (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Uncast</h1>
          <p className="text-muted-foreground">
            Unroll and read Farcaster threads with bookmarking and pagination
          </p>
        </div>
        
        <form onSubmit={handleLoadThread} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="cast-url" className="text-sm font-medium">
              Farcaster Cast URL
            </label>
            <Input
              id="cast-url"
              type="url"
              placeholder="https://warpcast.com/username/0x..."
              value={castUrl}
              onChange={(e) => setCastUrl(e.target.value)}
              disabled={loading}
              className="w-full"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !castUrl.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Thread...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Unroll Thread
              </>
            )}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );

  const renderThread = () => {
    if (!currentThread || visibleSegments.length === 0) {
      return (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">
            <Book className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No thread loaded. Enter a cast URL to get started.</p>
          </div>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Thread header */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                Thread from @{currentThread.rootCast.author.username}
              </h2>
              <p className="text-sm text-muted-foreground">
                {currentThread.totalCasts} casts • {Math.round(currentThread.totalCharacters / 1000)}k characters
                {currentThread.totalImages > 0 && ` • ${currentThread.totalImages} images`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCastUrl(currentThread.url)}
            >
              Load New Thread
            </Button>
          </div>
        </Card>

        {/* Navigation */}
        <ThreadNavigation
          currentPage={currentPage}
          totalPages={totalPages}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          progress={progress}
          isBookmarked={isCurrentThreadBookmarked}
          onPreviousPage={previousPage}
          onNextPage={nextPage}
          onGoToPage={goToPage}
          onBookmark={handleBookmark}
        />

        {/* Thread segments */}
        <div className="space-y-4">
          {visibleSegments.map((segment) => (
            <CastSegment
              key={segment.id}
              segment={segment}
              isLiked={isLiked}
              onToggleLike={toggleLike}
            />
          ))}
        </div>

        {/* Bottom navigation */}
        {totalPages > 1 && (
          <ThreadNavigation
            currentPage={currentPage}
            totalPages={totalPages}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            progress={progress}
            isBookmarked={isCurrentThreadBookmarked}
            onPreviousPage={previousPage}
            onNextPage={nextPage}
            onGoToPage={goToPage}
            onBookmark={handleBookmark}
          />
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="read">Read Thread</TabsTrigger>
          <TabsTrigger value="bookmarks" className="flex items-center gap-2">
            Bookmarks
            {bookmarks.length > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                {bookmarks.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="read" className="space-y-6">
          {!currentThread ? renderUrlInput() : renderThread()}
        </TabsContent>

        <TabsContent value="bookmarks">
          <BookmarksList
            bookmarks={bookmarks}
            onNavigateToBookmark={(bookmark) => {
              navigateToBookmark(bookmark);
              setActiveTab("read");
            }}
            onRemoveBookmark={removeBookmark}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}