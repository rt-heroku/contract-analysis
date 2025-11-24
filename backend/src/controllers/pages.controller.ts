import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../utils/logger';
import loggingService from '../services/logging.service';

class PagesController {
  /**
   * Get all pages for the current user
   */
  async getAll(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const pages = await prisma.dynamicPage.findMany({
        where: {
          OR: [
            { createdBy: userId },
            { isPublic: true },
            // TODO: Add role-based filtering using allowedRoles
          ],
          status: { not: 'archived' },
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          process: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      await loggingService.logActivity({
        userId,
        actionType: 'page.list',
        actionDescription: 'Viewed pages list',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({ pages });
    } catch (error: any) {
      logger.error('Failed to get pages:', error);
      res.status(500).json({ error: 'Failed to retrieve pages' });
    }
  }

  /**
   * Get page by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const pageId = parseInt(req.params.id);
      const userId = (req as any).user.id;

      const page = await prisma.dynamicPage.findUnique({
        where: { id: pageId },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          process: true,
          store: true,
        },
      });

      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }

      // Check access permissions
      if (!page.isPublic && page.createdBy !== userId) {
        // TODO: Check role-based permissions
        return res.status(403).json({ error: 'Access denied' });
      }

      await loggingService.logActivity({
        userId,
        actionType: 'page.view',
        actionDescription: `Viewed page: ${page.name}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { pageId: page.id },
      });

      res.json(page);
    } catch (error: any) {
      logger.error('Failed to get page:', error);
      res.status(500).json({ error: 'Failed to retrieve page' });
    }
  }

  /**
   * Get page by slug (public access)
   */
  async getBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;

      const page = await prisma.dynamicPage.findUnique({
        where: { slug },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          process: true,
        },
      });

      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }

      // Public pages can be accessed by anyone
      if (!page.isPublic && page.status !== 'published') {
        return res.status(403).json({ error: 'This page is not publicly accessible' });
      }

      // Log if user is authenticated
      if ((req as any).user) {
        await loggingService.logActivity({
          userId: (req as any).user.id,
          actionType: 'page.view',
          actionDescription: `Viewed page: ${page.name} (slug: ${slug})`,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          metadata: { pageId: page.id },
        });
      }

      res.json(page);
    } catch (error: any) {
      logger.error('Failed to get page by slug:', error);
      res.status(500).json({ error: 'Failed to retrieve page' });
    }
  }

  /**
   * Create new page
   */
  async create(req: Request, res: Response) {
    try {
      const {
        name,
        slug,
        description,
        pageConfig,
        processId,
        dataSource,
        dataConfig,
        storageType,
        storagePath,
        storeId,
        isPublic,
        allowedRoles,
        category,
        tags,
        thumbnail,
      } = req.body;

      const userId = (req as any).user.id;

      // Check if slug already exists
      const existing = await prisma.dynamicPage.findUnique({
        where: { slug },
      });

      if (existing) {
        return res.status(400).json({ error: 'A page with this slug already exists' });
      }

      const page = await prisma.dynamicPage.create({
        data: {
          name,
          slug,
          description,
          pageConfig,
          processId,
          dataSource: dataSource || 'static',
          dataConfig: dataConfig || undefined,
          storageType: storageType || 'database',
          storagePath,
          storeId,
          isPublic: isPublic || false,
          allowedRoles: allowedRoles || [],
          category,
          tags: tags || [],
          thumbnail,
          status: 'draft',
          createdBy: userId,
        },
      });

      await loggingService.logActivity({
        userId,
        actionType: 'page.create',
        actionDescription: `Created page: ${page.name}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { pageId: page.id },
      });

      logger.info(`Page created: ${page.name} (ID: ${page.id})`);
      res.status(201).json(page);
    } catch (error: any) {
      logger.error('Failed to create page:', error);
      res.status(500).json({ error: 'Failed to create page' });
    }
  }

  /**
   * Update existing page
   */
  async update(req: Request, res: Response) {
    try {
      const pageId = parseInt(req.params.id);
      const userId = (req as any).user.id;

      const {
        name,
        slug,
        description,
        pageConfig,
        processId,
        dataSource,
        dataConfig,
        isPublic,
        allowedRoles,
        category,
        tags,
        thumbnail,
      } = req.body;

      // Check if page exists and user has access
      const existing = await prisma.dynamicPage.findUnique({
        where: { id: pageId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Page not found' });
      }

      if (existing.createdBy !== userId) {
        // TODO: Check role-based edit permissions
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check slug uniqueness if changed
      if (slug && slug !== existing.slug) {
        const slugExists = await prisma.dynamicPage.findUnique({
          where: { slug },
        });

        if (slugExists) {
          return res.status(400).json({ error: 'A page with this slug already exists' });
        }
      }

      const page = await prisma.dynamicPage.update({
        where: { id: pageId },
        data: {
          name,
          slug,
          description,
          pageConfig,
          processId,
          dataSource,
          dataConfig: dataConfig || undefined,
          isPublic,
          allowedRoles: allowedRoles || undefined,
          category,
          tags: tags || undefined,
          thumbnail,
          lastModifiedBy: userId,
        },
      });

      await loggingService.logActivity({
        userId,
        actionType: 'page.update',
        actionDescription: `Updated page: ${page.name}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { pageId: page.id },
      });

      logger.info(`Page updated: ${page.name} (ID: ${page.id})`);
      res.json(page);
    } catch (error: any) {
      logger.error('Failed to update page:', error);
      res.status(500).json({ error: 'Failed to update page' });
    }
  }

  /**
   * Delete page
   */
  async delete(req: Request, res: Response) {
    try {
      const pageId = parseInt(req.params.id);
      const userId = (req as any).user.id;

      const existing = await prisma.dynamicPage.findUnique({
        where: { id: pageId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Page not found' });
      }

      if (existing.createdBy !== userId) {
        // TODO: Check role-based delete permissions
        return res.status(403).json({ error: 'Access denied' });
      }

      await prisma.dynamicPage.delete({
        where: { id: pageId },
      });

      await loggingService.logActivity({
        userId,
        actionType: 'page.delete',
        actionDescription: `Deleted page: ${existing.name}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { pageId },
      });

      logger.info(`Page deleted: ${existing.name} (ID: ${pageId})`);
      res.json({ message: 'Page deleted successfully' });
    } catch (error: any) {
      logger.error('Failed to delete page:', error);
      res.status(500).json({ error: 'Failed to delete page' });
    }
  }

  /**
   * Publish page
   */
  async publish(req: Request, res: Response) {
    try {
      const pageId = parseInt(req.params.id);
      const userId = (req as any).user.id;

      const existing = await prisma.dynamicPage.findUnique({
        where: { id: pageId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Page not found' });
      }

      if (existing.createdBy !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const page = await prisma.dynamicPage.update({
        where: { id: pageId },
        data: {
          status: 'published',
          publishedAt: new Date(),
          lastModifiedBy: userId,
        },
      });

      await loggingService.logActivity({
        userId,
        actionType: 'page.publish',
        actionDescription: `Published page: ${page.name}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { pageId: page.id },
      });

      logger.info(`Page published: ${page.name} (ID: ${page.id})`);
      res.json(page);
    } catch (error: any) {
      logger.error('Failed to publish page:', error);
      res.status(500).json({ error: 'Failed to publish page' });
    }
  }

  /**
   * Import pages from JSON
   */
  async import(req: Request, res: Response) {
    try {
      const { pages } = req.body;
      const userId = (req as any).user.id;

      if (!Array.isArray(pages) || pages.length === 0) {
        return res.status(400).json({ error: 'Invalid import data' });
      }

      const imported = await Promise.all(
        pages.map(async (pageData: any) => {
          // Generate unique slug if needed
          let slug = pageData.slug;
          let counter = 1;
          
          while (await prisma.dynamicPage.findUnique({ where: { slug } })) {
            slug = `${pageData.slug}-${counter}`;
            counter++;
          }

          return prisma.dynamicPage.create({
            data: {
              name: pageData.name,
              slug,
              description: pageData.description,
              pageConfig: pageData.pageConfig,
              processId: pageData.processId,
              dataSource: pageData.dataSource || 'static',
              dataConfig: pageData.dataConfig,
              storageType: pageData.storageType || 'database',
              storagePath: pageData.storagePath,
              storeId: pageData.storeId,
              isPublic: pageData.isPublic || false,
              allowedRoles: pageData.allowedRoles || [],
              status: 'draft',
              category: pageData.category,
              tags: pageData.tags || [],
              thumbnail: pageData.thumbnail,
              createdBy: userId,
            },
          });
        })
      );

      await loggingService.logActivity({
        userId,
        actionType: 'page.import',
        actionDescription: `Imported ${imported.length} page(s)`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      logger.info(`Imported ${imported.length} pages`);
      res.json({ imported, count: imported.length });
    } catch (error: any) {
      logger.error('Failed to import pages:', error);
      res.status(500).json({ error: 'Failed to import pages' });
    }
  }

  /**
   * Export page as JSON
   */
  async export(req: Request, res: Response) {
    try {
      const pageId = parseInt(req.params.id);
      const userId = (req as any).user.id;

      const page = await prisma.dynamicPage.findUnique({
        where: { id: pageId },
      });

      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }

      if (!page.isPublic && page.createdBy !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await loggingService.logActivity({
        userId,
        actionType: 'page.export',
        actionDescription: `Exported page: ${page.name}`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { pageId: page.id },
      });

      // Remove sensitive fields
      const { id, createdBy, lastModifiedBy, createdAt, updatedAt, ...exportData } = page;

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${page.slug}.json"`);
      res.json(exportData);
    } catch (error: any) {
      logger.error('Failed to export page:', error);
      res.status(500).json({ error: 'Failed to export page' });
    }
  }
}

export const pagesController = new PagesController();

