export const validateTransaction = (req: any, res: any, next: any) => {
  const { amount } = req.body;
  if (amount === undefined || amount === null) {
    return res.status(400).json({ error: 'amount is required' });
  }
  if (typeof amount !== 'number' && isNaN(Number(amount))) {
    return res.status(400).json({ error: 'amount must be a valid number' });
  }
  if (Number(amount) <= 0) {
    return res.status(400).json({ error: 'amount must be greater than zero' });
  }
  next();
};
