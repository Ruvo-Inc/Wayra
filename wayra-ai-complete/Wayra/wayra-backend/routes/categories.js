const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { verifyToken } = require('../middleware/auth');

// Get all categories for authenticated user
router.get('/', verifyToken, async (req, res) => {
  try {
    const categories = await Category.findByUser(req.user.uid);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get single category
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (category.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create new category
router.post('/', verifyToken, async (req, res) => {
  try {
    const categoryData = {
      ...req.body,
      userId: req.user.uid
    };

    const category = new Category(categoryData);
    await category.save();

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Category name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create category' });
    }
  }
});

// Update category
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (category.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    Object.assign(category, req.body);
    await category.save();

    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Category name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update category' });
    }
  }
});

// Delete category
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (category.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if category is being used by adventures
    const Adventure = require('../models/Adventure');
    const adventuresUsingCategory = await Adventure.countDocuments({
      userId: req.user.uid,
      'category.name': category.name
    });

    if (adventuresUsingCategory > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category. It is being used by ${adventuresUsingCategory} adventure(s)` 
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Create default categories for user
router.post('/defaults', verifyToken, async (req, res) => {
  try {
    const categories = await Category.createDefault(req.user.uid);
    res.json({ 
      message: 'Default categories created successfully',
      categories: categories.length,
      created: categories
    });
  } catch (error) {
    console.error('Error creating default categories:', error);
    res.status(500).json({ error: 'Failed to create default categories' });
  }
});

module.exports = router;
