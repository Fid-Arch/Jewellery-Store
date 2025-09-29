const pool = require('../config/database');

// Create Category
async function createCategory(req, res) {
    try {
        const { name, parent_categories_id } = req.body;
        if (!name) {
            return res.status(400).json({ Message: 'Category name is required' });
        }

        // Check if parent category exists (if provided)
        if (parent_categories_id) {
            const [parentCategory] = await pool.query(
                'SELECT category_id FROM categories WHERE category_id = ?', 
                [parent_categories_id]
            );
            if (parentCategory.length === 0) {
                return res.status(404).json({ Message: 'Parent category not found' });
            }
        }

        // Check if category name already exists at the same level
        const [existingCategory] = await pool.query(
            'SELECT category_id FROM categories WHERE name = ? AND parent_categories_id = ?', 
            [name, parent_categories_id || null]
        );
        
        if (existingCategory.length > 0) {
            return res.status(409).json({ Message: 'Category name already exists at this level' });
        }

        const [category] = await pool.query(
            'INSERT INTO categories (name, parent_categories_id) VALUES (?, ?)', 
            [name, parent_categories_id || null]
        );
        
        res.status(201).json({
            Message: 'Category created successfully',
            data: {
                categoryId: category.insertId,
                name,
                parent_categories_id: parent_categories_id || null
            }
        });
    } catch (error) {
        console.error('ERROR Creating Category:', error);
        res.status(500).json({ Error: 'Error creating category' });
    }
}

// Get All Categories
async function getAllCategories(req, res) {
    try {
        const { includeProducts = false } = req.query;

        let query = `
            SELECT c1.category_id, c1.name, c1.parent_categories_id, c2.name as parent_category_name
            FROM categories c1
            LEFT JOIN categories c2 ON c1.parent_categories_id = c2.category_id
            ORDER BY c1.parent_categories_id, c1.name
        `;

        if (includeProducts === 'true') {
            query = `
                SELECT c1.category_id, c1.name, c1.parent_categories_id, c2.name as parent_category_name,
                       COUNT(p.product_id) as product_count
                FROM categories c1
                LEFT JOIN categories c2 ON c1.parent_categories_id = c2.category_id
                LEFT JOIN products p ON c1.category_id = p.category_id
                GROUP BY c1.category_id, c1.name, c1.parent_categories_id, c2.name
                ORDER BY c1.parent_categories_id, c1.name
            `;
        }

        const [categories] = await pool.query(query);

        // Structure categories hierarchically
        const categoryMap = new Map();
        const rootCategories = [];

        categories.forEach(category => {
            categoryMap.set(category.category_id, {
                ...category,
                children: []
            });
        });

        categories.forEach(category => {
            if (category.parent_categories_id) {
                const parent = categoryMap.get(category.parent_categories_id);
                if (parent) {
                    parent.children.push(categoryMap.get(category.category_id));
                }
            } else {
                rootCategories.push(categoryMap.get(category.category_id));
            }
        });

        res.status(200).json({
            data: {
                categories: rootCategories,
                total: categories.length
            }
        });
    } catch (error) {
        console.error('ERROR Fetching Categories:', error);
        res.status(500).json({ Error: 'Error fetching categories' });
    }
}

// Get Category by ID
async function getCategoryById(req, res) {
    try {
        const { categoryId } = req.params;

        const [categories] = await pool.query(`
            SELECT c1.category_id, c1.name, c1.parent_categories_id, c2.name as parent_category_name,
                   COUNT(p.product_id) as product_count
            FROM categories c1
            LEFT JOIN categories c2 ON c1.parent_categories_id = c2.category_id
            LEFT JOIN products p ON c1.category_id = p.category_id
            WHERE c1.category_id = ?
            GROUP BY c1.category_id, c1.name, c1.parent_categories_id, c2.name
        `, [categoryId]);

        if (categories.length === 0) {
            return res.status(404).json({ Message: 'Category not found' });
        }

        // Get subcategories
        const [subcategories] = await pool.query(
            'SELECT category_id, name FROM categories WHERE parent_categories_id = ?',
            [categoryId]
        );

        const category = {
            ...categories[0],
            subcategories
        };

        res.status(200).json({ data: category });
    } catch (error) {
        console.error('ERROR Fetching Category by ID:', error);
        res.status(500).json({ Error: 'Error fetching category' });
    }
}

// Update Category
async function updateCategory(req, res) {
    try {
        const { categoryId } = req.params;
        const { name, parent_categories_id } = req.body;

        if (!name) {
            return res.status(400).json({ Message: 'Category name is required' });
        }

        // Check if category exists
        const [existingCategory] = await pool.query(
            'SELECT category_id FROM categories WHERE category_id = ?', 
            [categoryId]
        );
        
        if (existingCategory.length === 0) {
            return res.status(404).json({ Message: 'Category not found' });
        }

        // Check if parent category exists (if provided)
        if (parent_categories_id) {
            const [parentCategory] = await pool.query(
                'SELECT category_id FROM categories WHERE category_id = ?', 
                [parent_categories_id]
            );
            if (parentCategory.length === 0) {
                return res.status(404).json({ Message: 'Parent category not found' });
            }

            // Prevent circular reference
            if (parseInt(parent_categories_id) === parseInt(categoryId)) {
                return res.status(400).json({ Message: 'Category cannot be its own parent' });
            }
        }

        // Check if category name already exists at the same level (excluding current category)
        const [duplicateCategory] = await pool.query(
            'SELECT category_id FROM categories WHERE name = ? AND parent_categories_id = ? AND category_id != ?', 
            [name, parent_categories_id || null, categoryId]
        );
        
        if (duplicateCategory.length > 0) {
            return res.status(409).json({ Message: 'Category name already exists at this level' });
        }

        const [result] = await pool.query(
            'UPDATE categories SET name = ?, parent_categories_id = ? WHERE category_id = ?',
            [name, parent_categories_id || null, categoryId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ Message: 'Category not found or no changes made' });
        }

        res.status(200).json({
            Message: 'Category updated successfully',
            data: {
                categoryId: parseInt(categoryId),
                name,
                parent_categories_id: parent_categories_id || null
            }
        });
    } catch (error) {
        console.error('ERROR Updating Category:', error);
        res.status(500).json({ Error: 'Error updating category' });
    }
}

// Delete Category
async function deleteCategory(req, res) {
    try {
        const { categoryId } = req.params;

        // Check if category exists
        const [existingCategory] = await pool.query(
            'SELECT category_id FROM categories WHERE category_id = ?', 
            [categoryId]
        );
        
        if (existingCategory.length === 0) {
            return res.status(404).json({ Message: 'Category not found' });
        }

        // Check if category has products
        const [products] = await pool.query(
            'SELECT COUNT(*) as count FROM products WHERE category_id = ?', 
            [categoryId]
        );
        
        if (products[0].count > 0) {
            return res.status(400).json({ 
                Message: 'Cannot delete category with existing products',
                productCount: products[0].count
            });
        }

        // Check if category has subcategories
        const [subcategories] = await pool.query(
            'SELECT COUNT(*) as count FROM categories WHERE parent_categories_id = ?', 
            [categoryId]
        );
        
        if (subcategories[0].count > 0) {
            return res.status(400).json({ 
                Message: 'Cannot delete category with subcategories',
                subcategoryCount: subcategories[0].count
            });
        }

        const [result] = await pool.query('DELETE FROM categories WHERE category_id = ?', [categoryId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ Message: 'Category not found' });
        }

        res.status(200).json({ Message: 'Category deleted successfully' });
    } catch (error) {
        console.error('ERROR Deleting Category:', error);
        res.status(500).json({ Error: 'Error deleting category' });
    }
}

// Get Products by Category
async function getProductsByCategory(req, res) {
    try {
        const { categoryId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;

        // Check if category exists
        const [categoryCheck] = await pool.query(
            'SELECT category_id, name FROM categories WHERE category_id = ?', 
            [categoryId]
        );
        
        if (categoryCheck.length === 0) {
            return res.status(404).json({ Message: 'Category not found' });
        }

        const [products] = await pool.query(`
            SELECT p.product_id, p.productname, p.description, p.product_image, p.is_featured, p.created_at,
                   c.name as category_name,
                   MIN(pi.price) as min_price,
                   MAX(pi.price) as max_price,
                   SUM(pi.qty_in_stock) as total_stock
            FROM products p
            JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN product_item pi ON p.product_id = pi.product_id
            WHERE p.category_id = ?
            GROUP BY p.product_id, p.productname, p.description, p.product_image, p.is_featured, p.created_at, c.name
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `, [categoryId, limit, offset]);

        const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM products WHERE category_id = ?', 
            [categoryId]
        );

        res.status(200).json({
            data: {
                category: categoryCheck[0],
                products,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(countResult[0].total / limit),
                    totalItems: countResult[0].total,
                    hasNextPage: page < Math.ceil(countResult[0].total / limit),
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error) {
        console.error('ERROR Fetching Products by Category:', error);
        res.status(500).json({ Error: 'Error fetching products by category' });
    }
}

module.exports = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    getProductsByCategory
};