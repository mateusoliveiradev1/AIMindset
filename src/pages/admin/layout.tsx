import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from '../../components/Admin/AdminHeader';
import AdminSidebar from '../../components/Admin/AdminSidebar';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-dark-surface to-darker-surface">
      {/* Header Premium */}
      <AdminHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      
      {/* Sidebar Premium */}
      <AdminSidebar collapsed={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Conteúdo Principal com margem para o header fixo e sidebar */}
      <main className={`pt-16 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        <div className="container mx-auto px-4 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}