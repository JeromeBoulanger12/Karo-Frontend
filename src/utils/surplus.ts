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
