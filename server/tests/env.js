// Tests run against a separate database so they never touch development data.
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tawseel_test'
process.env.JWT_SECRET = 'test-secret'
process.env.SMTP_HOST = ''
