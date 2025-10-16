import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import api from '@/lib/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Loading } from '@/components/common/Loading';
import { AlertDialog } from '@/components/common/AlertDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { 
  Menu, Plus, Edit, Trash2, Save, X, GripVertical, 
  ExternalLink, Home, Users as UsersIcon 
} from 'lucide-react';

interface MenuItem {
  id: number;
  title: string;
  icon?: string;
  route?: string;
  isExternal: boolean;
  parentId?: number;
  orderIndex: number;
  isActive: boolean;
  permissions?: { roleId: number; role: { name: string } }[];
}

interface Role {
  id: number;
  name: string;
  description?: string;
}

const MenuItemDraggable: React.FC<{
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: number) => void;
}> = ({ item, onEdit, onDelete }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'MENU_ITEM',
    item: { id: item.id, title: item.title },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`p-3 bg-white border border-gray-200 rounded-lg flex items-center justify-between hover:shadow-md transition-shadow cursor-move ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <GripVertical className="w-4 h-4 text-gray-400" />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{item.title}</span>
            {item.isExternal && <ExternalLink className="w-3 h-3 text-blue-500" />}
            {!item.isActive && <span className="text-xs text-gray-500">(Inactive)</span>}
          </div>
          {item.route && (
            <span className="text-xs text-gray-500">{item.route}</span>
          )}
          {item.permissions && item.permissions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.permissions.map((p) => (
                <span
                  key={p.roleId}
                  className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full"
                >
                  {p.role.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(item)}
          className="p-2"
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDelete(item.id)}
          className="p-2 text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const RoleMenuDropZone: React.FC<{
  role: Role;
  assignedMenuIds: number[];
  onDrop: (menuId: number, roleId: number) => void;
  onRemove: (menuId: number, roleId: number) => void;
  allMenuItems: MenuItem[];
}> = ({ role, assignedMenuIds, onDrop, onRemove, allMenuItems }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'MENU_ITEM',
    drop: (item: { id: number; title: string }) => {
      if (!assignedMenuIds.includes(item.id)) {
        onDrop(item.id, role.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const assignedMenus = allMenuItems.filter((m) => assignedMenuIds.includes(m.id));

  return (
    <div
      ref={drop}
      className={`p-4 border-2 border-dashed rounded-lg min-h-[200px] ${
        isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <UsersIcon className="w-4 h-4 text-gray-600" />
        <h4 className="font-medium text-gray-900 capitalize">{role.name}</h4>
        <span className="text-xs text-gray-500">
          ({assignedMenus.length} menu{assignedMenus.length !== 1 ? 's' : ''})
        </span>
      </div>
      <div className="space-y-2">
        {assignedMenus.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Drag menu items here to assign to {role.name}
          </p>
        ) : (
          assignedMenus.map((menu) => (
            <div
              key={menu.id}
              className="p-2 bg-white border border-gray-200 rounded flex items-center justify-between"
            >
              <span className="text-sm text-gray-900">{menu.title}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRemove(menu.id, role.id)}
                className="p-1 text-red-600 hover:text-red-700"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const MenuManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    icon: '',
    route: '',
    isExternal: false,
    parentId: undefined as number | undefined,
    orderIndex: 0,
    isActive: true,
  });

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [menuRes, rolesRes] = await Promise.all([
        api.get('/menu'),
        api.get('/roles'),
      ]);
      setMenuItems(menuRes.data.menuItems);
      setRoles(rolesRes.data.roles);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to load menu data',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    try {
      if (!formData.title) {
        setAlertDialog({
          isOpen: true,
          title: 'Validation Error',
          message: 'Title is required',
          type: 'error',
        });
        return;
      }

      setSaving(true);

      if (editingItem) {
        await api.put(`/menu/${editingItem.id}`, formData);
      } else {
        await api.post('/menu', formData);
      }

      await fetchData();
      resetForm();

      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: `Menu item ${editingItem ? 'updated' : 'created'} successfully`,
        type: 'success',
      });
    } catch (error: any) {
      console.error('Failed to save menu item:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to save menu item',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Menu Item',
      message: 'Are you sure you want to delete this menu item? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await api.delete(`/menu/${id}`);
          await fetchData();
          setAlertDialog({
            isOpen: true,
            title: 'Success',
            message: 'Menu item deleted successfully',
            type: 'success',
          });
        } catch (error: any) {
          console.error('Failed to delete menu item:', error);
          setAlertDialog({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.error || 'Failed to delete menu item',
            type: 'error',
          });
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      icon: item.icon || '',
      route: item.route || '',
      isExternal: item.isExternal,
      parentId: item.parentId,
      orderIndex: item.orderIndex,
      isActive: item.isActive,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      icon: '',
      route: '',
      isExternal: false,
      parentId: undefined,
      orderIndex: 0,
      isActive: true,
    });
    setShowForm(false);
  };

  const handleAssignMenu = async (menuId: number, roleId: number) => {
    try {
      await api.post('/menu/assign', { menuItemId: menuId, roleId });
      await fetchData();
      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: 'Menu assigned to role',
        type: 'success',
      });
    } catch (error: any) {
      console.error('Failed to assign menu:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to assign menu',
        type: 'error',
      });
    }
  };

  const handleRemoveMenu = async (menuId: number, roleId: number) => {
    try {
      await api.post('/menu/remove', { menuItemId: menuId, roleId });
      await fetchData();
    } catch (error: any) {
      console.error('Failed to remove menu:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to remove menu',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Menu className="w-8 h-8" />
              Menu Management
            </h1>
            <p className="text-gray-600 mt-1">Create and manage navigation menu items</p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-primary-600 hover:bg-primary-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Menu Item
          </Button>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <Card title={editingItem ? 'Edit Menu Item' : 'Create Menu Item'}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Menu title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon
                  </label>
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="Icon name (e.g., Home, Users)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Route
                  </label>
                  <Input
                    value={formData.route}
                    onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                    placeholder="/route or https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Index
                  </label>
                  <Input
                    type="number"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isExternal}
                    onChange={(e) => setFormData({ ...formData, isExternal: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">External Link</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={handleCreateOrUpdate}
                  isLoading={saving}
                  disabled={saving}
                  className="bg-primary-600 hover:bg-primary-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingItem ? 'Update' : 'Create'}
                </Button>
                <Button
                  onClick={resetForm}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Menu Items List */}
        <Card title="All Menu Items">
          <div className="space-y-2">
            {menuItems.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No menu items yet</p>
            ) : (
              menuItems
                .filter((item) => !item.parentId) // Only show top-level items
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((item) => (
                  <MenuItemDraggable
                    key={item.id}
                    item={item}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
            )}
          </div>
        </Card>

        {/* Role Assignment */}
        <Card title="Assign Menus to Roles">
          <p className="text-sm text-gray-600 mb-4">
            Drag and drop menu items from above into role sections to assign them.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roles.map((role) => {
              const assignedMenuIds = menuItems
                .filter((item) => item.permissions?.some((p) => p.roleId === role.id))
                .map((item) => item.id);

              return (
                <RoleMenuDropZone
                  key={role.id}
                  role={role}
                  assignedMenuIds={assignedMenuIds}
                  onDrop={handleAssignMenu}
                  onRemove={handleRemoveMenu}
                  allMenuItems={menuItems}
                />
              );
            })}
          </div>
        </Card>

        {/* Alert Dialog */}
        <AlertDialog
          isOpen={alertDialog.isOpen}
          onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
          title={alertDialog.title}
          message={alertDialog.message}
          type={alertDialog.type}
        />

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
        />
      </div>
    </DndProvider>
  );
};

