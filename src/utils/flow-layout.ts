import { Overflow } from '~/models'

export interface Timeline {
  willAppear: number
  didAppear: number
  willDisappear: number
  didDisappear: number
}

type FindTimelineIndexParams = {
  lines: number
  messageRows: number
  overflow: Overflow
  timeline: Timeline
  timelines: Timeline[][]
}

const OVERLAY_STACKS = 2

export const getTimelineCapacity = (lines: number, overflow: Overflow) => {
  if (overflow === 'hidden') {
    return lines
  }
  return Math.max(lines, lines * OVERLAY_STACKS - 1)
}

export const isDeniedIndex = (index: number, lines: number) => {
  // Odd overlay stacks are shifted down by half a row, so their last row is unsafe.
  return index % (lines * 2) === lines * 2 - 1
}

const crossesLineBoundary = (
  index: number,
  lines: number,
  messageRows: number,
) => {
  const mod = (index + messageRows) % lines
  return mod > 0 && mod < messageRows
}

const canUseTimelineRows = ({
  index,
  lines,
  messageRows,
  timeline,
  timelines,
}: FindTimelineIndexParams & { index: number }) => {
  if (crossesLineBoundary(index, lines, messageRows)) {
    return false
  }

  return Array.from({ length: messageRows }).every((_, j) => {
    if (isDeniedIndex(index + j, lines)) {
      return false
    }

    const row = timelines[index + j]
    const lastTimeline = row?.[row.length - 1]
    if (!lastTimeline) {
      return true
    }

    return (
      lastTimeline.didDisappear < timeline.willDisappear &&
      lastTimeline.didAppear < timeline.willAppear
    )
  })
}

export const findTimelineIndex = (params: FindTimelineIndexParams) => {
  const { lines, messageRows, overflow } = params
  if (lines <= 0 || messageRows <= 0) {
    return undefined
  }

  const capacity = getTimelineCapacity(lines, overflow)
  if (messageRows > capacity) {
    return undefined
  }

  for (let index = 0; index <= capacity - messageRows; index++) {
    if (canUseTimelineRows({ ...params, index })) {
      return index
    }
  }

  return undefined
}

export const pruneTimelines = (timelines: Timeline[][], now: number) => {
  const pruned = timelines.map((row) => {
    return row.filter((timeline) => timeline.didDisappear > now)
  })

  while (pruned.length > 0 && !pruned[pruned.length - 1]?.length) {
    pruned.pop()
  }

  return pruned
}

export const createTransformKeyframes = (
  containerWidth: number,
  messageWidth: number,
  y: number,
) => {
  return [
    { transform: `translate3d(${containerWidth}px, ${y}px, 0)` },
    { transform: `translate3d(-${messageWidth}px, ${y}px, 0)` },
  ]
}
