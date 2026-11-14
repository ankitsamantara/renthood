import { Blocks, Dices, Hammer } from 'lucide-react'
import type { Category } from '../types'

export function CategoryIcon({ icon, size = 20 }: { icon: Category['icon']; size?: number }) {
  if (icon === 'dice') return <Dices size={size} />
  if (icon === 'hammer') return <Hammer size={size} />
  return <Blocks size={size} />
}
