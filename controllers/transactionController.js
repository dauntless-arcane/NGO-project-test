const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');

// @desc    Get all or filtered transactions with pagination
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      startDate, 
      endDate, 
      category, 
      type,
      description, 
      page = 1, 
      limit = 10,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const filter = { userId: req.user.userId };

    // Date filtering
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Category filtering
    if (category) filter.category = { $regex: category, $options: 'i' };
    
    // Type filtering
    if (type) filter.type = type;
    
    // Description search
    if (description) filter.description = { $regex: description, $options: 'i' };

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get transactions with pagination
    const transactions = await Transaction.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalTransactions = await Transaction.countDocuments(filter);
    const totalPages = Math.ceil(totalTransactions / parseInt(limit));

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalTransactions,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions'
    });
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
const getTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: { transaction }
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transaction'
    });
  }
};

// @desc    Add a new transaction
// @route   POST /api/transactions
// @access  Private
const addTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { date, description, amount, category, type } = req.body;

    const transaction = new Transaction({
      userId: req.user.userId,
      date: new Date(date),
      description: description.trim(),
      amount: parseFloat(amount),
      category: category.trim(),
      type
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Transaction added successfully',
      data: { transaction }
    });
  } catch (error) {
    console.error('Add transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding transaction'
    });
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const updateData = {};
    const { date, description, amount, category, type } = req.body;

    if (date) updateData.date = new Date(date);
    if (description) updateData.description = description.trim();
    if (amount) updateData.amount = parseFloat(amount);
    if (category) updateData.category = category.trim();
    if (type) updateData.type = type;

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: { transaction }
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating transaction'
    });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully',
      data: { transaction }
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting transaction'
    });
  }
};

// @desc    Get transaction statistics
// @route   GET /api/transactions/stats
// @access  Private
const getTransactionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { userId: req.user.userId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const stats = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          average: { $avg: '$amount' }
        }
      }
    ]);

    const totalIncome = stats.find(s => s._id === 'Income')?.total || 0;
    const totalExpense = stats.find(s => s._id === 'Expense')?.total || 0;
    const incomeCount = stats.find(s => s._id === 'Income')?.count || 0;
    const expenseCount = stats.find(s => s._id === 'Expense')?.count || 0;

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netAmount: totalIncome - totalExpense,
        incomeCount,
        expenseCount,
        totalTransactions: incomeCount + expenseCount,
        averageIncome: stats.find(s => s._id === 'Income')?.average || 0,
        averageExpense: stats.find(s => s._id === 'Expense')?.average || 0
      }
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
};

// @desc    Get category-wise statistics
// @route   GET /api/transactions/stats/categories
// @access  Private
const getCategoryStats = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    const filter = { userId: req.user.userId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (type) filter.type = type;

    const categoryStats = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { category: '$category', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          average: { $avg: '$amount' }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    res.json({
      success: true,
      data: categoryStats.map(stat => ({
        category: stat._id.category,
        type: stat._id.type,
        total: stat.total,
        count: stat.count,
        average: stat.average
      }))
    });
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching category statistics'
    });
  }
};

// @desc    Get monthly statistics
// @route   GET /api/transactions/stats/monthly
// @access  Private
const getMonthlyStats = async (req, res) => {
  try {
    const { year } = req.query;
    const filter = { userId: req.user.userId };

    if (year) {
      const startOfYear = new Date(`${year}-01-01`);
      const endOfYear = new Date(`${year}-12-31`);
      filter.date = { $gte: startOfYear, $lte: endOfYear };
    }

    const monthlyStats = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Group by month and year
    const groupedStats = monthlyStats.reduce((acc, stat) => {
      const key = `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}`;
      if (!acc[key]) {
        acc[key] = {
          year: stat._id.year,
          month: stat._id.month,
          income: 0,
          expense: 0,
          incomeCount: 0,
          expenseCount: 0
        };
      }
      
      if (stat._id.type === 'Income') {
        acc[key].income = stat.total;
        acc[key].incomeCount = stat.count;
      } else {
        acc[key].expense = stat.total;
        acc[key].expenseCount = stat.count;
      }
      
      return acc;
    }, {});

    const result = Object.values(groupedStats).map(stat => ({
      ...stat,
      net: stat.income - stat.expense,
      totalTransactions: stat.incomeCount + stat.expenseCount
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get monthly stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching monthly statistics'
    });
  }
};

module.exports = {
  getTransactions,
  getTransaction,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  getCategoryStats,
  getMonthlyStats
};