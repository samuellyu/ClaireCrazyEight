import React from 'react';
import { Card as CardType } from '../utils/deck';
import { motion } from 'motion/react';

interface CardProps {
  card: CardType;
  hidden?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  isValid?: boolean;
}

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const suitColors = {
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-gray-900',
  spades: 'text-gray-900',
};

export const Card: React.FC<CardProps> = ({ card, hidden, onClick, disabled, className = '', isValid }) => {
  if (hidden) {
    return (
      <div
        className={`w-16 h-24 sm:w-24 sm:h-36 rounded-xl border-2 border-white/20 bg-blue-800 shadow-xl flex items-center justify-center bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.1)_10px,rgba(255,255,255,0.1)_20px)] ${className}`}
      >
        <div className="w-12 h-20 sm:w-20 sm:h-32 border border-white/10 rounded-lg"></div>
      </div>
    );
  }

  const isPlayable = isValid === true;
  const isUnplayable = isValid === false;

  return (
    <motion.div
      whileHover={!disabled && onClick ? { y: -10, scale: 1.05 } : {}}
      whileTap={!disabled && onClick ? { scale: 0.95 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={`relative w-16 h-24 sm:w-24 sm:h-36 rounded-xl border border-gray-200 bg-white shadow-lg flex flex-col justify-between p-1.5 sm:p-2 select-none
        ${!disabled && onClick ? 'cursor-pointer' : 'cursor-default'} 
        ${isPlayable ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-emerald-800 shadow-yellow-400/50 z-10' : ''} 
        ${isUnplayable ? 'opacity-60 brightness-90' : ''} 
        ${className}`}
    >
      <div className={`text-sm sm:text-lg font-bold leading-none ${suitColors[card.suit]}`}>
        {card.rank}
        <br />
        {suitSymbols[card.suit]}
      </div>
      <div className={`text-3xl sm:text-5xl self-center ${suitColors[card.suit]}`}>
        {suitSymbols[card.suit]}
      </div>
      <div className={`text-sm sm:text-lg font-bold leading-none rotate-180 ${suitColors[card.suit]}`}>
        {card.rank}
        <br />
        {suitSymbols[card.suit]}
      </div>
    </motion.div>
  );
};
