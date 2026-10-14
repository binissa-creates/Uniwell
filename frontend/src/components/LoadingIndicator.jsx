export default function LoadingIndicator({
  size = 18,
  label = 'Loading',
  message,
  className = '',
}) {
  const markSize = Math.max(12, size)
  const accessibleProps = label
    ? { role: 'status', 'aria-live': 'polite', 'aria-label': message ? undefined : label }
    : { 'aria-hidden': true }

  return (
    <span
      className={`inline-flex items-center gap-3 ${className}`}
      {...accessibleProps}
    >
      <span
        aria-hidden="true"
        className="relative inline-flex shrink-0 items-center justify-center rounded-2xl border border-[#F6C945]/30 bg-gradient-to-br from-[#FFFDF9] via-[#FFF8EA] to-[#FEF3D6] shadow-sm"
        style={{ width: markSize, height: markSize }}
      >
        <span className="absolute inset-0 rounded-2xl bg-[#F6C945]/25 blur-md animate-pulse" />
        <span
          className="relative select-none leading-none"
          style={{
            fontSize: Math.max(8, Math.round(markSize * 0.7)),
            animation: 'breathe 2.4s ease-in-out infinite',
          }}
        >
          🌻
        </span>
      </span>
      {message && (
        <span className="flex min-w-0 flex-col gap-2">
          <span className="text-sm font-bold text-[#3a2b25]">{message}</span>
          <span className="h-1.5 w-36 max-w-full overflow-hidden rounded-full bg-[#F3EEE4]">
            <span className="block h-full w-full rounded-full bg-gradient-to-r from-[#F6C945] via-[#81B29A] to-[#F6C945] animate-[shimmer_1.8s_ease-in-out_infinite] [background-size:200%_100%]" />
          </span>
        </span>
      )}
    </span>
  )
}
