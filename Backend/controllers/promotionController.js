const pool = require('../config/database');

// Get all promotions (Admin only)
async function getAllPromotions(req, res) {
  try {
    const [promotions] = await pool.query(`
      SELECT * FROM promotion 
      ORDER BY promotion_id DESC
    `);
    
    // Transform snake_case to camelCase for frontend
    const transformedPromotions = promotions.map(promo => ({
      id: promo.promotion_id,
      promotionId: promo.promotion_id,
      name: promo.name,
      description: promo.description,
      discountRate: promo.discount_rate,
      startDate: promo.start_date,
      endDate: promo.end_date,
      promotionCode: promo.promotion_code,
      discountType: promo.discount_type,
      minimumOrderValue: promo.minimum_order_value,
      usageLimit: promo.usage_limit,
      usageCount: promo.usage_count,
      isActive: promo.is_active,
      applicableCategories: promo.applicable_categories
    }));
    
    res.status(200).json({
      Message: 'All promotions retrieved successfully',
      promotions: transformedPromotions
    });
  } catch (error) {
    console.error("ERROR Fetching All Promotions:", error);
    res.status(500).json({ Message: 'Error fetching promotions' });
  }
}

// Get active promotions
async function getActivePromotions(req, res) {
  try {
    const [promotions] = await pool.query(`
      SELECT * FROM promotion 
      WHERE is_active = TRUE 
        AND (start_date IS NULL OR start_date <= NOW()) 
        AND (end_date IS NULL OR end_date >= NOW())
      ORDER BY discount_rate DESC
    `);
    
    res.status(200).json({
      Message: 'Active promotions retrieved successfully',
      promotions: promotions
    });
  } catch (error) {
    console.error("ERROR Fetching Promotions:", error);
    res.status(500).json({ Message: 'Error fetching promotions' });
  }
}

// Create a new promotion
async function createPromotion(req, res) {
  try {
    const {
      name, description, discountRate, discountType, promotionCode,
      startDate, endDate, minimumOrderValue, usageLimit, applicableCategories
    } = req.body;
    
    if (!name || !discountRate || !promotionCode) {
      return res.status(400).json({ Message: 'Missing required fields' });
    }

    const [existingPromotion] = await pool.query('SELECT promotion_id FROM promotion WHERE promotion_code = ?', [promotionCode]);
    
    if (existingPromotion.length > 0) {
      return res.status(400).json({ Message: 'Promotion code already exists' });
    }

    const [newPromotion] = await pool.query(`
      INSERT INTO promotion (
        name, description, discount_rate, discount_type, promotion_code,
        start_date, end_date, minimum_order_value, usage_limit, 
        applicable_categories, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
    `, [
      name, description, discountRate, discountType || 'percentage', promotionCode,
      startDate, endDate, minimumOrderValue || 0, usageLimit, applicableCategories ? JSON.stringify(applicableCategories) : null
    ]);
    
    res.status(201).json({ 
      Message: 'Promotion created successfully',
      promotionId: newPromotion.insertId
    });
  } catch (error) {
    console.error("ERROR Creating Promotion:", error);
    res.status(500).json({ Message: 'Error creating promotion' });
  }
}

// Update promotion
async function updatePromotion(req, res) {
  try {
    const promotionId = req.params.id;
    console.log('=== UPDATE PROMOTION REQUEST ===');
    console.log('Promotion ID:', promotionId);
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    console.log('Content-Type:', req.headers['content-type']);
    console.log('================================');
    
    const {
      name, description, discountRate, discountType, promotionCode,
      startDate, endDate, minimumOrderValue, usageLimit, applicableCategories, isActive
    } = req.body;

    const [existingPromotion] = await pool.query(
      'SELECT promotion_id FROM promotion WHERE promotion_id = ?', 
      [promotionId]
    );
    
    if (existingPromotion.length === 0) {
      return res.status(404).json({ Message: 'Promotion not found' });
    }

    const updateFields = [];
    const values = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      values.push(description);
    }
    if (discountRate !== undefined) {
      updateFields.push('discount_rate = ?');
      values.push(discountRate);
    }
    if (discountType !== undefined) {
      updateFields.push('discount_type = ?');
      values.push(discountType);
    }
    if (promotionCode !== undefined) {
      updateFields.push('promotion_code = ?');
      values.push(promotionCode);
    }
    if (startDate !== undefined) {
      updateFields.push('start_date = ?');
      values.push(startDate);
    }
    if (endDate !== undefined) {
      updateFields.push('end_date = ?');
      values.push(endDate);
    }
    if (minimumOrderValue !== undefined) {
      updateFields.push('minimum_order_value = ?');
      values.push(minimumOrderValue);
    }
    if (usageLimit !== undefined) {
      updateFields.push('usage_limit = ?');
      values.push(usageLimit);
    }
    if (applicableCategories !== undefined) {
      updateFields.push('applicable_categories = ?');
      values.push(applicableCategories ? JSON.stringify(applicableCategories) : null);
    }
    if (isActive !== undefined) {
      updateFields.push('is_active = ?');
      values.push(isActive);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ Message: 'No fields to update' });
    }

    values.push(promotionId);
    
    await pool.query(
      `UPDATE promotion SET ${updateFields.join(', ')} WHERE promotion_id = ?`,
      values
    );
    
    res.status(200).json({ Message: 'Promotion updated successfully' });
  } catch (error) {
    console.error("ERROR Updating Promotion:", error);
    res.status(500).json({ Message: 'Error updating promotion' });
  }
}

// Delete promotion (deactivate)
async function deletePromotion(req, res) {
  try {
    const promotionId = req.params.id;
    
    const [existingPromotion] = await pool.query(
      'SELECT promotion_id FROM promotion WHERE promotion_id = ?', 
      [promotionId]
    );
    
    if (existingPromotion.length === 0) {
      return res.status(404).json({ Message: 'Promotion not found' });
    }

    await pool.query('UPDATE promotion SET is_active = FALSE WHERE promotion_id = ?', [promotionId]);
    res.status(200).json({ Message: 'Promotion deactivated successfully' });
  } catch (error) {
    console.error("ERROR Deactivating Promotion:", error);
    res.status(500).json({ Message: 'Error deactivating promotion' });
  }
}

// Validate promotion code
async function validatePromotionCode(req, res) {
  try {
    console.log('=== VALIDATE PROMOTION REQUEST ===');
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    console.log('==================================');
    
    const { promotionCode, userId, cartTotal, cartItems } = req.body;
    
    if (!promotionCode || !userId || !cartTotal) {
      return res.status(400).json({ Message: 'Missing required fields' });
    }

    const validation = await checkPromotionValidity(promotionCode, userId, cartTotal, cartItems);
    res.status(200).json(validation);
  } catch (error) {
    console.error("ERROR Validating Promotion:", error);
    res.status(500).json({ Message: 'Error validating promotion' });
  }
}

// Apply promotion to order
async function applyPromotionToOrder(req, res) {
  try {
    const { promotionCode, orderId } = req.body;
    const userId = req.user?.user_id;
    
    if (!promotionCode || !userId || !orderId) {
      return res.status(400).json({ Message: 'Missing required fields' });
    }

    // Check for user authentication
    const userCheck = await pool.query('SELECT user_id FROM users WHERE user_id = ?', [userId]);
    if (userCheck[0].length === 0) {
      return res.status(401).json({ Message: 'User not authenticated' });
    }

    const result = await processPromotionApplication(promotionCode, userId, orderId);
    res.status(200).json(result);
  } catch (error) {
    console.error("ERROR Applying Promotion:", error);
    res.status(500).json({ Message: 'Error applying promotion' });
  }
}

// Get promotion statistics (Admin)
async function getPromotionStats(req, res) {
  try {
    const [stats] = await pool.query(`
      SELECT 
        p.*,
        COALESCE(pu.usage_count, 0) as actual_usage,
        COALESCE(pu.total_discount, 0) as total_discount_given
      FROM promotion p
      LEFT JOIN (
        SELECT 
          promotion_id,
          COUNT(*) as usage_count,
          SUM(
            CASE 
              WHEN p2.discount_type = 'percentage' 
              THEN (so.order_total * p2.discount_rate / 100)
              ELSE p2.discount_rate
            END
          ) as total_discount
        FROM promotion_usage pu2
        JOIN promotion p2 ON pu2.promotion_id = p2.promotion_id
        JOIN shop_orders so ON pu2.order_id = so.shop_order_id
        GROUP BY promotion_id
      ) pu ON p.promotion_id = pu.promotion_id
      ORDER BY p.start_date DESC
    `);
    
    res.status(200).json({
      Message: 'Promotion statistics retrieved successfully',
      stats: stats
    });
  } catch (error) {
    console.error("ERROR Fetching Promotion Stats:", error);
    res.status(500).json({ Message: 'Error fetching promotion statistics' });
  }
}

//PROMOTION HELPER FUNCTIONS

async function checkPromotionValidity(promotionCode, userId, cartTotal, cartItems = []) {
  try {
    console.log('=== CHECKING PROMOTION VALIDITY ===');
    console.log('Promotion Code:', promotionCode);
    console.log('User ID:', userId);
    console.log('Cart Total:', cartTotal);
    console.log('Cart Items:', cartItems);
    
    // Get promotion details
    const [promotions] = await pool.query(
      `SELECT * FROM promotion 
       WHERE promotion_code = ? AND is_active = TRUE`,
      [promotionCode]
    );
    
    console.log('Found promotions:', promotions.length);
    
    if (promotions.length === 0) {
      return { valid: false, Message: 'Invalid promotion code' };
    }
    
    const promotion = promotions[0];
    
    // Check if promotion is within date range
    const now = new Date();
    if (promotion.start_date && new Date(promotion.start_date) > now) {
      return { valid: false, Message: 'Promotion has not started yet' };
    }
    
    if (promotion.end_date && new Date(promotion.end_date) < now) {
      return { valid: false, Message: 'Promotion has expired' };
    }
    
    // Check minimum order value
    if (promotion.minimum_order_value && cartTotal < promotion.minimum_order_value) {
      return { 
        valid: false, 
        Message: `Minimum order value of $${promotion.minimum_order_value} required` 
      };
    }
    
    // Check usage limit
    if (promotion.usage_limit && promotion.usage_count >= promotion.usage_limit) {
      return { valid: false, Message: 'Promotion usage limit reached' };
    }
    
    // Check if user has already used this promotion
    const [userUsage] = await pool.query(
      'SELECT COUNT(*) as count FROM promotion_usage WHERE promotion_id = ? AND user_id = ?',
      [promotion.promotion_id, userId]
    );
    
    if (userUsage[0].count > 0) {
      return { valid: false, Message: 'You have already used this promotion' };
    }
    
    // Check category-specific promotions
    if (promotion.discount_type === 'category_specific' && promotion.applicable_categories) {
      const applicableCategories = JSON.parse(promotion.applicable_categories);
      const hasApplicableItems = cartItems.some(item => 
        applicableCategories.includes(item.category_id)
      );
      
      if (!hasApplicableItems) {
        return { 
          valid: false, 
          Message: 'This promotion is not applicable to items in your cart' 
        };
      }
    }
    
    // Calculate discount amount
    let discountAmount = 0;
    if (promotion.discount_type === 'percentage') {
      discountAmount = (cartTotal * promotion.discount_rate) / 100;
    } else if (promotion.discount_type === 'fixed_amount') {
      discountAmount = promotion.discount_rate;
    } else if (promotion.discount_type === 'category_specific') {
      const applicableCategories = JSON.parse(promotion.applicable_categories);
      const applicableItemsTotal = cartItems
        .filter(item => applicableCategories.includes(item.category_id))
        .reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      discountAmount = (applicableItemsTotal * promotion.discount_rate) / 100;
    }
    
    // Ensure discount doesn't exceed cart total
    discountAmount = Math.min(discountAmount, cartTotal);
    
    const result = {
      valid: true,
      promotion: promotion,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      finalTotal: parseFloat((cartTotal - discountAmount).toFixed(2)),
      Message: 'Promotion applied successfully'
    };
    
    console.log('=== PROMOTION VALIDATION RESULT ===');
    console.log('Result:', result);
    console.log('==================================');
    
    return result;
    
  } catch (error) {
    console.error("ERROR Validating Promotion Code:", error);
    return { valid: false, Message: 'Error validating promotion' };
  }
}

async function processPromotionApplication(promotionCode, userId, orderId) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get promotion details
    const [promotions] = await connection.query(
      'SELECT * FROM promotion WHERE promotion_code = ? AND is_active = TRUE', [promotionCode]
    );
    
    if (promotions.length === 0) {
      throw new Error('Invalid promotion code');
    }
    
    const promotion = promotions[0];
    
    // Update order with promotion
    await connection.query(
      'UPDATE shop_orders SET promotion_id = ? WHERE shop_order_id = ?', [promotion.promotion_id, orderId]
    );
    
    // Record promotion usage
    await connection.query(
      'INSERT INTO promotion_usage (promotion_id, user_id, order_id) VALUES (?, ?, ?)', [promotion.promotion_id, userId, orderId]
    );
    
    // Update promotion usage count
    await connection.query(
      'UPDATE promotion SET usage_count = usage_count + 1 WHERE promotion_id = ?', [promotion.promotion_id]
    );
    
    await connection.commit();
    
    return {
      Message: 'Promotion applied successfully',
      promotion: promotion,
      discountAmount: promotion.discount_rate
    };
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  getAllPromotions,
  getActivePromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  validatePromotionCode,
  applyPromotionToOrder,
  getPromotionStats,
  checkPromotionValidity,
  processPromotionApplication
};