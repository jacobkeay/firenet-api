// @desc    Get all transactions
// @route   GET /api/v1/transactions
// @access  Public
exports.getTest = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: "East this  ",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};
