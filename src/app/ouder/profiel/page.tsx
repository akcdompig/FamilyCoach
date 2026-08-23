"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";

export default function ParentProfilePage() {
  const { data, activePerson, updateSettings, eraseEverything, loadDemo, forgetMemory } = useFamilyFlow();
  const toast = useToast();
  const router = useRouter();
  const [status, setStatus] = useState<{ provider: string; configured: boolean } | null>(null);
  const [confirmErase, setConfirmErase] = useState(false);

  useEffect(() => {
    fetch("/api/coach")
      .then((res) => res.json())
      .then((json) => setStatus(json as { provider: string; configured: boolean }))
      .catch(() => setStatus({ provider: "none", configured: false }));
  }, []);

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "familyflow-export.json";
    link.click();
    URL.revokeObjectURL(url);
    toast("Export gedownload");
  }

  return (
    <AppShell role="parent">
      <header className="mb-6">
        <h1 className="text-[28px] font-semibold leading-tight text-ink">Profiel</h1>
        <p className="mt-1 text-sm text-muted">
          {activePerson.name} · {data.family.name}
        </p>
      </header>

      <section>
        <SectionTitle>Hoe vaak laat Flow van zich horen?</SectionTitle>
        <Card className="space-y-5">
          <div>
            <label className="label" htmlFor="max-moments">
              Maximaal aantal coachmomenten per dag
            </label>
            <select
              id="max-moments"
              className="field"
              value={data.settings.maxMomentsPerDay}
              onChange={(event) => updateSettings({ maxMomentsPerDay: Number(event.target.value) })}
            >
              {[1, 2, 3, 4].map((value) => (
                <option key={value} value={value}>
                  {value} per dag
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="quiet-from">
                Stil vanaf
              </label>
              <input
                id="quiet-from"
                type="time"
                className="field"
                value={data.settings.quietFrom}
                onChange={(event) => updateSettings({ quietFrom: event.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="quiet-to">
                Weer actief vanaf
              </label>
              <input
                id="quiet-to"
                type="time"
                className="field"
                value={data.settings.quietTo}
                onChange={(event) => updateSettings({ quietTo: event.target.value })}
              />
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            Flow herhaalt zichzelf niet als er niet gereageerd wordt, en waarschuwt jou pas als iets
            meerdere dagen achter elkaar niet lukt.
          </p>
        </Card>
      </section>

      <section className="mt-8">
        <SectionTitle>Flow &amp; AI</SectionTitle>
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-ink">Flow gebruikt een AI-model</p>
              <p className="mt-1 text-sm text-muted">
                Staat dit uit, dan blijft Flow werken op vaste regels zonder externe verbinding.
              </p>
            </div>
            <input
              type="checkbox"
              aria-label="AI-ondersteuning gebruiken"
              className="h-5 w-5 shrink-0 accent-primary"
              checked={data.settings.aiEnabled}
              onChange={(event) => updateSettings({ aiEnabled: event.target.checked })}
            />
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
            <div>
              <p className="font-medium text-ink">Interesses meesturen</p>
              <p className="mt-1 text-sm text-muted">
                Maakt berichten persoonlijker, bijvoorbeeld door voetbal of muziek te noemen.
              </p>
            </div>
            <input
              type="checkbox"
              aria-label="Interesses meesturen"
              className="h-5 w-5 shrink-0 accent-primary"
              checked={data.settings.shareInterestsWithAI}
              onChange={(event) => updateSettings({ shareInterestsWithAI: event.target.checked })}
            />
          </div>
          <div className="flex items-center gap-2 border-t border-line pt-4">
            <Badge tone={status?.configured ? "green" : "muted"}>
              {status ? (status.configured ? `${status.provider} actief` : "Regelgebaseerd") : "controleren…"}
            </Badge>
            <span className="text-sm text-muted">
              {status?.configured
                ? "Berichten komen van het model, met vaste veiligheidsregels ervoor."
                : "Geen API key gevonden. Flow werkt op regels."}
            </span>
          </div>
        </Card>
      </section>

      <section className="mt-8">
        <SectionTitle>Hoe werkt privacy bij Flow-gesprekken?</SectionTitle>
        <Card className="space-y-3">
          <p className="text-sm leading-relaxed text-muted">
            Flow deelt gesprekken niet automatisch met jou. We gebruiken drie categorieën, en je kind ziet
            dezelfde uitleg in eenvoudige taal:
          </p>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium text-ink">Privé</span> — blijft tussen je kind en Flow. Dit is de meeste conflict- en coachgesprekken.</p>
            <p><span className="font-medium text-ink">Zichtbaar voor ouder</span> — je kind kiest zelf om iets met je te delen.</p>
            <p><span className="font-medium text-ink">Veiligheidsrelevant</span> — als Flow zorgen heeft over de veiligheid van je kind, verwijst Flow altijd door naar een vertrouwde volwassene en zie je dat hier op je startpagina.</p>
          </div>
        </Card>
      </section>

      {(data.memoryFacts ?? []).length > 0 ? (
        <section className="mt-8">
          <SectionTitle>Wat Flow heeft onthouden</SectionTitle>
          <Card className="space-y-2">
            <p className="text-sm leading-relaxed text-muted">
              Korte, relevante feiten — geen transcripten. Je kunt losse items verwijderen.
            </p>
            <ul className="divide-y divide-line">
              {(data.memoryFacts ?? []).map((fact) => (
                <li key={fact.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-sm text-ink">{fact.text}</span>
                  <button
                    type="button"
                    onClick={() => forgetMemory(fact.id)}
                    className="shrink-0 text-xs font-medium text-muted hover:text-[#9B3B2F] hover:underline"
                  >
                    Vergeten
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ) : null}

      <section className="mt-8">
        <SectionTitle>Gegevens</SectionTitle>
        <Card className="space-y-4">
          <p className="text-sm leading-relaxed text-muted">
            In deze versie blijven jullie gegevens op dit apparaat. Naar het AI-model gaat alleen een
            beperkte samenvatting: voornaam, leeftijd, focusgebieden en de afspraken van vandaag. Geen
            achternamen, geen e-mailadressen, geen vrije intaketekst.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={exportData}>
              Gegevens exporteren
            </Button>
            <Button variant="secondary" size="sm" onClick={() => router.push("/onboarding")}>
              Opnieuw instellen
            </Button>
            <Button variant="secondary" size="sm" onClick={() => { loadDemo(); toast("Demogezin geladen"); }}>
              Demogezin laden
            </Button>
            <Button variant="danger" size="sm" onClick={() => setConfirmErase(true)}>
              Alles verwijderen
            </Button>
          </div>
        </Card>
      </section>

      <section className="mt-8">
        <SectionTitle>Pilot</SectionTitle>
        <Card tone="sand">
          <p className="text-[15px] leading-relaxed text-ink">
            Doen jullie mee aan de testpilot? Laat weten wat werkt en wat irritant is.
          </p>
          <Link href="/pilot" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
            Naar de pilotpagina
          </Link>
        </Card>
      </section>

      <p className="mt-10 px-1 text-xs leading-relaxed text-muted">
        FamilyFlow is een ondersteunende gezinscoach en geen medisch diagnostisch of behandelplatform.
        Flow stelt geen diagnoses en geeft geen medisch advies. Bij zorgen over de gezondheid of
        veiligheid van je kind: neem contact op met je huisarts of een andere passende professional.
      </p>

      <Modal
        open={confirmErase}
        onClose={() => setConfirmErase(false)}
        title="Alles verwijderen?"
        description="Alle gezinsgegevens, afspraken en check-ins worden gewist. Dit kan niet ongedaan gemaakt worden."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmErase(false)}>
              Annuleren
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                eraseEverything();
                setConfirmErase(false);
                router.push("/");
              }}
            >
              Verwijderen
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Wil je een kopie bewaren? Exporteer je gegevens eerst.
        </p>
      </Modal>
    </AppShell>
  );
}
