import React, { useState, useEffect } from 'react';

const TypewriterInput = ({ placeholders, value, onChange, onKeyPress }) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);
  const [isFocused, setIsFocused] = useState(false); // Track if user is clicking

  useEffect(() => {
    // The typing loop
    const handleTyping = () => {
      const fullText = placeholders[currentIndex];
      
      // Speed adjustments
      setTypingSpeed(isDeleting ? 50 : 50);

      if (!isDeleting) {
        // Typing forward
        setCurrentText(fullText.substring(0, currentText.length + 1));

        // Pause at the end of the sentence
        if (currentText === fullText) {
          // First item (index 0) stays longer (3.5s), others 2.5s
          const pauseTime = currentIndex === 0 ? 2000 : 1500;
          setTypingSpeed(pauseTime);
          setIsDeleting(true);
        }
      } else {
        // Deleting backward
        setCurrentText(fullText.substring(0, currentText.length - 1));

        // Finished deleting, move to next
        if (currentText === '') {
          setIsDeleting(false);
          setCurrentIndex((prevIndex) => (prevIndex + 1) % placeholders.length);
          setTypingSpeed(400);
        }
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);

  }, [currentText, isDeleting, currentIndex, placeholders, typingSpeed]);

  return (
    <input 
      type="text" 
      value={value} /* CONTROLLED: Only shows what the user types */
      onChange={onChange}
      onKeyPress={onKeyPress}
      
      /* UX MAGIC: If focused or user has typed, hide placeholder. Else show animation. */
      placeholder={isFocused || value ? "" : currentText} 
      
      /* EVENTS: Detect click */
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    />
  );
};

export default TypewriterInput;