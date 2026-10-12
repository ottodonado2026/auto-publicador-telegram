import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#E5E7EB] text-[#111827] flex">
      {/* Sidebar fijo inteligente a la izquierda */}
      <AdminSidebar />

      {/* Contenido dinámico con margen a la izquierda y paleta descansada gris pizarra */}
      <div className="flex-1 ml-64 min-h-screen flex flex-col bg-[#E9ECF0]">
        {children}
      </div>
    </div>
  );
}
