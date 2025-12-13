"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { initSearchEngine, searchData, type SearchableItem } from '@/lib/searchEngine';
import { useTransactions } from '@/hooks/useTransactions';
import { buildSearchData } from '@/lib/buildSearchData';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command';
import { Search as SearchIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { FuseResult } from 'fuse.js';
import { useHydrated } from '@/hooks/useHydrated';

const HighlightedText: React.FC<{ text: string; indices: readonly [number, number][] | undefined }> = ({ text, indices }) => {
  if (!indices || indices.length === 0) {
    return <>{text}</>;
  }

  const parts = [];
  let lastIndex = 0;

  indices.forEach(([start, end], i) => {
    if (start > lastIndex) {
      parts.push(text.substring(lastIndex, start));
    }
    parts.push(<mark key={i} className="bg-primary/20 text-primary-foreground rounded-sm px-0.5">{text.substring(start, end + 1)}</mark>);
    lastIndex = end + 1;
  });

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts}</>;
};


const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FuseResult<SearchableItem>[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const commandRef = useRef<HTMLDivElement>(null);
  const isHydrated = useHydrated();
  
  const { purchases, sales, payments, receipts, getAllMasters, locationTransfers, isTransactionsLoaded, isMasterDataLoaded } = useTransactions();
  
  const initializeIndex = useCallback(() => {
    if (isTransactionsLoaded && isMasterDataLoaded) {
      const allMasters = getAllMasters();
      const searchDataPayload = buildSearchData({
        sales,
        purchases,
        payments,
        receipts,
        masters: allMasters,
        locationTransfers,
      });
      initSearchEngine(searchDataPayload);
    }
  }, [isTransactionsLoaded, isMasterDataLoaded, sales, purchases, payments, receipts, getAllMasters, locationTransfers]);

  useEffect(() => {
    initializeIndex();
    
    const handleReindex = () => initializeIndex();
    window.addEventListener('reindex-search', handleReindex);
    
    return () => {
        window.removeEventListener('reindex-search', handleReindex);
    };

  }, [initializeIndex]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
        setTimeout(() => {
            setOpen(false);
        }, 150);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (query.trim().length > 0) {
      const res = searchData(query);
      setResults(res.slice(0, 10)); 
    } else {
      setResults([]);
    }
  }, [query]);

  const handleSelectResult = (href: string) => {
    router.push(href);
    setQuery('');
    setOpen(false);
    (document.activeElement as HTMLElement)?.blur();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const getBestMatch = (item: FuseResult<SearchableItem>, key: 'title' | 'description'): { text: string; indices: readonly [number, number][] | undefined } => {
      const match = item.matches?.find(m => m.key === key);
      return {
        text: item.item[key],
        indices: match?.indices
      };
  };


  if (!isHydrated) {
    return (
      <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md flex-shrink min-w-0">
        <div className="relative rounded-md border border-input shadow-sm h-9 flex items-center px-3">
           <SearchIcon className="h-5 w-5 text-muted-foreground" />
           <span className="ml-2 text-muted-foreground text-sm">Search anything...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md flex-shrink min-w-0" ref={commandRef}>
      <Command className="overflow-visible bg-transparent">
        <div className="relative rounded-md border border-input shadow-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <CommandInput
            value={query}
            onValueChange={setQuery}
            onFocus={() => setOpen(true)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search anything..."
            className="w-full pl-10 pr-4 h-9 border-none focus:ring-0 bg-transparent"
          />
        </div>
        
        {open && query.length > 0 && (
          <div className="absolute top-full mt-1.5 bg-background border border-border shadow-lg rounded-md z-50 w-full">
            <CommandList>
              {results.length > 0 ? (
                results.map((result) => {
                    const { item } = result;
                    const titleMatch = getBestMatch(result, 'title');
                    const descriptionMatch = getBestMatch(result, 'description');
                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            passHref
                            legacyBehavior
                        >
                            <a
                                onClick={() => handleSelectResult(item.href)}
                                className={cn(
                                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                )}
                            >
                                <div className="flex flex-col uppercase">
                                    <span className="font-medium">
                                       <HighlightedText text={titleMatch.text} indices={titleMatch.indices} />
                                    </span>
                                    <span className="text-xs text-muted-foreground uppercase">
                                        <HighlightedText text={descriptionMatch.text} indices={descriptionMatch.indices} />
                                    </span>
                                </div>
                            </a>
                        </Link>
                    )
                })
              ) : (
                <CommandEmpty>No results found for "{query}".</CommandEmpty>
              )}
            </CommandList>
          </div>
        )}
      </Command>
    </div>
  );
};

export default SearchBar;
