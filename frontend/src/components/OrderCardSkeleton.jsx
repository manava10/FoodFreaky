import React from 'react';
import { SkeletonBox, SkeletonText, SkeletonCircle } from './Skeleton';

/**
 * Skeleton for Order Card
 * Matches the structure of DashboardPage order cards
 */
const OrderCardSkeleton = () => {
    return (
        <div className="order-card bg-white bg-opacity-95 rounded-xl p-6 shadow-lg mb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <SkeletonCircle size="40px" />
                    <div>
                        <SkeletonBox width="150px" height="1.25rem" className="mb-2" />
                        <SkeletonBox width="100px" height="1rem" />
                    </div>
                </div>
                <SkeletonBox width="100px" height="32px" borderRadius="9999px" />
            </div>
            
            {/* Order items */}
            <div className="mb-4 space-y-2">
                <SkeletonBox width="100%" height="20px" />
                <SkeletonBox width="80%" height="20px" />
                <SkeletonBox width="60%" height="20px" />
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-300">
                <SkeletonBox width="120px" height="1.5rem" />
                <div className="flex space-x-2">
                    <SkeletonBox width="80px" height="36px" borderRadius="0.5rem" />
                    <SkeletonBox width="80px" height="36px" borderRadius="0.5rem" />
                </div>
            </div>
        </div>
    );
};

/**
 * Order List Skeleton
 * Shows multiple order card skeletons
 */
export const OrderListSkeleton = ({ count = 3 }) => {
    return (
        <div>
            {Array.from({ length: count }).map((_, index) => (
                <OrderCardSkeleton key={index} />
            ))}
        </div>
    );
};

export default OrderCardSkeleton;

