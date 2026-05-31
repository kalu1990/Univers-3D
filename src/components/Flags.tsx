/** Steagul României — 3 benzi verticale (albastru, galben, roșu). */
export function RoFlag({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * 0.67}
      viewBox="0 0 30 20"
      role="img"
      aria-label="Română"
    >
      <rect width="10" height="20" fill="#002B7F" />
      <rect x="10" width="10" height="20" fill="#FCD116" />
      <rect x="20" width="10" height="20" fill="#CE1126" />
    </svg>
  )
}

/** Steagul SUA — 13 dungi + canton albastru cu stele (simplificat). */
export function UsFlag({ size = 28 }: { size?: number }) {
  const stripe = 20 / 13
  return (
    <svg
      width={size}
      height={size * 0.67}
      viewBox="0 0 30 20"
      role="img"
      aria-label="English"
    >
      <rect width="30" height="20" fill="#fff" />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} y={i * 2 * stripe} width="30" height={stripe} fill="#B22234" />
      ))}
      <rect width="12" height={stripe * 7} fill="#3C3B6E" />
      {Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 5 }, (_, c) => (
          <circle
            key={`${r}-${c}`}
            cx={1.6 + c * 2.2}
            cy={1.5 + r * 2.4}
            r="0.5"
            fill="#fff"
          />
        )),
      )}
    </svg>
  )
}
