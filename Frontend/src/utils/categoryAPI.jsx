// Helper function to get auth token
const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

// Get all categories
async function getAllCategories() {
    try {
        const response = await fetch(`http://localhost:3000/categories`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to get categories');
        }
        return result;
    } catch (error) {
        console.error('Error getting categories:', error);
        throw error;
    }
}

export {
    getAllCategories
};