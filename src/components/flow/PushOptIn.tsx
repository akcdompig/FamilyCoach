"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icons";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { isPushSupported, notificationPermission, subscribeToPush, unsubscribeFromPush } from "@/lib/push/client";
import { useFamilyFlow } from "@/lib/store/FamilyFlowProvider";
import type { Person } from "@/lib/types";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/**
 * Opt-in voor echte pushmeldingen (release 3 §14, §40) — zodat een
 * herinnering ook binnenkomt als het toestel dicht is, niet alleen wanneer
 * het kind toevallig de app opent. Per apparaat: als Kian dit op zijn eigen
 * telefoon inschakelt, komen zijn herinneringen daar binnen.
 */
export function PushOptIn({ person }: { person: Person }) {
  const { data, addPushSubscription, removePushSubscriptionByEndpoint } = useFamilyFlow();
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    setSupported(isPushSupported());
    setPermission(notificationPermission());
  }, []);

  const alreadySubscribed = (data.pushSubscriptions ?? []).some((s) => s.personId === person.id);

  if (!VAPID_PUBLIC_KEY) return null;
  if (!supported) {
    return (
      <Card tone="outline" className="mt-8">
        <p className="flex items-center gap-2 text-sm text-muted">
          <Icon name="bell" className="h-4 w-4 shrink-0" />
          Meldingen worden niet ondersteund in deze browser.
        </p>
      </Card>
    );
  }

  async function enable() {
    setStatus("working");
    try {
      const subscription = await subscribeToPush(VAPID_PUBLIC_KEY as string);
      if (!subscription) {
        setStatus("error");
        setPermission(notificationPermission());
        return;
      }
      addPushSubscription(person.id, subscription);
      setStatus("idle");
      setPermission("granted");
    } catch {
      setStatus("error");
    }
  }

  async function disable() {
    setStatus("working");
    const endpoints = (data.pushSubscriptions ?? []).filter((s) => s.personId === person.id).map((s) => s.endpoint);
    await unsubscribeFromPush();
    endpoints.forEach((endpoint) => removePushSubscriptionByEndpoint(endpoint));
    setStatus("idle");
  }

  return (
    <Card tone={alreadySubscribed ? "sage" : "outline"} className="mt-8 flex items-start gap-3">
      <Icon name="bell" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-ink">Meldingen op dit apparaat</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          {alreadySubscribed
            ? "Aan. Herinneringen van je ouder komen hier binnen, ook als de app dicht is."
            : "Zet aan om herinneringen te krijgen, ook als de app dicht is."}
        </p>
        {permission === "denied" ? (
          <p className="mt-2 text-xs text-danger">
            Meldingen staan uit voor deze site in je browserinstellingen. Zet ze daar eerst weer aan.
          </p>
        ) : null}
        {status === "error" && permission !== "denied" ? (
          <p className="mt-2 text-xs text-danger">Dat lukte niet. Probeer het nog eens.</p>
        ) : null}
        <Button
          size="sm"
          variant={alreadySubscribed ? "secondary" : "primary"}
          className="mt-3"
          disabled={status === "working" || permission === "denied"}
          onClick={() => void (alreadySubscribed ? disable() : enable())}
        >
          {alreadySubscribed ? "Uitzetten" : "Meldingen inschakelen"}
        </Button>
      </div>
    </Card>
  );
}
