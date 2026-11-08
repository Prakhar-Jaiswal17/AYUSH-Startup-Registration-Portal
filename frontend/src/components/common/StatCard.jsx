import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({
  icon: Icon,
  value,
  label,
  trend,
  trendDirection,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`card p-6 flex items-start gap-4 ${className}`}
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#E99B35]/10 flex items-center justify-center">
        {Icon && <Icon className="w-6 h-6 text-[#E99B35]" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-[#202A25] leading-tight">{value}</p>
        <p className="text-sm text-[#6B756F] mt-1">{label}</p>
        {trend !== undefined && trend !== null && (
          <div className="flex items-center gap-1 mt-2">
            {trendDirection === 'up' ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span
              className={`text-xs font-medium ${
                trendDirection === 'up' ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {trend}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
