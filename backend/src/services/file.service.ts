import prisma from '../config/database';

class FileService {
  /**
   * Create upload record
   */
  async createUpload(
    userId: number,
    jobId: string,
    filename: string,
    fileType: string,
    fileSize: number,
    mimeType: string,
    fileContentBase64: string,
    uploadType: 'contract' | 'data'
  ) {
    return prisma.upload.create({
      data: {
        userId,
        jobId,
        filename,
        fileType,
        fileSize,
        mimeType,
        fileContentBase64,
        uploadType,
      },
    });
  }

  /**
   * Get upload by ID
   */
  async getUploadById(uploadId: number, userId?: number) {
    const where: any = { id: uploadId };
    if (userId) {
      where.userId = userId;
    }

    return prisma.upload.findUnique({
      where,
    });
  }

  /**
   * Get user uploads
   */
  async getUserUploads(userId: number, uploadType?: string) {
    const where: any = { userId };
    if (uploadType) {
      where.uploadType = uploadType;
    }

    return prisma.upload.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete upload
   */
  async deleteUpload(uploadId: number, userId?: number): Promise<void> {
    const where: any = { id: uploadId };
    if (userId) {
      where.userId = userId;
    }

    await prisma.upload.delete({
      where,
    });
  }

  /**
   * Get uploads by jobId
   */
  async getUploadsByJobId(jobId: string, userId?: number) {
    const where: any = { jobId };
    if (userId) {
      where.userId = userId;
    }

    return prisma.upload.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }
}

export default new FileService();

