/*
  Warnings:

  - The `status` column on the `RoleRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `RoleRequest` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `requestedRole` on the `RoleRequest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "RoleRequest" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "requestedRole",
ADD COLUMN     "requestedRole" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';
