const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be at least 0.01'],
    validate: {
      validator: function(value) {
        return Number.isFinite(value) && value > 0;
      },
      message: 'Amount must be a positive number'
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters'],
    index: true
  },
  type: {
    type: String,
    enum: {
      values: ['Income', 'Expense'],
      message: 'Type must be either Income or Expense'
    },
    required: [true, 'Type is required'],
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Digital Wallet', 'Check', 'Other'],
    default: 'Cash'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDetails: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: function() {
        return this.isRecurring;
      }
    },
    nextDueDate: {
      type: Date,
      required: function() {
        return this.isRecurring;
      }
    },
    endDate: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, date: -1, type: 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return this.amount.toFixed(2);
});

// Virtual for month/year
transactionSchema.virtual('monthYear').get(function() {
  return {
    month: this.date.getMonth() + 1,
    year: this.date.getFullYear(),
    formatted: `${this.date.getFullYear()}-${(this.date.getMonth() + 1).toString().padStart(2, '0')}`
  };
});

// Static method to get user's categories
transactionSchema.statics.getUserCategories = function(userId) {
  return this.distinct('category', { userId });
};

// Static method to get user's payment methods
transactionSchema.statics.getUserPaymentMethods = function(userId) {
  return this.distinct('paymentMethod', { userId });
};

// Static method to get user's tags
transactionSchema.statics.getUserTags = function(userId) {
  return this.distinct('tags', { userId });
};

// Instance method to check if transaction is from current month
transactionSchema.methods.isCurrentMonth = function() {
  const now = new Date();
  return this.date.getMonth() === now.getMonth() && 
         this.date.getFullYear() === now.getFullYear();
};

// Pre-save middleware to handle recurring transactions
transactionSchema.pre('save', function(next) {
  if (this.isRecurring && this.isNew) {
    // Set next due date based on frequency
    const nextDate = new Date(this.date);
    
    switch (this.recurringDetails.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    
    this.recurringDetails.nextDueDate = nextDate;
  }
  
  next();
});

// Pre-find middleware to populate user data if needed
transactionSchema.pre(/^find/, function(next) {
  // Only populate if explicitly requested
  if (this.getOptions().populate) {
    this.populate({
      path: 'userId',
      select: 'username email'
    });
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);