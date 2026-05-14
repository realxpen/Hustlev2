-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('client', 'hustler', 'agent', 'admin');

-- CreateEnum
CREATE TYPE "public"."PostType" AS ENUM ('video', 'image', 'text', 'mixed');

-- CreateEnum
CREATE TYPE "public"."PostVisibility" AS ENUM ('public', 'followers', 'private');

-- CreateEnum
CREATE TYPE "public"."PostMediaType" AS ENUM ('image', 'video');

-- CreateEnum
CREATE TYPE "public"."PostAttachmentType" AS ENUM ('service', 'product', 'training');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(40) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "password" VARCHAR(255) NOT NULL,
    "profilePhoto" TEXT,
    "bio" VARCHAR(280),
    "role" "public"."UserRole" NOT NULL DEFAULT 'client',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Post" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "type" "public"."PostType" NOT NULL,
    "visibility" "public"."PostVisibility" NOT NULL DEFAULT 'public',
    "caption" TEXT,
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "musicTitle" VARCHAR(160),
    "musicArtist" VARCHAR(160),
    "musicUrl" TEXT,
    "allowComments" BOOLEAN NOT NULL DEFAULT true,
    "attachmentType" "public"."PostAttachmentType",
    "attachmentId" VARCHAR(100),
    "attachmentTitle" VARCHAR(150),
    "attachmentSubtitle" VARCHAR(150),
    "attachmentThumbnailUrl" TEXT,
    "attachmentPriceMinor" INTEGER,
    "attachmentCurrency" VARCHAR(10),
    "attachmentMetadata" JSONB,
    "repostOfId" TEXT,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "repostCount" INTEGER NOT NULL DEFAULT 0,
    "saveCount" INTEGER NOT NULL DEFAULT 0,
    "mediaCount" INTEGER NOT NULL DEFAULT 0,
    "rankingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PostMedia" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "mediaType" "public"."PostMediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" VARCHAR(255),
    "mimeType" VARCHAR(120),
    "format" VARCHAR(50),
    "resourceType" VARCHAR(50),
    "width" INTEGER,
    "height" INTEGER,
    "durationSeconds" DOUBLE PRECISION,
    "bytes" INTEGER,
    "thumbnailUrl" TEXT,
    "altText" VARCHAR(160),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Like" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Comment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "body" TEXT NOT NULL,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Repost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalPostId" TEXT NOT NULL,
    "repostPostId" TEXT NOT NULL,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Repost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Collection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" VARCHAR(240),
    "coverImageUrl" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SavedPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "public"."User"("phone");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");

-- CreateIndex
CREATE INDEX "Post_visibility_isArchived_createdAt_idx" ON "public"."Post"("visibility", "isArchived", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Post_visibility_isArchived_rankingScore_createdAt_idx" ON "public"."Post"("visibility", "isArchived", "rankingScore" DESC, "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Post_authorId_createdAt_idx" ON "public"."Post"("authorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Post_repostOfId_createdAt_idx" ON "public"."Post"("repostOfId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PostMedia_postId_sortOrder_idx" ON "public"."PostMedia"("postId", "sortOrder");

-- CreateIndex
CREATE INDEX "Like_userId_createdAt_idx" ON "public"."Like"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Like_postId_userId_key" ON "public"."Like"("postId", "userId");

-- CreateIndex
CREATE INDEX "Comment_postId_parentId_createdAt_idx" ON "public"."Comment"("postId", "parentId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Comment_userId_createdAt_idx" ON "public"."Comment"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Repost_repostPostId_key" ON "public"."Repost"("repostPostId");

-- CreateIndex
CREATE INDEX "Repost_originalPostId_createdAt_idx" ON "public"."Repost"("originalPostId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Repost_userId_originalPostId_key" ON "public"."Repost"("userId", "originalPostId");

-- CreateIndex
CREATE INDEX "Collection_userId_createdAt_idx" ON "public"."Collection"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Collection_userId_name_key" ON "public"."Collection"("userId", "name");

-- CreateIndex
CREATE INDEX "SavedPost_userId_postId_idx" ON "public"."SavedPost"("userId", "postId");

-- CreateIndex
CREATE INDEX "SavedPost_collectionId_createdAt_idx" ON "public"."SavedPost"("collectionId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "SavedPost_collectionId_postId_key" ON "public"."SavedPost"("collectionId", "postId");

-- AddForeignKey
ALTER TABLE "public"."Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Post" ADD CONSTRAINT "Post_repostOfId_fkey" FOREIGN KEY ("repostOfId") REFERENCES "public"."Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostMedia" ADD CONSTRAINT "PostMedia_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Like" ADD CONSTRAINT "Like_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Repost" ADD CONSTRAINT "Repost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Repost" ADD CONSTRAINT "Repost_originalPostId_fkey" FOREIGN KEY ("originalPostId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Repost" ADD CONSTRAINT "Repost_repostPostId_fkey" FOREIGN KEY ("repostPostId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Collection" ADD CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SavedPost" ADD CONSTRAINT "SavedPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SavedPost" ADD CONSTRAINT "SavedPost_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "public"."Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SavedPost" ADD CONSTRAINT "SavedPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

