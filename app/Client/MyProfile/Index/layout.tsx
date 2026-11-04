export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen bg-slate-50">
      {/* Yeh wrapper ensure karega ki global layout aur menus intact rahein */}
      <div className="w-full p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}