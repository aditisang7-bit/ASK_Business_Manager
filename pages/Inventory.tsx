import React, { useState } from 'react';
import { DB } from '../services/db';
import { InventoryItem } from '../types';
import { useTranslation } from '../services/i18n';
import { useToast } from '../components/Toast';

const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>(DB.getInventory());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ name: '', category: '', stock: 10, unit: 'pcs', minStockAlert: 5, vendor: '', image: '' });
  const { t } = useTranslation();
  const { showToast } = useToast();

  const handleUpdateStock = (id: string, delta: number) => {
    const updated = items.map(i => {
      if (i.id === id) {
        const newStock = Math.max(0, i.stock + delta);
        const newItem = { ...i, stock: newStock };
        DB.saveInventoryItem(newItem);
        return newItem;
      }
      return i;
    });
    setItems(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentItemId(null);
    setFormData({ name: '', category: '', stock: 10, unit: 'pcs', minStockAlert: 5, vendor: '', image: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setIsEditMode(true);
    setCurrentItemId(item.id);
    setFormData({ 
      name: item.name, 
      category: item.category, 
      stock: item.stock, 
      unit: item.unit, 
      minStockAlert: item.minStockAlert, 
      vendor: item.vendor || '',
      image: item.image || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveItem = () => {
    if (!formData.name) return;

    let i: InventoryItem;

    if (isEditMode && currentItemId) {
      const existing = items.find(x => x.id === currentItemId);
      if (!existing) return;
      i = {
        ...existing,
        name: formData.name,
        category: formData.category,
        stock: formData.stock,
        unit: formData.unit,
        minStockAlert: formData.minStockAlert,
        vendor: formData.vendor,
        image: formData.image
      };
      showToast(t('common_saved'), "success");
    } else {
      i = {
        id: Date.now().toString(),
        name: formData.name,
        category: formData.category,
        stock: formData.stock,
        unit: formData.unit,
        minStockAlert: formData.minStockAlert,
        vendor: formData.vendor,
        image: formData.image
      };
      showToast("Item added successfully", "success");
    }

    DB.saveInventoryItem(i);
    setItems(DB.getInventory());
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">{t('inv_title')}</h2>
        <button onClick={openAddModal} className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 shadow flex items-center gap-2">
           <i className="fa-solid fa-plus"></i> {t('inv_add')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between group relative transition-all hover:shadow-md">
             {/* Edit Button - Always visible for better UX */}
             <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => openEditModal(item)}
                  className="w-8 h-8 rounded-full bg-white/90 shadow text-gray-500 hover:text-indigo-600 flex items-center justify-center transition-colors"
                  title={t('common_edit')}
                >
                  <i className="fa-solid fa-pen text-xs"></i>
                </button>
              </div>

            <div className="flex items-start gap-4">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover border border-gray-100" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300">
                  <i className="fa-solid fa-box text-2xl"></i>
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-lg text-slate-800 pr-8 leading-tight">{item.name}</h3>
                  {item.stock <= item.minStockAlert && (
                    <span className="absolute top-4 right-14 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">{t('inv_low_stock')}</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{item.category} {item.vendor && `• ${item.vendor}`}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-4">
              <div className="text-center">
                <p className="text-xs text-gray-400 uppercase font-semibold">{t('inv_stock_level')}</p>
                <p className={`text-xl font-bold ${item.stock <= item.minStockAlert ? 'text-red-600' : 'text-slate-800'}`}>
                  {item.stock} <span className="text-sm font-normal text-gray-400">{item.unit}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleUpdateStock(item.id, -1)}
                  className="w-9 h-9 rounded-full border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
                >
                  <i className="fa-solid fa-minus"></i>
                </button>
                <button 
                  onClick={() => handleUpdateStock(item.id, 1)}
                  className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 flex items-center justify-center transition-colors"
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">{isEditMode ? t('common_edit') : t('inv_add')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-times text-lg"></i></button>
            </div>
            
            <div className="space-y-4">
              {/* Image Upload */}
              <div className="flex justify-center mb-4">
                 <div className="relative">
                    <img 
                      src={formData.image || 'https://via.placeholder.com/150?text=No+Image'} 
                      className="w-24 h-24 rounded-lg object-cover border-2 border-indigo-100" 
                      alt="Preview"
                    />
                    <label className="absolute bottom-[-10px] right-[-10px] bg-indigo-600 text-white rounded-full p-2 cursor-pointer hover:bg-indigo-700 shadow-md">
                      <i className="fa-solid fa-camera text-xs"></i>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                 </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">{t('common_name')}</label>
                <input 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Shampoo Bottle" 
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{t('inv_category')}</label>
                    <input 
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value})} 
                      placeholder="e.g. Hair Care" 
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{t('inv_vendor')}</label>
                    <input 
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={formData.vendor} 
                      onChange={e => setFormData({...formData, vendor: e.target.value})} 
                      placeholder="e.g. Supplier Co" 
                    />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{t('inv_stock_level')}</label>
                    <input 
                      type="number" 
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={formData.stock} 
                      onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})} 
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{t('inv_unit')}</label>
                    <input 
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={formData.unit} 
                      onChange={e => setFormData({...formData, unit: e.target.value})} 
                      placeholder="e.g. pcs, box" 
                    />
                 </div>
              </div>
              <div>
                 <label className="block text-xs font-bold text-gray-600 mb-1">{t('inv_min_stock')}</label>
                 <input 
                    type="number" 
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={formData.minStockAlert} 
                    onChange={e => setFormData({...formData, minStockAlert: parseInt(e.target.value) || 0})} 
                 />
                 <p className="text-[10px] text-gray-400 mt-1">Alert when stock falls below this number.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">{t('common_cancel')}</button>
              <button onClick={handleSaveItem} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-md">{t('common_save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;