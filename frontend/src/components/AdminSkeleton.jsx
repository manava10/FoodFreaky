import React from 'react';
import { SkeletonBox, SkeletonText } from './Skeleton';
import { OrderListSkeleton } from './OrderCardSkeleton';

/**
 * Admin Stat Card Skeleton
 */
export const AdminStatCardSkeleton = () => {
    return (
        <div className="admin-stat-card">
            <SkeletonBox width="60%" height="1.5rem" className="mb-4" />
            <SkeletonBox width="80%" height="2.5rem" />
        </div>
    );
};

/**
 * Admin Page Skeleton
 */
export const AdminPageSkeleton = () => {
    return (
        <div className="space-y-8">
            {/* Analytics Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AdminStatCardSkeleton />
                <AdminStatCardSkeleton />
            </div>

            {/* Management Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="admin-management-card">
                    <SkeletonBox width="40%" height="2rem" className="mb-4" />
                    <div className="space-y-4">
                        <SkeletonBox width="100%" height="48px" borderRadius="0.5rem" />
                        <SkeletonBox width="100%" height="48px" borderRadius="0.5rem" />
                        <SkeletonBox width="100%" height="48px" borderRadius="0.5rem" />
                    </div>
                </div>
                <div className="admin-management-card">
                    <SkeletonBox width="40%" height="2rem" className="mb-4" />
                    <div className="space-y-4">
                        <SkeletonBox width="100%" height="200px" borderRadius="0.5rem" />
                    </div>
                </div>
            </div>

            {/* Orders Section */}
            <div className="admin-management-card">
                <SkeletonBox width="50%" height="2rem" className="mb-4" />
                <OrderListSkeleton count={3} />
            </div>
        </div>
    );
};

export default AdminPageSkeleton;

