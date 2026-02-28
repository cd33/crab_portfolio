/**
 * MainLayout Component
 * Layout wrapper for the 3D scene and UI overlays
 */
export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}
