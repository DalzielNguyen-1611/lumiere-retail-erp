export default function App() {
  return (
    // Dùng class màu sắc hệ thống từ file theme.css
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="p-8 border border-border rounded-xl shadow-lg bg-card">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Lumière Beauty Studio ERP
        </h1>
        <p className="text-muted-foreground">
          Dự án ứng dụng PC đã khởi tạo thành công. Môi trường Tailwind v4 đã sẵn sàng!
        </p>
      </div>
    </div>
  )
}