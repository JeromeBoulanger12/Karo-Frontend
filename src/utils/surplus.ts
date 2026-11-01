// One point of the surplus history: the account's balance minus its envelopes at that moment
export interface SurplusPoint {
  capturedAt: string
  balance: number
  envelopesTotal: number
  surplus: number
  currency: string
}

export interface SurplusStats {
  // Share of the period (by duration, not by number of points) spent with surplus >= 0, 0-100
  percentInSurplus: number
  lowest: SurplusPoint
  current: SurplusPoint
}

// Each point holds until the next one; the last one holds until now. Time is weighted so a long
// stretch in deficit counts for more than a quick dip
export function surplusStats(points: SurplusPoint[], now: Date = new Date()): SurplusStats | null {
  if (points.length === 0) return null

  let inSurplusMs = 0
  let totalMs = 0
  points.forEach((point, index) => {
    const start = new Date(point.capturedAt).getTime()
    const end = index + 1 < points.length
      ? new Date(points[index + 1].capturedAt).getTime()
      : now.getTime()
    const duration = Math.max(0, end - start)
    totalMs += duration
    if (point.surplus >= 0) inSurplusMs += duration
  })

  const lowest = points.reduce((min, p) => (p.surplus < min.surplus ? p : min), points[0])
  const current = points[points.length - 1]

  return {
    percentInSurplus: totalMs > 0 ? Math.round((inSurplusMs / totalMs) * 100) : 100,
    lowest,
    current
  }
}

// Time-weighted average of the surplus over the `windowMs` ending at `at`. The surplus is a step
// function (each point holds until the next), so each stretch counts for its duration. Returns null
// when no point starts before `at` inside that window
export function averageSurplusAt(points: SurplusPoint[], at: number, windowMs: number): number | null {
  const windowStart = at - windowMs
  let weighted = 0
  let covered = 0

  points.forEach((point, index) => {
    const segmentStart = new Date(point.capturedAt).getTime()
    const segmentEnd = index + 1 < points.length
      ? new Date(points[index + 1].capturedAt).getTime()
      : at
    const start = Math.max(segmentStart, windowStart)
    const end = Math.min(segmentEnd, at)
    if (end > start) {
      weighted += point.surplus * (end - start)
      covered += end - start
    }
  })

  return covered > 0 ? weighted / covered : null
}

// Moving average evaluated at each point's own timestamp, for plotting alongside the surplus
export function movingAverageSeries(points: SurplusPoint[], windowMs: number): (number | null)[] {
  return points.map(point => averageSurplusAt(points, new Date(point.capturedAt).getTime(), windowMs))
}
