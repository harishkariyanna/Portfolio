const Joi = require('joi');

/**
 * Validate required environment variables on startup
 * Fails fast with descriptive error if configuration is invalid
 */
const validateEnv = () => {
  const envSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(5000),
    MONGODB_URI: Joi.string().required(),
    JWT_SECRET: Joi.string().min(32).required(),
    OPENAI_API_KEY: Joi.string().optional(),
    CLOUDINARY_URL: Joi.string().optional(),
    FRONTEND_URL: Joi.string().uri().default('http://localhost:5173'),
    ADMIN_EMAIL: Joi.string().email().optional(),
    ADMIN_PASSWORD: Joi.string().optional()
  }).unknown(true);

  const { error, value } = envSchema.validate(process.env);

  if (error) {
    console.error('✗ Environment variable validation failed:');
    console.error(error.details.map(detail => `  - ${detail.message}`).join('\n'));
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    console.error('Refer to .env.example for required variables and format.\n');
    process.exit(1);
  }

  // Warnings for optional variables
  if (!value.OPENAI_API_KEY) {
    console.warn('⚠ OPENAI_API_KEY not set - AI features will be disabled');
  }
  if (!value.CLOUDINARY_URL) {
    console.warn('⚠ CLOUDINARY_URL not set - Media uploads will use GridFS fallback');
  }

  console.log('✓ Environment variables validated successfully');
  return value;
};

module.exports = validateEnv;
