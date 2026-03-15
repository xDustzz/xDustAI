import React, { useEffect, useState, useRef } from 'react';

const Tooltip = () => {
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState('');
  const [style, setStyle] = useState<React.CSSProperties>({});
  
  const timerRef = useRef<number | null>(null);
  const targetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-tooltip]') as HTMLElement;
      
      // Only trigger if we moved to a new tooltip-enabled element
      if (target && target !== targetRef.current) {
        // Clear any existing timer/tooltip from previous element
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setVisible(false);
        targetRef.current = target;

        const text = target.getAttribute('data-tooltip');
        if (text) {
          // Start 1 second timer
          timerRef.current = window.setTimeout(() => {
            const rect = target.getBoundingClientRect();
            const newStyle: React.CSSProperties = {};
            
            // Check Screen Quadrants for smart positioning
            const isRightSide = rect.left > window.innerWidth / 2;
            const isBottomHalf = rect.bottom > window.innerHeight / 2;

            // Y-Axis Positioning
            if (isBottomHalf) {
                // Show above the element
                newStyle.bottom = `${window.innerHeight - rect.top + 8}px`;
                newStyle.top = 'auto';
            } else {
                // Show below the element
                newStyle.top = `${rect.bottom + 8}px`;
                newStyle.bottom = 'auto';
            }

            // X-Axis Positioning & Boundary Protection
            if (isRightSide) {
                // If close to right edge (like Delete button), align right edges
                if (rect.right > window.innerWidth - 100) {
                    newStyle.right = `${window.innerWidth - rect.right}px`;
                    newStyle.left = 'auto';
                } else {
                    // Otherwise center
                    newStyle.left = `${rect.left + rect.width / 2}px`;
                    newStyle.transform = 'translateX(-50%)';
                }
            } else {
                // If close to left edge, align left edges
                if (rect.left < 100) {
                    newStyle.left = `${rect.left}px`;
                    newStyle.right = 'auto';
                } else {
                    // Otherwise center
                    newStyle.left = `${rect.left + rect.width / 2}px`;
                    newStyle.transform = 'translateX(-50%)';
                }
            }

            setContent(text);
            setStyle(newStyle);
            setVisible(true);
          }, 1000); // 1 Second Delay
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
        // Check if we actually left the target element (and didn't just move to a child node)
        if (targetRef.current) {
            const related = e.relatedTarget as Node;
            if (targetRef.current.contains(related)) {
                return;
            }
            
            // Actually left the element
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            setVisible(false);
            targetRef.current = null;
        }
    };

    const handleMouseDown = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setVisible(false);
        targetRef.current = null;
    };

    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mouseout', handleMouseOut);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('mousedown', handleMouseDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div 
      className="fixed z-[10000] pointer-events-none px-4 py-2 rounded-xl liquid-glass text-white text-xs font-medium animate-pop-bounce font-['Poppins'] tracking-wide whitespace-nowrap"
      style={style}
    >
      {content}
    </div>
  );
};

export default Tooltip;