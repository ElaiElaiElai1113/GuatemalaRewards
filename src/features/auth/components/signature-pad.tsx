import { useMemo, useRef, useState, type PointerEvent } from 'react'
import { RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  SIGNATURE_VIEWBOX_HEIGHT,
  SIGNATURE_VIEWBOX_WIDTH,
  hasDrawableSignature,
  signatureStrokeToPath,
  signatureStrokesToSvg,
  type SignaturePoint,
  type SignatureStroke,
} from '@/lib/signature-svg'

type SignaturePadProps = {
  onChange: (signatureSvg: string) => void
  error?: string
  disabled?: boolean
}

function getPointFromPointer(
  event: PointerEvent<SVGSVGElement>,
  element: SVGSVGElement,
): SignaturePoint {
  const rect = element.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * SIGNATURE_VIEWBOX_WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * SIGNATURE_VIEWBOX_HEIGHT,
  }
}

export function SignaturePad({ onChange, error, disabled = false }: SignaturePadProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [strokes, setStrokes] = useState<SignatureStroke[]>([])
  const [activeStroke, setActiveStroke] = useState<SignatureStroke | null>(null)

  const visibleStrokes = useMemo(
    () => (activeStroke ? [...strokes, activeStroke] : strokes),
    [activeStroke, strokes],
  )

  function commitStrokes(nextStrokes: SignatureStroke[]) {
    setStrokes(nextStrokes)
    onChange(signatureStrokesToSvg(nextStrokes))
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    if (disabled || !svgRef.current) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setActiveStroke([getPointFromPointer(event, svgRef.current)])
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (disabled || !activeStroke || !svgRef.current) return
    event.preventDefault()
    setActiveStroke([...activeStroke, getPointFromPointer(event, svgRef.current)])
  }

  function finishActiveStroke() {
    if (!activeStroke) return

    const nextStrokes = activeStroke.length >= 2 ? [...strokes, activeStroke] : strokes
    setActiveStroke(null)
    commitStrokes(nextStrokes)
  }

  function clearSignature() {
    commitStrokes([])
    setActiveStroke(null)
  }

  const hasSignature = hasDrawableSignature(strokes)

  return (
    <div className="space-y-3">
      <div
        className={`overflow-hidden rounded-2xl border bg-[var(--card)] shadow-sm ${
          error ? 'border-destructive/60' : 'border-[var(--border)]'
        }`}
      >
        <svg
          ref={svgRef}
          role="img"
          aria-label="Drawn signature"
          viewBox={`0 0 ${SIGNATURE_VIEWBOX_WIDTH} ${SIGNATURE_VIEWBOX_HEIGHT}`}
          className="block aspect-[30/11] w-full touch-none bg-white"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishActiveStroke}
          onPointerCancel={finishActiveStroke}
          onPointerLeave={finishActiveStroke}
        >
          <rect width={SIGNATURE_VIEWBOX_WIDTH} height={SIGNATURE_VIEWBOX_HEIGHT} fill="#ffffff" />
          <line x1="44" y1="172" x2="556" y2="172" stroke="#d1d5db" strokeWidth="2" />
          {visibleStrokes.map((stroke, index) => {
            const path = signatureStrokeToPath(stroke)
            if (!path) return null

            return (
              <path
                key={`${index}-${stroke.length}`}
                d={path}
                fill="none"
                stroke="#111827"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
              />
            )
          })}
        </svg>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className={`text-sm font-medium ${error ? 'text-destructive' : 'text-[var(--muted-foreground)]'}`}>
          {error ?? (hasSignature ? 'Signature captured' : 'Draw your signature')}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={clearSignature} disabled={disabled || !hasSignature}>
          <RotateCcw className="size-4" />
          Clear
        </Button>
      </div>
    </div>
  )
}
