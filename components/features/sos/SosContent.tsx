"use client";

import { useCallback, useRef, useState } from "react";
import {
  AlertTriangle,
  Heart,
  MapPin,
  Mic,
  MicOff,
  Phone,
  Share2,
  Shield,
  UserPlus,
  Users,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSimulatedLoading } from "@/hooks/useSimulatedLoading";
import { INDIAN_EMERGENCY_SERVICES, PRIMARY_EMERGENCY_NUMBER } from "@/lib/emergency-services";
import { ROUTES } from "@/lib/constants";
import {
  EMERGENCY_CONTACTS,
  LIVE_LOCATION,
  type EmergencyEvent,
} from "@/lib/sample-data";
import { cn } from "@/lib/utils";

const HOLD_DURATION = 3000;

function formatEventTime(date: Date) {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function createEvent(
  type: EmergencyEvent["type"],
  detail: string
): EmergencyEvent {
  return {
    id: crypto.randomUUID(),
    type,
    timestamp: formatEventTime(new Date()),
    detail,
  };
}

export function SosContent() {
  const { t } = useLocale(); 
  const isLoading = useSimulatedLoading();
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [events, setEvents] = useState<EmergencyEvent[]>([]);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef(0);

  const addEvent = useCallback((event: EmergencyEvent) => {
    setEvents((prev) => [event, ...prev]);
  }, []);

  const clearHold = useCallback(() => {
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
    setIsHolding(false);
    setHoldProgress(0);
  }, []);

  const triggerSOS = useCallback(() => {
    setAlertSent(true);
    addEvent(createEvent("sos_triggered", "SOS alert activated"));
    addEvent(
      createEvent(
        "location_shared",
        `Location shared: ${LIVE_LOCATION.area}`
      )
    );
    EMERGENCY_CONTACTS.forEach((contact) => {
      addEvent(
        createEvent("contact_notified", `${contact.name} notified via SMS`)
      );
    });
  }, [addEvent]);

  const startHold = useCallback(() => {
    setIsHolding(true);
    setAlertSent(false);
    startTime.current = Date.now();
    holdTimer.current = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setHoldProgress(progress);
      if (progress >= 100) {
        clearHold();
        triggerSOS();
      }
    }, 50);
  }, [clearHold, triggerSOS]);

  const handleShareLocation = useCallback(async () => {
    const locationText = `${LIVE_LOCATION.area} (${LIVE_LOCATION.coordinates.lat}, ${LIVE_LOCATION.coordinates.lng})`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "SafeCity Connect — Emergency Location",
          text: `I need help! My location: ${locationText}`,
        });
      } catch {
        /* user cancelled */
      }
    }
    addEvent(createEvent("location_shared", `Location shared: ${locationText}`));
  }, [addEvent]);

  const handleNotifyContacts = useCallback(() => {
    EMERGENCY_CONTACTS.forEach((contact) => {
      addEvent(
        createEvent("contact_notified", `${contact.name} notified`)
      );
    });
    setAlertSent(true);
  }, [addEvent]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      if (recordTimer.current) {
        clearInterval(recordTimer.current);
        recordTimer.current = null;
      }
      setIsRecording(false);
      addEvent(
        createEvent(
          "audio_recorded",
          `Audio recording saved (${recordingSeconds}s)`
        )
      );
      setRecordingSeconds(0);
    } else {
      setIsRecording(true);
      setRecordingSeconds(0);
      recordTimer.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    }
  }, [isRecording, recordingSeconds, addEvent]);

  if (isLoading) {
    return (
      <PageContainer withBottomNav>
        <PageHeader title={t.sosEmergency} subtitle={t.loading} backHref={ROUTES.dashboard} />
        <Skeleton className="mx-auto mb-8 h-40 w-40 rounded-full" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer withBottomNav>
      <PageHeader
        title={t.sosEmergency}
        subtitle={t.sosSubtitle}
        backHref={ROUTES.dashboard}
      />

      {alertSent && (
        <Card padding="sm" className="mb-6 border-danger/30 bg-danger-light animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 shrink-0 text-danger" />
            <div>
              <p className="font-semibold text-danger">{t.alertSent}</p>
              <p className="text-sm text-red-700">
                {t.locationShared} ({EMERGENCY_CONTACTS.length} contacts)
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card padding="sm" className="mb-6 border-danger/40 bg-danger/5">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-danger text-white shadow-lg">
            <Phone className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-foreground">{t.oneTapSOS}</p>
            <p className="text-sm text-muted">{t.call112Desc}</p>
          </div>
          <Button variant="danger" size="sm" href={PRIMARY_EMERGENCY_NUMBER.tel}>
            {t.call112}
          </Button>
        </div>
      </Card>

      <div className="mb-8 flex flex-col items-center">
        <div className="relative">
          <svg className="absolute -inset-3 h-[calc(100%+24px)] w-[calc(100%+24px)]" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-danger/20"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${holdProgress * 2.89} 289`}
              strokeLinecap="round"
              className="text-danger transition-all duration-75"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <button
            type="button"
            className={cn(
              "relative flex h-40 w-40 items-center justify-center rounded-full bg-danger shadow-xl shadow-danger/30 transition-transform",
              isHolding ? "scale-95" : "active:scale-95"
            )}
            aria-label="Hold to trigger SOS emergency alert"
            onPointerDown={startHold}
            onPointerUp={clearHold}
            onPointerLeave={clearHold}
          >
            {!isHolding && !alertSent && (
              <span className="absolute inset-0 animate-ping rounded-full bg-danger/20" />
            )}
            <span className="relative text-center">
              <span className="block text-3xl font-black text-white">SOS</span>
              <span className="mt-1 block text-xs font-medium text-white/80">
                {isHolding ? t.keepHolding : t.holdToAlert}
              </span>
            </span>
          </button>
        </div>
        <p className="mt-4 max-w-xs text-center text-sm text-muted">
          Press and hold for 3 seconds to {t.notifyContacts.toLowerCase()} and share live location.
        </p>
      </div>

      <div className="mb-6 grid gap-2 sm:grid-cols-2">
        <Button variant="outline" size="sm" onClick={handleShareLocation}>
          <Share2 className="h-4 w-4" />
          {t.shareLocation}
        </Button>
        <Button variant="outline" size="sm" onClick={handleNotifyContacts}>
          <Users className="h-4 w-4" />
          {t.notifyContacts}
        </Button>
      </div>

      <Card padding="sm" className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                isRecording ? "bg-danger text-white" : "bg-slate-100 text-muted"
              )}
            >
              {isRecording ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{t.audioRecording}</p>
              <p className="text-xs text-muted">
                {isRecording
                  ? `${t.recordingActive} ${recordingSeconds}s`
                  : "Record audio evidence during emergency"}
              </p>
            </div>
          </div>
          <Button
            variant={isRecording ? "danger" : "secondary"}
            size="sm"
            onClick={toggleRecording}
          >
            {isRecording ? t.stopRecording : t.startRecording}
          </Button>
        </div>
      </Card>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t.emergencyServices}</h2>
        <div className="flex flex-col gap-2">
          {INDIAN_EMERGENCY_SERVICES.map((service) => (
            <Card key={service.number} padding="sm" className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger font-bold text-sm">
                  {service.number}
                </div>
                <div>
                  <p className="font-medium text-foreground">{service.label}</p>
                  <p className="text-xs text-muted">{service.description}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" href={service.tel} className="!px-3">
                <Phone className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            {t.emergencyContacts}
            <span className="ml-1.5 font-normal text-muted">({EMERGENCY_CONTACTS.length})</span>
          </h2>
          <Button variant="ghost" size="sm">
            <Users className="h-4 w-4" />
            {t.manage}
          </Button>
        </div>

        {EMERGENCY_CONTACTS.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="No emergency contacts"
            description="Add trusted contacts who will be notified when you trigger an SOS alert."
            actionLabel="Add Contact"
            onAction={() => {}}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {EMERGENCY_CONTACTS.map((contact) => (
              <Card key={contact.id} padding="sm" className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
                    {contact.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{contact.name}</p>
                      {contact.isPrimary && (
                        <Badge variant="danger" className="text-[10px]">{t.primary}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted">{contact.relationship}</p>
                    <p className="text-sm text-muted">{contact.phone}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="!px-3"
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  aria-label={`Call ${contact.name}`}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t.eventLog}</h2>
        {events.length === 0 ? (
          <Card padding="sm">
            <p className="text-sm text-muted">{t.noEvents}</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {events.map((event) => (
              <Card key={event.id} padding="sm" className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{event.detail}</p>
                  <p className="text-xs text-muted">{event.timestamp}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card padding="sm" className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">{t.liveLocation}</p>
            <p className="text-xs text-muted">
              {LIVE_LOCATION.area}, {LIVE_LOCATION.accuracy} accuracy
            </p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-start gap-3">
          <Heart className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          <div>
            <p className="text-sm font-medium text-foreground">{t.medicalInfo}</p>
            <p className="text-xs text-muted">Blood group B+, no known allergies</p>
          </div>
        </Card>
      </div>

      <Card padding="sm" className="mt-4 flex items-center gap-3 bg-accent-light/50">
        <Share2 className="h-5 w-5 shrink-0 text-accent" />
        <p className="text-sm text-foreground">
          <Shield className="mr-1 inline h-4 w-4" />
          Your location is only shared when SOS is actively triggered.
        </p>
      </Card>
    </PageContainer>
  );
}
