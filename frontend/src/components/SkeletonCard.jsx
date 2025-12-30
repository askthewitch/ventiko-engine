import React from 'react';
import './SkeletonCard.css';

const SkeletonCard = () => {
  return (
    <div className="card skeleton-card">
      <div className="skeleton-content">
        {/* Title Bar */}
        <div className="skeleton-bar title-bar"></div>
        {/* Description Bars */}
        <div className="skeleton-bar text-bar"></div>
        <div className="skeleton-bar text-bar short"></div>
      </div>
      
      <div className="card-footer">
        {/* Price Box */}
        <div className="skeleton-bar price-bar"></div>
        {/* View Deal Text */}
        <div className="skeleton-bar score-bar"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;