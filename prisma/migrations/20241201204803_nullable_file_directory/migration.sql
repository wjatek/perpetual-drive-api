-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_directoryId_fkey";

-- AlterTable
ALTER TABLE "File" ALTER COLUMN "directoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_directoryId_fkey" FOREIGN KEY ("directoryId") REFERENCES "Directory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
