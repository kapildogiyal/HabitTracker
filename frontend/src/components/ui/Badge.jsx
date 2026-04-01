import clsx from 'clsx';
import useThemeStore from '../../store/themeStore';

const sizeMap = { sm: 'text-xs px-2 py-0.5', md: 'text-xs px-2.5 py-1', lg: 'text-sm px-3 py-1.5' };

const variantMap = {
  violet: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
  indigo: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  rose: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  pink: 'bg-pink-500/20 text-pink-400 border border-pink-500/30',
  // Priority
  low: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  high: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
  urgent: 'bg-red-600/20 text-red-400 border border-red-600/30',
  // Status
  todo: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  inprogress: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  done: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
};

const variantMapLight = {
  violet: 'bg-violet-100 text-violet-700 border border-violet-200',
  indigo: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
  cyan: 'bg-cyan-100 text-cyan-700 border border-cyan-200',
  emerald: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  rose: 'bg-rose-100 text-rose-700 border border-rose-200',
  amber: 'bg-amber-100 text-amber-700 border border-amber-200',
  blue: 'bg-blue-100 text-blue-700 border border-blue-200',
  pink: 'bg-pink-100 text-pink-700 border border-pink-200',
  low: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  medium: 'bg-amber-100 text-amber-700 border border-amber-200',
  high: 'bg-rose-100 text-rose-700 border border-rose-200',
  urgent: 'bg-red-100 text-red-700 border border-red-200',
  todo: 'bg-gray-100 text-gray-600 border border-gray-200',
  inprogress: 'bg-blue-100 text-blue-700 border border-blue-200',
  done: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
};

export default function Badge({ label, variant = 'violet', size = 'md' }) {
  const { isDark } = useThemeStore();
  const vMap = isDark ? variantMap : variantMapLight;
  return (
    <span className={clsx('inline-flex items-center rounded-full font-medium', sizeMap[size], vMap[variant] || vMap.violet)}>
      {label}
    </span>
  );
}
