export const SIGNATURE_VIEWBOX_WIDTH = 600
export const SIGNATURE_VIEWBOX_HEIGHT = 220

export type SignaturePoint = {
  x: number
  y: number
}

export type SignatureStroke = SignaturePoint[]

function clampCoordinate(value: number, max: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(value, 0), max)
}

function formatCoordinate(value: number, max: number) {
  return clampCoordinate(value, max)
    .toFixed(2)
    .replace(/\.?0+$/, '')
}

export function hasDrawableSignature(strokes: SignatureStroke[]) {
  return strokes.some((stroke) => stroke.length >= 2)
}

export function signatureStrokeToPath(stroke: SignatureStroke) {
  if (stroke.length < 2) return ''

  const [firstPoint, ...remainingPoints] = stroke
  const first = `M ${formatCoordinate(firstPoint.x, SIGNATURE_VIEWBOX_WIDTH)} ${formatCoordinate(firstPoint.y, SIGNATURE_VIEWBOX_HEIGHT)}`
  const rest = remainingPoints.map(
    (point) =>
      `L ${formatCoordinate(point.x, SIGNATURE_VIEWBOX_WIDTH)} ${formatCoordinate(point.y, SIGNATURE_VIEWBOX_HEIGHT)}`,
  )

  return [first, ...rest].join(' ')
}

export function signatureStrokesToSvg(strokes: SignatureStroke[]) {
  const paths = strokes
    .map(signatureStrokeToPath)
    .filter(Boolean)
    .map(
      (path) =>
        `<path d="${path}" fill="none" stroke="#111827" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join('')

  if (!paths) return ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIGNATURE_VIEWBOX_WIDTH} ${SIGNATURE_VIEWBOX_HEIGHT}" data-signature="drawn">${paths}</svg>`
}
