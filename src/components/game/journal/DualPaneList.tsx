import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  JOURNAL_LIST_ROW_HEIGHT,
  JOURNAL_VIRTUALIZE_THRESHOLD,
} from '@/components/game/journal/journalConstants';
import { useJournalListNavigation } from '@/components/game/journal/useJournalListNavigation';

interface DualPaneListProps<T> {
  items: T[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  getItemId: (item: T) => string;
  listLabel: string;
  renderListItem: (item: T, state: { isSelected: boolean; isFocused: boolean; index: number }) => ReactNode;
  renderDetail: (selected: T) => ReactNode;
  emptyList?: ReactNode;
  emptyDetail?: ReactNode;
  listFooter?: ReactNode;
  navigationEnabled?: boolean;
}

function DualPaneListInner<T>({
  items,
  selectedId,
  onSelect,
  getItemId,
  listLabel,
  renderListItem,
  renderDetail,
  emptyList,
  emptyDetail,
  listFooter,
  navigationEnabled = true,
}: DualPaneListProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const selectedIndex = items.findIndex((item) => getItemId(item) === selectedId);

  useEffect(() => {
    if (selectedIndex >= 0) setFocusedIndex(selectedIndex);
    else if (focusedIndex >= items.length) setFocusedIndex(Math.max(0, items.length - 1));
  }, [selectedIndex, items.length, focusedIndex]);

  const onSelectIndex = useCallback(
    (index: number) => {
      const item = items[index];
      if (item) onSelect(getItemId(item));
    },
    [items, onSelect, getItemId],
  );

  useJournalListNavigation({
    enabled: navigationEnabled && items.length > 0,
    itemCount: items.length,
    focusedIndex,
    setFocusedIndex,
    onSelectIndex,
    listRef,
  });

  const useVirtual = items.length >= JOURNAL_VIRTUALIZE_THRESHOLD;
  const virtualizer = useVirtualizer({
    count: useVirtual ? items.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => JOURNAL_LIST_ROW_HEIGHT,
    overscan: 6,
  });

  const selected = items.find((item) => getItemId(item) === selectedId);

  const listBody = items.length === 0
    ? emptyList
    : useVirtual
      ? (
          <div ref={scrollRef} className="h-full overflow-y-auto">
            <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative', width: '100%' }}>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const item = items[virtualRow.index]!;
                const itemId = getItemId(item);
                return (
                  <div
                    key={itemId}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {renderListItem(item, {
                      isSelected: selectedId === itemId,
                      isFocused: focusedIndex === virtualRow.index,
                      index: virtualRow.index,
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )
      : (
          <div className="p-2 space-y-1">
            {items.map((item, index) => {
              const itemId = getItemId(item);
              return (
                <div key={itemId}>
                  {renderListItem(item, {
                    isSelected: selectedId === itemId,
                    isFocused: focusedIndex === index,
                    index,
                  })}
                </div>
              );
            })}
          </div>
        );

  return (
    <div className="flex h-full">
      <div className="w-2/5 min-w-[160px] sm:min-w-[180px] border-r border-cyan-900/20">
        <div
          ref={listRef}
          tabIndex={-1}
          role="listbox"
          aria-label={listLabel}
          className="h-full outline-none"
        >
          <ScrollArea className="h-full">
            {listBody}
            {listFooter}
          </ScrollArea>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        {selected ? renderDetail(selected) : emptyDetail}
      </div>
    </div>
  );
}

export const DualPaneList = memo(DualPaneListInner) as typeof DualPaneListInner;
