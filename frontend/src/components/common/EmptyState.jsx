import { motion } from 'framer-motion';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-[#F7F9F6] flex items-center justify-center mb-5">
          <Icon className="w-8 h-8 text-[#6B756F]/60" />
        </div>
      )}
      {title && (
        <h3 className="text-lg font-semibold text-[#202A25] mb-2">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-[#6B756F] max-w-sm mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </motion.div>
  );
}
