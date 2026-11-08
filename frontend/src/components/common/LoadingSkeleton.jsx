function Bone({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-[#E5E7EB] rounded-md ${className}`}
    />
  );
}

export function SkeletonAvatar({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };
  return (
    <div
      className={`animate-pulse bg-[#E5E7EB] rounded-full ${sizeClasses[size] || sizeClasses.md}`}
    />
  );
}

export function SkeletonText({ lines = 3, widths }) {
  const defaultWidths = ['w-full', 'w-5/6', 'w-4/6', 'w-3/4', 'w-2/3'];
  return (
    <div className="space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <Bone
          key={i}
          className={`h-3.5 ${
            widths
              ? widths[i] || 'w-full'
              : defaultWidths[i % defaultWidths.length]
          }`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-4">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
          <Bone className="h-4 w-1/3" />
          <Bone className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="flex gap-3 pt-2">
        <Bone className="h-8 w-20 rounded-lg" />
        <Bone className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-[#E5E7EB] bg-[#F7F9F6] px-4 py-3 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Bone key={i} className="h-4 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-[#E5E7EB]">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="px-4 py-3.5 flex gap-4">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <Bone key={colIdx} className="h-3.5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default { SkeletonCard, SkeletonTable, SkeletonText, SkeletonAvatar };
