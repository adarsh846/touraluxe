export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-panel" style={{ cursor: "auto" }}>
      <style>{`
        .admin-panel, .admin-panel *, .admin-panel *:hover, 
        .admin-panel a, .admin-panel button, .admin-panel input, 
        .admin-panel select, .admin-panel textarea, .admin-panel label {
          cursor: auto !important;
        }
        .admin-panel button:hover, .admin-panel a:hover {
          cursor: pointer !important;
        }
        .admin-panel input, .admin-panel textarea {
          cursor: text !important;
        }
      `}</style>
      {children}
    </div>
  );
}
