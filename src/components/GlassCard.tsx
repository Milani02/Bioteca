import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export function GlassCard({ 
  children, 
  className, 
  hover = false,
  glow = false,
  ...props 
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        'glass-card rounded-2xl',
        hover && 'glow-hover cursor-pointer',
        glow && 'animate-glow-pulse',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
