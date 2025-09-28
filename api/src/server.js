const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// Register plugins
fastify.register(cors, {
  origin: true,
  credentials: true
});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
});

// Register routes
fastify.register(async function (fastify) {
  // Health check
  fastify.get('/health', async (request, reply) => {
    return { status: 'OK', timestamp: new Date().toISOString() };
  });

  // Register route
  fastify.post('/auth/register', async (request, reply) => {
    try {
      const { email, password, firstName, lastName, role = 'BUYER' } = request.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return reply.code(400).send({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role
        }
      });

      // Generate JWT token
      const token = fastify.jwt.sign({ userId: user.id, email: user.email, role: user.role });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        token
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Login route
  fastify.post('/auth/login', async (request, reply) => {
    try {
      const { email, password } = request.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = fastify.jwt.sign({ userId: user.id, email: user.email, role: user.role });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        token
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Protected route example
  fastify.get('/auth/me', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    }
  }, async (request, reply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.user.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true
        }
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return { user };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
});

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
