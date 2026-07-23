/**
 * Input validation helpers — lightweight, no dependencies
 */

/**
 * Validate a value against a set of rules. Returns { valid, error }.
 * Rules object keys: required, type, minLen, maxLen, pattern, min, max, enum, custom
 */
function validate(value, rules, fieldName) {
  if (rules.required && (value === undefined || value === null || value === '')) {
    return { valid: false, error: `${fieldName} 为必填项` };
  }
  if (value === undefined || value === null || value === '') return { valid: true };

  if (rules.type) {
    const t = typeof value;
    if (rules.type === 'string' && t !== 'string') return { valid: false, error: `${fieldName} 应为字符串` };
    if (rules.type === 'number' && t !== 'number' && isNaN(Number(value))) return { valid: false, error: `${fieldName} 应为数字` };
    if (rules.type === 'boolean' && t !== 'boolean') return { valid: false, error: `${fieldName} 应为布尔值` };
  }

  if (rules.minLen && String(value).length < rules.minLen) {
    return { valid: false, error: `${fieldName} 至少需要 ${rules.minLen} 个字符` };
  }
  if (rules.maxLen && String(value).length > rules.maxLen) {
    return { valid: false, error: `${fieldName} 不能超过 ${rules.maxLen} 个字符` };
  }
  if (rules.pattern && !rules.pattern.test(String(value))) {
    return { valid: false, error: `${fieldName} 格式不正确` };
  }
  if (rules.min !== undefined && Number(value) < rules.min) {
    return { valid: false, error: `${fieldName} 不能小于 ${rules.min}` };
  }
  if (rules.max !== undefined && Number(value) > rules.max) {
    return { valid: false, error: `${fieldName} 不能大于 ${rules.max}` };
  }
  if (rules.enum && !rules.enum.includes(value)) {
    return { valid: false, error: `${fieldName} 取值无效` };
  }
  if (rules.custom) {
    const result = rules.custom(value);
    if (result !== true) return { valid: false, error: result };
  }

  return { valid: true };
}

/**
 * Validate an object against a schema. Returns { valid, errors }.
 * Schema: { fieldName: { required, type, minLen, maxLen, pattern, ... } }
 */
function validateBody(body, schema) {
  const errors = [];
  for (const [field, rules] of Object.entries(schema)) {
    const result = validate(body[field], rules, field);
    if (!result.valid) errors.push(result.error);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Express middleware factory — validates req.body against schema.
 */
function validateMiddleware(schema) {
  return (req, res, next) => {
    const { valid, errors } = validateBody(req.body, schema);
    if (!valid) {
      return res.status(400).json({ success: false, error: errors.join('; ') });
    }
    next();
  };
}

// Common validation schemas
const PHONE_REGEX = /^1[3-9]\d{9}$/;
const schemas = {
  register: {
    phone: { required: true, type: 'string', pattern: PHONE_REGEX },
    code: { required: true, type: 'string', minLen: 4, maxLen: 6 },
    password: { required: true, type: 'string', minLen: 6, maxLen: 128 },
  },
  login: {
    phone: { required: true, type: 'string', pattern: PHONE_REGEX },
    password: { required: true, type: 'string', maxLen: 128 },
  },
  loginSms: {
    phone: { required: true, type: 'string', pattern: PHONE_REGEX },
    code: { required: true, type: 'string', minLen: 4, maxLen: 6 },
  },
  project: {
    industry: { required: true, type: 'string', maxLen: 64 },
    sub_industry: { maxLen: 128 },
    province: { required: true, type: 'string', maxLen: 64 },
    city: { required: true, type: 'string', maxLen: 64 },
    revenue: { type: 'number', min: 0, max: 999999999 },
    price: { type: 'number', min: 0, max: 999999999 },
    description: { type: 'string', maxLen: 5000 },
  },
  profile: {
    name: { type: 'string', maxLen: 64 },
    email: { type: 'string', maxLen: 128 },
    company_name: { type: 'string', maxLen: 128 },
    wechat_id: { type: 'string', maxLen: 64 },
  },
};

module.exports = { validate, validateBody, validateMiddleware, schemas };
