import React from 'react';
import { SkeletonBox, SkeletonText } from './Skeleton';

/**
 * Skeleton for Menu Item Card
 * Matches the structure of RestaurantPage menu items
 */
const MenuItemSkeleton = () => {
    return (
        <div className="menu-item-card bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    {/* Item name */}
                    <SkeletonBox width="60%" height="1.5rem" className="mb-2" />
                    
                    {/* Description */}
                    <SkeletonBox width="80%" height="1rem" className="mb-3" />
                    
                    {/* Price and button */}
                    <div className="flex items-center justify-between">
                        <SkeletonBox width="80px" height="1.5rem" />
                        <SkeletonBox width="100px" height="40px" borderRadius="0.25rem" />
                    </div>
                </div>
                
                {/* Image */}
                <SkeletonBox 
                    width="96px" 
                    height="96px" 
                    borderRadius="0.5rem"
                    className="ml-4"
                />
            </div>
        </div>
    );
};

/**
 * Menu Item List Skeleton
 * Shows multiple menu item skeletons
 */
export const MenuItemListSkeleton = ({ count = 5 }) => {
    return (
        <div>
            {Array.from({ length: count }).map((_, index) => (
                <MenuItemSkeleton key={index} />
            ))}
        </div>
    );
};

export default MenuItemSkeleton;

