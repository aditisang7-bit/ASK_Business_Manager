import React, { useState } from 'react';
import { DB } from '../services/db';
import { Staff, UserRole } from '../types';
import { useTranslation } from '../services/i18n';
import { useToast } from '../components/Toast';

const StaffPage: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>(DB.getStaff());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', phone: '', role: UserRole.STAFF, commissionRate: 10, avatar: '' });
  
  const { t } = useTranslation();
  const { showToast } = useToast();

  const toggleAttendance = (id: string) => {
    const updated = staff.map(s => {
      if (s.id === id) return { ...s, attendanceToday: !s.attendanceToday };
      return s;
    });
    setStaff(updated);
    updated.forEach(s => DB.saveStaff(s));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentStaffId(null);
    setFormData({ name: '', phone: '', role: UserRole.STAFF, commissionRate: 10, avatar: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (s: Staff) => {
    setIsEditMode(true);
    setCurrentStaffId(s.id);
    setFormData({ name: s.name, phone: s.phone, role: s.role, commissionRate: s.commissionRate, avatar: s.avatar || '' });
    setIsModalOpen(true);
  };

  const handleSaveStaff = () => {
    if (!formData.name || !formData.phone) return;
    
    let s: Staff;

    // Use uploaded avatar or generate default if empty
    const finalAvatar = formData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`;

    if (isEditMode && currentStaffId) {
      // Update existing staff
      const existing = staff.find(x => x.id === currentStaffId);
      if (!existing) return;
      s = {
        ...existing,
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
        commissionRate: Number(formData.commissionRate),
        avatar: finalAvatar
      };
      showToast(t('common_saved'), "success");
    } else {
      // Create new staff
      s = {
        id: Date.now().toString(),
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
        commissionRate: Number(formData.commissionRate),
        status: 'active',
        attendanceToday: false, // Default absent when created
        avatar: finalAvatar
      };
      showToast("Staff added successfully", "success");
    }

    DB.saveStaff(s);
    setStaff(DB.getStaff());
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-slate-800">{t('staff_title')}</h2>
         <button onClick={openAddModal} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow">
           <i className="fa-solid fa-plus mr-2"></i> {t('staff_add')}
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map(s => (
          <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
            <div className="p-6 flex items-start gap-4 relative">
              {/* Edit button always visible */}
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => openEditModal(s)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 flex items-center justify-center transition-colors"
                  title={t('common_edit')}
                >
                  <i className="fa-solid fa-pen text-xs"></i>
                </button>
              </div>

              <img src={s.avatar} alt={s.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" />
              <div>
                <h3 className="font-bold text-lg text-slate-800">{s.name}</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">{s.role}</span>
                <p className="text-sm text-gray-500 mt-1">{s.phone}</p>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <div>
                 <p className="text-xs text-gray-500 uppercase font-semibold">{t('staff_today_status')}</p>
                 <div className="flex items-center gap-2 mt-1">
                   <div className={`w-3 h-3 rounded-full ${s.attendanceToday ? 'bg-green-500' : 'bg-red-400'}`}></div>
                   <span className="text-sm font-medium">{s.attendanceToday ? t('staff_present') : t('staff_absent')}</span>
                 </div>
              </div>
              <button 
                onClick={() => toggleAttendance(s.id)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                  s.attendanceToday 
                  ? 'border-red-200 text-red-600 hover:bg-red-50' 
                  : 'border-green-200 text-green-600 hover:bg-green-50'
                }`}
              >
                {s.attendanceToday ? t('staff_mark_absent') : t('staff_mark_present')}
              </button>
            </div>
            
            <div className="px-6 py-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
              <span>{t('staff_commission')}: {s.commissionRate}%</span>
              <button className="text-indigo-600 hover:underline">{t('staff_view_perf')}</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl animate-fade-in">
            <h3 className="text-xl font-bold mb-4">{isEditMode ? t('common_edit') : t('staff_add')}</h3>
            <div className="space-y-3">
              <div className="flex justify-center mb-4">
                 <div className="relative">
                    <img 
                      src={formData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'New')}&background=random`} 
                      className="w-20 h-20 rounded-full object-cover border-2 border-indigo-100" 
                      alt="Preview"
                    />
                    <label className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-1.5 cursor-pointer hover:bg-indigo-700 shadow-md">
                      <i className="fa-solid fa-camera text-xs"></i>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                 </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">{t('common_name')}</label>
                <input className="w-full border rounded p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Jane Doe" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">{t('common_phone')}</label>
                <input className="w-full border rounded p-2" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91 98765..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">{t('staff_role')}</label>
                <select className="w-full border rounded p-2" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                  <option value={UserRole.STAFF}>Staff</option>
                  <option value={UserRole.MANAGER}>Manager</option>
                  <option value={UserRole.OWNER}>Owner</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">{t('staff_commission')}</label>
                <input type="number" className="w-full border rounded p-2" value={formData.commissionRate} onChange={e => setFormData({...formData, commissionRate: parseInt(e.target.value)})} />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200">{t('common_cancel')}</button>
              <button onClick={handleSaveStaff} className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold">{t('common_save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPage;