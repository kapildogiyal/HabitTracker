import { motion } from 'framer-motion';

export default function Loader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent"
      />
    </div>
  );
}
