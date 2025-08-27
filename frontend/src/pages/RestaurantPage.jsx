import { Link } from "react-router-dom";

function RestaurantPage() {
    return (
        <div>
            <h1>Restaurant Page 🍕</h1>
            <p>Here we’ll list all the restaurants...</p>

            {/* Back button to go to Homepage */}
            <Link to="/">
                <button>Back to Homepage</button>
            </Link>
        </div>
    );
}

export default RestaurantPage;