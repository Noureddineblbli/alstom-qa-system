import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KPIStatCard({
  setActiveTab,
  title,
  value,
  icon: Icon,
  color = 'blue',
  link
}) {


  const colorStyles = {
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      glow: 'shadow-blue-500/10'
    },
    green: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      text: 'text-green-400',
      glow: 'shadow-green-500/10'
    },
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-400',
      glow: 'shadow-red-500/10'
    },
    orange: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      text: 'text-orange-400',
      glow: 'shadow-orange-500/10'
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      text: 'text-purple-400',
      glow: 'shadow-purple-500/10'
    }
  };

  const style = colorStyles[color];

  return (

    <div  
        onClick={() => setActiveTab(link)}
        className="cursor-pointer hover:scale-[1.02] transition-transform"
    >
        <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            className={`
                relative overflow-hidden
                bg-[#16191E]
                border ${style.border}
                rounded-2xl
                p-5
                shadow-xl ${style.glow}
            `}
            >
            {/* top row */}
            <div className="flex items-start justify-between mb-5">

                <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-2">
                    {title}
                </p>

                <h3 className="text-3xl font-bold tracking-tight">
                    {value}
                </h3>
                </div>

                <div className={`
                w-12 h-12 rounded-xl
                flex items-center justify-center
                ${style.bg}
                border ${style.border}
                `}>
                <Icon className={`w-6 h-6 ${style.text}`} />
                </div>
            </div>

            {/* glow effect */}
            <div className={`
                absolute -top-10 -right-10
                w-24 h-24 rounded-full blur-3xl opacity-20
                ${style.bg}
            `} />
        </motion.div>
    </div>
    
    
  );
}