const pool = require('../config/database');

// Create Product
async function createProduct(req, res) {
    try {
        const { productname, description, product_image, is_featured = true, category_id, supplier_id } = req.body;

        if (!productname || !description) {
            return res.status(400).json({ Message: 'Missing required fields: productname and description are required' });
        }
        
        // Handle empty strings for foreign key fields - convert to null
        const cleanCategoryId = category_id && category_id !== '' ? parseInt(category_id) : null;
        const cleanSupplierId = supplier_id && supplier_id !== '' ? parseInt(supplier_id) : null;
        
        const [product] = await pool.query(`
            INSERT INTO products (productname, description, product_image, is_featured, category_id, supplier_id) 
            VALUES (?,?,?,?,?,?)`, 
            [productname, description, product_image, is_featured, cleanCategoryId, cleanSupplierId]);
            
        res.status(201).json({
            Message: 'Product created successfully',
            productId: product.insertId,
            product: {
                id: product.insertId,
                productname,
                description,
                product_image,
                is_featured,
                category_id: cleanCategoryId,
                supplier_id: cleanSupplierId
            }
        });
    } catch (error) {
        console.error('ERROR Creating Product:', error);
        res.status(500).json({ Message: 'Error creating product', error: error.message });
    }
}

// Get All Products with pagination
async function getAllProducts(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const [results] = await pool.query('SELECT COUNT(*) as total FROM products');
        const totalProducts = results[0].total;

        const [products] = await pool.query(`
            SELECT p.product_id, p.productname, p.description, p.product_image, p.is_featured, p.created_at, p.updated_at, 
                   c.name as category_name, s.name as supplier_name,
                   MIN(pi.price) as min_price,
                   MAX(pi.price) as max_price,
                   COUNT(DISTINCT pi.product_item_id) as variants_count
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
            LEFT JOIN product_item pi ON p.product_id = pi.product_id
            GROUP BY p.product_id
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?`, [limit, offset]);
            
        res.status(200).json({
            data: {
                products,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalProducts / limit),
                    totalItems: totalProducts,
                    hasNextPage: page < Math.ceil(totalProducts / limit),
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error) {
        console.error('ERROR Fetching Products:', error);
        res.status(500).json({ Error: 'Error Fetching data from the database' });
    }
}

// Get Product By ID
async function getProductById(req, res) {
    try {
        const { id } = req.params;
        const [products] = await pool.query(`
            SELECT p.product_id, p.productname, p.description, p.product_image, p.is_featured, p.created_at, p.updated_at, 
                   c.name as category_name, s.name as supplier_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
            WHERE p.product_id = ?`, [id]);

        if (products.length === 0) {
            return res.status(404).json({ Message: 'Product not found' });
        }

        const [productItems] = await pool.query(`
            SELECT product_item_id, sku, qty_in_stock, product_image, price
            FROM product_item
            WHERE product_id = ?`, [id]);

        const [variations] = await pool.query(`
            SELECT v.variation_id, v.name, vo.variation_option_id, vo.value
            FROM product_variation pv
            JOIN variation v ON pv.variation_id = v.variation_id
            LEFT JOIN variation_option vo ON v.variation_id = vo.variation_id
            WHERE pv.product_id = ?`, [id]);

        const product = { ...products[0], items: productItems, variations: variations };
        res.status(200).json({ data: product });
    } catch (error) {
        console.error('ERROR Fetching Product by ID:', error);
        res.status(500).json({ Error: 'Error Fetching data from the database' });
    }
}

// Update Product
async function updateProduct(req, res) {
    try {
        const { id } = req.params;
        const updateFields = req.body;

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ Message: 'No fields to update' });
        }

        const allowedFields = ['productname', 'description', 'product_image', 'is_featured', 'category_id', 'supplier_id'];
        const validFields = {};

        Object.keys(updateFields).forEach(key => {
            if (allowedFields.includes(key)) {
                let value = updateFields[key];
                // Handle empty strings for foreign key fields - convert to null
                if ((key === 'category_id' || key === 'supplier_id') && (value === '' || value === null)) {
                    value = null;
                } else if ((key === 'category_id' || key === 'supplier_id') && value) {
                    value = parseInt(value);
                }
                validFields[key] = value;
            }
        });

        const [result] = await pool.query('UPDATE products SET ? WHERE product_id = ?', [validFields, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ Message: 'Product not found or no changes made' });
        }
        res.status(200).json({ Message: 'Product updated successfully' });
    } catch (error) {
        console.error('ERROR Updating Product:', error);
        res.status(500).json({ Error: 'Error Updating data in the database' });
    }
}

// Delete Product
async function deleteProduct(req, res) {
    try {
        const { id } = req.params;
        const [product] = await pool.query('SELECT product_id FROM products WHERE product_id = ?', [id]);

        if (product.length === 0) {
            return res.status(404).json({ Message: 'Product not found' });
        }

        await pool.query('DELETE FROM products WHERE product_id = ?', [id]);
        res.status(200).json({ Message: 'Product deleted successfully' });
    } catch (error) {
        console.error('ERROR Deleting Product:', error);
        res.status(500).json({ Error: 'Error Deleting data from the database' });
    }
}

// Search Products
async function searchProducts(req, res) {
    try {
        const {
            query = '', category, MinPrice, MaxPrice, featured, page = 1, limit = 12, sortBy = 'created_at', sortOrder = 'desc'
        } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let queryParams = [];

        if (query) {
            whereConditions.push('(p.productname LIKE ? OR p.description LIKE ?)');
            queryParams.push(`%${query}%`, `%${query}%`);
        }

        if (category) {
            whereConditions.push('c.category_id = ?');
            queryParams.push(category);
        }

        if (MinPrice || MaxPrice) {
            if (MinPrice) {
                whereConditions.push('pi.price >= ?');
                queryParams.push(parseFloat(MinPrice));
            }
            if (MaxPrice) {
                whereConditions.push('pi.price <= ?');
                queryParams.push(parseFloat(MaxPrice));
            }
        }

        if (featured !== undefined) {
            whereConditions.push('p.is_featured = ?');
            queryParams.push(featured === 'true' ? 1 : 0);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        const validSortColumns = ['created_at', 'productname', 'price'];
        const validSortOrder = ['ASC', 'DESC'];

        const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
        const finalSortOrder = validSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

        const searchQuery = `
            SELECT p.product_id, p.productname, p.description, p.product_image, p.is_featured, p.created_at, 
                c.name as category_name,
                MIN(pi.price) as min_price,
                MAX(pi.price) as max_price,
                COUNT(DISTINCT pi.product_item_id) as variants_count
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN product_item pi ON p.product_id = pi.product_id
            ${whereClause}
            GROUP BY p.product_id
            ORDER BY ${finalSortBy} ${finalSortOrder}
            LIMIT ? OFFSET ?`;

        queryParams.push(parseInt(limit), parseInt(offset));

        const [products] = await pool.query(searchQuery, queryParams);

        const countQuery = `
            SELECT COUNT(DISTINCT p.product_id) as total
            FROM products p
            LEFT JOIN product_item pi ON p.product_id = pi.product_id
            ${whereClause}`;

        const [countResult] = await pool.query(countQuery, queryParams.slice(0, -2));
        const totalProducts = countResult[0].total;

        res.status(200).json({
            data: {
                products,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalProducts / limit),
                    totalProducts,
                    hasNextPage: page < Math.ceil(totalProducts / limit),
                    hasPrevPage: page > 1
                },
                appliedFilters: {
                    query,
                    category,
                    MinPrice,
                    MaxPrice,
                    featured,
                    sortBy,
                    sortOrder
                }
            }
        });
    } catch (error) {
        console.error('ERROR Searching Products:', error);
        res.status(500).json({ Error: 'Error searching products' });
    }
}

// Get Featured Products
async function getFeaturedProducts(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 8;
        
        const [products] = await pool.query(`
            SELECT p.product_id, p.productname, p.description, p.product_image, p.is_featured, p.created_at,
                   c.name as category_name,
                   MIN(pi.price) as min_price,
                   MAX(pi.price) as max_price
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN product_item pi ON p.product_id = pi.product_id
            WHERE p.is_featured = 1
            GROUP BY p.product_id
            ORDER BY p.created_at DESC
            LIMIT ?`, [limit]);

        res.status(200).json({
            data: {
                products,
                totalFeatured: products.length
            }
        });
    } catch (error) {
        console.error('ERROR Fetching Featured Products:', error);
        res.status(500).json({ Error: 'Error fetching featured products' });
    }
}

// Get Product Suggestions
async function getProductSuggestions(req, res) {
    try {
        const { productId } = req.params;
        const limit = parseInt(req.query.limit) || 4;

        // Get current product's category
        const [currentProduct] = await pool.query(
            'SELECT category_id FROM products WHERE product_id = ?', 
            [productId]
        );

        if (currentProduct.length === 0) {
            return res.status(404).json({ Message: 'Product not found' });
        }

        const categoryId = currentProduct[0].category_id;

        // Get related products from same category
        const [suggestions] = await pool.query(`
            SELECT p.product_id, p.productname, p.description, p.product_image, p.is_featured,
                   c.name as category_name,
                   MIN(pi.price) as min_price,
                   MAX(pi.price) as max_price
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN product_item pi ON p.product_id = pi.product_id
            WHERE p.category_id = ? AND p.product_id != ?
            GROUP BY p.product_id
            ORDER BY p.is_featured DESC, RAND()
            LIMIT ?`, [categoryId, productId, limit]);

        res.status(200).json({
            data: {
                suggestions,
                totalSuggestions: suggestions.length
            }
        });
    } catch (error) {
        console.error('ERROR Fetching Product Suggestions:', error);
        res.status(500).json({ Error: 'Error fetching product suggestions' });
    }
}

// Get Products by Category
async function getProductByCategory(req, res) {
    try {
        const { categoryId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;

        const [products] = await pool.query(`
            SELECT p.product_id, p.productname, p.description, p.product_image, p.is_featured, p.created_at,
                   c.name as category_name,
                   MIN(pi.price) as min_price,
                   MAX(pi.price) as max_price
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN product_item pi ON p.product_id = pi.product_id
            WHERE p.category_id = ?
            GROUP BY p.product_id
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?`, [categoryId, limit, offset]);

        const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM products WHERE category_id = ?', 
            [categoryId]
        );
        const totalProducts = countResult[0].total;

        res.status(200).json({
            data: {
                products,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalProducts / limit),
                    totalItems: totalProducts,
                    hasNextPage: page < Math.ceil(totalProducts / limit),
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error) {
        console.error('ERROR Fetching Products by Category:', error);
        res.status(500).json({ Error: 'Error fetching products by category' });
    }
}

// Create Product Item (Stock Entry)
async function createProductItem(req, res) {
    try {
        const { productId } = req.params;
        const { sku, price, qty_in_stock, product_image } = req.body;

        if (!sku || !price) {
            return res.status(400).json({ Message: 'SKU and price are required' });
        }

        const [item] = await pool.query(`
            INSERT INTO product_item (product_id, sku, price, qty_in_stock, product_image) 
            VALUES (?,?,?,?,?)`, 
            [productId, sku, parseFloat(price), parseInt(qty_in_stock) || 0, product_image]);
            
        res.status(201).json({
            Message: 'Product item created successfully',
            itemId: item.insertId
        });
    } catch (error) {
        console.error('ERROR Creating Product Item:', error);
        res.status(500).json({ Message: 'Error creating product item', error: error.message });
    }
}

// Update Product Item
async function updateProductItem(req, res) {
    try {
        const { itemId } = req.params;
        const updateFields = req.body;

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ Message: 'No fields to update' });
        }

        const allowedFields = ['sku', 'price', 'qty_in_stock', 'product_image'];
        const validFields = {};

        Object.keys(updateFields).forEach(key => {
            if (allowedFields.includes(key)) {
                let value = updateFields[key];
                if (key === 'price' && value) value = parseFloat(value);
                if (key === 'qty_in_stock' && value) value = parseInt(value);
                validFields[key] = value;
            }
        });

        const [result] = await pool.query('UPDATE product_item SET ? WHERE product_item_id = ?', [validFields, itemId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ Message: 'Product item not found' });
        }
        
        res.status(200).json({ Message: 'Product item updated successfully' });
    } catch (error) {
        console.error('ERROR Updating Product Item:', error);
        res.status(500).json({ Error: 'Error updating product item' });
    }
}

// Delete Product Item
async function deleteProductItem(req, res) {
    try {
        const { itemId } = req.params;
        
        const [result] = await pool.query('DELETE FROM product_item WHERE product_item_id = ?', [itemId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ Message: 'Product item not found' });
        }
        
        res.status(200).json({ Message: 'Product item deleted successfully' });
    } catch (error) {
        console.error('ERROR Deleting Product Item:', error);
        res.status(500).json({ Error: 'Error deleting product item' });
    }
}

// Get Product Items by Product ID
async function getProductItems(req, res) {
    try {
        const { id } = req.params;
        
        const [productItems] = await pool.query(`
            SELECT product_item_id, sku, qty_in_stock, product_image, price
            FROM product_item
            WHERE product_id = ? AND qty_in_stock > 0
            ORDER BY price ASC`, [id]);
        
        if (productItems.length === 0) {
            return res.status(404).json({ Message: 'No available product items found' });
        }
        
        res.status(200).json({ data: productItems });
    } catch (error) {
        console.error('ERROR Fetching Product Items:', error);
        res.status(500).json({ Error: 'Error fetching product items' });
    }
}

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    searchProducts,
    getFeaturedProducts,
    getProductSuggestions,
    getProductByCategory,
    createProductItem,
    updateProductItem,
    deleteProductItem,
    getProductItems
};