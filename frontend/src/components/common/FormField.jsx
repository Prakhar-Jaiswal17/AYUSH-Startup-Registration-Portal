export default function FormField({
  label,
  error,
  description,
  required = false,
  children,
  className = '',
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="label block text-sm font-medium text-[#202A25]">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {description && (
        <p className="text-xs text-[#6B756F]">{description}</p>
      )}
      {children}
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}
