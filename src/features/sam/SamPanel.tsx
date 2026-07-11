"use client";

/**
 * SamPanel.tsx, le mode SAM (celui qui ne boit pas et ramene tout
 * le monde vivant).
 *
 * Trois outils, zero compte requis :
 *  1. le groupe : liste des prenoms + numeros (localStorage), appel
 *     en un tap,
 *  2. "Partager ma position" : envoie un lien Google Maps de sa
 *     position via la feuille de partage du telephone,
 *  3. alerte discrete : pre-remplit un SMS "viens me chercher" avec
 *     la position, vers le contact de confiance choisi.
 *
 * Vie privee : tout reste sur le telephone, rien ne part vers un
 * serveur Festayre.
 */
import { useEffect, useState } from "react";

type Contact = { id: string; name: string; phone: string };

const STORAGE_KEY = "festayre.sam.contacts.v1";

/** Message de l'alerte discrete (volontairement sobre et clair). */
function alertSms(url: string): string {
  return encodeURIComponent(
    `J'ai besoin que tu viennes me chercher. Ma position : ${url}`
  );
}

export default function SamPanel() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setContacts(JSON.parse(raw) as Contact[]);
    } catch {
      // Stockage corrompu : on repart de zero, pas de crash.
    }
  }, []);

  const save = (next: Contact[]) => {
    setContacts(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addContact = () => {
    if (!name.trim() || !phone.trim()) return;
    save([...contacts, { id: `${Date.now()}`, name: name.trim(), phone: phone.trim() }]);
    setName("");
    setPhone("");
  };

  /** Recupere la position et retourne un lien Google Maps. */
  const getPositionUrl = () =>
    new Promise<string>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve(`https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`),
        reject,
        { enableHighAccuracy: true, timeout: 10_000 }
      );
    });

  const shareMyPosition = async () => {
    try {
      const url = await getPositionUrl();
      if (navigator.share) {
        await navigator.share({ title: "Ma position", text: `Je suis ici : ${url}` });
        setStatus("Position partagée.");
      } else {
        await navigator.clipboard.writeText(url);
        setStatus("Lien de position copié.");
      }
    } catch {
      setStatus("Impossible de récupérer la position (GPS refusé ?).");
    }
  };

  /** Ouvre le SMS d'alerte pre-rempli vers un contact. */
  const sendAlert = async (contact: Contact) => {
    try {
      const url = await getPositionUrl();
      // sms: est le seul canal universel sans backend ni compte.
      window.location.href = `sms:${contact.phone}?body=${alertSms(url)}`;
    } catch {
      setStatus("Position introuvable, l'alerte partira sans lien.");
      window.location.href = `sms:${contact.phone}?body=${encodeURIComponent(
        "J'ai besoin que tu viennes me chercher."
      )}`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Partage de position, l'action la plus frequente du SAM. */}
      <button
        onClick={shareMyPosition}
        className="w-full rounded-xl bg-festa-navy py-3.5 text-sm font-bold text-white"
      >
        Partager ma position au groupe
      </button>
      {status && (
        <p role="status" className="text-center text-xs text-muted">
          {status}
        </p>
      )}

      {/* Le groupe. */}
      <section className="rounded-xl border border-card-border bg-card p-4">
        <h2 className="display text-lg text-festa-red">Mon groupe</h2>
        <p className="mt-1 text-xs text-muted">
          Ajoute les numéros AVANT la féria, pas à 3h du matin.
        </p>

        {contacts.length > 0 && (
          <ul className="mt-3 space-y-2">
            {contacts.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {c.name}
                </span>
                <a
                  href={`tel:${c.phone}`}
                  className="flex min-h-11 items-center rounded-full bg-festa-green px-4 text-xs font-bold text-white"
                >
                  Appeler
                </a>
                <button
                  onClick={() => sendAlert(c)}
                  className="flex min-h-11 items-center rounded-full bg-festa-red px-4 text-xs font-bold text-white"
                >
                  Alerte
                </button>
                <button
                  onClick={() => save(contacts.filter((x) => x.id !== c.id))}
                  aria-label={`Supprimer ${c.name}`}
                  className="flex h-11 w-11 items-center justify-center text-xs font-bold text-muted"
                >
                  X
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Prénom"
            className="w-28 rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="06..."
            type="tel"
            inputMode="tel"
            className="flex-1 rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={addContact}
            className="rounded-lg bg-festa-navy px-4 text-sm font-bold text-white"
          >
            OK
          </button>
        </div>
      </section>

      {/* Rappels du SAM + urgences, toujours visibles. */}
      <section className="rounded-xl border border-festa-red/40 bg-festa-red/5 p-4 text-sm">
        <h2 className="display text-lg text-festa-red">Réflexes SAM</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
          <li>Un point de RDV fixé sur la carte de la féria (onglet Carte).</li>
          <li>De l&apos;eau pour tout le monde toutes les deux heures.</li>
          <li>Personne ne rentre seul, personne ne reste seul en vrac.</li>
        </ul>
        <p className="mt-3 font-semibold">
          Urgences : <a className="underline" href="tel:112">112</a>,{" "}
          <a className="underline" href="tel:15">15 SAMU</a>,{" "}
          <a className="underline" href="tel:3114">3114 souffrance psychique</a>
        </p>
      </section>
    </div>
  );
}
