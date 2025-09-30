/**
 * @file rateLimitMiddleware.js
 * @description Rate limiting middleware configurations for API endpoint protection
 * @module middleware/rateLimitMiddleware
 * @requires express-rate-limit
 * 
 * @description
 * Provides pre-configured rate limiters for different endpoint types:
 * - Login attempts (strict - prevents brute force attacks)
 * - User registration (moderate - prevents spam accounts)
 * - General API requests (lenient - prevents abuse)
 * - Password reset (moderate - prevents enumeration attacks)
 * 
 * All limiters use memory-based storage (suitable for single-server deployments).
 * For multi-server deployments, consider using Redis or similar distributed storage.
 * 
 * **Rate Limit Headers:**
 * - Uses standard RateLimit-* headers (RFC draft)
 * - Legacy X-RateLimit-* headers disabled for modern clients
 * 
 * **Configuration Strategy:**
 * - Stricter limits for authentication endpoints
 * - More lenient limits for general API usage
 * - User-friendly error messages with retry information
 * 
 * @example
 * // Apply to specific routes
 * const { loginLimiter, apiLimiter } = require('./middleware/rateLimitMiddleware');
 * 
 * app.post('/api/auth/login', loginLimiter, authController.login);
 * app.use('/api', apiLimiter);
 * 
 * @example
 * // Response when limit exceeded
 * // HTTP 429 Too Many Requests
 * // {
 * //   success: false,
 * //   message: 'Demasiados intentos de login. Intenta de nuevo en 10 minutos.',
 * //   retryAfter: '10 minutos'
 * // }
 * 
 * @see {@link https://www.npmjs.com/package/express-rate-limit|express-rate-limit documentation}
 */
const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for login endpoints
 * @type {Function}
 * @constant
 * 
 * @description
 * Strict rate limiting to prevent brute force password attacks:
 * 
 * **Configuration:**
 * - Window: 10 minutes
 * - Max Requests: 5 attempts
 * - Status Code: 429 Too Many Requests
 * 
 * **Security Purpose:**
 * - Prevents credential stuffing attacks
 * - Mitigates brute force password guessing
 * - Protects against automated login attempts
 * - Reduces server load from attack traffic
 * 
 * **User Impact:**
 * After 5 failed login attempts within 10 minutes:
 * - User must wait 10 minutes before trying again
 * - Legitimate users unlikely to hit this limit
 * - Attackers significantly slowed down
 * 
 * **Headers Sent:**
 * - RateLimit-Limit: 5
 * - RateLimit-Remaining: [remaining attempts]
 * - RateLimit-Reset: [reset timestamp]
 * 
 * **Best Practices:**
 * - Apply only to login endpoint
 * - Combine with account lockout mechanism
 * - Log when limit is reached for security monitoring
 * - Consider CAPTCHA after multiple failures
 * 
 * @example
 * // Apply to login route
 * router.post('/login', loginLimiter, authController.login);
 * 
 * @example
 * // Error response after 5 attempts
 * // HTTP 429
 * // {
 * //   success: false,
 * //   message: 'Demasiados intentos de login. Intenta de nuevo en 10 minutos.',
 * //   retryAfter: '10 minutos'
 * // }
 */
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 5,
  message: {
    success: false,
    message: 'Demasiados intentos de login. Intenta de nuevo en 10 minutos.',
    retryAfter: '10 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter for user registration endpoints
 * @type {Function}
 * @constant
 * 
 * @description
 * Moderate rate limiting to prevent spam account creation:
 * 
 * **Configuration:**
 * - Window: 1 hour
 * - Max Requests: 3 attempts
 * - Status Code: 429 Too Many Requests
 * 
 * **Security Purpose:**
 * - Prevents automated spam account creation
 * - Reduces fake account registration
 * - Protects against email bombing attacks
 * - Mitigates resource exhaustion
 * 
 * **User Impact:**
 * After 3 registration attempts within 1 hour:
 * - User must wait 1 hour before registering again
 * - Legitimate users rarely need multiple attempts
 * - Prevents typo-driven multiple registrations
 * 
 * **Considerations:**
 * - May affect legitimate users with registration errors
 * - Consider email verification as additional layer
 * - Monitor for false positives in shared networks
 * - Adjust limit based on registration patterns
 * 
 * **Integration Points:**
 * - Works with email service for verification
 * - Coordinates with user validation logic
 * - Logs registration attempts for analytics
 * 
 * @example
 * // Apply to registration route
 * router.post('/register', registerLimiter, userController.register);
 * 
 * @example
 * // Error response after 3 attempts
 * // HTTP 429
 * // {
 * //   success: false,
 * //   message: 'Demasiados intentos de registro. Intenta de nuevo en 1 hora.',
 * //   retryAfter: '1 hora'
 * // }
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: {
    success: false,
    message: 'Demasiados intentos de registro. Intenta de nuevo en 1 hora.',
    retryAfter: '1 hora'
  }
});

/**
 * General API rate limiter
 * @type {Function}
 * @constant
 * 
 * @description
 * Lenient rate limiting for general API usage:
 * 
 * **Configuration:**
 * - Window: 15 minutes
 * - Max Requests: 100 requests
 * - Status Code: 429 Too Many Requests
 * 
 * **Protection Purpose:**
 * - Prevents API abuse and scraping
 * - Protects against DoS attacks
 * - Ensures fair resource distribution
 * - Maintains service availability
 * 
 * **User Impact:**
 * After 100 requests within 15 minutes:
 * - User must wait until window resets
 * - Average: ~6.6 requests per minute allowed
 * - Sufficient for normal user activity
 * - May affect heavy API consumers
 * 
 * **Usage Patterns:**
 * - Normal users: Rarely hit limit
 * - Power users: May need rate increase
 * - Mobile apps: Consider per-user limits
 * - Batch operations: May need exemption
 * 
 * **Deployment Considerations:**
 * - Apply globally to all API routes
 * - Exclude health check endpoints
 * - Consider different limits for authenticated users
 * - Monitor hit rates to adjust threshold
 * 
 * **Scaling:**
 * For production with multiple servers:
 * - Use Redis store for distributed rate limiting
 * - Configure with `express-rate-limit` Redis store
 * - Ensure consistent limits across instances
 * 
 * @example
 * // Apply to all API routes
 * app.use('/api', apiLimiter);
 * 
 * @example
 * // Apply selectively
 * app.use('/api/tasks', apiLimiter);
 * app.use('/api/users', apiLimiter);
 * 
 * @example
 * // With Redis store for multi-server setup
 * // const RedisStore = require('rate-limit-redis');
 * // const apiLimiter = rateLimit({
 * //   store: new RedisStore({
 * //     client: redisClient,
 * //     prefix: 'rl:api:'
 * //   }),
 * //   windowMs: 15 * 60 * 1000,
 * //   max: 100
 * // });
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: {
    success: false,
    message: 'Demasiadas peticiones. Intenta de nuevo más tarde.',
    retryAfter: '15 minutos'
  }
});

/**
 * Rate limiter for password reset endpoints
 * @type {Function}
 * @constant
 * 
 * @description
 * Moderate rate limiting to prevent password reset abuse:
 * 
 * **Configuration:**
 * - Window: 10 minutes
 * - Max Requests: 10 attempts
 * - Status Code: 429 Too Many Requests
 * 
 * **Security Purpose:**
 * - Prevents email enumeration attacks
 * - Mitigates email bombing via reset requests
 * - Reduces abuse of password reset flow
 * - Protects email service quota
 * 
 * **User Impact:**
 * After 10 reset requests within 10 minutes:
 * - User must wait 10 minutes before requesting again
 * - Allows multiple attempts for legitimate users
 * - Prevents rapid-fire reset requests
 * - Balances security with usability
 * 
 * **Attack Scenarios Prevented:**
 * 1. **Email Enumeration:** Attackers testing valid emails
 * 2. **Email Flooding:** Overwhelming user's inbox
 * 3. **Service Abuse:** Exhausting email quota
 * 4. **DoS on Email Service:** Overloading email provider
 * 
 * **Legitimate Use Cases:**
 * - User genuinely forgot password (1-2 attempts)
 * - User didn't receive first email (3-4 attempts)
 * - Multiple account recovery (up to 10)
 * 
 * **Integration:**
 * - Works with PasswordResetService
 * - Coordinates with EmailService
 * - Logs suspicious patterns
 * - May trigger additional security measures
 * 
 * **Monitoring:**
 * - Track when limit is reached
 * - Alert on repeated limit violations
 * - Identify potential enumeration attempts
 * - Review legitimate user friction
 * 
 * @example
 * // Apply to password reset routes
 * router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);
 * router.post('/reset-password', passwordResetLimiter, authController.resetPassword);
 * 
 * @example
 * // Error response after 10 attempts
 * // HTTP 429
 * // {
 * //   success: false,
 * //   message: 'Demasiados intentos de recuperación. Intenta de nuevo en 10 minutos.',
 * //   retryAfter: '10 minutos'
 * // }
 */
const passwordResetLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 30 minutos
  max: 10,
  message: {
    success: false,
    message: 'Demasiados intentos de recuperación. Intenta de nuevo en 10 minutos.',
    retryAfter: '10 minutos'
  }
});
/**
 * @exports middleware/rateLimitMiddleware
 * @description Exported rate limiter configurations
 * 
 * @example
 * // Import and apply limiters
 * const {
 *   loginLimiter,
 *   registerLimiter,
 *   apiLimiter,
 *   passwordResetLimiter
 * } = require('./middleware/rateLimitMiddleware');
 * 
 * // Authentication routes (strictest)
 * app.post('/api/auth/login', loginLimiter, authController.login);
 * app.post('/api/auth/register', registerLimiter, userController.register);
 * 
 * // Password recovery (moderate)
 * app.post('/api/auth/forgot-password', passwordResetLimiter, authController.forgotPassword);
 * 
 * // General API (lenient)
 * app.use('/api', apiLimiter);
 * 
 * @example
 * // Custom rate limiter
 * const customLimiter = rateLimit({
 *   windowMs: 5 * 60 * 1000, // 5 minutes
 *   max: 20,
 *   message: { success: false, message: 'Custom limit exceeded' }
 * });
 * 
 * @example
 * // Skip limiter for certain conditions
 * const conditionalLimiter = rateLimit({
 *   windowMs: 15 * 60 * 1000,
 *   max: 100,
 *   skip: (req) => req.user?.role === 'admin' // Admins bypass limit
 * });
 * 
 * @example
 * // Custom key generator (rate limit by user instead of IP)
 * const userBasedLimiter = rateLimit({
 *   windowMs: 15 * 60 * 1000,
 *   max: 100,
 *   keyGenerator: (req) => req.user?._id || req.ip
 * });
 */
module.exports = {
  loginLimiter,
  registerLimiter,
  apiLimiter,
  passwordResetLimiter
};
