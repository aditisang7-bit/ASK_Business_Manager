import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from '../services/i18n';
import { DB } from '../services/db';

const Legal: React.FC = () => {
  const { page } = useParams();
  const { t } = useTranslation();
  const isAuth = DB.isAuthenticated();
  const profile = DB.getProfile();
  
  // Use translations for content
  const contentMap = {
    privacy: { title: 'legal_privacy', content: 'legal_privacy_content' },
    terms: { title: 'legal_terms', content: 'legal_terms_content' },
    refund: { title: 'legal_refund', content: 'legal_refund_content' }
  };

  const currentKey = (page && contentMap[page as keyof typeof contentMap]) ? page as keyof typeof contentMap : 'privacy';
  const current = contentMap[currentKey];

  return (
    <div className={`max-w-3xl mx-auto py-10 px-6 bg-white shadow-sm my-8 rounded-xl border border-gray-100 ${isAuth ? 'animate-fade-in' : ''}`}>
      <div className="mb-6">
        {!isAuth && (
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-4">
            <i className="fa-solid fa-arrow-left"></i> {t('legal_back_home')}
            </Link>
        )}
        <div className="flex gap-4 text-sm border-b pb-4">
          <Link to="/legal/privacy" className={`hover:text-indigo-600 ${page === 'privacy' ? 'font-bold text-indigo-600' : 'text-gray-500'}`}>{t('legal_privacy')}</Link>
          <Link to="/legal/terms" className={`hover:text-indigo-600 ${page === 'terms' ? 'font-bold text-indigo-600' : 'text-gray-500'}`}>{t('legal_terms')}</Link>
          <Link to="/legal/refund" className={`hover:text-indigo-600 ${page === 'refund' ? 'font-bold text-indigo-600' : 'text-gray-500'}`}>{t('legal_refund')}</Link>
        </div>
      </div>
      
      {/* Personalized Header if Logged In */}
      {isAuth ? (
          <div className="mb-6 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
              <h1 className="text-2xl font-bold text-indigo-900">{t(current.title)}</h1>
              <p className="text-sm text-indigo-700 mt-1">
                  Agreement for <span className="font-bold">{profile.name}</span>
              </p>
          </div>
      ) : (
          <h1 className="text-3xl font-bold mb-6 text-slate-900">{t(current.title)}</h1>
      )}

      <div className="prose text-gray-600" dangerouslySetInnerHTML={{ __html: t(current.content) }} />
      
      <div className="mt-10 pt-6 border-t border-gray-100 text-sm text-gray-400">
        <p>{t('legal_last_updated')}: {new Date().toLocaleDateString()}</p>
        <p>ASK Multinational Company • +91 7249074350</p>
      </div>
    </div>
  );
};

export default Legal;