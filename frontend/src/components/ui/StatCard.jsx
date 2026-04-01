import { motion } from 'framer-motion';
import clsx from 'clsx';

const gradientMap = {
  violet: 'from-violet-500 to-indigo-500',
  cyan: 'from-cyan-500 to-blue-500',
  emerald: 'from-emerald-500 to-teal-500',
  rose: 'from-rose-500 to-pink-500',
  amber: 'from-amber-500 to-orange-500',
  indigo: 'from-indigo-500 to-purple-500',
  pink: 'from-pink-500 to-rose-500',
  blue: 'from-blue-500 to-indigo-500',
};

export default function StatCard({ icon: Icon, label, value, color = 'violet', suffix = '', trend }) {
  const gradient = gradientMap[color] || gradientMap.violet;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg"
    >
      {/* Background gradient */}
      <div className={clsx('absolute inset-0 bg-gradient-to-br', gradient)} />
      {/* Decorative circles */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -left-2 w-16 h-16 rounded-full bg-white/10" />

      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="text-3xl font-bold tracking-tight">
          {value}<span className="text-xl font-semibold ml-0.5">{suffix}</span>
        </div>
        <div className="text-sm text-white/80 mt-1">{label}</div>
        {trend !== undefined && (
          <div className={clsx('text-xs mt-1 font-medium', trend >= 0 ? 'text-white/90' : 'text-white/70')}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% this week
          </div>
        )}
      </div>
    </motion.div>
  );
}
