import { useState, useRef } from 'react';

const SwipeableCard = ({ children, onDelete, onArchive }) => {
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [position, setPosition] = useState(0);
  const cardRef = useRef(null);
  const startX = useRef(0);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    setPosition(diff);

    if (diff < -50) {
      setSwipeDirection('left');
    } else if (diff > 50) {
      setSwipeDirection('right');
    } else {
      setSwipeDirection(null);
    }
  };

  const handleTouchEnd = () => {
    if (swipeDirection === 'left' && onDelete) {
      onDelete();
    } else if (swipeDirection === 'right' && onArchive) {
      onArchive();
    }
    setPosition(0);
    setSwipeDirection(null);
  };

  // Mouse events for desktop
  const handleMouseDown = (e) => {
    startX.current = e.clientX;
  };

  const handleMouseMove = (e) => {
    const diff = e.clientX - startX.current;
    setPosition(diff);

    if (diff < -50) {
      setSwipeDirection('left');
    } else if (diff > 50) {
      setSwipeDirection('right');
    } else {
      setSwipeDirection(null);
    }
  };

  const handleMouseUp = () => {
    if (swipeDirection === 'left' && onDelete) {
      onDelete();
    } else if (swipeDirection === 'right' && onArchive) {
      onArchive();
    }
    setPosition(0);
    setSwipeDirection(null);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Left action (Archive) */}
      <div className={`absolute left-0 top-0 bottom-0 w-20 flex items-center justify-center bg-amber-600/80 transition-opacity duration-200 ${
        swipeDirection === 'right' ? 'opacity-100' : 'opacity-0'
      }`}>
        <span className="text-white text-xs font-medium">Archive</span>
      </div>

      {/* Right action (Delete) */}
      <div className={`absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center bg-red-600/80 transition-opacity duration-200 ${
        swipeDirection === 'left' ? 'opacity-100' : 'opacity-0'
      }`}>
        <span className="text-white text-xs font-medium">Delete</span>
      </div>

      {/* Card */}
      <div
        ref={cardRef}
        className="relative"
        style={{ transform: `translateX(${position}px)`, transition: position === 0 ? 'transform 0.3s ease' : 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {children}
      </div>

      <style>{`
        .touch-none { touch-action: none; }
      `}</style>
    </div>
  );
};

export default SwipeableCard;