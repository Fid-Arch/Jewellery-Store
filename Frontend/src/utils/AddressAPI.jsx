async function createAddress(userId, addressData, token) {
    try {
        const response = await fetch(`http://localhost:3000/api/addresses`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`, // ✅ Auth with token
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId, // ✅ Associate with user
                ...addressData // e.g., { street, city, state, postalCode, country }
            })
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Create address failed');
        }
        return result; // e.g., { address: { id, street, ... } }
    } catch (error) {
        console.error('Error creating address:', error);
        throw error;
    }
}

export {
    createAddress
};