import { useState } from 'react'

interface RatingStarsProps {
  rating: number
  onChange?: (newRating: number) => void
  readonly?: boolean
}

export default function RatingStars({ rating, onChange, readonly = false }: RatingStarsProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const displayRating = hoverIndex !== null ? hoverIndex : rating

  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayRating

        if (readonly) {
          return (
            <span
              key={star}
              className={`text-lg leading-none ${
                filled ? 'text-amber-400' : 'text-gray-300'
              }`}
            >
              ★
            </span>
          )
        }

        return (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoverIndex(star)}
            onMouseLeave={() => setHoverIndex(null)}
            onClick={() => onChange?.(star)}
            className={`cursor-pointer text-lg leading-none transition-colors ${
              filled ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'
            }`}
          >
            ★
          </button>
        )
      })}
    </div>
  )
}