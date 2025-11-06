import React from 'react';
import './EmptyState.css';

/**
 * Reusable Empty State Component
 * Displays helpful messages when there's no data to show
 */
const EmptyState = ({
    icon = '📭',
    title = 'Nothing here yet',
    message = 'This section is empty',
    actionLabel,
    action,
    className = '',
    size = 'medium' // 'small', 'medium', 'large'
}) => {
    const sizeClasses = {
        small: 'empty-state-small',
        medium: 'empty-state-medium',
        large: 'empty-state-large'
    };

    return (
        <div className={`empty-state ${sizeClasses[size]} ${className}`}>
            <div className="empty-state-icon">{icon}</div>
            <h3 className="empty-state-title">{title}</h3>
            <p className="empty-state-message">{message}</p>
            {actionLabel && action && (
                <button onClick={action} className="empty-state-action">
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

/**
 * Empty Cart State
 */
export const EmptyCart = ({ onBrowseRestaurants }) => (
    <EmptyState
        icon="🛒"
        title="Your cart is empty"
        message="Start adding delicious items to your cart from our amazing restaurants!"
        actionLabel="Browse Restaurants"
        action={onBrowseRestaurants}
        size="medium"
    />
);

/**
 * Empty Search Results State
 */
export const EmptySearchResults = ({ searchQuery, onClearSearch, onClearFilters }) => (
    <EmptyState
        icon="🔍"
        title={`No results found${searchQuery ? ` for "${searchQuery}"` : ''}`}
        message={searchQuery 
            ? "We couldn't find anything matching your search. Try different keywords or browse our restaurants."
            : "No items match your current filters. Try adjusting your search criteria."
        }
        actionLabel={searchQuery ? "Clear Search" : "Clear Filters"}
        action={searchQuery ? onClearSearch : onClearFilters}
        size="medium"
    />
);

/**
 * Empty Orders State
 */
export const EmptyOrders = ({ onBrowseRestaurants, isAdmin = false }) => (
    <EmptyState
        icon="📦"
        title={isAdmin ? "No orders yet" : "No orders yet"}
        message={isAdmin 
            ? "Orders will appear here once customers start placing them."
            : "You haven't placed any orders yet. Browse our restaurants and place your first order!"
        }
        actionLabel={!isAdmin ? "Browse Restaurants" : undefined}
        action={!isAdmin ? onBrowseRestaurants : undefined}
        size="large"
    />
);

/**
 * Empty Restaurants State
 */
export const EmptyRestaurants = ({ onClearFilters, hasFilters = false }) => (
    <EmptyState
        icon="🍽️"
        title="No restaurants found"
        message={hasFilters 
            ? "We couldn't find any restaurants matching your filters. Try adjusting your search criteria."
            : "We're working on adding more restaurants. Check back soon!"
        }
        actionLabel={hasFilters ? "Clear All Filters" : undefined}
        action={hasFilters ? onClearFilters : undefined}
        size="large"
    />
);

/**
 * Empty Menu Items State
 */
export const EmptyMenuItems = ({ searchQuery, onClearSearch }) => (
    <EmptyState
        icon="🍕"
        title={searchQuery ? "No items found" : "No items in this category"}
        message={searchQuery 
            ? `We couldn't find any items matching "${searchQuery}". Try a different search term.`
            : "This category doesn't have any items yet."
        }
        actionLabel={searchQuery ? "Clear Search" : undefined}
        action={searchQuery ? onClearSearch : undefined}
        size="medium"
    />
);

export default EmptyState;

