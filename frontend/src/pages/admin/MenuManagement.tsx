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
import { Modal } from '@/components/common/Modal';
import { 
  Menu, Plus, Edit, Trash2, Save, X, GripVertical, 
  ExternalLink, ChevronRight, ChevronDown, FolderPlus
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
  children?: MenuItem[];
  permissions?: { roleId: number; role: { name: string } }[];
}

interface Role {
  id: number;
  name: string;
  description?: string;
}

const DraggableMenuItem: React.FC<{
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: number) => void;
}> = ({ item, onEdit, onDelete }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'MENU_ITEM',
    item: { id: item.id, title: item.title, isNew: false },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`p-3 bg-white border border-gray-200 rounded-lg flex items-center justify-between hover:shadow-md transition-shadow cursor-move mb-2 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        <GripVertical className="w-4 h-4 text-gray-400" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{item.title}</span>
            {item.isExternal && <ExternalLink className="w-3 h-3 text-blue-500" />}
            {!item.isActive && <span className="text-xs text-gray-500">(Inactive)</span>}
          </div>
          {item.route && (
            <span className="text-xs text-gray-500">{item.route}</span>
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

const TreeMenuItem: React.FC<{
  item: MenuItem;
  level: number;
  onDrop: (draggedId: number, targetId: number, dropPosition: 'on' | 'before' | 'after') => void;
  onRemove: (menuId: number) => void;
  roleId: number;
}> = ({ item, level, onDrop, onRemove, roleId }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isOver, setIsOver] = useState(false);
  const [dropPosition, setDropPosition] = useState<'on' | 'before' | 'after' | null>(null);

  const [{ canDrop }, drop] = useDrop({
    accept: 'MENU_ITEM',
    hover: (draggedItem: any, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;
      
      const hoverBoundingRect = (monitor.getClientOffset() as any);
      const targetElement = document.getElementById(`tree-item-${item.id}`);
      if (!targetElement) return;
      
      const targetRect = targetElement.getBoundingClientRect();
      const hoverY = hoverBoundingRect.y - targetRect.top;
      const height = targetRect.height;
      
      // Determine drop position
      if (hoverY < height * 0.25) {
        setDropPosition('before');
      } else if (hoverY > height * 0.75) {
        setDropPosition('after');
      } else {
        setDropPosition('on');
      }
    },
    drop: (draggedItem: any, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;
      onDrop(draggedItem.id, item.id, dropPosition || 'on');
      setDropPosition(null);
    },
    collect: (monitor) => ({
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div className="relative">
      <div
        id={`tree-item-${item.id}`}
        ref={drop}
        className={`group relative ${level > 0 ? 'ml-6' : ''}`}
        onMouseEnter={() => setIsOver(true)}
        onMouseLeave={() => {
          setIsOver(false);
          setDropPosition(null);
        }}
      >
        {/* Drop indicators */}
        {canDrop && isOver && dropPosition === 'before' && (
          <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 z-10" />
        )}
        {canDrop && isOver && dropPosition === 'after' && (
          <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 z-10" />
        )}
        
        <div
          className={`p-2 border rounded flex items-center justify-between mb-1 transition-colors ${
            canDrop && isOver && dropPosition === 'on'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2 flex-1">
            {item.children && item.children.length > 0 ? (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-0.5 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-5" />
            )}
            <span className="text-sm font-medium text-gray-900">{item.title}</span>
            {item.isExternal && <ExternalLink className="w-3 h-3 text-blue-500" />}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRemove(item.id)}
            className="p-1 text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {isExpanded && item.children && item.children.length > 0 && (
        <div className="ml-4">
          {item.children
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((child) => (
              <TreeMenuItem
                key={child.id}
                item={child}
                level={level + 1}
                onDrop={onDrop}
                onRemove={onRemove}
                roleId={roleId}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export const MenuManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleMenus, setRoleMenus] = useState<MenuItem[]>([]);
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

  const [submenuDialog, setSubmenuDialog] = useState<{
    isOpen: boolean;
    item1Id: number;
    item2Id: number;
    parentName: string;
  }>({
    isOpen: false,
    item1Id: 0,
    item2Id: 0,
    parentName: '',
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

  useEffect(() => {
    if (selectedRole) {
      buildRoleMenuTree();
    }
  }, [selectedRole, menuItems]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [menuRes, rolesRes] = await Promise.all([
        api.get('/menu'),
        api.get('/roles'),
      ]);
      setMenuItems(menuRes.data.menuItems);
      setRoles(rolesRes.data.roles);
      
      // Select first role by default
      if (rolesRes.data.roles.length > 0 && !selectedRole) {
        setSelectedRole(rolesRes.data.roles[0]);
      }
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

  const buildRoleMenuTree = () => {
    if (!selectedRole) return;

    // Get menu items assigned to this role
    const assignedMenuIds = menuItems
      .filter((item) => item.permissions?.some((p) => p.roleId === selectedRole.id))
      .map((item) => item.id);

    // Build tree structure
    const buildTree = (parentId: number | null = null): MenuItem[] => {
      return menuItems
        .filter((item) => {
          const isInRole = assignedMenuIds.includes(item.id);
          const matchesParent = item.parentId === parentId;
          return isInRole && matchesParent;
        })
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((item) => ({
          ...item,
          children: buildTree(item.id),
        }));
    };

    setRoleMenus(buildTree(null));
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

  const handleDrop = async (draggedId: number, targetId: number, dropPosition: 'on' | 'before' | 'after') => {
    if (!selectedRole) return;

    try {
      const draggedItem = menuItems.find((m) => m.id === draggedId);
      const targetItem = menuItems.find((m) => m.id === targetId);

      if (!draggedItem || !targetItem) return;

      // Check if dragged item is already in this role
      const isAlreadyInRole = draggedItem.permissions?.some((p) => p.roleId === selectedRole.id);

      // If not in role, assign it first
      if (!isAlreadyInRole) {
        await api.post('/menu/assign', { menuItemId: draggedId, roleId: selectedRole.id });
      }

      // Handle drop position
      if (dropPosition === 'on') {
        // Drop on target - make it a child
        if (targetItem.children && targetItem.children.length > 0) {
          // Target already has children, just add as child
          await api.put(`/menu/${draggedId}`, {
            parentId: targetId,
            orderIndex: targetItem.children.length,
          });
        } else {
          // Target has no children - ask if user wants to create submenu
          const hasRoute = targetItem.route && targetItem.route.trim() !== '';
          
          if (hasRoute) {
            // Target is a regular menu item, create submenu
            setSubmenuDialog({
              isOpen: true,
              item1Id: targetId,
              item2Id: draggedId,
              parentName: '',
            });
            return;
          } else {
            // Target is already a parent/submenu, just add as child
            await api.put(`/menu/${draggedId}`, {
              parentId: targetId,
              orderIndex: 0,
            });
          }
        }
      } else if (dropPosition === 'before' || dropPosition === 'after') {
        // Drop before/after - make it a sibling
        const newOrderIndex = dropPosition === 'before' ? targetItem.orderIndex : targetItem.orderIndex + 1;
        await api.put(`/menu/${draggedId}`, {
          parentId: targetItem.parentId,
          orderIndex: newOrderIndex,
        });
      }

      await fetchData();
    } catch (error: any) {
      console.error('Failed to handle drop:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to update menu structure',
        type: 'error',
      });
    }
  };

  const handleCreateSubmenu = async () => {
    if (!submenuDialog.parentName.trim()) {
      setAlertDialog({
        isOpen: true,
        title: 'Validation Error',
        message: 'Submenu name is required',
        type: 'error',
      });
      return;
    }

    try {
      const item1 = menuItems.find((m) => m.id === submenuDialog.item1Id);
      if (!item1) return;

      // Create new parent menu item
      const parentResponse = await api.post('/menu', {
        title: submenuDialog.parentName,
        icon: item1.icon,
        route: null, // No route for parent
        isExternal: false,
        parentId: item1.parentId,
        orderIndex: item1.orderIndex,
        isActive: true,
      });

      const newParentId = parentResponse.data.menuItem.id;

      // Assign parent to role
      await api.post('/menu/assign', { 
        menuItemId: newParentId, 
        roleId: selectedRole!.id 
      });

      // Update item1 to be child of new parent
      await api.put(`/menu/${item1.id}`, {
        parentId: newParentId,
        orderIndex: 0,
        route: item1.route, // Keep original route
      });

      // Update item2 (dragged item) to be child of new parent
      await api.put(`/menu/${submenuDialog.item2Id}`, {
        parentId: newParentId,
        orderIndex: 1,
      });

      // Assign dragged item to role if not already
      const draggedItem = menuItems.find((m) => m.id === submenuDialog.item2Id);
      const isAlreadyInRole = draggedItem?.permissions?.some((p) => p.roleId === selectedRole!.id);
      if (!isAlreadyInRole) {
        await api.post('/menu/assign', { 
          menuItemId: submenuDialog.item2Id, 
          roleId: selectedRole!.id 
        });
      }

      await fetchData();
      
      setSubmenuDialog({
        isOpen: false,
        item1Id: 0,
        item2Id: 0,
        parentName: '',
      });

      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: 'Submenu created successfully',
        type: 'success',
      });
    } catch (error: any) {
      console.error('Failed to create submenu:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to create submenu',
        type: 'error',
      });
    }
  };

  const handleRemoveFromRole = async (menuId: number) => {
    if (!selectedRole) return;

    try {
      await api.post('/menu/remove', { menuItemId: menuId, roleId: selectedRole.id });
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

  // Get unassigned menu items (not in current role)
  const getUnassignedMenus = () => {
    if (!selectedRole) return [];
    
    return menuItems.filter((item) => {
      const isInRole = item.permissions?.some((p) => p.roleId === selectedRole.id);
      return !isInRole && !item.parentId; // Only show top-level items
    });
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
            <p className="text-gray-600 mt-1">Drag menu items to assign them to roles</p>
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
                <Button onClick={resetForm} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: 'calc(100vh - 300px)' }}>
          {/* Left Column - All Menu Items */}
          <Card title="Available Menu Items" className="flex flex-col h-full">
            <div className="space-y-2 flex-1 overflow-y-auto">
              {getUnassignedMenus().length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  All menu items are assigned to the selected role
                </p>
              ) : (
                getUnassignedMenus()
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((item) => (
                    <DraggableMenuItem
                      key={item.id}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))
              )}
            </div>
          </Card>

          {/* Right Column - Role Menu Tree */}
          <Card 
            className="flex flex-col h-full"
            title={
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Select Role
                </label>
                <select
                  value={selectedRole?.id || ''}
                  onChange={(e) => {
                    const role = roles.find((r) => r.id === parseInt(e.target.value));
                    setSelectedRole(role || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            }
          >
            <div className="flex flex-col flex-1 mt-4">
              <p className="text-sm text-gray-600 mb-4">
                Drag items from the left to build the menu tree. Drop on items to create submenus.
              </p>
              <div className="flex-1 overflow-y-auto">
                {roleMenus.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <FolderPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">
                      No menu items assigned to this role yet.
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Drag items from the left to get started.
                    </p>
                  </div>
                ) : (
                  roleMenus.map((item) => (
                    <TreeMenuItem
                      key={item.id}
                      item={item}
                      level={0}
                      onDrop={handleDrop}
                      onRemove={handleRemoveFromRole}
                      roleId={selectedRole!.id}
                    />
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Submenu Creation Dialog */}
        <Modal
          isOpen={submenuDialog.isOpen}
          onClose={() => setSubmenuDialog({ ...submenuDialog, isOpen: false })}
          title="Create Submenu"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              The target item is a regular menu item. Enter a name for the new submenu that will contain both items:
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Submenu Name *
              </label>
              <Input
                value={submenuDialog.parentName}
                onChange={(e) => setSubmenuDialog({ ...submenuDialog, parentName: e.target.value })}
                placeholder="Enter submenu name"
                autoFocus
              />
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                onClick={handleCreateSubmenu}
                className="bg-primary-600 hover:bg-primary-700"
              >
                Create Submenu
              </Button>
              <Button
                onClick={() => setSubmenuDialog({ ...submenuDialog, isOpen: false })}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

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
