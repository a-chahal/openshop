import { memo } from 'react'
import { motion, type Variants } from 'framer-motion'
import { useStore } from '@xyflow/react'
import { useBoardStore } from '../../store/boardStore'

const selectTransform = (s: any) => s.transform as [number, number, number]

const idleVariant: Variants = {
  animate: {
    scale: [1.0, 1.08, 1.0],
    transition: {
      duration: 3,
      repeat: Infinity,
      repeatType: 'mirror',
      ease: 'easeInOut',
    },
  },
}

const thinkingVariant: Variants = {
  animate: {
    scale: [1.0, 1.08, 1.0],
    opacity: [1, 0.7, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: 'mirror',
      ease: 'easeInOut',
    },
  },
}

const stateVariants: Record<string, Variants> = {
  idle: idleVariant,
  thinking: thinkingVariant,
  moving: {
    animate: {
      scale: 1,
      opacity: 1,
    },
  },
}

export const Avatar = memo(function Avatar() {
  const avatarPosition = useBoardStore(s => s.avatarPosition)
  const avatarState = useBoardStore(s => s.avatarState)
  const phase = useBoardStore(s => s.phase)
  const transform = useStore(selectTransform)
  const [vx, vy, zoom] = transform

  if (phase === 'entry') return null

  const screenX = avatarPosition.x * zoom + vx
  const screenY = avatarPosition.y * zoom + vy

  const variants = stateVariants[avatarState] ?? stateVariants.idle

  return (
    <motion.div
      variants={variants}
      animate="animate"
      transition={
        avatarState === 'moving'
          ? { type: 'spring', stiffness: 120, damping: 18 }
          : undefined
      }
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 20,
        height: 20,
        borderRadius: '50%',
        background:
          'radial-gradient(circle, rgb(147, 197, 253) 0%, rgba(147, 197, 253, 0.3) 100%)',
        boxShadow:
          '0 0 12px rgba(147, 197, 253, 0.4), 0 0 24px rgba(147, 197, 253, 0.15)',
        pointerEvents: 'none',
        zIndex: 20,
        x: screenX - 10,
        y: screenY - 10,
      }}
    />
  )
})
