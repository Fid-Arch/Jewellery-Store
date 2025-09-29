const pool = require('../config/database');

// Get Dashboard Stats
async function getDashboardStats(req, res) {
    try {
        console.log('Fetching dashboard stats...');
        
        // Get revenue (handle null values)
        const [revenueResult] = await pool.query(`
            SELECT COALESCE(SUM(order_total), 0) as total_revenue 
            FROM shop_orders 
            WHERE payment_status IN ('Paid', 'completed', 'success')
        `);
        
        // Get total orders
        const [ordersResult] = await pool.query('SELECT COUNT(*) as total_orders FROM shop_orders');
        
        // Get total users
        const [usersResult] = await pool.query('SELECT COUNT(*) as total_users FROM users');
        
        // Get total products
        const [productsResult] = await pool.query('SELECT COUNT(*) as total_products FROM products');

        // Get recent orders count (last 7 days)
        const [recentOrdersResult] = await pool.query(`
            SELECT COUNT(*) as recent_orders 
            FROM shop_orders 
            WHERE order_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `);

        // Get monthly revenue trend (simplified)
        const [monthlyRevenue] = await pool.query(`
            SELECT 
                DATE_FORMAT(order_date, '%Y-%m') as month,
                COALESCE(SUM(order_total), 0) as revenue
            FROM shop_orders 
            WHERE payment_status IN ('Paid', 'completed', 'success')
                AND order_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY month
            ORDER BY month ASC
        `);

        const stats = {
            totalRevenue: parseFloat(revenueResult[0].total_revenue) || 0,
            totalOrders: parseInt(ordersResult[0].total_orders) || 0,
            totalUsers: parseInt(usersResult[0].total_users) || 0,
            totalProducts: parseInt(productsResult[0].total_products) || 0,
            recentOrders: parseInt(recentOrdersResult[0].recent_orders) || 0,
            monthlyRevenue: monthlyRevenue || []
        };

        console.log('Dashboard stats:', stats);

        res.status(200).json({
            data: stats
        });
    } catch (error) {
        console.error('ERROR Fetching Dashboard Stats:', error);
        console.error('Error details:', error.message);
        res.status(500).json({ 
            Error: 'Error Fetching Dashboard Stats',
            message: error.message 
        });
    }
}

// Get All Users (Admin only)
async function getAllUsersAdmin(req, res) {
    try {
        const { page = 1, limit = 15, search = '', role } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = '';
        let queryParams = [];

        if (search) {
            whereClause += 'WHERE (u.firstName LIKE ? OR u.lastName LIKE ? OR u.email LIKE ?) ';
            queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (role) {
            whereClause += whereClause ? 'AND r.role_name = ? ' : 'WHERE r.role_name = ? ';
            queryParams.push(role);
        }

        const [users] = await pool.query(`
            SELECT u.user_id, u.firstName, u.lastName, u.email, u.phoneNumber, u.createdAt, r.role_name
            FROM users u
            LEFT JOIN roles r ON u.roles_id = r.roles_id
            ${whereClause}
            ORDER BY u.createdAt DESC
            LIMIT ? OFFSET ?`, [...queryParams, parseInt(limit), parseInt(offset)]);

        let totalUsers = users.length;
        let totalPages = 1;
        let countResult;
        try {
            [countResult] = await pool.query(`
                SELECT COUNT(*) as total 
                FROM users u
                LEFT JOIN roles r ON u.roles_id = r.roles_id
                ${whereClause}`, queryParams);
            totalUsers = countResult[0].total;
            totalPages = Math.ceil(totalUsers / limit);
        } catch (err) {
            console.error('Error fetching user count:', err);
        }
        res.status(200).json({
            data: {
                users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalUsers
                }
            }
        });
    } catch (error) {
        console.error('ERROR Fetching All Users:', error);
        res.status(500).json({ Error: 'Error Fetching All Users' });
    }
}

// Update User Role (Admin only)
async function updateUserRole(req, res) {
    try {
        const { userId } = req.params;
        const { roleId } = req.body;

        if (!roleId) {
            return res.status(400).json({ Message: 'Role ID is required' });
        }

        // Check if role exists
        const [roleCheck] = await pool.query('SELECT roles_id FROM roles WHERE roles_id = ?', [roleId]);
        if (roleCheck.length === 0) {
            return res.status(400).json({ Message: 'Invalid role ID' });
        }

        const [updateRole] = await pool.query('UPDATE users SET roles_id = ? WHERE user_id = ?', [roleId, userId]);
        if (updateRole.affectedRows === 0) {
            return res.status(404).json({ Message: 'User not found' });
        }

        res.status(200).json({ Message: 'User role updated successfully' });
    } catch (error) {
        console.error('ERROR Updating User Role:', error);
        res.status(500).json({ Error: 'Error Updating User Role' });
    }
}

// Delete User (Admin only)
async function deleteUserAdmin(req, res) {
    try {
        const { userId } = req.params;

        // Check if user exists
        const [userCheck] = await pool.query('SELECT user_id FROM users WHERE user_id = ?', [userId]);
        if (userCheck.length === 0) {
            return res.status(404).json({ Message: 'User not found' });
        }

        const [deleteUser] = await pool.query('DELETE FROM users WHERE user_id = ?', [userId]);
        res.status(200).json({ Message: 'User deleted successfully' });
    } catch (error) {
        console.error('ERROR Deleting User:', error);
        res.status(500).json({ Error: 'Error Deleting User' });
    }
}

// Get Sales Analytics (Admin only)
async function getSalesAnalytics(req, res) {
    try {
        const { startDate, endDate, timeframe = '7d' } = req.query;
        let dateFilter = '';
        const queryParams = [];

        if (startDate && endDate) {
            dateFilter = 'AND order_date BETWEEN ? AND ? ';
            queryParams.push(startDate, endDate);
        } else {
            let timeframeCondition = {
                "24h": "1 DAY",
                "7d": "7 DAY",
                "30d": "30 DAY",
                "3m": "3 MONTH",
                "6m": "6 MONTH",
                "1y": "1 YEAR"
            };
            const interval = timeframeCondition[timeframe] || '7 DAY';
            dateFilter = `AND order_date >= NOW() - INTERVAL ${interval} `;
        }

        const query = `
            SELECT 
                DATE(order_date) as date,
                COUNT(*) as orders_count,
                SUM(total_amount) as daily_revenue
            FROM shop_orders
            WHERE payment_status = 'Paid' 
            ${dateFilter}
            GROUP BY date
            ORDER BY date ASC
        `;

        const [salesData] = await pool.query(query, queryParams);

        // Get top selling products
        const [topProducts] = await pool.query(`
            SELECT 
                p.product_id,
                p.productname,
                SUM(ol.qty) as total_sold,
                SUM(ol.qty * ol.price) as total_revenue
            FROM order_line ol
            JOIN product_item pi ON ol.product_item_id = pi.product_item_id
            JOIN products p ON pi.product_id = p.product_id
            JOIN shop_orders so ON ol.shop_order_id = so.shop_order_id
            WHERE so.payment_status = 'Paid' ${dateFilter.replace('order_date', 'so.order_date')}
            GROUP BY p.product_id, p.productname
            ORDER BY total_sold DESC
            LIMIT 10`, queryParams);

        res.status(200).json({
            data: {
                salesTrend: salesData,
                topProducts: topProducts,
                timeframe: timeframe,
                dateRange: { startDate, endDate }
            }
        });
    } catch (error) {
        console.error('ERROR Fetching Sales Analytics:', error);
        res.status(500).json({ Error: 'Error Fetching Sales Analytics' });
    }
}

// Get Low Stock Products (Admin only)
async function getLowStockProducts(req, res) {
    try {
        const threshold = parseInt(req.query.threshold) || 10;

        const [lowStockProducts] = await pool.query(`
            SELECT 
                p.product_id,
                p.productname,
                pi.product_item_id,
                pi.sku,
                pi.qty_in_stock,
                pi.price
            FROM products p
            JOIN product_item pi ON p.product_id = pi.product_id
            WHERE pi.qty_in_stock <= ?
            ORDER BY pi.qty_in_stock ASC`, [threshold]);

        res.status(200).json({
            data: {
                lowStockProducts,
                threshold,
                totalLowStockItems: lowStockProducts.length
            }
        });
    } catch (error) {
        console.error('ERROR Fetching Low Stock Products:', error);
        res.status(500).json({ Error: 'Error fetching low stock products' });
    }
}

// Get Order Statistics by Status (Admin only)
async function getOrderStatistics(req, res) {
    try {
        const { timeframe = '30d' } = req.query;
        
        let dateFilter = '';
        const timeframeCondition = {
            "24h": "1 DAY",
            "7d": "7 DAY",
            "30d": "30 DAY",
            "3m": "3 MONTH",
            "6m": "6 MONTH",
            "1y": "1 YEAR"
        };
        const interval = timeframeCondition[timeframe] || '30 DAY';
        dateFilter = `WHERE so.order_date >= NOW() - INTERVAL ${interval}`;

        const [orderStats] = await pool.query(`
            SELECT 
                os.status,
                COUNT(*) as order_count,
                SUM(so.total_amount) as total_value
            FROM shop_orders so
            JOIN order_status os ON so.order_status = os.status_id
            ${dateFilter}
            GROUP BY os.status, so.order_status
            ORDER BY order_count DESC`);

        const [totalStats] = await pool.query(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(total_amount) as total_revenue,
                AVG(total_amount) as average_order_value
            FROM shop_orders so
            ${dateFilter}`);

        res.status(200).json({
            data: {
                ordersByStatus: orderStats,
                summary: totalStats[0],
                timeframe: timeframe
            }
        });
    } catch (error) {
        console.error('ERROR Fetching Order Statistics:', error);
        res.status(500).json({ Error: 'Error fetching order statistics' });
    }
}

module.exports = {
    getDashboardStats,
    getAllUsersAdmin,
    updateUserRole,
    deleteUserAdmin,
    getSalesAnalytics,
    getLowStockProducts,
    getOrderStatistics
};