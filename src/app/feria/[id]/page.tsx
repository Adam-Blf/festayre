/**
 * /feria/[id], page serveur d'une feria.
 * Valide le slug, genere les metadonnees SEO, puis delegue tout
 * l'interactif (carte, geoloc, POI) au composant client.
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FERIAS, getFeria } from "@/features/ferias/data";
import FeriaPageClient from "./FeriaPageClient";

// Toutes les ferias sont connues a l'avance : pages statiques au build.
export function generateStaticParams() {
  return FERIAS.map((f) => ({ id: f.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const feria = getFeria(id);
  if (!feria) return {};
  return {
    title: `${feria.name} 2026, carte et programme | Festayre`,
    description: `Toilettes les plus proches, alcool le moins cher, programme et meteo pour ${feria.name} a ${feria.city}.`,
  };
}

export default async function FeriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const feria = getFeria(id);
  if (!feria) notFound();

  return <FeriaPageClient feria={feria} />;
}
