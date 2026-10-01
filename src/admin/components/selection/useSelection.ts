import { useState, useMemo, useCallback, useEffect, useRef } from 'react'

export interface UseSelectionOptions<T> {
  items: T[]
  getItemId?: (item: T) => string
  /**
   * If true, changes to the items dataset (e.g. search filter changing)
   * will retain only items that are still in the dataset.
   */
  preserveFiltered?: boolean
}

export interface UseSelectionReturn {
  selectedIds: Set<string>
  selectedArray: string[]
  selectedCount: number
  isSelected: (id: string) => boolean
  toggle: (id: string, e?: React.MouseEvent | React.KeyboardEvent) => void
  select: (id: string) => void
  deselect: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  isAllSelected: boolean
  isIndeterminate: boolean
  isSelectionMode: boolean
  setIsSelectionMode: (active: boolean) => void
  toggleSelectionMode: () => void
}

export function useSelection<T extends { id?: string } | string>({
  items,
  getItemId = (item: any) => (typeof item === 'string' ? item : item.id),
  preserveFiltered = false,
}: UseSelectionOptions<T>): UseSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false)

  // Extract all current IDs
  const allCurrentIds = useMemo(() => {
    return items.map(getItemId).filter(Boolean)
  }, [items, getItemId])

  // Track previous item IDs to auto-clear when search/filter resets or changes
  const prevIdsRef = useRef<string[]>([])
  useEffect(() => {
    const currentIdsSet = new Set(allCurrentIds)
    const prevIdsSet = new Set(prevIdsRef.current)

    // Check if the dataset changed substantially
    const isDifferent =
      allCurrentIds.length !== prevIdsRef.current.length ||
      allCurrentIds.some((id) => !prevIdsSet.has(id))

    if (isDifferent) {
      if (preserveFiltered) {
        // Keep only selection that is still visible
        setSelectedIds((prev) => {
          const next = new Set<string>()
          prev.forEach((id) => {
            if (currentIdsSet.has(id)) next.add(id)
          })
          return next
        })
      } else {
        // Safe clear on dataset filter changes
        setSelectedIds(new Set())
      }
    }

    prevIdsRef.current = allCurrentIds
  }, [allCurrentIds, preserveFiltered])

  const selectedArray = useMemo(() => Array.from(selectedIds), [selectedIds])
  const selectedCount = selectedIds.size

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  )

  const toggle = useCallback(
    (id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
      if (e) {
        e.stopPropagation()
      }
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
    },
    []
  )

  const select = useCallback((id: string) => {
    setSelectedIds((prev) => new Set(prev).add(id))
  }, [])

  const deselect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    if (selectedIds.size === allCurrentIds.length && allCurrentIds.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allCurrentIds))
    }
  }, [selectedIds.size, allCurrentIds])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isAllSelected =
    allCurrentIds.length > 0 && selectedIds.size === allCurrentIds.length

  const isIndeterminate =
    selectedIds.size > 0 && selectedIds.size < allCurrentIds.length

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => !prev)
  }, [])

  return {
    selectedIds,
    selectedArray,
    selectedCount,
    isSelected,
    toggle,
    select,
    deselect,
    selectAll,
    clearSelection,
    isAllSelected,
    isIndeterminate,
    isSelectionMode,
    setIsSelectionMode,
    toggleSelectionMode,
  }
}
