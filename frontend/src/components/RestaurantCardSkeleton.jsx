import React from 'react';
import { SkeletonBox, SkeletonText, SkeletonCircle } from './Skeleton';

/**
 * Skeleton for Restaurant Card
 * Matches the structure of RestaurantPage restaurant cards
 */
const RestaurantCardSkeleton = () => {
    return (
        <div className="restaurant-card bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Image skeleton */}
            <SkeletonBox 
                width="100%" 
                height="192px" 
                borderRadius="0"
                className="mb-0"
            />
            
            {/* Content skeleton */}
            <div className="p-6">
                {/* Title and cuisine */}
                <div className="mb-3">
                    <SkeletonBox width="70%" height="1.5rem" className="mb-2" />
                    <SkeletonBox width="50%" height="1rem" />
                </div>
                
                {/* Rating and delivery time */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <SkeletonCircle size="16px" />
                        <SkeletonBox width="60px" height="1rem" />
                    </div>
                    <SkeletonBox width="80px" height="1rem" />
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                    <SkeletonBox width="60px" height="24px" borderRadius="9999px" />
                    <SkeletonBox width="70px" height="24px" borderRadius="9999px" />
                    <SkeletonBox width="55px" height="24px" borderRadius="9999px" />
                </div>
            </div>
        </div>
    );
};

/**
 * Restaurant List Skeleton
 * Shows multiple restaurant card skeletons in a grid
 */
export const RestaurantListSkeleton = ({ count = 6 }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, index) => (
                <RestaurantCardSkeleton key={index} />
            ))}
        </div>
    );
};

export default RestaurantCardSkeleton;

