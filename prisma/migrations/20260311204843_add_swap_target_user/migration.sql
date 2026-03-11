/*
  Warnings:

  - You are about to drop the column `adminNotes` on the `swap_requests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "swap_requests" DROP COLUMN "adminNotes",
ADD COLUMN     "targetUserId" TEXT;

-- AddForeignKey
ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
