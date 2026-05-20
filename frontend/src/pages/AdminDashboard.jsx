import { useState } from 'react';
import Overview from '../components/admin/Overview';
import Upload from '../components/admin/Upload';
import Manage from '../components/admin/Manage';
import Reviews from '../components/admin/Reviews';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'upload', label: 'Upload books' },
    { id: 'manage', label: 'Manage catalog' },
    { id: 'reviews', label: 'Reader reviews' },
  ];

  return (
    <div className="page-shell space-y-10">
      <section className="surface-card-dark px-6 py-10 sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(255,247,239,0.58)]">Admin dashboard</p>
            <h1 className="mt-3 text-5xl text-[#fff7ef]">Manage the catalog, monitor activity, and keep the library polished.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[rgba(255,247,239,0.72)]">
              This workspace is now styled to match the public site so operations feel just as thoughtful as the reader experience.
            </p>
          </div>
          <div className="surface-card p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-[#8e766a]">Admin focus</p>
            <div className="mt-4 grid gap-3">
              {[
                'Track books, reviews, and reading activity from real backend endpoints.',
                'Add titles with cleaner upload controls.',
                'Moderate content from a more readable dashboard view.',
              ].map((item) => (
                <div key={item} className="rounded-[1.2rem] bg-white/70 p-4">
                  <p className="text-sm leading-7">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card-strong p-6 sm:p-8">
        <div className="flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`filter-chip ${activeTab === tab.id ? 'filter-chip-active' : ''}`}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'upload' && <Upload />}
        {activeTab === 'manage' && <Manage />}
        {activeTab === 'reviews' && <Reviews />}
      </section>
    </div>
  );
};

export default AdminDashboard;
