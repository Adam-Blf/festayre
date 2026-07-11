/**
 * not-found.tsx, 404 maison. Une app App Store-grade ne montre jamais
 * la page d'erreur par defaut du framework.
 */
import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <Image src="/logo.png" alt="Festayre" width={96} height={108} />
      <h1 className="display mt-6 text-4xl text-festa-red">Perdu ?</h1>
      <p className="mt-3 max-w-sm text-sm text-muted">
        Cette page n&apos;existe pas. Ça arrive aux meilleurs, surtout
        après les bodegas.
      </p>
      <Link
        href="/"
        className="mt-6 flex min-h-12 items-center rounded-xl bg-festa-red px-6 text-sm font-bold text-white"
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
