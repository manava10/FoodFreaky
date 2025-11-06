import React from 'react';
import './Skeleton.css';

/**
 * Base Skeleton Component
 * Displays a loading placeholder with shimmer animation
 */
const Skeleton = ({ 
    width = '100%', 
    height = '1rem', 
    borderRadius = '0.25rem',
    className = '',
    style = {}
}) => {
    return (
        <div
            className={`skeleton ${className}`}
            style={{
                width,
                height,
                borderRadius,
                ...style
            }}
        />
    );
};

/**
 * Skeleton Box - For rectangular placeholders
 */
export const SkeletonBox = ({ width, height, borderRadius, className }) => (
    <Skeleton 
        width={width} 
        height={height} 
        borderRadius={borderRadius} 
        className={className}
    />
);

/**
 * Skeleton Circle - For circular placeholders (avatars, icons)
 */
export const SkeletonCircle = ({ size = '40px', className }) => (
    <Skeleton 
        width={size} 
        height={size} 
        borderRadius="50%" 
        className={className}
    />
);

/**
 * Skeleton Text - For text lines
 */
export const SkeletonText = ({ lines = 1, width = '100%', className = '' }) => {
    if (lines === 1) {
        return <Skeleton width={width} height="1rem" className={className} />;
    }
    
    return (
        <div className={className}>
            {Array.from({ length: lines }).map((_, index) => (
                <Skeleton
                    key={index}
                    width={index === lines - 1 ? '80%' : '100%'}
                    height="1rem"
                    className="mb-2"
                />
            ))}
        </div>
    );
};

/**
 * Skeleton Button - For button placeholders
 */
export const SkeletonButton = ({ width = '120px', height = '40px', className = '' }) => (
    <Skeleton 
        width={width} 
        height={height} 
        borderRadius="0.5rem"
        className={className}
    />
);

export default Skeleton;

