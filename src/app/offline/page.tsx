/**
 * /offline, page de secours servie par le service worker quand le
 * reseau est mort (situation tres courante a 23h un samedi de feria).
 */
export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <h1 className="display text-4xl font-extrabold text-festa-red">Hors ligne</h1>
      <p className="mt-3 max-w-sm text-sm text-muted">
        Le réseau est saturé (bienvenue en féria). Les dernières données
        chargées restent disponibles, reviens sur cette page quand une
        barre de réseau réapparaît.
      </p>
    </main>
  );
}
