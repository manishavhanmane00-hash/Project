const Performance = require('../models/Performance');

// GET /api/performance  (admin: all; employee: own)
const getPerformance = async (req, res) => {
  try {
    const { employeeId } = req.query;
    const filter = {};

    if (req.user.role === 'Employee') {
      filter.$or = [{ userId: req.user.id }, { email: req.user.email }];
    } else {
      if (employeeId) filter.employeeId = employeeId;
    }

    const records = await Performance.find(filter).sort({ reviewDate: -1, createdAt: -1 });
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/performance  (admin creates a review)
const createReview = async (req, res) => {
  try {
    const { employeeId, userId, email, employeeName, department, reviewPeriod, reviewDate, reviewer,
      overallRating, goals, kpis, strengths, improvements, managerComments, employeeComments, status, goalsList } = req.body;

    if (!employeeId || !overallRating)
      return res.status(400).json({ success: false, message: 'employeeId and overallRating are required' });

    const review = await Performance.create({
      employeeId, userId, email, employeeName, department, reviewPeriod,
      reviewDate: reviewDate || new Date().toISOString().split('T')[0],
      reviewer, overallRating, goals: goals || 0, kpis: kpis || 0,
      strengths, improvements, managerComments, employeeComments,
      status: status || 'completed',
      goalsList: goalsList || [],
    });

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/performance/:id  (admin updates a review)
const updateReview = async (req, res) => {
  try {
    const review = await Performance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getPerformance, createReview, updateReview };
