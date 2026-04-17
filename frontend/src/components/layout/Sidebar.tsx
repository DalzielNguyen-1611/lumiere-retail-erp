export function Sidebar() {
  return (
    <div className="w-64 h-full bg-white/80 backdrop-blur-md p-6 border-r border-pink-100">
      <h2 className="text-xl font-bold text-pink-600 mb-8">Lumière Studio</h2>
      <nav className="space-y-4">
        <div className="p-2 hover:bg-pink-50 rounded cursor-pointer">📊 Dashboard</div>
        <div className="p-2 hover:bg-pink-50 rounded cursor-pointer">📦 Quản lý kho</div>
        <div className="p-2 hover:bg-pink-50 rounded cursor-pointer">👥 Nhân viên</div>
      </nav>
    </div>
  );
}