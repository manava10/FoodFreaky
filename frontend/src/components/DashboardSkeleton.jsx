import React from 'react';
import { SkeletonBox, SkeletonText, SkeletonCircle } from './Skeleton';

/**
 * Dashboard Welcome Section Skeleton
 */
export const DashboardWelcomeSkeleton = () => {
    return (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 mb-8 shadow-lg">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <SkeletonBox width="300px" height="2rem" className="mb-2" />
                    <SkeletonBox width="250px" height="1.5rem" className="mb-4" />
                    <div className="flex items-center space-x-2 md:space-x-6">
                        <div className="bg-white/20 rounded-lg p-3">
                            <SkeletonBox width="60px" height="2rem" className="mb-2 mx-auto" />
                            <SkeletonBox width="120px" height="1rem" className="mx-auto" />
                        </div>
                        <div className="bg-white/20 rounded-lg p-3">
                            <SkeletonBox width="80px" height="2rem" className="mb-2 mx-auto" />
                            <SkeletonBox width="100px" height="1rem" className="mx-auto" />
                        </div>
                    </div>
                </div>
                <SkeletonCircle size="120px" className="hidden md:block" />
            </div>
        </div>
    );
};

export default DashboardWelcomeSkeleton;

