import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import prisma from '../config/database';

class DashboardController {
  /**
   * Get dashboard statistics
   */
  async getStatistics(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userId = req.user.id;

      // Get counts for current user
      const [
        totalAnalyses,
        completedAnalyses,
        processingAnalyses,
        failedAnalyses,
        totalUploads,
        recentAnalyses,
        analysisStatusDistribution,
      ] = await Promise.all([
        // Total analyses
        prisma.analysisRecord.count({
          where: { userId },
        }),

        // Completed analyses (both 'completed' and 'IDP_COMPLETED')
        prisma.analysisRecord.count({
          where: { 
            userId, 
            status: { in: ['completed', 'COMPLETED'] }
          },
        }),

        // Processing analyses (includes 'processing' and 'IDP_COMPLETED')
        prisma.analysisRecord.count({
          where: { 
            userId, 
            status: { in: ['processing', 'PROCESSING', 'IDP_COMPLETED'] }
          },
        }),

        // Failed analyses
        prisma.analysisRecord.count({
          where: { 
            userId, 
            status: { in: ['failed', 'FAILED'] }
          },
        }),

        // Total uploads
        prisma.upload.count({
          where: { userId },
        }),

        // Recent analyses (last 5)
        prisma.analysisRecord.findMany({
          where: { userId },
          include: {
            contractUpload: {
              select: { filename: true },
            },
            dataUpload: {
              select: { filename: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),

        // Status distribution
        prisma.analysisRecord.groupBy({
          by: ['status'],
          where: { userId },
          _count: { id: true },
        }),
      ]);

      // Calculate success rate
      const successRate = totalAnalyses > 0
        ? Math.round((completedAnalyses / totalAnalyses) * 100)
        : 0;

      // Recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentActivity = await prisma.analysisRecord.groupBy({
        by: ['createdAt'],
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo },
        },
        _count: { id: true },
      });

      // Group by date
      const activityByDate = recentActivity.reduce((acc: any, item) => {
        const date = new Date(item.createdAt).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + item._count.id;
        return acc;
      }, {});

      res.json({
        statistics: {
          totalAnalyses,
          completedAnalyses,
          processingAnalyses,
          failedAnalyses,
          totalUploads,
          successRate,
          statusDistribution: analysisStatusDistribution.map(item => ({
            status: item.status,
            count: item._count.id,
          })),
        },
        recentAnalyses: recentAnalyses.map(analysis => ({
          id: analysis.id,
          status: analysis.status,
          contractFile: analysis.contractUpload?.filename || 'N/A',
          dataFile: analysis.dataUpload?.filename || 'N/A',
          createdAt: analysis.createdAt,
        })),
        activityChart: Object.entries(activityByDate).map(([date, count]) => ({
          date,
          count,
        })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get admin dashboard statistics (admin only)
   */
  async getAdminStatistics(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Check if user is admin
      const isAdmin = req.user.roles?.some((role: string) => 
        role.toLowerCase() === 'admin'
      );

      if (!isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const [
        totalUsers,
        activeUsers,
        totalAnalyses,
        totalUploads,
        recentUsers,
        analysisStatusDistribution,
      ] = await Promise.all([
        // Total users
        prisma.user.count(),

        // Active users (logged in last 30 days)
        prisma.user.count({
          where: {
            lastLogin: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        // Total analyses
        prisma.analysisRecord.count(),

        // Total uploads
        prisma.upload.count(),

        // Recent users
        prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),

        // Analysis status distribution
        prisma.analysisRecord.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
      ]);

      res.json({
        statistics: {
          totalUsers,
          activeUsers,
          totalAnalyses,
          totalUploads,
          statusDistribution: analysisStatusDistribution.map(item => ({
            status: item.status,
            count: item._count.id,
          })),
        },
        recentUsers: recentUsers.map(user => ({
          id: user.id,
          email: user.email,
          name: user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.email.split('@')[0],
          createdAt: user.createdAt,
        })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new DashboardController();

