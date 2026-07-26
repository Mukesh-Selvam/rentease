const rateLimitMap = new Map();

// Helper to escape HTML tags to prevent XSS
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>&'"/]/g, (s) => {
    const map = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&#x27;',
      '"': '&quot;',
      '/': '&#x2F;'
    };
    return map[s];
  });
}

// In-memory rate limiting middleware
export function rateLimiter(limit = 100, windowMs = 15 * 60 * 1000) {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, []);
    }
    
    let requests = rateLimitMap.get(ip);
    requests = requests.filter(time => now - time < windowMs);
    requests.push(now);
    rateLimitMap.set(ip, requests);

    if (requests.length > limit) {
      return res.status(429).json({ 
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    next();
  };
}

// Account lockout tracking
const loginFailures = new Map();
const MAX_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export function recordLoginFailure(email) {
  if (!email) return;
  const key = email.toLowerCase();
  const prev = loginFailures.get(key) || { count: 0, lockedUntil: null };
  const count = prev.count + 1;
  const lockedUntil = count >= MAX_FAILURES ? Date.now() + LOCKOUT_MS : null;
  loginFailures.set(key, { count, lockedUntil });
}

export function recordLoginSuccess(email) {
  if (email) loginFailures.delete(email.toLowerCase());
}

export function checkAccountLockout(req, res, next) {
  const email = (req.body?.email || '').toLowerCase();
  if (!email) return next();

  const record = loginFailures.get(email);
  if (!record) return next();

  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    const remainingMins = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    return res.status(429).json({
      message: `Account temporarily locked due to failed login attempts. Try again in ${remainingMins} minute(s).`
    });
  }

  if (record.lockedUntil && Date.now() >= record.lockedUntil) {
    loginFailures.delete(email);
  }

  next();
}

// Input validation middleware for User registration
export function validateRegister(req, res, next) {
  let { name, email, password, role } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  req.body.name = sanitizeString(name.trim());
  req.body.email = email.trim().toLowerCase();
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(req.body.email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!pwdRegex.test(password)) {
    return res.status(400).json({ 
      message: 'Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a digit, and a special character (@$!%*?&).' 
    });
  }

  const validRoles = ['CUSTOMER', 'VENDOR'];
  if (role && !validRoles.includes(role.toUpperCase())) {
    return res.status(400).json({ message: 'Invalid role. Public registration allows CUSTOMER or VENDOR applications only.' });
  }

  next();
}

// Input validation middleware for Product creation
export function validateProduct(req, res, next) {
  let { title, description, price, monthlyRent, deposit, category } = req.body;
  const rentVal = price || monthlyRent;

  if (!title || !rentVal || deposit === undefined || !category) {
    return res.status(400).json({ message: 'Title, monthly rent, deposit, and category are required' });
  }

  req.body.title = sanitizeString(title.trim());
  req.body.description = sanitizeString((description || '').trim());
  
  const parsedPrice = parseFloat(rentVal);
  const parsedDeposit = parseFloat(deposit);

  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({ message: 'Monthly rent must be a valid positive number' });
  }
  if (isNaN(parsedDeposit) || parsedDeposit < 0) {
    return res.status(400).json({ message: 'Deposit cannot be a negative number' });
  }

  const validCategories = ['furniture', 'appliances', 'electronics', 'fitness', 'kids', 'packages', 'beds', 'sofas', 'tables', 'refrigerators', 'washing machines', 'tvs'];
  if (!validCategories.includes(category.toLowerCase())) {
    return res.status(400).json({ message: `Category must be one of valid platform categories.` });
  }

  next();
}

// Input validation for Rental orders
export function validateRental(req, res, next) {
  const { productId, tenureMonths, deliveryDate, deliveryAddress } = req.body;

  if (!productId || !deliveryDate || !deliveryAddress) {
    return res.status(400).json({ message: 'Product ID, delivery date, and address are required' });
  }

  const parsedTenure = parseInt(tenureMonths || 6);
  if (![3, 6, 9, 12, 24].includes(parsedTenure)) {
    return res.status(400).json({ message: 'Invalid rental tenure selection.' });
  }

  req.body.deliveryAddress = sanitizeString(deliveryAddress.trim());
  next();
}

// Input validation for Maintenance tickets
export function validateMaintenance(req, res, next) {
  const { orderId, description, issueType } = req.body;

  if (!orderId || (!description && !issueType)) {
    return res.status(400).json({ message: 'Order ID and issue description are required.' });
  }

  if (description) req.body.description = sanitizeString(description.trim());
  next();
}
