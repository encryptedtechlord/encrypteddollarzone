const Joi = require('joi');

const tradeSchema = Joi.object({
  symbol: Joi.string().required(),
  side: Joi.string().valid('BUY', 'SELL').required(),
  amount: Joi.number().min(1).max(10000).required(),
  duration: Joi.number().min(1).max(360).default(60)
});

function validateTrade(req, res, next) {
  const { error } = tradeSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
}

module.exports = { validateTrade };