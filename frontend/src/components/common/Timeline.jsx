import { motion } from 'framer-motion';
import { CheckCircle, Clock, XCircle, AlertCircle, Circle } from 'lucide-react';

const statusConfig = {
  Approved: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500', ring: 'ring-emerald-100' },
  Completed: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500', ring: 'ring-emerald-100' },
  Pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500', ring: 'ring-amber-100' },
  'Under Review': { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500', ring: 'ring-blue-100' },
  'In Progress': { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500', ring: 'ring-blue-100' },
  Rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500', ring: 'ring-red-100' },
  'Query Raised': { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-500', ring: 'ring-orange-100' },
  Submitted: { icon: Circle, color: 'text-[#145A43]', bg: 'bg-[#145A43]', ring: 'ring-[#145A43]/10' },
};

function getConfig(status) {
  return (
    statusConfig[status] || {
      icon: Circle,
      color: 'text-[#6B756F]',
      bg: 'bg-[#6B756F]',
      ring: 'ring-gray-100',
    }
  );
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

export default function Timeline({ events = [] }) {
  if (!events.length) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative"
    >
      {events.map((event, idx) => {
        const config = getConfig(event.status);
        const Icon = config.icon;
        const isLast = idx === events.length - 1;

        return (
          <motion.div
            key={idx}
            variants={itemVariants}
            className="relative flex gap-4 pb-8 last:pb-0"
          >
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-[15px] top-9 bottom-0 w-0.5 bg-[#E5E7EB]" />
            )}

            {/* Dot */}
            <div
              className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full ring-4 ${config.ring} ${config.bg} flex items-center justify-center`}
            >
              <Icon className="w-4 h-4 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-sm font-semibold ${config.color}`}>
                  {event.status}
                </span>
                {event.date && (
                  <span className="text-xs text-[#6B756F]">{event.date}</span>
                )}
              </div>
              {event.remark && (
                <p className="text-sm text-[#202A25] mt-1">{event.remark}</p>
              )}
              {event.officer && (
                <p className="text-xs text-[#6B756F] mt-1">
                  By: {event.officer}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
