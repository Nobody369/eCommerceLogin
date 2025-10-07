-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SELLER', 'BUYER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'BUYER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "contentTsvector" tsvector,
    "filePath" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(65,30),
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "searchTsvector" tsvector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Add FTS support for documents
CREATE INDEX "documents_content_fts_idx" ON "documents" USING GIN("contentTsvector");

-- Add FTS support for products
CREATE INDEX "products_search_fts_idx" ON "products" USING GIN("searchTsvector");

-- Create function to update document tsvector
CREATE OR REPLACE FUNCTION update_document_tsvector()
RETURNS TRIGGER AS $$
BEGIN
  NEW."contentTsvector" := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update product tsvector
CREATE OR REPLACE FUNCTION update_product_tsvector()
RETURNS TRIGGER AS $$
BEGIN
  NEW."searchTsvector" := to_tsvector('english', COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.description, '') || ' ' || COALESCE(NEW.category, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to maintain tsvector
CREATE TRIGGER documents_tsvector_update
  BEFORE INSERT OR UPDATE ON "documents"
  FOR EACH ROW
  EXECUTE FUNCTION update_document_tsvector();

CREATE TRIGGER products_tsvector_update
  BEFORE INSERT OR UPDATE ON "products"
  FOR EACH ROW
  EXECUTE FUNCTION update_product_tsvector();
