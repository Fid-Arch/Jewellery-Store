// Legacy API functions - now using centralized service
import { productAPI } from '../services/apiService';

// Re-export all product API functions for backward compatibility
export const {
    getAllProducts,
    getProductById,
    searchProducts,
    getFeaturedProducts,
    getProductsByCategory,
    getProductSuggestions,
    getProductItems,
    createProduct,
    updateProduct,
    updateProductItem,
    createProductItem,
    deleteProduct
} = productAPI;

// Legacy function for backward compatibility
export const createProductWithStock = async (productData) => {
    try {
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
                const itemResult = await createProductItem(productResult.productId, itemData);
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
};

// Legacy function for backward compatibility
export const updateProductWithStock = async (productId, productData) => {
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
                await createProductItem(productId, itemData);
            }
        }
        
        console.log('=== updateProductWithStock COMPLETED ===');
        return { Message: 'Product updated successfully' };
    } catch (error) {
        console.error('=== updateProductWithStock ERROR ===');
        console.error('Error updating product with stock:', error);
        throw error;
    }
};