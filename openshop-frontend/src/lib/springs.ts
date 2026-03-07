export const springs = {
  snappy: { type: 'spring' as const, stiffness: 300, damping: 30 },
  smooth: { type: 'spring' as const, stiffness: 200, damping: 25 },
  gentle: { type: 'spring' as const, stiffness: 120, damping: 18 },
  slow: { type: 'spring' as const, stiffness: 80, damping: 20 },
}
