# Craft.js Page Builder Implementation Guide

## ✅ **Completed Steps**

### 1. Dependencies Installed
- `@craftjs/core` - Core page builder framework
- `@craftjs/layers` - Layer management
- `lz-string` - JSON compression for storage
- `react-contenteditable` - Editable components

### 2. Database Schema Created
- `DynamicPage` model with full support for:
  - Page configuration storage (compressed JSON)
  - Data source configuration (process, API, store, static)
  - Storage connectors (database, S3, filesystem)
  - Access control and publishing workflow
  - Relations to Process, Store, and User models

### 3. Basic Components Created
- ✅ Container - Layout container with drag-and-drop
- ✅ Text - Editable text with styling options
- ✅ CraftButton - Styled button component
- ✅ CraftCard - Card layout component

---

## 🚧 **Remaining Implementation Steps**

### **STEP 1: Complete Component Library**

Create these additional components in `/frontend/src/components/craft/`:

#### **DataTable.tsx** - Display process execution data
```typescript
import React from 'react';
import { useNode } from '@craftjs/core';
import { useProcessData } from '@/hooks/useProcessData';

interface DataTableProps {
  dataPath?: string;
  columns?: Array<{ key: string; label: string }>;
  title?: string;
}

export const DataTable: React.FC<DataTableProps> = ({ dataPath, columns = [], title }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const data = useProcessData(dataPath);

  return (
    <div ref={(ref) => ref && connect(drag(ref))} className={selected ? 'ring-2 ring-primary-500' : ''}>
      {title && <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">{title}</h3>}
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {Array.isArray(data) && data.map((row, idx) => (
            <tr key={idx}>
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

DataTable.craft = {
  displayName: 'Data Table',
  props: { dataPath: '', columns: [], title: '' },
};
```

#### **Image.tsx** - Display images
```typescript
import React from 'react';
import { useNode } from '@craftjs/core';

interface ImageProps {
  src?: string;
  alt?: string;
  width?: string;
  height?: string;
}

export const Image: React.FC<ImageProps> = ({
  src = 'https://via.placeholder.com/300',
  alt = 'Image',
  width = '100%',
  height = 'auto',
}) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <img
      ref={(ref) => ref && connect(drag(ref))}
      src={src}
      alt={alt}
      style={{ width, height }}
      className={selected ? 'ring-2 ring-primary-500' : ''}
    />
  );
};

Image.craft = {
  displayName: 'Image',
  props: { src: 'https://via.placeholder.com/300', alt: 'Image', width: '100%', height: 'auto' },
};
```

Update `index.ts` to include new components.

---

### **STEP 2: Create useProcessData Hook**

File: `/frontend/src/hooks/useProcessData.ts`

```typescript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/lib/api';

export const useProcessData = (dataPath?: string) => {
  const { executionId } = useParams<{ executionId?: string }>();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!dataPath) return;

    const fetchData = async () => {
      try {
        let executionData;
        
        if (executionId) {
          // Fetch specific execution
          const response = await api.get(`/executions/${executionId}`);
          executionData = response.data;
        } else {
          // Use static/mock data for preview
          executionData = {};
        }
        
        // Navigate to the specific data path
        const value = dataPath.split('.').reduce((obj, key) => obj?.[key], executionData);
        setData(value);
      } catch (error) {
        console.error('Failed to fetch process data:', error);
      }
    };

    fetchData();
  }, [executionId, dataPath]);

  return data;
};
```

---

### **STEP 3: Create Page Builder Interface**

File: `/frontend/src/pages/PageBuilder.tsx`

```typescript
import React, { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Editor, Frame, Element } from '@craftjs/core';
import { Layers } from '@craftjs/layers';
import lz from 'lz-string';
import { ComponentLibrary } from '@/components/craft';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Container } from '@/components/craft/Container';
import api from '@/lib/api';

export const PageBuilder: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(true);
  const [name, setName] = useState('New Page');
  const [slug, setSlug] = useState('new-page');

  const handleSave = useCallback(async (query: any) => {
    const json = query.serialize();
    const compressed = lz.compressToBase64(json);

    try {
      if (id) {
        await api.put(`/pages/${id}`, { name, slug, pageConfig: compressed });
      } else {
        await api.post('/pages', { name, slug, pageConfig: compressed });
      }
      navigate('/pages');
    } catch (error) {
      console.error('Failed to save page:', error);
    }
  }, [id, name, slug, navigate]);

  return (
    <Editor resolver={ComponentLibrary} enabled={enabled}>
      <div className="h-screen flex flex-col">
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Page Name"
              className="w-64"
            />
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="page-slug"
              className="w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEnabled(!enabled)}>
              {enabled ? 'Preview' : 'Edit'}
            </Button>
            <Button onClick={() => {
              const state = (window as any).craftjsState;
              if (state) handleSave(state);
            }}>
              Save Page
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Left Sidebar - Component Toolbox */}
          <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <h3 className="font-bold mb-4 text-gray-900 dark:text-gray-100">Components</h3>
            <div className="space-y-2">
              {Object.keys(ComponentLibrary).map((key) => (
                <div
                  key={key}
                  draggable
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded cursor-move hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  {key}
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Layers expandRootOnLoad={true} />
            </div>
          </div>

          {/* Main Canvas */}
          <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-y-auto p-8">
            <Frame>
              <Element is={Container} canvas className="min-h-screen bg-white dark:bg-gray-800 rounded-lg p-8">
                {/* Components will be dropped here */}
              </Element>
            </Frame>
          </div>

          {/* Right Sidebar - Settings Panel */}
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <h3 className="font-bold mb-4 text-gray-900 dark:text-gray-100">Settings</h3>
            {/* Component settings will appear here when a component is selected */}
          </div>
        </div>
      </div>
    </Editor>
  );
};
```

---

### **STEP 4: Create Page Renderer**

File: `/frontend/src/pages/PageRenderer.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Editor, Frame } from '@craftjs/core';
import lz from 'lz-string';
import { ComponentLibrary } from '@/components/craft';
import api from '@/lib/api';
import { Loading } from '@/components/common/Loading';

export const PageRenderer: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [pageConfig, setPageConfig] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPage = async () => {
      try {
        const response = await api.get(`/pages/slug/${slug}`);
        const decompressed = lz.decompressFromBase64(response.data.pageConfig);
        setPageConfig(decompressed);
      } catch (error) {
        console.error('Failed to load page:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) loadPage();
  }, [slug]);

  if (loading) return <Loading />;
  if (!pageConfig) return <div>Page not found</div>;

  return (
    <Editor resolver={ComponentLibrary} enabled={false}>
      <Frame data={pageConfig}>
        {/* Page content rendered here */}
      </Frame>
    </Editor>
  );
};
```

---

### **STEP 5: Create Backend API Endpoints**

File: `/backend/src/routes/pages.routes.ts`

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { pagesController } from '../controllers/pages.controller';

const router = Router();

router.get('/', authenticate, pagesController.getAll);
router.get('/:id', authenticate, pagesController.getById);
router.get('/slug/:slug', pagesController.getBySlug);
router.post('/', authenticate, pagesController.create);
router.put('/:id', authenticate, pagesController.update);
router.delete('/:id', authenticate, pagesController.delete);
router.post('/:id/publish', authenticate, pagesController.publish);
router.post('/import', authenticate, pagesController.import);
router.get('/:id/export', authenticate, pagesController.export);

export default router;
```

File: `/backend/src/controllers/pages.controller.ts`

```typescript
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

class PagesController {
  async getAll(req: Request, res: Response) {
    try {
      const pages = await prisma.dynamicPage.findMany({
        where: { status: { not: 'archived' } },
        include: { creator: { select: { firstName: true, lastName: true, email: true } } },
      });
      res.json({ pages });
    } catch (error: any) {
      logger.error('Failed to get pages:', error);
      res.status(500).json({ error: 'Failed to retrieve pages' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const page = await prisma.dynamicPage.findUnique({
        where: { id: parseInt(req.params.id) },
      });
      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }
      res.json(page);
    } catch (error: any) {
      logger.error('Failed to get page:', error);
      res.status(500).json({ error: 'Failed to retrieve page' });
    }
  }

  async getBySlug(req: Request, res: Response) {
    try {
      const page = await prisma.dynamicPage.findUnique({
        where: { slug: req.params.slug },
      });
      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }
      res.json(page);
    } catch (error: any) {
      logger.error('Failed to get page by slug:', error);
      res.status(500).json({ error: 'Failed to retrieve page' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, slug, description, pageConfig, processId, dataSource } = req.body;
      const userId = (req as any).user.id;

      const page = await prisma.dynamicPage.create({
        data: {
          name,
          slug,
          description,
          pageConfig,
          processId,
          dataSource: dataSource || 'static',
          createdBy: userId,
        },
      });

      res.status(201).json(page);
    } catch (error: any) {
      logger.error('Failed to create page:', error);
      res.status(500).json({ error: 'Failed to create page' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { name, slug, description, pageConfig } = req.body;
      const userId = (req as any).user.id;

      const page = await prisma.dynamicPage.update({
        where: { id: parseInt(req.params.id) },
        data: {
          name,
          slug,
          description,
          pageConfig,
          lastModifiedBy: userId,
        },
      });

      res.json(page);
    } catch (error: any) {
      logger.error('Failed to update page:', error);
      res.status(500).json({ error: 'Failed to update page' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await prisma.dynamicPage.delete({
        where: { id: parseInt(req.params.id) },
      });
      res.json({ message: 'Page deleted successfully' });
    } catch (error: any) {
      logger.error('Failed to delete page:', error);
      res.status(500).json({ error: 'Failed to delete page' });
    }
  }

  async publish(req: Request, res: Response) {
    try {
      const page = await prisma.dynamicPage.update({
        where: { id: parseInt(req.params.id) },
        data: {
          status: 'published',
          publishedAt: new Date(),
        },
      });
      res.json(page);
    } catch (error: any) {
      logger.error('Failed to publish page:', error);
      res.status(500).json({ error: 'Failed to publish page' });
    }
  }

  async import(req: Request, res: Response) {
    try {
      const { pages } = req.body;
      const userId = (req as any).user.id;

      const imported = await Promise.all(
        pages.map((page: any) =>
          prisma.dynamicPage.create({
            data: {
              ...page,
              createdBy: userId,
            },
          })
        )
      );

      res.json({ imported, count: imported.length });
    } catch (error: any) {
      logger.error('Failed to import pages:', error);
      res.status(500).json({ error: 'Failed to import pages' });
    }
  }

  async export(req: Request, res: Response) {
    try {
      const page = await prisma.dynamicPage.findUnique({
        where: { id: parseInt(req.params.id) },
      });

      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${page.slug}.json"`);
      res.json(page);
    } catch (error: any) {
      logger.error('Failed to export page:', error);
      res.status(500).json({ error: 'Failed to export page' });
    }
  }
}

export const pagesController = new PagesController();
```

Register routes in `/backend/src/index.ts`:
```typescript
import pagesRoutes from './routes/pages.routes';
app.use('/api/pages', pagesRoutes);
```

---

### **STEP 6: Add Menu Items**

Update menu items in database or code to include:

```sql
INSERT INTO menu_items (title, route, icon, parent_id, order_index) VALUES
  ('Pages', '/pages', 'FileText', NULL, 8),
  ('Page Builder', '/page-builder', 'Layout', NULL, 9);
```

Or add to frontend routing:

File: `/frontend/src/App.tsx` - Add routes:
```typescript
<Route path="/pages" element={<Pages />} />
<Route path="/page-builder/:id?" element={<PageBuilder />} />
<Route path="/page/:slug" element={<PageRenderer />} />
```

---

### **STEP 7: Create Pages Management Page**

File: `/frontend/src/pages/Pages.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Plus, Edit, Trash2, Eye, Download, Upload } from 'lucide-react';
import api from '@/lib/api';

export const Pages: React.FC = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState<any[]>([]);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    const response = await api.get('/pages');
    setPages(response.data.pages);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure?')) {
      await api.delete(`/pages/${id}`);
      loadPages();
    }
  };

  const handleExport = async (id: number) => {
    const response = await api.get(`/pages/${id}/export`);
    const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${response.data.slug}.json`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Pages</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage custom dynamic pages</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => navigate('/page-builder')}>
            <Plus className="w-4 h-4 mr-2" />
            New Page
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pages.map((page) => (
          <Card key={page.id}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{page.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">/{page.slug}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => navigate(`/page/${page.slug}`)}>
                <Eye className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate(`/page-builder/${page.id}`)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleExport(page.id)}>
                <Download className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleDelete(page.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
```

---

## 🎯 **Summary**

### ✅ Completed:
1. Dependencies installed
2. Database schema created and migrated
3. Basic Craft.js components created (Container, Text, Button, Card)

### 📝 To Complete:
1. Additional components (DataTable, Image)
2. useProcessData hook
3. Page Builder interface
4. Page Renderer
5. Backend API endpoints
6. Pages management page
7. Menu integration
8. Import/Export functionality

### 🚀 **Next Steps:**
1. Create remaining components from this document
2. Create backend controller and routes
3. Test page building and rendering
4. Add storage connector support (S3, filesystem)
5. Add permissions and role-based access

---

**All code templates are provided above and ready to implement!**

