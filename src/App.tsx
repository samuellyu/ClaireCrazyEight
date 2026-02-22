import React, { useState, useEffect, useCallback } from 'react';
import { Card as CardComponent } from './components/Card';
import { createDeck, shuffleDeck, Card, Suit, SUITS } from './utils/deck';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [aiHand, setAiHand] = useState<Card[]>([]);
  const [currentSuit, setCurrentSuit] = useState<Suit | null>(null);
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  const [showSuitPicker, setShowSuitPicker] = useState(false);
  const [message, setMessage] = useState('Game Started! Your turn.');
  const [pendingEightCard, setPendingEightCard] = useState<Card | null>(null);

  const startNewGame = useCallback(() => {
    let newDeck = shuffleDeck(createDeck());
    const newPlayerHand = newDeck.splice(0, 8);
    const newAiHand = newDeck.splice(0, 8);
    
    let firstCardIndex = newDeck.findIndex(c => c.rank !== '8');
    if (firstCardIndex === -1) firstCardIndex = 0;
    
    const firstCard = newDeck.splice(firstCardIndex, 1)[0];
    
    setDeck(newDeck);
    setPlayerHand(newPlayerHand);
    setAiHand(newAiHand);
    setDiscardPile([firstCard]);
    setCurrentSuit(firstCard.suit);
    setTurn('player');
    setWinner(null);
    setShowSuitPicker(false);
    setMessage('Game Started! Your turn.');
    setPendingEightCard(null);
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const isValidPlay = useCallback((card: Card) => {
    if (card.rank === '8') return true;
    const topCard = discardPile[discardPile.length - 1];
    if (!topCard) return false;
    return card.suit === currentSuit || card.rank === topCard.rank;
  }, [discardPile, currentSuit]);

  const executePlay = useCallback((card: Card, chosenSuit: Suit, isPlayer: boolean) => {
    if (isPlayer) {
      setPlayerHand(prev => {
        const newHand = prev.filter(c => c.id !== card.id);
        if (newHand.length === 0) {
          setWinner('player');
          setMessage('You win! 🎉');
          setTurn('none' as any);
        } else {
          setTurn('ai');
          setMessage("AI's turn...");
        }
        return newHand;
      });
    } else {
      setAiHand(prev => {
        const newHand = prev.filter(c => c.id !== card.id);
        if (newHand.length === 0) {
          setWinner('ai');
          setMessage('AI wins! 🤖');
          setTurn('none' as any);
        } else {
          setTurn('player');
          setMessage('Your turn.');
        }
        return newHand;
      });
    }

    setDiscardPile(prev => [...prev, card]);
    setCurrentSuit(chosenSuit);
  }, []);

  const handlePlayerPlay = (card: Card) => {
    if (turn !== 'player' || winner) return;
    if (!isValidPlay(card)) {
      setMessage("Invalid card! Must match suit or rank, or be an 8.");
      return;
    }

    if (card.rank === '8') {
      setPendingEightCard(card);
      setShowSuitPicker(true);
    } else {
      executePlay(card, card.suit, true);
    }
  };

  const handleSuitPick = (suit: Suit) => {
    if (pendingEightCard) {
      executePlay(pendingEightCard, suit, true);
      setPendingEightCard(null);
      setShowSuitPicker(false);
    }
  };

  const drawCard = useCallback((isPlayer: boolean): Card | null => {
    let currentDeck = [...deck];
    let currentDiscard = [...discardPile];

    if (currentDeck.length === 0) {
      if (currentDiscard.length <= 1) {
        return null;
      }
      const topCard = currentDiscard[currentDiscard.length - 1];
      const cardsToShuffle = currentDiscard.slice(0, -1);
      currentDeck = shuffleDeck(cardsToShuffle);
      currentDiscard = [topCard];
      setDiscardPile(currentDiscard);
    }

    const drawnCard = currentDeck[0];
    const newDeck = currentDeck.slice(1);
    setDeck(newDeck);

    if (isPlayer) {
      setPlayerHand(prev => [...prev, drawnCard]);
    } else {
      setAiHand(prev => [...prev, drawnCard]);
    }
    return drawnCard;
  }, [deck, discardPile]);

  const handlePlayerDraw = () => {
    if (turn !== 'player' || winner) return;
    
    if (playerHand.some(isValidPlay)) {
      setMessage("You have a playable card! You must play it.");
      return;
    }

    const drawnCard = drawCard(true);
    if (!drawnCard) {
      setMessage("Deck is empty! AI's turn.");
      setTurn('ai');
    } else {
      if (!isValidPlay(drawnCard)) {
        setMessage("Drawn card is unplayable. AI's turn.");
        setTurn('ai');
      } else {
        setMessage("You drew a playable card! Play it.");
      }
    }
  };

  useEffect(() => {
    if (turn === 'player' && !winner) {
      const hasValid = playerHand.some(isValidPlay);
      if (!hasValid && deck.length === 0 && discardPile.length <= 1) {
        const timer = setTimeout(() => {
          setMessage("No playable cards and deck is empty. AI's turn.");
          setTurn('ai');
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [turn, playerHand, deck.length, discardPile.length, winner, isValidPlay]);

  useEffect(() => {
    if (turn === 'ai' && !winner) {
      const timer = setTimeout(() => {
        const validCards = aiHand.filter(isValidPlay);
        
        if (validCards.length > 0) {
          const nonEights = validCards.filter(c => c.rank !== '8');
          const cardToPlay = nonEights.length > 0 
            ? nonEights[Math.floor(Math.random() * nonEights.length)]
            : validCards[0];
            
          if (cardToPlay.rank === '8') {
            const suitCounts = aiHand.reduce((acc, card) => {
              acc[card.suit] = (acc[card.suit] || 0) + 1;
              return acc;
            }, {} as Record<Suit, number>);
            
            let bestSuit: Suit = 'hearts';
            let maxCount = -1;
            for (const suit of SUITS) {
              if ((suitCounts[suit] || 0) > maxCount) {
                maxCount = suitCounts[suit] || 0;
                bestSuit = suit;
              }
            }
            executePlay(cardToPlay, bestSuit, false);
          } else {
            executePlay(cardToPlay, cardToPlay.suit, false);
          }
        } else {
          const drawnCard = drawCard(false);
          if (!drawnCard) {
            setMessage("AI passes.");
            setTurn('player');
          } else {
            if (isValidPlay(drawnCard)) {
              setMessage("AI drew a card.");
            } else {
              setMessage("AI drew an unplayable card. Your turn.");
              setTurn('player');
            }
          }
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [turn, aiHand, winner, isValidPlay, executePlay, drawCard]);

  const suitSymbols = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  };

  return (
    <div className="min-h-screen bg-emerald-800 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-700 to-emerald-900 text-white flex flex-col items-center justify-between p-4 sm:p-8 font-sans overflow-hidden">
      {/* Header / Messages */}
      <div className="text-center mb-4">
        <h1 className="text-3xl sm:text-5xl font-bold mb-2 text-yellow-400 drop-shadow-md">果果疯狂 8 点</h1>
        <p className="text-lg sm:text-xl h-8 font-medium bg-black/20 px-4 py-1 rounded-full inline-block backdrop-blur-sm">{message}</p>
      </div>

      {/* AI Hand */}
      <div className="flex justify-center items-center h-36 mb-4 sm:mb-8">
        {aiHand.map((card, i) => (
          <div key={card.id} className="-ml-8 sm:-ml-12 first:ml-0 relative transition-all" style={{ zIndex: i }}>
            <CardComponent card={card} hidden />
          </div>
        ))}
      </div>

      {/* Play Area */}
      <div className="flex items-center justify-center gap-8 sm:gap-16 my-4 sm:my-8">
        {/* Draw Pile */}
        <div className="relative cursor-pointer group" onClick={handlePlayerDraw}>
          {deck.length > 0 ? (
            <>
              <CardComponent card={deck[0]} hidden className="absolute top-1 left-1" />
              <CardComponent card={deck[0]} hidden className="absolute top-2 left-2" />
              <CardComponent card={deck[0]} hidden className="relative z-10 group-hover:-translate-y-2 transition-transform shadow-xl" />
            </>
          ) : (
            <div className="w-16 h-24 sm:w-24 sm:h-36 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-900/30 flex items-center justify-center text-emerald-300 font-bold text-center p-2 hover:bg-emerald-900/50 transition-colors shadow-inner">
              {turn === 'player' && !playerHand.some(isValidPlay) ? 'Pass' : 'Empty'}
            </div>
          )}
          <div className="absolute -bottom-8 left-0 right-0 text-center text-sm font-semibold text-emerald-100">
            {deck.length} Cards
          </div>
        </div>

        {/* Discard Pile */}
        <div className="relative">
          {discardPile.length > 0 && (
            <CardComponent card={discardPile[discardPile.length - 1]} />
          )}
          {currentSuit && (
            <div className="absolute -bottom-10 left-0 right-0 flex justify-center items-center gap-2 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
              <span className="text-xs sm:text-sm font-semibold text-emerald-100 uppercase tracking-wider">Suit:</span>
              <span className={`text-xl sm:text-2xl leading-none ${currentSuit === 'hearts' || currentSuit === 'diamonds' ? 'text-red-400' : 'text-gray-300'}`}>
                {suitSymbols[currentSuit]}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Player Hand */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-8 max-w-5xl">
        <AnimatePresence>
          {playerHand.map((card) => {
            const valid = turn === 'player' && !winner && !showSuitPicker ? isValidPlay(card) : false;
            return (
              <motion.div 
                key={card.id} 
                layout
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="transition-transform"
              >
                <CardComponent 
                  card={card} 
                  isValid={valid}
                  onClick={() => handlePlayerPlay(card)}
                  disabled={!valid}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Suit Picker Modal */}
      <AnimatePresence>
        {showSuitPicker && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full mx-4 text-center shadow-2xl border border-white/20"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Choose a Suit</h2>
              <div className="flex justify-center gap-4">
                {SUITS.map(suit => (
                  <button
                    key={suit}
                    onClick={() => handleSuitPick(suit)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl hover:scale-110 transition-transform shadow-md border border-gray-200 ${suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-gray-900'} bg-gray-50 hover:bg-gray-100 active:scale-95`}
                  >
                    {suitSymbols[suit]}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Modal */}
      <AnimatePresence>
        {winner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50"
          >
            <motion.div 
              initial={{ y: 50, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              className="bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-3xl p-8 sm:p-12 max-w-md w-full mx-4 text-center shadow-[0_0_50px_rgba(234,179,8,0.5)] border-4 border-yellow-300"
            >
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 drop-shadow-lg">
                {winner === 'player' ? 'You Win! 🎉' : 'AI Wins! 🤖'}
              </h2>
              <p className="text-yellow-900 font-medium text-lg mb-8">
                {winner === 'player' ? 'Great job! You cleared your hand first.' : 'Better luck next time!'}
              </p>
              <button
                onClick={startNewGame}
                className="bg-white text-yellow-600 font-bold text-xl px-8 py-4 rounded-full shadow-xl hover:scale-105 transition-transform active:scale-95 border-2 border-white/50"
              >
                Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
