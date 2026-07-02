import { describe, expect, it } from 'vitest'

import {
  hasDrawableSignature,
  signatureStrokeToPath,
  signatureStrokesToSvg,
  type SignatureStroke,
} from './signature-svg'

describe('signature SVG helpers', () => {
  const stroke: SignatureStroke = [
    { x: 12.4, y: 18.7 },
    { x: 80.2, y: 44.1 },
    { x: 140.8, y: 30.3 },
  ]

  it('detects drawable strokes only when a stroke has at least two points', () => {
    expect(hasDrawableSignature([])).toBe(false)
    expect(hasDrawableSignature([[{ x: 10, y: 10 }]])).toBe(false)
    expect(hasDrawableSignature([stroke])).toBe(true)
  })

  it('serializes strokes into a path-only SVG signature artifact', () => {
    const svg = signatureStrokesToSvg([stroke])

    expect(svg).toContain('data-signature="drawn"')
    expect(svg).toContain('<path')
    expect(svg).toContain(signatureStrokeToPath(stroke))
    expect(svg).not.toContain('<script')
    expect(svg).not.toContain('<foreignObject')
  })
})
