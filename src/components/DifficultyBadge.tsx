import { Difficulty } from '../types'

const config = {
  EASY:   { label: 'Easy',   className: 'bg-green-100 text-green-600' },
  MEDIUM: { label: 'Medium', className: 'bg-amber-100 text-amber-500' },
  HARD:   { label: 'Hard',   className: 'bg-red-100 text-red-500' },
}

export default function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const c = config[difficulty]
  return <span className={`badge ${c.className}`}>{c.label}</span>
}