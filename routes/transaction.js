const express = require('express');
const { body, param, query } = require('express-validator');
const { 
  getTransactions, 
  getTransaction,
  addTransaction, 
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  getCategoryStats,
  getMonthlyStats
} = require('../controllers/transactionController');
const { verifyToken } = require('../middlewares/auth');

const router = express.Router();

// Validation rules
const transactionValidation = [
  body('date').isISO8601().withMessage('Valid date required'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Description is required and must be less than 200 characters'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number with at least 0.01'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category is required and must be less than 50 characters'),
  body('type')
    .isIn(['Income', 'Expense'])
    .withMessage('Type must be Income or Expense')
];

const updateTransactionValidation = [
  body('date').optional().isISO8601().withMessage('Valid date required'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Description must be less than 200 characters'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number with at least 0.01'),
  body('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be less than 50 characters'),
  body('type')
    .optional()
    .isIn(['Income', 'Expense'])
    .withMessage('Type must be Income or Expense')
];

const queryValidation = [
  query('startDate').optional().isISO8601().withMessage('Valid start date required'),
  query('endDate').optional().isISO8601().withMessage('Valid end date required'),
  query('category').optional().trim().isLength({ max: 50 }).withMessage('Category too long'),
  query('type').optional().isIn(['Income', 'Expense']).withMessage('Type must be Income or Expense'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

const idValidation = [
  param('id').isMongoId().withMessage('Invalid transaction ID')
];

// Routes

// @route   GET /api/transactions
// @desc    Get all transactions with filtering and pagination
// @access  Private
router.get('/', verifyToken, queryValidation, getTransactions);

// @route   GET /api/transactions/stats
// @desc    Get transaction statistics
// @access  Private
router.get('/stats', verifyToken, queryValidation, getTransactionStats);

// @route   GET /api/transactions/stats/categories
// @desc    Get category-wise statistics
// @access  Private
router.get('/stats/categories', verifyToken, queryValidation, getCategoryStats);

// @route   GET /api/transactions/stats/monthly
// @desc    Get monthly statistics
// @access  Private
router.get('/stats/monthly', verifyToken, queryValidation, getMonthlyStats);

// @route   GET /api/transactions/:id
// @desc    Get single transaction
// @access  Private
router.get('/:id', verifyToken, idValidation, getTransaction);

// @route   POST /api/transactions
// @desc    Add a new transaction
// @access  Private
router.post('/', verifyToken, transactionValidation, addTransaction);

// @route   PUT /api/transactions/:id
// @desc    Update a transaction
// @access  Private
router.patch('/:id', verifyToken, idValidation, updateTransactionValidation, updateTransaction);

// @route   DELETE /api/transactions/:id
// @desc    Delete a transaction
// @access  Private
router.delete('/:id', verifyToken, idValidation, deleteTransaction);

module.exports = router;