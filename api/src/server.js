const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { searchMixed, getSearchSuggestions, searchDocuments, getAllDocuments, storeDocument, deleteDocument } = require('./services/documentService');
const { processPDF } = require('./utils/pdfProcessor');
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

// Register multipart for file uploads
fastify.register(require('@fastify/multipart'), {
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
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

// Get search suggestions (autocomplete)
fastify.get('/search/suggestions', {
  preHandler: async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  }
}, async (request, reply) => {
  try {
    const { q: query, limit = 10 } = request.query;

    if (!query || query.trim().length < 2) {
      return reply.code(400).send({ error: 'Query must be at least 2 characters' });
    }

    const suggestions = await getSearchSuggestions(query, limit);
    
    return {
      query,
      suggestions: suggestions.map(suggestion => ({
        id: suggestion.id,
        type: suggestion.type,
        filename: suggestion.filename,
        title: suggestion.title,
        preview: suggestion.content.substring(0, 100) + '...',
        filePath: suggestion.filePath,
        price: suggestion.price,
        category: suggestion.category
      }))
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ error: 'Failed to get suggestions' });
  }
});

// Mixed search (documents + products)
fastify.post('/search/mixed', {
  preHandler: async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  }
}, async (request, reply) => {
  try {
    const { query, limit = 10, documentRatio = 0.6, productRatio = 0.4 } = request.body;

    if (!query || query.trim().length === 0) {
      return reply.code(400).send({ error: 'Search query is required' });
    }

    const results = await searchMixed(query, limit, { documentRatio, productRatio });
    
    return {
      query,
      searchType: 'mixed',
      results: results.map(result => ({
        id: result.id,
        type: result.type,
        title: result.title,
        content: result.content.substring(0, 500) + '...',
        similarity: result.similarity,
        // Document specific fields
        ...(result.type === 'document' && {
          filename: result.filename,
          filePath: result.filePath,
          uploadedBy: result.uploadedBy
        }),
        // Product specific fields
        ...(result.type === 'product' && {
          price: result.price,
          category: result.category
        }),
        createdAt: result.createdAt
      })),
      totalResults: results.length,
      breakdown: {
        documents: results.filter(r => r.type === 'document').length,
        products: results.filter(r => r.type === 'product').length
      }
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ error: 'Mixed search failed' });
  }
});

// Search documents (FTS only)
fastify.post('/search', {
  preHandler: async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  }
}, async (request, reply) => {
    try {
      const { query, limit = 10 } = request.body;

      if (!query || query.trim().length === 0) {
        return reply.code(400).send({ error: 'Search query is required' });
      }

      const results = await searchDocuments(query, limit);
      
      return {
        query,
        searchType: 'fts',
        results: results.map(result => ({
          id: result.id,
          filename: result.filename,
          title: result.title,
          content: result.content.substring(0, 500) + '...', // Truncate for preview
          filePath: result.filePath,
          uploadedBy: result.uploadedBy,
          createdAt: result.createdAt,
          similarity: result.similarity
        })),
        totalResults: results.length
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Search failed' });
    }
  });

  // Get all documents
  fastify.get('/documents', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    }
  }, async (request, reply) => {
    try {
      const documents = await getAllDocuments();
      return { documents };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch documents' });
    }
  });

  // Upload and process PDF
  fastify.post('/documents/upload', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    }
  }, async (request, reply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }

      if (!data.filename.toLowerCase().endsWith('.pdf')) {
        return reply.code(400).send({ error: 'Only PDF files are allowed' });
      }

      // Save file to public directory
      const fs = require('fs');
      const path = require('path');
      const uploadDir = path.join(__dirname, '../../web/public/assets/pdf');
      
      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, data.filename);
      await data.file.pipe(fs.createWriteStream(filePath));

      // Process PDF
      const processedData = await processPDF(filePath, data.filename);
      
      // Store in database
      const document = await storeDocument({
        filename: data.filename,
        title: processedData.title,
        content: processedData.content,
        embedding: processedData.embedding,
        filePath: `/assets/pdf/${data.filename}`,
        uploadedBy: request.user.userId
      });

      return {
        message: 'PDF uploaded and processed successfully',
        document: {
          id: document.id,
          filename: document.filename,
          title: document.title,
          filePath: document.filePath,
          createdAt: document.createdAt
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to upload and process PDF' });
    }
  });

  // Delete document
  fastify.delete('/documents/:id', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const document = await deleteDocument(id);
      
      return {
        message: 'Document deleted successfully',
        document: {
          id: document.id,
          filename: document.filename
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete document' });
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
