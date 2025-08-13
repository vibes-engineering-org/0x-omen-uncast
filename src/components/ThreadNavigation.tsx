"use client";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  BookmarkCheck,
  SkipBack,
  SkipForward 
} from "lucide-react";

interface ThreadNavigationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  progress: {
    percentage: number;
    current: number;
    total: number;
  };
  isBookmarked: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onGoToPage: (page: number) => void;
  onBookmark: () => void;
  className?: string;
}

export function ThreadNavigation({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  progress,
  isBookmarked,
  onPreviousPage,
  onNextPage,
  onGoToPage,
  onBookmark,
  className,
}: ThreadNavigationProps) {
  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement;
      const page = parseInt(target.value) - 1; // Convert to 0-based indexing
      if (!isNaN(page) && page >= 0 && page < totalPages) {
        onGoToPage(page);
      }
      target.blur();
    }
  };

  if (totalPages <= 1) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Single page thread
          </div>
          <Button
            variant={isBookmarked ? "default" : "outline"}
            size="sm"
            onClick={onBookmark}
            className="flex items-center gap-2"
          >
            {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            {isBookmarked ? "Bookmarked" : "Bookmark"}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 space-y-4 ${className}`}>
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Reading Progress</span>
          <span>{progress.percentage}%</span>
        </div>
        <Progress value={progress.percentage} className="w-full" />
        <div className="text-xs text-muted-foreground text-center">
          Page {progress.current} of {progress.total}
        </div>
      </div>

      {/* Navigation controls */}
      <div className="flex items-center gap-2">
        {/* First page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onGoToPage(0)}
          disabled={currentPage === 0}
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        {/* Previous page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousPage}
          disabled={!hasPreviousPage}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {/* Page input */}
        <div className="flex items-center gap-1 flex-1 justify-center">
          <span className="text-sm">Page</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            defaultValue={currentPage + 1}
            key={currentPage} // Reset input when page changes
            className="w-16 px-2 py-1 text-sm text-center border rounded"
            onKeyDown={handlePageInput}
          />
          <span className="text-sm">of {totalPages}</span>
        </div>

        {/* Next page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!hasNextPage}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onGoToPage(totalPages - 1)}
          disabled={currentPage === totalPages - 1}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Bookmark button */}
      <div className="flex justify-center">
        <Button
          variant={isBookmarked ? "default" : "outline"}
          size="sm"
          onClick={onBookmark}
          className="flex items-center gap-2"
        >
          {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          {isBookmarked ? "Update Bookmark" : "Bookmark Position"}
        </Button>
      </div>
    </Card>
  );
}