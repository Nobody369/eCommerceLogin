const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Mixed search for documents and products
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Mixed search results
 */
async function searchMixed(query, limit = 10, options = {}) {
  try {
    const { 
      documentRatio = 0.6,  // 60% documents
      productRatio = 0.4,   // 40% products
      minScore = 0.1        // Minimum relevance score
    } = options;

    const documentLimit = Math.ceil(limit * documentRatio);
    const productLimit = Math.ceil(limit * productRatio);

    // Search documents
    const documents = await prisma.$queryRaw`
      SELECT 
        id,
        filename,
        title,
        content,
        "filePath",
        "uploadedBy",
        "createdAt",
        GREATEST(
          ts_rank("contentTsvector", plainto_tsquery('english', ${query})),
          ts_rank("contentTsvector", phraseto_tsquery('english', ${query})),
          CASE 
            WHEN LOWER(content) LIKE LOWER('%' || ${query} || '%') THEN 0.5
            ELSE 0
          END
        ) as fts_rank,
        'document' as result_type
      FROM documents 
      WHERE 
        "contentTsvector" @@ plainto_tsquery('english', ${query})
        OR "contentTsvector" @@ phraseto_tsquery('english', ${query})
        OR LOWER(content) LIKE LOWER('%' || ${query} || '%')
        OR LOWER(title) LIKE LOWER('%' || ${query} || '%')
        OR LOWER(filename) LIKE LOWER('%' || ${query} || '%')
      ORDER BY fts_rank DESC
      LIMIT ${parseInt(documentLimit)}
    `;

    // Search products (only by name)
    const products = await prisma.$queryRaw`
      SELECT 
        id,
        name,
        description,
        price,
        category,
        "isActive",
        "createdAt",
        CASE 
          WHEN LOWER(name) LIKE LOWER('%' || ${query} || '%') THEN 1.0
          ELSE 0
        END as fts_rank,
        'product' as result_type
      FROM products 
      WHERE 
        "isActive" = true
        AND LOWER(name) LIKE LOWER('%' || ${query} || '%')
      ORDER BY fts_rank DESC
      LIMIT ${parseInt(productLimit)}
    `;

    // Combine and normalize results
    const allResults = [
      ...documents.map(doc => ({
        id: doc.id,
        type: 'document',
        title: doc.title || doc.filename,
        content: doc.content,
        filename: doc.filename,
        filePath: doc.filePath,
        uploadedBy: doc.uploadedBy,
        createdAt: doc.createdAt,
        similarity: doc.fts_rank,
        searchType: 'mixed'
      })),
      ...products.map(prod => ({
        id: prod.id,
        type: 'product',
        title: prod.name,
        content: prod.description,
        price: prod.price,
        category: prod.category,
        createdAt: prod.createdAt,
        similarity: prod.fts_rank,
        searchType: 'mixed'
      }))
    ];

    // Sort by similarity score and limit
    return allResults
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

  } catch (error) {
    console.error('Error in mixed search:', error);
    throw new Error(`Failed to perform mixed search: ${error.message}`);
  }
}

/**
 * Get search suggestions for autocomplete
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of suggestions
 * @returns {Promise<Array>} Search suggestions
 */
async function getSearchSuggestions(query, limit = 10) {
  try {
    const documentLimit = Math.ceil(limit * 0.6); // 60% documents
    const productLimit = Math.ceil(limit * 0.4);  // 40% products

    // Search documents
    const documents = await prisma.$queryRaw`
      SELECT 
        id,
        filename,
        title,
        content,
        "filePath",
        "uploadedBy",
        "createdAt",
        GREATEST(
          ts_rank("contentTsvector", plainto_tsquery('english', ${query})),
          ts_rank("contentTsvector", phraseto_tsquery('english', ${query})),
          CASE 
            WHEN LOWER(content) LIKE LOWER('%' || ${query} || '%') THEN 0.5
            ELSE 0
          END
        ) as fts_rank,
        'document' as result_type
      FROM documents 
      WHERE 
        "contentTsvector" @@ plainto_tsquery('english', ${query})
        OR "contentTsvector" @@ phraseto_tsquery('english', ${query})
        OR LOWER(content) LIKE LOWER('%' || ${query} || '%')
        OR LOWER(title) LIKE LOWER('%' || ${query} || '%')
        OR LOWER(filename) LIKE LOWER('%' || ${query} || '%')
      ORDER BY fts_rank DESC
      LIMIT ${parseInt(documentLimit)}
    `;

    // Search products (only by name)
    const products = await prisma.$queryRaw`
      SELECT 
        id,
        name,
        description,
        price,
        category,
        "isActive",
        "createdAt",
        CASE 
          WHEN LOWER(name) LIKE LOWER('%' || ${query} || '%') THEN 1.0
          ELSE 0
        END as fts_rank,
        'product' as result_type
      FROM products 
      WHERE 
        "isActive" = true
        AND LOWER(name) LIKE LOWER('%' || ${query} || '%')
      ORDER BY fts_rank DESC
      LIMIT ${parseInt(productLimit)}
    `;

    // Combine and normalize results
    const allResults = [
      ...documents.map(doc => ({
        id: doc.id,
        type: 'document',
        filename: doc.filename,
        title: doc.title || doc.filename,
        content: doc.content,
        filePath: doc.filePath,
        uploadedBy: doc.uploadedBy,
        createdAt: doc.createdAt,
        similarity: doc.fts_rank,
        searchType: 'mixed'
      })),
      ...products.map(prod => ({
        id: prod.id,
        type: 'product',
        filename: prod.name, // Use name as filename for consistency
        title: prod.name,
        content: prod.description,
        price: prod.price,
        category: prod.category,
        createdAt: prod.createdAt,
        similarity: prod.fts_rank,
        searchType: 'mixed'
      }))
    ];

    // Sort by similarity score and limit
    return allResults
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

  } catch (error) {
    console.error('Error getting search suggestions:', error);
    throw new Error(`Failed to get suggestions: ${error.message}`);
  }
}

/**
 * Search documents using FTS (Full Text Search)
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} Search results
 */
async function searchDocuments(query, limit = 10) {
  try {
    // 使用前缀匹配和部分匹配的组合搜索
    const results = await prisma.$queryRaw`
      SELECT 
        id,
        filename,
        title,
        content,
        "filePath",
        "uploadedBy",
        "createdAt",
        GREATEST(
          ts_rank("contentTsvector", plainto_tsquery('english', ${query})),
          ts_rank("contentTsvector", phraseto_tsquery('english', ${query})),
          CASE 
            WHEN LOWER(content) LIKE LOWER('%' || ${query} || '%') THEN 0.5
            ELSE 0
          END
        ) as fts_rank
      FROM documents 
      WHERE 
        "contentTsvector" @@ plainto_tsquery('english', ${query})
        OR "contentTsvector" @@ phraseto_tsquery('english', ${query})
        OR LOWER(content) LIKE LOWER('%' || ${query} || '%')
        OR LOWER(title) LIKE LOWER('%' || ${query} || '%')
        OR LOWER(filename) LIKE LOWER('%' || ${query} || '%')
      ORDER BY fts_rank DESC
      LIMIT ${parseInt(limit)}
    `;
    
    return results.map(result => ({
      id: result.id,
      filename: result.filename,
      title: result.title,
      content: result.content,
      filePath: result.filePath,
      uploadedBy: result.uploadedBy,
      createdAt: result.createdAt,
      similarity: result.fts_rank,
      searchType: 'fts'
    }));
  } catch (error) {
    console.error('Error searching documents:', error);
    throw new Error(`Search failed: ${error.message}`);
  }
}

// FTS-only version - no vector search needed

/**
 * Store document with embedding in database
 * @param {Object} documentData - Document data
 * @returns {Promise<Object>} Created document
 */
async function storeDocument(documentData) {
  try {
    const document = await prisma.document.create({
      data: {
        filename: documentData.filename,
        title: documentData.title,
        content: documentData.content,
        filePath: documentData.filePath,
        uploadedBy: documentData.uploadedBy
      }
    });
    
    return document;
  } catch (error) {
    console.error('Error storing document:', error);
    throw new Error(`Failed to store document: ${error.message}`);
  }
}

/**
 * Get all documents
 * @returns {Promise<Array>} All documents
 */
async function getAllDocuments() {
  try {
    const documents = await prisma.document.findMany({
      select: {
        id: true,
        filename: true,
        title: true,
        filePath: true,
        uploadedBy: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return documents;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }
}

/**
 * Delete document by ID
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} Deleted document
 */
async function deleteDocument(documentId) {
  try {
    const document = await prisma.document.delete({
      where: {
        id: documentId
      }
    });
    
    return document;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

module.exports = {
  searchMixed,
  getSearchSuggestions,
  searchDocuments,
  storeDocument,
  getAllDocuments,
  deleteDocument
};
