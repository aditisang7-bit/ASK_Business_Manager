import React, { useState } from 'react';
import { DB } from '../services/db';
import { Service } from '../types';
import { useTranslation } from '../services/i18n';
import { useToast } from '../components/Toast';

const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>(DB.getServices());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentServiceId, setCurrentServiceId] = useState<string | null>(null);

  const [formData, setFormData] = useState({ name: '', price: '', duration: 30, description: '', image: '' });
  const { t } = useTranslation();
  const { showToast } = useToast();

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
    setCurrentServiceId(null);
    setFormData({ name: '', price: '', duration: 30, description: '', image: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setIsEditMode(true);
    setCurrentServiceId(service.id);
    setFormData({
      name: service.name,
      price: service.price.toString(),
      duration: service.durationMinutes,
      description: service.description || '',
      image: service.image || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveService = () => {
    if (!formData.name || !formData.price) return;
    
    if (isEditMode && currentServiceId) {
      // Update existing
      const existing = services.find(s => s.id === currentServiceId);
      if (existing) {
        const updated: Service = {
          ...existing,
          name: formData.name,
          price: Number(formData.price),
          durationMinutes: Number(formData.duration),
          description: formData.description,
          image: formData.image
        };
        DB.saveService(updated);
        showToast("Service updated successfully", "success");
      }
    } else {
      // Create new
      const s: Service = {
        id: Date.now().toString(),
        name: formData.name,
        price: Number(formData.price),
        durationMinutes: Number(formData.duration),
        description: formData.description,
        image: formData.image
      };
      DB.saveService(s);
      showToast("Service added successfully", "success");
    }

    setServices(DB.getServices());
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      DB.deleteService(id);
      setServices(DB.getServices());
      showToast("Service deleted", "info");
    }
  };

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-slate-800">{t('serv_title')}</h2>
         <button onClick={openAddModal} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow flex items-center gap-2">
           <i className="fa-solid fa-plus"></i> {t('serv_add')}
         </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
            <tr>
              <th className="p-4">{t('common_name')}</th>
              <th className="p-4">{t('common_desc')}</th>
              <th className="p-4">{t('common_price')}</th>
              <th className="p-4">{t('common_duration')}</th>
              <th className="p-4 text-right">{t('common_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {services.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {s.image ? (
                      <img src={s.image} alt="" className="w-10 h-10 rounded-md object-cover border border-gray-100" />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-400">
                        <i className="fa-solid fa-scissors"></i>
                      </div>
                    )}
                    <span className="font-bold text-slate-800">{s.name}</span>
                  </div>
                </td>
                <td className="p-4 text-gray-500 truncate max-w-xs">{s.description || '-'}</td>
                <td className="p-4 font-medium text-green-700">{formatINR(s.price)}</td>
                <td className="p-4 text-gray-500">{s.durationMinutes} min</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => openEditModal(s)} 
                      className="text-slate-400 hover:text-indigo-600 transition-colors"
                      title={t('common_edit')}
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button 
                      onClick={() => handleDelete(s.id)} 
                      className="text-slate-400 hover:text-red-600 transition-colors"
                      title={t('common_delete')}
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl animate-scale-in">
            <h3 className="text-xl font-bold mb-4">{isEditMode ? t('common_edit') : t('serv_add')}</h3>
            <div className="space-y-3">
              {/* Image Upload */}
              <div className="flex justify-center mb-4">
                 <div className="relative">
                    <img 
                      src={formData.image || 'https://via.placeholder.com/150?text=Service'} 
                      className="w-24 h-24 rounded-lg object-cover border-2 border-indigo-100" 
                      alt="Preview"
                    />
                    <label className="absolute bottom-[-8px] right-[-8px] bg-indigo-600 text-white rounded-full p-2 cursor-pointer hover:bg-indigo-700 shadow-md">
                      <i className="fa-solid fa-camera text-xs"></i>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                 </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">{t('common_name')} <span className="text-red-500">*</span></label>
                <input 
                  className="w-full border rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="Service Name" 
                />
              </div>
              <div>
                 <label className="block text-xs font-bold text-gray-600 mb-1">{t('common_desc')}</label>
                 <textarea 
                   className="w-full border rounded p-2 h-20 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                   value={formData.description} 
                   onChange={e => setFormData({...formData, description: e.target.value})} 
                   placeholder="Details about service..."
                 ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-2">
                 <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{t('common_price')} <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      className="w-full border rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={formData.price} 
                      onChange={e => setFormData({...formData, price: e.target.value})} 
                      placeholder="0" 
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{t('common_duration')}</label>
                    <input 
                      type="number" 
                      className="w-full border rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={formData.duration} 
                      onChange={e => setFormData({...formData, duration: parseInt(e.target.value) || 0})} 
                    />
                 </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200">{t('common_cancel')}</button>
              <button onClick={handleSaveService} className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold">{t('common_save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;