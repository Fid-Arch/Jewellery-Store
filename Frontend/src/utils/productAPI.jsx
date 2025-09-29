// Helper function to get auth token
const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token;
};

// Get all products with pagination
async function getAllProducts(page = 1, limit = 10) {
    try {
        const response = await fetch(`http://localhost:3000/products?page=${page}&limit=${limit}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to get products');
        }
        return result;
    } catch (error) {
        console.error('Error getting products:', error);
        throw error;
    }
}

// Get product by ID
async function getProductById(productId) {
    try {
        const response = await fetch(`http://localhost:3000/products/${productId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to get product');
        }
        return result;
    } catch (error) {
        console.error('Error getting product by ID:', error);
        throw error;
    }
}

// Search products
async function searchProducts(query, page = 1, limit = 10) {
    try {
        const response = await fetch(`http://localhost:3000/products/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to search products');
        }
        return result;
    } catch (error) {
        console.error('Error searching products:', error);
        throw error;
    }
}

// Get featured products
async function getFeaturedProducts() {
    try {
        const response = await fetch(`http://localhost:3000/products/featured`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to get featured products');
        }
        return result;
    } catch (error) {
        console.error('Error getting featured products:', error);
        throw error;
    }
}

// Get products by category
async function getProductsByCategory(categoryId, page = 1, limit = 10) {
    try {
        const response = await fetch(`http://localhost:3000/products/category/${categoryId}?page=${page}&limit=${limit}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to get products by category');
        }
        return result;
    } catch (error) {
        console.error('Error getting products by category:', error);
        throw error;
    }
}

// Get product suggestions
async function getProductSuggestions(productId) {
    try {
        const response = await fetch(`http://localhost:3000/products/${productId}/suggestions`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to get product suggestions');
        }
        return result;
    } catch (error) {
        console.error('Error getting product suggestions:', error);
        throw error;
    }
}

// Admin functions - require authentication

// Create product (Admin only)
async function createProduct(productData) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in as admin to create products');
        }

        const response = await fetch(`http://localhost:3000/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });
        
        const result = await response.json();
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Your session has expired. Please log in again.');
            } else if (response.status === 403) {
                throw new Error('Access denied. Admin privileges required.');
            }
            throw new Error(result.Message || result.message || 'Failed to create product');
        }
        return result;
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
}

// Update product (Admin only)
async function updateProduct(productId, productData) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in as admin to update products');
        }

        const response = await fetch(`http://localhost:3000/products/${productId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData)
        });
        
        const result = await response.json();
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Your session has expired. Please log in again.');
            } else if (response.status === 403) {
                throw new Error('Access denied. Admin privileges required.');
            }
            throw new Error(result.Message || result.message || 'Failed to update product');
        }
        return result;
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
}

// Update product item (Admin only)
async function updateProductItem(itemId, itemData) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in as admin to update product items');
        }

        const response = await fetch(`http://localhost:3000/products/items/${itemId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(itemData)
        });
        
        const result = await response.json();
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Your session has expired. Please log in again.');
            } else if (response.status === 403) {
                throw new Error('Access denied. Admin privileges required.');
            }
            throw new Error(result.Message || result.message || 'Failed to update product item');
        }
        return result;
    } catch (error) {
        console.error('Error updating product item:', error);
        throw error;
    }
}

// Get product items by product ID
async function getProductItems(productId) {
    try {
        const response = await fetch(`http://localhost:3000/products/${productId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.Message || result.message || 'Failed to get product items');
        }
        return result;
    } catch (error) {
        console.error('Error getting product items:', error);
        throw error;
    }
}

// Update product with stock (combines product and product item updates)
async function updateProductWithStock(productId, productData) {
    try {
        console.log('=== updateProductWithStock START ===');
        console.log('Product ID:', productId);
        console.log('Product Data:', productData);
        
        // Separate product data from stock data
        const { sku, price, qty_in_stock, ...baseProductData } = productData;
        console.log('Base product data:', baseProductData);
        console.log('Stock data - SKU:', sku, 'Price:', price, 'Qty:', qty_in_stock);
        
        // Update basic product information
        console.log('Updating basic product info...');
        await updateProduct(productId, baseProductData);
        console.log('Basic product update completed');
        
        // If stock data provided, get existing product items and update the first one
        if (sku || price || qty_in_stock) {
            console.log('Stock data provided, getting existing product items...');
            const productDetail = await getProductItems(productId);
            console.log('Product detail response:', productDetail);
            const productItems = productDetail.data?.items || [];
            console.log('Product items found:', productItems);
            
            if (productItems.length > 0) {
                // Update existing product item
                const itemId = productItems[0].product_item_id;
                const itemData = {};
                if (sku !== undefined) itemData.sku = sku;
                if (price !== undefined) itemData.price = parseFloat(price);
                if (qty_in_stock !== undefined) itemData.qty_in_stock = parseInt(qty_in_stock);
                
                console.log('Updating product item:', itemId, itemData);
                await updateProductItem(itemId, itemData);
            } else {
                // Create new product item if none exists
                const itemData = {
                    sku: sku || `SKU-${productId}-${Date.now()}`,
                    price: parseFloat(price) || 0,
                    qty_in_stock: parseInt(qty_in_stock) || 0
                };
                console.log('Creating new product item:', itemData);
                await createProductItem({ 
                    product_id: productId, 
                    ...itemData 
                });
            }
        }
        
        console.log('=== updateProductWithStock COMPLETED ===');
        return { Message: 'Product updated successfully' };
    } catch (error) {
        console.error('=== updateProductWithStock ERROR ===');
        console.error('Error updating product with stock:', error);
        throw error;
    }
}

// Delete product (Admin only)
async function deleteProduct(productId) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in as admin to delete products');
        }

        const response = await fetch(`http://localhost:3000/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Your session has expired. Please log in again.');
            } else if (response.status === 403) {
                throw new Error('Access denied. Admin privileges required.');
            }
            throw new Error(result.Message || result.message || 'Failed to delete product');
        }
        return result;
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
}

// Create product with stock item (Admin only)
async function createProductWithStock(productData) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in as admin to create products');
        }

        console.log('Creating product with data:', productData);

        // First create the product
        const productResult = await createProduct(productData);
        console.log('Product created:', productResult);
        
        // If price and stock info provided, create product item
        if (productData.price || productData.qty_in_stock || productData.sku) {
            const itemData = {
                product_id: productResult.productId,
                sku: productData.sku || `SKU-${productResult.productId}`,
                price: parseFloat(productData.price) || 0,
                qty_in_stock: parseInt(productData.qty_in_stock) || 0,
                product_image: productData.product_image || null
            };
            
            console.log('Creating product item with data:', itemData);
            
            try {
                const itemResult = await createProductItem(itemData);
                console.log('Product item created:', itemResult);
            } catch (itemError) {
                console.error('Failed to create product item:', itemError);
                // Don't fail the whole operation, but log the error
            }
        } else {
            console.log('No stock data provided, skipping product item creation');
        }
        
        return productResult;
    } catch (error) {
        console.error('Error creating product with stock:', error);
        throw error;
    }
}

// Create product item (stock entry)
async function createProductItem(itemData) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Please log in as admin');
        }

        console.log('Sending product item request to:', `http://localhost:3000/products/${itemData.product_id}/items`);
        console.log('With data:', itemData);

        const response = await fetch(`http://localhost:3000/products/${itemData.product_id}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                sku: itemData.sku,
                price: itemData.price,
                qty_in_stock: itemData.qty_in_stock,
                product_image: itemData.product_image
            })
        });
        
        const result = await response.json();
        console.log('Product item API response:', result);
        
        if (!response.ok) {
            console.error('Product item creation failed:', response.status, result);
            throw new Error(result.Message || result.message || 'Failed to create product item');
        }
        return result;
    } catch (error) {
        console.error('Error creating product item:', error);
        throw error;
    }
}

export {
    getAllProducts,
    getProductById,
    searchProducts,
    getFeaturedProducts,
    getProductsByCategory,
    getProductSuggestions,
    createProduct,
    updateProduct,
    deleteProduct,
    createProductWithStock,
    createProductItem,
    updateProductItem,
    getProductItems,
    updateProductWithStock
};