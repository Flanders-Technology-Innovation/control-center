"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Archive,
  ArchiveRestore,
  ArrowRight,
  ArrowUpRight,
  AtSign,
  Bookmark,
  Cable,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  Facebook,
  Globe2,
  Inbox,
  Instagram,
  KeyRound,
  LayoutDashboard,
  Link2,
  Linkedin,
  ListTodo,
  Mail,
  Menu,
  MessageSquare,
  Music2,
  Moon,
  Newspaper,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Users,
  X,
  Youtube,
} from "lucide-react";
import type {
  AudienceMetric,
  AudiencePlatform,
  DailyBriefItem,
  DailyBriefResponse,
  LiveFeedResponse,
  LiveStory,
  NewsletterFeedResponse,
  PublicSettings,
  ReminderItem,
  SettingsUpdate,
  TaskItem,
  WorkspaceState,
  WorkspaceStateResponse,
} from "@/lib/types";
import {
  GOOGLE_OAUTH_CLIENT_ID_ERROR,
  isGoogleOAuthClientId,
} from "@/lib/google-oauth";
import { isDailyBriefItemInWindow } from "@/lib/brief-window";
import {
  AUDIENCE_COMPARISON_WINDOW_LABEL,
  audienceComparisonLabel,
} from "@/lib/audience-growth";
import { SettingsInput } from "@/components/settings-input";
import { AiProviderSettings } from "@/components/ai-provider-settings";
import { DailySnapshot } from "@/components/daily-snapshot";
import { AudienceInsights } from "@/components/audience-insights";
import type { AudienceHistorySeries } from "@/lib/audience-charts";
import { AI_PROVIDER_LABELS, DEFAULT_LOCAL_AI_URLS, isAiReady } from "@/lib/ai-providers";
import { sortFeedStories, selectNewsletterTopics, newsletterSourceOptions } from "@/lib/feed-priority";
import { sortIndustryItems, type IndustrySortOrder } from "@/lib/industry";
import { completeTaskItems } from "@/lib/tasks";
import {
  applyArchiveToPayload,
  type CachedFeedPayload,
} from "@/lib/live-response";

type Tab =
  | "today"
  | "industry"
  | "mentions"
  | "reminders"
  | "audience"
  | "newsletters"
  | "tasks"
  | "settings";
type SettingsSection =
  | "general"
  | "industry"
  | "mentions"
  | "newsletters"
  | "audience"
  | "ai"
  | "dailyBrief"
  | "integrations";
type Reminder = ReminderItem;
type Task = TaskItem;

const emptySettings: PublicSettings = {
  general: { workspaceName: "Control Center" },
  industry: {
    sources: [],
    keywords: [],
    description: "",
    excludedTerms: [],
    dailyLimit: 30,
  },
  mentions: {
    terms: [],
    websites: [],
    identityAnchors: [],
    negativeTerms: [],
    strictMode: true,
    excludeOwnedSites: true,
  },
  newsletters: {
    googleClientId: "",
    googleClientSecretSet: false,
    connected: false,
    connectedEmail: "",
    gmailQuery: "newer_than:30d (category:updates OR category:promotions)",
  },
  audience: { accounts: [] },
  ai: {
    provider: "none",
    model: "",
    localBaseUrls: DEFAULT_LOCAL_AI_URLS,
    keySet: { openai: false, anthropic: false, gemini: false, xai: false, lmstudio: false, ollama: false },
    keySource: { openai: "none", anthropic: "none", gemini: "none", xai: "none", lmstudio: "none", ollama: "none" },
  },
  dailyBrief: { sourceLabels: [], lookbackDays: 7, sections: { industry: 5, mentions: 5, newsletters: 5 } },
};

const nav: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: "today", label: "Today", icon: LayoutDashboard },
  { id: "industry", label: "Industry", icon: Radio },
  { id: "mentions", label: "Mentions", icon: AtSign },
  { id: "reminders", label: "Reminders", icon: Bookmark },
  { id: "audience", label: "Audience", icon: Users },
  { id: "newsletters", label: "Newsletters", icon: Newspaper },
  { id: "tasks", label: "Tasks", icon: ListTodo },
];

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}
function Panel({
  children,
  className = "",
  ...props
}: React.ComponentPropsWithoutRef<"section">) {
  return (
    <section className={`panel ${className}`} {...props}>
      {children}
    </section>
  );
}
function Label({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return (
    <span
      className={classNames(
        "label",
        tone && `label-${tone.toLowerCase().replaceAll(" ", "-")}`,
      )}
    >
      {children}
    </span>
  );
}
function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading reveal">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {action}
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  const difference = Date.now() - date.getTime();
  if (difference < 60 * 60 * 1000)
    return `${Math.max(1, Math.round(difference / 60_000))} min ago`;
  if (difference < 24 * 60 * 60 * 1000)
    return `${Math.round(difference / 3_600_000)} hr ago`;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, {
    notation: Math.abs(value) >= 100_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTaskDue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  }).format(date);
}

function isTaskDueToday(value: string) {
  return value === "Today" || value === localDateValue();
}

function readLegacyList<T>(key: string): T[] {
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

const WORKSPACE_RECOVERY_KEY = "control-center-v3-workspace-recovery";
const THEME_STORAGE_KEY = "control-center-theme";

function toggleColorTheme() {
  const root = document.documentElement;
  const nextTheme = root.dataset.theme === "light" ? "dark" : "light";
  root.dataset.theme = nextTheme;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch {
    // The selected theme still applies for this session when storage is unavailable.
  }
}

type WorkspaceRecovery = {
  id: string;
  savedAt: string;
  workspace: WorkspaceState;
};

// The route handlers explain what actually failed; the gateway in front of them
// explains it too, and its answer never reaches the SQLite layer a local
// diagnostic inspects. Carry that sentence to the screen rather than dropping it.
async function failureDetail(response: Response) {
  try {
    const body = (await response.json()) as { error?: unknown };
    const detail = typeof body.error === "string" ? body.error.trim() : "";
    return detail ? ` ${detail}` : ` The server answered ${response.status}.`;
  } catch {
    return ` The server answered ${response.status}.`;
  }
}

function readWorkspaceRecovery(): WorkspaceRecovery | null {
  try {
    const value = window.localStorage.getItem(WORKSPACE_RECOVERY_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<WorkspaceRecovery>;
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.savedAt !== "string" ||
      !parsed.workspace ||
      !Array.isArray(parsed.workspace.reminders) ||
      !Array.isArray(parsed.workspace.tasks)
    ) return null;
    return parsed as WorkspaceRecovery;
  } catch {
    return null;
  }
}

function SetupEmpty({
  icon,
  title,
  description,
  onSetup,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onSetup: () => void;
}) {
  return (
    <Panel className="empty-state setup-empty">
      <div className="setup-empty-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{description}</p>
      <button className="button button-primary" onClick={onSetup}>
        <Settings2 size={15} /> Open settings
      </button>
    </Panel>
  );
}

function ErrorNotice({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <div className="error-notice">
      <CircleAlert size={17} />
      <div>
        <b>Some sources could not be read</b>
        {errors.map((error) => (
          <p key={error}>{error}</p>
        ))}
      </div>
    </div>
  );
}

const liveDataCache = new Map<string, unknown>();

function clearLiveDataCache() {
  liveDataCache.clear();
}

function useLiveData<T>(
  endpoint: string,
  refreshEveryMs = 15 * 60 * 1000,
  manualEndpoint = endpoint,
) {
  const initialData = liveDataCache.get(endpoint) as T | undefined;
  const [data, setData] = useState<T | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const load = async (requestEndpoint = endpoint) => {
      setLoading(true);
      try {
        const response = await fetch(requestEndpoint, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok)
          throw new Error(
            payload.errors?.[0] || payload.error || "Live data request failed.",
          );
        if (!cancelled) {
          setData(payload as T);
          liveDataCache.set(endpoint, payload as T);
          setError("");
        }
      } catch (requestError) {
        if (!cancelled)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Live data request failed.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (nonce > 0) void load(manualEndpoint);
    else void load(endpoint);
    const interval = window.setInterval(
      () => void load(manualEndpoint),
      refreshEveryMs,
    );
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [endpoint, manualEndpoint, nonce, refreshEveryMs]);
  return {
    data,
    loading,
    error,
    refresh: () => setNonce((value) => value + 1),
    mutate: (updater: (current: T) => T) =>
      setData((current) => {
        if (!current) return current;
        const next = updater(current);
        liveDataCache.set(endpoint, next);
        return next;
      }),
  };
}

function LoadingPanel() {
  return (
    <Panel className="empty-state">
      <RefreshCw className="spin" size={24} />
      <h2>Checking live sources</h2>
      <p>This can take a few seconds when several providers are configured.</p>
    </Panel>
  );
}

function LiveLoadError({ error, retry }: { error: string; retry: () => void }) {
  return (
    <Panel className="empty-state error-state" role="alert">
      <CircleAlert size={26} />
      <h2>Live data could not be loaded</h2>
      <p>{error}</p>
      <button className="button button-primary" onClick={retry}>
        <RefreshCw size={15} /> Retry
      </button>
    </Panel>
  );
}

function useArchiveAction<T extends CachedFeedPayload>(
  category: "industry" | "mentions" | "newsletters",
  mutate: (updater: (current: T) => T) => void,
) {
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const update = async (id: string, archived: boolean) => {
    setPending(id);
    setError("");
    try {
      const response = await fetch("/api/library", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, id, archived }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error || "Could not update the archive.");
      liveDataCache.delete("/api/brief");
      mutate((current) => applyArchiveToPayload(current, id, archived));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not update the archive.",
      );
    } finally {
      setPending("");
    }
  };
  return { pending, error, update };
}

function briefDueLabel(value?: string) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function DailyBriefPanel({
  settings,
  openSettings,
  addTask,
  goTo,
}: {
  settings: PublicSettings;
  openSettings: (section?: SettingsSection) => void;
  addTask: (item: DailyBriefItem) => void;
  goTo: (tab: Tab) => void;
}) {
  const { data, loading, error, refresh } = useLiveData<DailyBriefResponse>(
    "/api/brief",
    5 * 60 * 1000,
  );
  const [window, setWindow] = useState<"today" | "week">("today");
  const now = Date.parse(data?.checkedAt || "1970-01-01T00:00:00.000Z");
  const enabledSources = new Set(
    settings.dailyBrief.sourceLabels.map((source) =>
      source.toLocaleLowerCase("en-US"),
    ),
  );
  const items = (data?.items || []).filter((item) => {
    if (!enabledSources.has(item.source.toLocaleLowerCase("en-US"))) return false;
    return isDailyBriefItemInWindow(item, window, now);
  });
  const connected = (data?.sourceStatuses || []).filter(
    (status) => status.state === "live",
  ).length;

  return (
    <Panel className="daily-brief-panel reveal delay-1">
      <div className="daily-brief-head">
        <div>
          <p className="eyebrow">Across your dashboard</p>
          <h2>Daily brief</h2>
          <p>
            Your top stories at a glance, drawn from the saved queues you choose.
          </p>
        </div>
        <div className="daily-brief-actions">
          <button className="button button-ghost" onClick={() => openSettings("dailyBrief")}>
            <Settings2 size={14} /> Customize
          </button>
          <button
            className="round-link"
            aria-label="Refresh daily brief"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={loading ? "spin" : ""} size={15} />
          </button>
        </div>
      </div>
      {error && <p className="save-notice" role="alert">{error}</p>}
      {loading && !data && <p className="brief-loading">Reading your saved dashboard…</p>}
      {!!data?.snapshot?.length && <DailySnapshot sections={data.snapshot} onOpen={goTo} />}
      {data && !data.snapshot?.length && (
        <div className="brief-setup-state">
          <LayoutDashboard size={24} />
          <div>
            <b>Build your own daily snapshot</b>
            <p>Choose how many stories to include from Industry, Mentions, and Newsletters. No extra connection is needed.</p>
          </div>
          <button className="button button-primary" onClick={() => openSettings("dailyBrief")}>Choose sections</button>
        </div>
      )}
      {!!settings.dailyBrief.sourceLabels.length && <div className="brief-private-head">
        <div><p className="eyebrow">Optional private context</p><h3>Messages, meetings & actions</h3></div>
        <div className="filter-row"><button className={window === "today" ? "active" : ""} onClick={() => setWindow("today")}>Today</button><button className={window === "week" ? "active" : ""} onClick={() => setWindow("week")}>Week</button></div>
      </div>}
      {!settings.dailyBrief.sourceLabels.length ? null : error && !data ? (
        <div className="brief-setup-state error-state" role="alert">
          <CircleAlert size={24} />
          <div>
            <b>Daily Brief could not be read</b>
            <p>{error}</p>
          </div>
          <button className="button button-primary" onClick={refresh}>
            Retry
          </button>
        </div>
      ) : loading && !data ? (
        <div className="brief-setup-state">
          <RefreshCw className="spin" size={24} />
          <div>
            <b>Reading local connector data</b>
            <p>This should only take a moment.</p>
          </div>
        </div>
      ) : items.length ? (
        <div className="daily-brief-grid">
          {items.slice(0, 8).map((item) => (
            <article className="daily-brief-item" key={`${item.source}:${item.id}`}>
              <div className="brief-item-meta">
                <Label tone={item.kind === "action" ? "high" : "brief"}>
                  {item.kind}
                </Label>
                <span>{item.source}</span>
                <span>
                  <Clock3 size={11} /> {briefDueLabel(item.dueAt)}
                </span>
              </div>
              <h3>{item.title}</h3>
              {item.summary && <p>{item.summary}</p>}
              <div className="brief-item-actions">
                <button onClick={() => addTask(item)}>
                  <ListTodo size={13} /> Add task
                </button>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer">
                    Open source <ArrowUpRight size={13} />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="brief-setup-state">
          <MessageSquare size={24} />
          <div>
            <b>Waiting for the first connector sync</b>
            <p>
              {connected
                ? `${connected} source${connected === 1 ? " has" : "s have"} synced, with no items in this window.`
                : "Open bridge setup to copy the Codex automation prompt or use the local ingest command."}
            </p>
          </div>
          <button
            className="button button-ghost"
            onClick={() => openSettings("integrations")}
          >
            Bridge setup
          </button>
        </div>
      )}
      {!!data?.sourceStatuses.length && (
        <div className="brief-source-strip">
          {data.sourceStatuses.map((status) => (
            <span key={status.source} title={status.message || undefined}>
              <i
                className={
                  status.state === "live"
                    ? "ready"
                    : status.state === "error"
                      ? "error"
                      : ""
                }
              />
              {status.source}
              <small>
                {status.state === "error"
                  ? `failed · ${formatDate(status.lastAttemptAt)}`
                  : status.lastSyncedAt
                  ? `${status.itemCount} · ${formatDate(status.lastSyncedAt)}`
                  : "waiting"}
              </small>
            </span>
          ))}
        </div>
      )}
    </Panel>
  );
}

function newsletterSetupReady(settings: PublicSettings) {
  return settings.newsletters.connected && isAiReady(settings.ai);
}

function TodayView({
  settings,
  tasks,
  goTo,
  openSettings,
  addBriefTask,
}: {
  settings: PublicSettings;
  tasks: Task[];
  goTo: (tab: Tab) => void;
  openSettings: (section?: SettingsSection) => void;
  addBriefTask: (item: DailyBriefItem) => void;
}) {
  const openTasks = tasks.filter((task) => !task.done).slice(0, 3);
  const industryConfigured =
    settings.industry.sources.length + settings.industry.keywords.length > 0;
  const configured = [
    industryConfigured,
    settings.mentions.terms.length + settings.mentions.websites.length > 0,
    newsletterSetupReady(settings),
    settings.audience.accounts.length > 0,
  ].filter(Boolean).length;
  const today = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
  return (
    <div className="view">
      <PageHeading
        eyebrow={today}
        title="Good morning."
        description="A quiet starting point for the sources, signals, and work you choose to track."
        action={
          <button
            className="button button-ghost"
            onClick={() => openSettings()}
          >
            <Settings2 size={15} /> Settings
          </button>
        }
      />
      <div className="brief-banner reveal delay-1">
        <div className="brief-mark">
          <Sparkles size={19} />
        </div>
        <p>
          {configured === 0 ? (
            <>
              <strong>Your dashboard is ready to configure.</strong> Add
              industry sources, mention terms, a newsletter Gmail, and audience
              accounts in Settings.
            </>
          ) : (
            <>
              <strong>{configured} of 4 live areas are configured.</strong> Open
              a tracked page for saved results, or use Refresh to check now.
            </>
          )}
        </p>
        <button aria-label="Open settings" onClick={() => openSettings()}>
          <ArrowRight size={18} />
        </button>
      </div>
      <DailyBriefPanel
        settings={settings}
        openSettings={openSettings}
        addTask={addBriefTask}
        goTo={goTo}
      />
      <div className="today-grid reveal delay-2">
        <Panel className="priority-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Focus</p>
              <h2>Open tasks</h2>
            </div>
            <span className="progress-count">
              {tasks.filter((task) => !task.done).length}
            </span>
          </div>
          {openTasks.length ? (
            <div className="priority-list">
              {openTasks.map((task, index) => (
                <button
                  key={task.id}
                  className="priority-row"
                  onClick={() => goTo("tasks")}
                >
                  <span className="check-box">{index + 1}</span>
                  <span>
                    <b>{task.title}</b>
                    <small>
                      {formatTaskDue(task.due)} · {task.recurrence}
                    </small>
                  </span>
                  <ArrowRight size={16} />
                </button>
              ))}
            </div>
          ) : (
            <div className="inline-empty">
              <ListTodo size={20} />
              <p>No open tasks yet.</p>
            </div>
          )}
          <button className="text-button" onClick={() => goTo("tasks")}>
            Open task list <ArrowRight size={14} />
          </button>
        </Panel>
        <Panel className="setup-progress">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Live tracking</p>
              <h2>Setup progress</h2>
            </div>
            <b>{configured}/4</b>
          </div>
          <div className="setup-checklist">
            <button
              onClick={() => openSettings("industry")}
              className={industryConfigured ? "complete" : ""}
            >
              <span>{industryConfigured ? <Check /> : <Globe2 />}</span>
              <div>
                <b>Industry</b>
                <small>
                  {industryConfigured
                    ? `${settings.industry.sources.length} sites · ${settings.industry.keywords.length} topics`
                    : "Add sites or topics"}
                </small>
              </div>
            </button>
            <button
              onClick={() => openSettings("mentions")}
              className={
                settings.mentions.terms.length +
                settings.mentions.websites.length
                  ? "complete"
                  : ""
              }
            >
              <span>
                {settings.mentions.terms.length +
                settings.mentions.websites.length ? (
                  <Check />
                ) : (
                  <AtSign />
                )}
              </span>
              <div>
                <b>Mentions</b>
                <small>
                  {settings.mentions.terms.length +
                  settings.mentions.websites.length
                    ? `${settings.mentions.terms.length + settings.mentions.websites.length} watch terms`
                    : "Add names and brands"}
                </small>
              </div>
            </button>
            <button
              onClick={() => openSettings("newsletters")}
              className={newsletterSetupReady(settings) ? "complete" : ""}
            >
              <span>
                {newsletterSetupReady(settings) ? <Check /> : <Mail />}
              </span>
              <div>
                <b>Newsletters</b>
                <small>
                  {settings.newsletters.connected
                    ? newsletterSetupReady(settings)
                      ? settings.newsletters.connectedEmail
                      : "Configure AI to finish setup"
                    : "Connect a Gmail account (optional)"}
                </small>
              </div>
            </button>
            <button
              onClick={() => openSettings("audience")}
              className={settings.audience.accounts.length ? "complete" : ""}
            >
              <span>
                {settings.audience.accounts.length ? <Check /> : <Users />}
              </span>
              <div>
                <b>Audience</b>
                <small>
                  {settings.audience.accounts.length
                    ? `${settings.audience.accounts.length} accounts`
                    : "Add social accounts"}
                </small>
              </div>
            </button>
          </div>
        </Panel>
        <Panel className="privacy-card">
          <ShieldCheck size={22} />
          <div>
            <p className="eyebrow">Local by design</p>
            <h2>Your configuration stays here</h2>
            <p>
              Settings and provider tokens are stored server-side in the local
              data directory and excluded from Git. Browser code never receives
              saved secrets.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function IndustryView({
  saveStory,
  openSettings,
}: {
  saveStory: (story: LiveStory) => void;
  openSettings: () => void;
}) {
  const { data, loading, error, refresh, mutate } = useLiveData<LiveFeedResponse>(
    "/api/live/industry",
    15 * 60 * 1000,
    "/api/live/industry?refresh=1",
  );
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"active" | "history" | "archive">("active");
  const [sortOrder, setSortOrder] = useState<IndustrySortOrder>("important");
  const archive = useArchiveAction<LiveFeedResponse>("industry", mutate);
  const sourceItems =
    view === "archive"
      ? data?.archivedItems || []
      : view === "history"
        ? data?.historyItems || []
        : data?.items || [];
  const items = sortIndustryItems(
    sourceItems.filter((item) =>
      `${item.title} ${item.summary} ${item.source}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    ),
    sortOrder,
  );
  const kindLabel = (item: LiveStory) =>
    item.kind === "sitemap"
      ? "New sitemap page"
      : item.kind === "topic"
        ? "Topic discovery"
        : "Live feed";
  return (
    <div className="view">
      <PageHeading
        eyebrow="Live source desk"
        title="Industry"
        description="A bounded briefing of the most useful watched-site and topic updates from the last 24 hours."
        action={
          <button
            className="button button-primary"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw size={15} /> Refresh sources
          </button>
        }
      />
      {loading && !data ? (
        <LoadingPanel />
      ) : !data && error ? (
        <LiveLoadError error={error} retry={refresh} />
      ) : !data?.configured ? (
        <SetupEmpty
          icon={<Globe2 />}
          title="Choose what this page watches"
          description="Add public sites for feed or sitemap tracking, and topics for wider industry-news discovery."
          onSetup={openSettings}
        />
      ) : (
        <>
          <div className="toolbar reveal delay-1">
            <div className="filter-row">
              <button
                className={view === "active" ? "active" : ""}
                onClick={() => setView("active")}
              >
                Important now {data.items.length}
              </button>
              <button
                className={view === "history" ? "active" : ""}
                onClick={() => setView("history")}
              >
                History {data.historyCount || 0}
              </button>
              <button
                className={view === "archive" ? "active" : ""}
                onClick={() => setView("archive")}
              >
                Archived {data.archiveCount || 0}
              </button>
            </div>
            <div className="toolbar-actions">
              <label className="sort-control">
                <span>Sort</span>
                <select
                  aria-label="Sort industry updates"
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(event.target.value as IndustrySortOrder)
                  }
                >
                  <option value="important">Most important</option>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="watched">Watched sites first</option>
                </select>
              </label>
              <label className="search-box">
                <Search size={15} />
                <input
                  aria-label="Search industry updates"
                  placeholder="Search updates"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>
          </div>
          <div className="industry-curation-strip reveal delay-1">
            <div>
              <Sparkles size={17} />
              <span>
                <b>{data.items.length} surfaced</b>
                <small>
                  from {data.discoveredCount ?? data.items.length} current
                  discoveries · limit {data.surfacedLimit ?? data.items.length}
                </small>
              </span>
            </div>
            <Label tone={data.curationMode === "local" ? "watch" : "verified"}>
              {data.curationMode === "local"
                ? "Local ranking"
                : `${data.curationMode} assisted`}
            </Label>
            <p>
              {data.providerStatuses?.[0]?.message ||
                "Canonical deduplication, relevance, recency, material-change signals, and source diversity determine this queue."}
            </p>
          </div>
          {data.sourceStatuses?.length ? (
            <div className="source-status-grid reveal delay-1">
              {data.sourceStatuses.map((status) => (
                <div
                  className={`source-status status-${status.state}`}
                  key={status.sourceId}
                >
                  <span>
                    <Globe2 size={14} />
                    <b>{status.source}</b>
                  </span>
                  <Label
                    tone={status.mode === "sitemap" ? "brief" : "positive"}
                  >
                    {status.mode}
                  </Label>
                  <p>{status.message}</p>
                  <a href={status.endpoint} target="_blank" rel="noreferrer">
                    View endpoint <ExternalLink size={11} />
                  </a>
                </div>
              ))}
            </div>
          ) : null}
          <ErrorNotice
            errors={[
              ...(data.errors || []),
              ...(error ? [error] : []),
              ...(archive.error ? [archive.error] : []),
            ]}
          />
          <div className="story-stack reveal delay-2">
            {items.map((item, index) => (
              <article className="story-card" key={item.id}>
                <div className="story-index">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="story-body">
                  <div className="story-meta">
                    <span>{item.source}</span>
                    <i />
                    <span>{formatDate(item.publishedAt)}</span>
                    <Label
                      tone={item.kind === "sitemap" ? "brief" : "positive"}
                    >
                      {kindLabel(item)}
                    </Label>
                    {item.importanceScore !== undefined && (
                      <Label tone="verified">
                        {item.importanceScore} importance
                      </Label>
                    )}
                    {view === "history" && (
                      <Label tone="watch">History</Label>
                    )}
                    {view === "archive" && (
                      <Label tone="watch">Archived</Label>
                    )}
                  </div>
                  <h2>{item.title}</h2>
                  <p>
                    {item.summary ||
                      "Open the original source for the full update."}
                  </p>
                  {item.importanceReason && view === "active" && (
                    <p className="importance-reason">
                      <Sparkles size={12} /> {item.importanceReason}
                    </p>
                  )}
                  <div className="story-footer">
                    <span />
                    <div>
                      {view === "active" && (
                        <button
                          title="Save to reminders"
                          onClick={() => saveStory(item)}
                        >
                          <Bookmark size={16} />
                        </button>
                      )}
                      {view === "active" ? (
                        <button
                          title="Archive"
                          disabled={archive.pending === item.id}
                          onClick={() => void archive.update(item.id, true)}
                        >
                          <Archive size={16} />
                        </button>
                      ) : item.workflow?.restoreEligible ? (
                        <button
                          title="Restore from archive"
                          disabled={archive.pending === item.id}
                          onClick={() => void archive.update(item.id, false)}
                        >
                          <ArchiveRestore size={16} />
                        </button>
                      ) : null}
                      <a
                        className="round-link"
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        title="Open original"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {!items.length && (
              <Panel className="empty-state">
                <CheckCircle2 size={24} />
                <h2>
                  {view === "archive"
                    ? "Nothing archived yet"
                    : view === "history"
                      ? "Nothing in history yet"
                      : "No current updates found"}
                </h2>
                <p>
                  {view === "archive"
                    ? "Items only appear here after you choose Archive."
                    : view === "history"
                      ? "Updates that left the current 24-hour window remain available here."
                      : "No discovery cleared the current importance threshold. The broad source scan still completed and will check again automatically."}
                </p>
              </Panel>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MentionsView({
  saveStory,
  openSettings,
}: {
  saveStory: (story: LiveStory) => void;
  openSettings: () => void;
}) {
  const { data, loading, error, refresh, mutate } = useLiveData<LiveFeedResponse>(
    "/api/live/mentions",
    15 * 60 * 1000,
    "/api/live/mentions?refresh=1",
  );
  const [view, setView] = useState<"active" | "archive">("active");
  const [sortOrder, setSortOrder] = useState<"priority" | "newest" | "oldest">("priority");
  const archive = useArchiveAction<LiveFeedResponse>("mentions", mutate);
  const items = sortFeedStories(view === "archive" ? data?.archivedItems || [] : data?.items || [], sortOrder);
  const highConfidenceCount = (data?.items || []).filter(
    (item) => item.confidence === "high",
  ).length;
  return (
    <div className="view">
      <PageHeading
        eyebrow="Seven-day web radar"
        title="Mentions"
        description="Verified third-party pages from the past week, matched to the identities you configure and deduplicated against your local archive."
        action={
          <button
            className="button button-ghost"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw size={15} /> Check now
          </button>
        }
      />
      {loading && !data ? (
        <LoadingPanel />
      ) : !data && error ? (
        <LiveLoadError error={error} retry={refresh} />
      ) : !data?.configured ? (
        <SetupEmpty
          icon={<AtSign />}
          title="Tell the radar what to watch"
          description="Add exact aliases plus identity anchors that distinguish you from namesakes."
          onSetup={openSettings}
        />
      ) : (
        <>
          <div className="shelf-controls reveal delay-1">
            <div className="filter-row">
              <button
                className={view === "active" ? "active" : ""}
                onClick={() => setView("active")}
              >
                Past 7 days {data.items.length}
              </button>
              <button
                className={view === "archive" ? "active" : ""}
                onClick={() => setView("archive")}
              >
                Archive & history {data.archiveCount || 0}
              </button>
            </div>
            <div className="live-stamp">
              <i /> Checked {formatDate(data.checkedAt)}
            </div>
          </div>
          <div className="mention-summary reveal delay-1">
            <div>
              <span>High confidence</span>
              <b>{highConfidenceCount}</b>
              <small>Direct identity evidence</small>
            </div>
            <div>
              <span>Needs review</span>
              <b>{data.reviewCount || 0}</b>
              <small>Literal matches when strict mode is off</small>
            </div>
            <div>
              <span>Noise removed</span>
              <b>{data.filteredOut || 0}</b>
              <small>Weak or ambiguous matches</small>
            </div>
            <div className="mention-callout">
              <ShieldCheck size={19} />
              <p>
                <b>Identity-aware filtering</b>Provider query terms never count
                as evidence. Exact aliases and domains can qualify directly;
                ambiguous names require configured identity anchors in strict
                mode.
              </p>
            </div>
          </div>
          {data.providerStatuses?.length ? (
            <div className="provider-status-list reveal delay-1">
              {data.providerStatuses.map((status) => (
                <div key={status.provider} className={`provider-state state-${status.state}`}>
                  <span>
                    <i /> <b>{status.provider}</b>
                  </span>
                  <Label
                    tone={
                      status.state === "live"
                        ? "positive"
                        : status.state === "disabled"
                          ? "watch"
                          : "brief"
                    }
                  >
                    {status.state}
                  </Label>
                  <p>{status.message}</p>
                </div>
              ))}
            </div>
          ) : null}
          <ErrorNotice
            errors={[
              ...(data.errors || []),
              ...(error ? [error] : []),
              ...(archive.error ? [archive.error] : []),
            ]}
          />
          <div className="mention-feed reveal delay-2">
            <div className="feed-sort-bar">
              <span><Sparkles size={14} /> {data.curationMode && data.curationMode !== "local" ? `${AI_PROVIDER_LABELS[data.curationMode]} priority & page summaries` : "Built-in priority · enable AI for richer page summaries"}</span>
              <label>Sort mentions <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)}><option value="priority">Priority</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
            </div>
            {items.map((item) => (
              <article className="mention-card" key={item.id}>
                <div className="network-avatar network-web">
                  {item.matchedTerm?.[0]?.toUpperCase() || "@"}
                </div>
                <div className="mention-content">
                  <div className="mention-meta">
                    <b>{item.source}</b>
                    <span>{formatDate(item.publishedAt || item.discoveredAt || "")}</span>
                    <Label
                      tone={item.confidence === "high" ? "verified" : "watch"}
                    >
                      {item.confidence === "high"
                        ? "High confidence"
                        : "Review"}
                    </Label>
                    {item.matchedTerm && <Label>{item.matchedTerm}</Label>}
                  </div>
                  <p>“{item.title}”</p>
                  <div className="mention-page-summary">{item.aiSummary || item.summary}</div>
                  {item.importanceReason && <div className="priority-reason"><Sparkles size={12} /><span>{item.importanceScore !== undefined ? `${item.importanceScore}/100 · ` : ""}{item.importanceReason}</span></div>}
                  <div className="mention-footer">
                    <span>
                      {item.matchReasons?.join(" · ") ||
                        item.summary.slice(0, 180)}
                    </span>
                  </div>
                </div>
                <div className="mention-actions">
                  {view === "active" && (
                    <button
                      title="Save to reminders"
                      onClick={() => saveStory(item)}
                    >
                      <Bookmark size={16} />
                    </button>
                  )}
                  <a
                    className="round-link"
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${item.title}`}
                  >
                    <ExternalLink size={16} />
                  </a>
                  {view === "active" ? (
                    <button
                      title="Archive"
                      disabled={archive.pending === item.id}
                      onClick={() => void archive.update(item.id, true)}
                    >
                      <Archive size={16} />
                    </button>
                  ) : item.workflow?.restoreEligible ? (
                    <button
                      title="Restore"
                      disabled={archive.pending === item.id}
                      onClick={() => void archive.update(item.id, false)}
                    >
                      <ArchiveRestore size={16} />
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
            {!items.length && (
              <Panel className="empty-state">
                <CheckCircle2 size={26} />
                <h2>
                  {view === "archive"
                    ? "No mention history"
                    : "No verified new mentions found"}
                </h2>
                <p>
                  {view === "archive"
                    ? "Archived and expired mentions remain available here."
                    : "The news collectors and any enabled broad-web research found no new URL with direct identity evidence in the past seven days. Previously archived URLs stay out of this queue."}
                </p>
              </Panel>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function RemindersView({
  reminders,
  addReminder,
  archiveReminder,
}: {
  reminders: Reminder[];
  addReminder: (title: string, note: string, url?: string) => void;
  archiveReminder: (id: string | number, archived: boolean) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [view, setView] = useState<"active" | "archive">("active");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    addReminder(
      title.trim(),
      note.trim(),
      title.startsWith("http") ? title : undefined,
    );
    setTitle("");
    setNote("");
    setShowForm(false);
  };
  const active = reminders
    .filter((item) => !item.archivedAt)
    .sort(
      (left, right) =>
        Date.parse(right.createdAt || "") - Date.parse(left.createdAt || ""),
    );
  const archived = reminders
    .filter((item) => item.archivedAt)
    .sort(
      (left, right) =>
        Date.parse(right.archivedAt || "") - Date.parse(left.archivedAt || ""),
    );
  const items = view === "archive" ? archived : active;
  return (
    <div className="view">
      <PageHeading
        eyebrow="Come back to this"
        title="Reminders"
        description="Save articles, videos, posts, and ideas without turning them into tasks."
        action={
          <button
            className="button button-primary"
            onClick={() => {
              setView("active");
              setShowForm(true);
            }}
          >
            <Plus size={16} /> Save something
          </button>
        }
      />
      {showForm && (
        <form className="quick-form reveal" onSubmit={submit}>
          <div className="form-icon">
            <Link2 size={20} />
          </div>
          <label>
            <span>Link or title</span>
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Paste a URL or type a title…"
            />
          </label>
          <label>
            <span>Why save it?</span>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="A note for future you"
            />
          </label>
          <button className="button button-primary">Save</button>
          <button
            className="icon-button"
            type="button"
            onClick={() => setShowForm(false)}
          >
            <X size={16} />
          </button>
        </form>
      )}
      <div className="shelf-controls reveal delay-1">
        <div className="filter-row">
          <button
            className={view === "active" ? "active" : ""}
            onClick={() => setView("active")}
          >
            Active {active.length}
          </button>
          <button
            className={view === "archive" ? "active" : ""}
            onClick={() => setView("archive")}
          >
            Archive {archived.length}
          </button>
        </div>
        <span className="sort-label">
          <ChevronDown size={15} /> Newest first
        </span>
      </div>
      <div className="reminder-grid reveal delay-2">
        {items.map((item) => (
          <article
            className={`reminder-card accent-${item.accent}`}
            key={item.id}
          >
            <div className="reminder-top">
              <Label>{item.type}</Label>
              <button
                title={
                  view === "archive" ? "Restore reminder" : "Archive reminder"
                }
                onClick={() => archiveReminder(item.id, view === "active")}
              >
                {view === "archive" ? (
                  <ArchiveRestore size={15} />
                ) : (
                  <Archive size={15} />
                )}
              </button>
            </div>
            <div className="reminder-icon">
              <Newspaper />
            </div>
            <h2>{item.title}</h2>
            <p>{item.note}</p>
            <div className="reminder-bottom">
              <span>
                {item.source} ·{" "}
                {item.createdAt
                  ? formatDate(item.createdAt)
                  : item.added || "Saved previously"}
              </span>
              {item.url && (
                <a href={item.url} target="_blank" rel="noreferrer">
                  Open <ArrowUpRight size={14} />
                </a>
              )}
            </div>
          </article>
        ))}
        {view === "active" && (
          <button className="add-card" onClick={() => setShowForm(true)}>
            <Plus />
            <span>
              {reminders.length ? "Save another thing" : "Your shelf is empty"}
            </span>
            <small>Paste any link from the web</small>
          </button>
        )}
        {view === "archive" && !items.length && (
          <Panel className="empty-state">
            <Archive size={24} />
            <h2>No archived reminders</h2>
            <p>
              Archived links and ideas stay available here until you restore
              them.
            </p>
          </Panel>
        )}
      </div>
    </div>
  );
}

function platformColor(platform: AudiencePlatform) {
  return {
    youtube: "#e5484d",
    x: "#15181c",
    instagram: "#b44b91",
    facebook: "#3d73a8",
    linkedin: "#1769aa",
    threads: "#4f5554",
    tiktok: "#1e918c",
  }[platform];
}
function profilePlaceholder(platform: AudiencePlatform) {
  return {
    youtube: "https://youtube.com/@your-handle",
    x: "https://x.com/your-handle",
    instagram: "https://instagram.com/your-handle",
    facebook: "https://facebook.com/your-page",
    linkedin: "https://linkedin.com/in/your-name",
    threads: "https://threads.net/@your-handle",
    tiktok: "https://tiktok.com/@your-handle",
  }[platform];
}
function cachedMetricLabel(item: AudienceMetric) {
  if (item.source?.includes("daily cache")) return "Daily cache";
  return item.source?.includes("(cached)") ? "Cached" : "";
}

function AudienceView({ openSettings }: { openSettings: () => void }) {
  const { data, loading, error, refresh } = useLiveData<{
    configured: boolean;
    checkedAt: string;
    items: AudienceMetric[];
    history?: AudienceHistorySeries[];
  }>("/api/live/audience", 15 * 60 * 1000, "/api/live/audience?refresh=1");
  const items = data?.items || [];
  return (
    <div className="view">
      <PageHeading
        eyebrow="Keyless audience ledger"
        title="Audience"
        description="Best-effort public totals for the exact profile URLs in Settings, with changes measured against a verified 24–36h baseline instead of the latest refresh."
        action={
          <button
            className="button button-ghost"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw size={15} /> Refresh metrics
          </button>
        }
      />
      {loading && !data ? (
        <LoadingPanel />
      ) : !data && error ? (
        <LiveLoadError error={error} retry={refresh} />
      ) : !data?.configured ? (
        <SetupEmpty
          icon={<Users />}
          title="Add the accounts you care about"
          description="Paste public YouTube, X, Instagram, Facebook, LinkedIn, Threads, or TikTok profile URLs. API keys are optional fallbacks."
          onSetup={openSettings}
        />
      ) : (
        <>
          <AudienceInsights items={items} history={data.history} checkedAt={data.checkedAt} />
          {error && <ErrorNotice errors={[error]} />}
          <div className="platform-table reveal delay-2">
            <div className="platform-head">
              <span>Platform</span>
              <span>Audience</span>
              <span>{AUDIENCE_COMPARISON_WINDOW_LABEL}</span>
              <span>Status</span>
            </div>
            {items.map((item) => {
              const cacheLabel = cachedMetricLabel(item);
              return (
                <div className="platform-row" key={item.id}>
                  <div className="platform-name">
                    <span
                      className="platform-icon"
                      style={{ background: platformColor(item.platform) }}
                    >
                      {item.platform[0].toUpperCase()}
                    </span>
                    <div>
                      <b>{item.label}</b>
                      <small>{item.handle}</small>
                    </div>
                  </div>
                  <div className="platform-total">
                    <strong>
                      {item.error
                        ? item.total === null
                          ? "—"
                          : formatNumber(item.total)
                        : formatNumber(item.total ?? 0)}
                    </strong>
                    <small>
                      {[
                        item.primaryLabel
                          ? `${item.primaryLabel[0].toUpperCase()}${item.primaryLabel.slice(1)}`
                          : "Audience total",
                        item.secondaryLabel && item.secondaryValue !== undefined
                          ? `${formatNumber(item.secondaryValue)} ${item.secondaryLabel}`
                          : "",
                      ].filter(Boolean).join(" · ")}
                    </small>
                  </div>
                  <div className="platform-growth">
                    <b>
                      {item.error && item.stale
                        ? "Last known"
                        : item.change === null
                          ? "Baseline"
                          : `${item.change >= 0 ? "+" : ""}${formatNumber(item.change)}`}
                    </b>
                    <small>
                      {item.error
                        ? item.lastSuccessfulAt
                          ? `Last verified ${formatDate(item.lastSuccessfulAt)}`
                          : item.error
                        : item.change === null
                          ? "Waiting for 24–36h baseline"
                          : audienceComparisonLabel(
                              item.checkedAt,
                              item.changeComparedAt,
                            )}
                    </small>
                  </div>
                  {item.error ? (
                    <Label tone="watch">
                      {item.stale ? "Limited" : "Unavailable"}
                    </Label>
                  ) : (
                    <Label tone={cacheLabel ? "watch" : "positive"}>
                      {cacheLabel || "Public"}
                    </Label>
                  )}
                  {item.error && item.lastSuccessfulAt && (
                    <small className="metric-error">{item.error}</small>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function NewslettersView({
  addReminder,
  openSettings,
  openAiSettings,
}: {
  addReminder: (title: string, note: string, url?: string) => void;
  openSettings: () => void;
  openAiSettings: () => void;
}) {
  const { data, loading, error, refresh, mutate } = useLiveData<NewsletterFeedResponse>(
    "/api/live/newsletters",
    15 * 60 * 1000,
    "/api/live/newsletters?refresh=1",
  );
  const [view, setView] = useState<"active" | "archive" | "history">("active");
  const [sortOrder, setSortOrder] = useState<"priority" | "newest" | "oldest">("priority");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(30);
  const archive = useArchiveAction<NewsletterFeedResponse>(
    "newsletters",
    mutate,
  );
  const sourceItems = view === "archive"
    ? data?.archivedItems || []
    : view === "history"
      ? data?.historyItems || []
      : data?.items || [];
  const sourceOptions = newsletterSourceOptions(sourceItems);
  const items = selectNewsletterTopics(sourceItems, { sortOrder, sources: selectedSources, query });
  const visibleItems = items.slice(0, visibleCount);
  const changeView = (next: typeof view) => { setView(next); setVisibleCount(30); };
  const clearFilters = () => { setSelectedSources([]); setQuery(""); setVisibleCount(30); };
  return (
    <div className="view newsletter-view">
      <PageHeading
        eyebrow="Newsletter intelligence"
        title="Newsletters"
        description="AI reads your newsletters, extracts the actual news, and combines repeated coverage into source-backed stories."
        action={
          <button
            className="button button-primary"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw size={15} /> Refresh intelligence
          </button>
        }
      />
      {loading && !data ? (
        <LoadingPanel />
      ) : !data && error ? (
        <LiveLoadError error={error} retry={refresh} />
      ) : !data?.configured ? (
        <SetupEmpty
          icon={<Mail />}
          title="Connect a newsletter Gmail"
          description="This can be a completely different account from any Gmail connected elsewhere. The dashboard requests read-only access."
          onSetup={openSettings}
        />
      ) : data.aiConfigured === false && !data.items.length && !data.historyItems?.length && !data.archivedItems.length ? (
        <SetupEmpty
          icon={<Sparkles />}
          title="Choose AI for newsletter intelligence"
          description="Connect a cloud AI provider or a loaded LM Studio / Ollama model in AI curation. Newsletter text goes only to the selected provider. Gmail remains read-only."
          onSetup={openAiSettings}
        />
      ) : (
        <>
          <div className="newsletter-status reveal delay-1">
            <div className="status-orb">
              <Inbox size={21} />
            </div>
            <div>
              <b>
                {data.connected
                  ? `${data.items.length} active stories from ${data.issueCount || 0} newsletter issues`
                  : "Saved newsletter intelligence"}
              </b>
              <p>
                {data.newsletterCount || 0} newsletters · {data.mentionCount || 0} source mentions · {data.aiProvider ? AI_PROVIDER_LABELS[data.aiProvider] : "AI"} · checked {formatDate(data.checkedAt)}
                {data.pendingIssueCount ? ` · ${data.pendingIssueCount} older issues queued for background processing` : ""}
                {!data.connected ? " · Gmail disconnected" : ""}
              </p>
            </div>
            <button onClick={openSettings}>
              Manage account <ArrowRight size={14} />
            </button>
          </div>
          <div className="shelf-controls reveal delay-1">
            <div className="filter-row">
              <button
                className={view === "active" ? "active" : ""}
                onClick={() => changeView("active")}
              >
                Past {data.freshnessHours || 36} hours {data.items.length}
              </button>
              <button
                className={view === "history" ? "active" : ""}
                onClick={() => changeView("history")}
              >
                Earlier {data.historyCount || 0}
              </button>
              <button
                className={view === "archive" ? "active" : ""}
                onClick={() => changeView("archive")}
              >
                Archive {data.archiveCount || 0}
              </button>
            </div>
          </div>
          <ErrorNotice
            errors={[
              ...(data.errors || []),
              ...(error ? [error] : []),
              ...(archive.error ? [archive.error] : []),
            ]}
          />
          <div className="newsletter-stack reveal delay-2">
            <div className="newsletter-controls">
              <label className="search-box"><Search size={15} /><input aria-label="Search newsletter stories" autoComplete="off" value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(30); }} placeholder="Search headlines, topics, or sources…" /></label>
              <details className="newsletter-filter-menu">
                <summary><Mail size={14} /> {selectedSources.length ? `${selectedSources.length} selected newsletters` : "All newsletters"}<ChevronDown size={14} /></summary>
                <div className="newsletter-filter-options">
                  <button type="button" onClick={() => { setSelectedSources([]); setVisibleCount(30); }}>All newsletters</button>
                  {sourceOptions.map(({name, count}) => <label key={name}><input type="checkbox" checked={selectedSources.includes(name)} onChange={(event) => { setSelectedSources((current) => event.target.checked ? [...current, name] : current.filter((source) => source !== name)); setVisibleCount(30); }} /><span>{name}</span><small>{count}</small></label>)}
                  {!sourceOptions.length && <p>No newsletters in this view yet.</p>}
                </div>
              </details>
              <label className="feed-sort-select">Sort stories<select value={sortOrder} onChange={(event) => { setSortOrder(event.target.value as typeof sortOrder); setVisibleCount(30); }}><option value="priority">Priority</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
            </div>
            <div className="newsletter-results" aria-live="polite"><span>Showing {visibleItems.length} of {items.length} stories{selectedSources.length ? ` · ${selectedSources.join(", ")}` : ""}</span>{(query || selectedSources.length > 0) && <button onClick={clearFilters}>Clear filters <X size={12} /></button>}</div>
            {visibleItems.map((item) => (
              <article className="newsletter-card" key={item.id}>
                <div className="sender-mark">
                  {item.title[0]?.toUpperCase() || "N"}
                </div>
                <div className="newsletter-copy">
                  <div className="story-meta">
                    <span>
                      {item.coverageCount} report{item.coverageCount === 1 ? "" : "s"}
                    </span>
                    <i />
                    <span>
                      {item.newsletterCount} newsletter{item.newsletterCount === 1 ? "" : "s"}
                    </span>
                    <i />
                    <span>{formatDate(item.receivedAt)}</span>
                    <Label tone={item.coverageCount > 1 ? "positive" : "neutral"}>
                      {item.coverageCount > 1 ? "Cross-reported" : "New story"}
                    </Label>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  {item.importanceReason && <div className="priority-reason"><Sparkles size={12} /><span>{item.importanceScore !== undefined ? `${item.importanceScore}/100 · ` : ""}{item.importanceReason}</span></div>}
                  <div className="newsletter-sources">
                    {item.sourceLinks.slice(0, 4).map((source) => (
                      <a
                        key={source.url}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        title={source.title}
                      >
                        <ExternalLink size={12} /> {source.publisher}
                      </a>
                    ))}
                    {item.sourceLinks.length > 4 && (
                      <details>
                        <summary>+{item.sourceLinks.length - 4} more sources</summary>
                        {item.sourceLinks.slice(4).map((source) => (
                          <a key={source.url} href={source.url} target="_blank" rel="noreferrer" title={source.title}>
                            <ExternalLink size={12} /> {source.publisher}
                          </a>
                        ))}
                      </details>
                    )}
                  </div>
                  <div className="newsletter-byline">
                    Reported by {item.newsletterSources.slice(0, 4).join(", ")}
                    {item.newsletterSources.length > 4
                      ? ` +${item.newsletterSources.length - 4} more`
                      : ""}
                  </div>
                  <div className="newsletter-foot">
                    {view !== "archive" && (
                      <button
                        onClick={() =>
                          addReminder(
                            item.title,
                            item.summary,
                            item.url,
                          )
                        }
                      >
                        <Bookmark size={14} /> Remind me
                      </button>
                    )}
                    <a href={item.url} target="_blank" rel="noreferrer">
                      <ExternalLink size={14} /> Open source
                    </a>
                    <a href={item.gmailUrl} target="_blank" rel="noreferrer">
                      <Mail size={14} /> Newsletter evidence
                    </a>
                  </div>
                </div>
                {(view === "active" || (view === "archive" && item.workflow?.restoreEligible)) && <button
                  className="mark-read"
                  title={view === "archive" ? "Restore" : "Archive"}
                  disabled={archive.pending === item.id}
                  onClick={() =>
                    void archive.update(item.id, view === "active")
                  }
                >
                  {view === "archive" ? (
                    <ArchiveRestore size={16} />
                  ) : (
                    <Archive size={16} />
                  )}
                </button>}
              </article>
            ))}
            {items.length > visibleCount && <button className="button button-ghost newsletter-load-more" onClick={() => setVisibleCount((count) => count + 30)}>Show 30 more · {items.length - visibleCount} remaining</button>}
            {!items.length && (
              <Panel className="empty-state">
                <CheckCircle2 size={28} />
                <h2>
                  {query || selectedSources.length ? "No stories match these filters" : view === "archive"
                    ? "No archived newsletter stories"
                    : view === "history"
                      ? "No earlier stories yet"
                      : "You’re all caught up"}
                </h2>
                <p>
                  {query || selectedSources.length ? "Try another newsletter, a different search, or clear the filters above." : view === "archive"
                    ? "Archived stories remain stored locally without changing Gmail."
                    : view === "history"
                      ? "Stories outside the current reading window remain here as the mailbox backfill is processed."
                      : "No extracted newsletter stories remain in the active queue."}
                </p>
              </Panel>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TasksView({
  tasks,
  setTasks,
}: {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [due, setDue] = useState(localDateValue);
  const [recurrence, setRecurrence] = useState("One-time");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !due) return;
    setTasks((values) => [
      {
        id: crypto.randomUUID(),
        title: title.trim(),
        description: description.trim() || "No additional details.",
        due,
        recurrence,
        priority: "Normal",
        done: false,
        createdAt: new Date().toISOString(),
      },
      ...values,
    ]);
    setTitle("");
    setDescription("");
    setDue(localDateValue());
    setRecurrence("One-time");
    setShowForm(false);
  };
  const complete = (task: Task) =>
    setTasks((values) =>
      completeTaskItems(values, task.id, { expectedDue: task.due }),
    );
  const open = tasks.filter((task) => !task.done);
  const completed = tasks
    .filter((task) => task.done)
    .sort((a, b) =>
      (b.completedAt || b.createdAt || "").localeCompare(
        a.completedAt || a.createdAt || "",
      ),
    );
  const completedToday = completed.filter(
    (task) =>
      task.completedAt &&
      localDateValue(new Date(task.completedAt)) === localDateValue(),
  );
  const dueToday = open.filter((task) => isTaskDueToday(task.due));
  const todayTotal = dueToday.length + completedToday.length;
  return (
    <div className="view">
      <PageHeading
        eyebrow="Execution"
        title="Tasks"
        description="One-time and repeating work, with enough detail to make the next action obvious."
        action={
          <button
            className="button button-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus size={16} /> Add task
          </button>
        }
      />
      {showForm && (
        <form className="task-form reveal" onSubmit={submit}>
          <div>
            <p className="eyebrow">New task</p>
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What needs to get done?"
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add a description (optional)"
            />
          </div>
          <div className="task-fields">
            <label>
              Due
              <input
                type="date"
                required
                value={due}
                onChange={(event) => setDue(event.target.value)}
              />
            </label>
            <label>
              Repeats
              <select
                value={recurrence}
                onChange={(event) => setRecurrence(event.target.value)}
              >
                <option>One-time</option>
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </label>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="button button-ghost"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button className="button button-primary">Add task</button>
          </div>
        </form>
      )}
      <div className="task-summary reveal delay-1">
        <div>
          <b>{open.length}</b>
          <span>open tasks</span>
        </div>
        <div>
          <b>{dueToday.length}</b>
          <span>due today</span>
        </div>
        <div>
          <b>
            {
              tasks.filter(
                (task) => task.recurrence !== "One-time" && !task.done,
              ).length
            }
          </b>
          <span>repeating</span>
        </div>
        <div className="task-progress">
          <span>
            <i
              style={{
                width: `${todayTotal ? (completedToday.length / todayTotal) * 100 : 0}%`,
              }}
            />
          </span>
          <small>{completedToday.length} completed today</small>
        </div>
      </div>
      {open.length ? (
        <div className="task-list reveal delay-2">
          <div className="task-list-head">
            <span>Task</span>
            <span>Due</span>
            <span>Repeats</span>
            <span />
          </div>
          {open.map((task) => (
            <div className="task-row" key={task.id}>
              <button
                className="round-check"
                aria-label={
                  task.recurrence === "One-time"
                    ? `Complete ${task.title}`
                    : `Complete and reschedule ${task.title}`
                }
                onClick={() => complete(task)}
              >
                <Check size={14} />
              </button>
              <div className="task-copy">
                <b>{task.title}</b>
                <p>{task.description}</p>
              </div>
              <Label tone={isTaskDueToday(task.due) ? "high" : undefined}>
                {formatTaskDue(task.due)}
              </Label>
              <span className="repeat-text">
                <RefreshCw size={13} />
                {task.recurrence}
              </span>
              <button
                className="more-button"
                aria-label={`Delete ${task.title}`}
                title="Delete task"
                onClick={() =>
                  setTasks((values) =>
                    values.filter((value) => value.id !== task.id),
                  )
                }
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <Panel className="empty-state">
          <ListTodo size={26} />
          <h2>No open tasks</h2>
          <p>Add the first task when there is something worth committing to.</p>
        </Panel>
      )}
      {completed.length > 0 && (
        <details className="completed-list">
          <summary>{completed.length} completed</summary>
          {completed.map((task) => (
            <div className="completed-row" key={task.id}>
              <CheckCircle2 size={16} />
              <div className="completed-copy">
                <s>{task.title}</s>
                <small>
                  {task.completedAt
                    ? `Completed ${formatDate(task.completedAt)}`
                    : "Completed"}
                  {` · was due ${formatTaskDue(task.due)}`}
                  {task.seriesId !== undefined ? " · recurring occurrence" : ""}
                </small>
              </div>
              {task.seriesId === undefined && (
                <button
                  aria-label={`Delete completed ${task.title}`}
                  title="Delete completed task"
                  onClick={() =>
                    setTasks((values) =>
                      values.filter((value) => value.id !== task.id),
                    )
                  }
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </details>
      )}
    </div>
  );
}

function TagEditor({
  label,
  help,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  help: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  const [value, setValue] = useState("");
  const add = () => {
    const cleaned = value.trim();
    if (!cleaned || values.includes(cleaned)) return;
    onChange([...values, cleaned]);
    setValue("");
  };
  return (
    <div className="settings-field">
      <label>
        {label}
        <small>{help}</small>
      </label>
      <div className="tag-input">
        <SettingsInput
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <button type="button" onClick={add}>
          <Plus size={15} /> Add
        </button>
      </div>
      <div className="tag-list">
        {values.map((item) => (
          <span key={item}>
            {item}
            <button
              type="button"
              aria-label={`Remove ${item}`}
              onClick={() =>
                onChange(values.filter((valueItem) => valueItem !== item))
              }
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

type SettingsDraft = Omit<SettingsUpdate, "ai" | "industry" | "mentions"> & {
  industry: PublicSettings["industry"];
  mentions: PublicSettings["mentions"];
  ai: NonNullable<SettingsUpdate["ai"]> & {
    keySet: PublicSettings["ai"]["keySet"];
    keySource: PublicSettings["ai"]["keySource"];
  };
};

function settingsDraft(settings: PublicSettings): SettingsDraft {
  return {
    ...settings,
    newsletters: { ...settings.newsletters, googleClientSecret: "" },
    audience: {
      accounts: settings.audience.accounts.map((account) => ({
        ...account,
        credential: "",
      })),
    },
    ai: { ...settings.ai, apiKeys: {}, clearKeys: [] },
  };
}

function SettingsView({
  settings,
  onSaved,
}: {
  settings: PublicSettings;
  onSaved: (settings: PublicSettings) => void;
}) {
  const router = useRouter();
  const [section, setSection] = useState<SettingsSection>("general");
  const [draft, setDraft] = useState<SettingsDraft>(() =>
    settingsDraft(settings),
  );
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [bridgePromptFallback, setBridgePromptFallback] = useState("");
  useEffect(() => {
    window.queueMicrotask(() => {
      const parameters = new URLSearchParams(window.location.search);
      const requested = parameters.get("section") as SettingsSection | null;
      if (
        requested &&
        [
          "general",
          "industry",
          "mentions",
          "newsletters",
          "audience",
          "ai",
          "dailyBrief",
          "integrations",
        ].includes(requested)
      )
        setSection(requested);
      const oauthError = parameters.get("error");
      if (oauthError === "oauth-config")
        setNotice(
          "Save a Google OAuth client ID and secret before choosing an account.",
        );
      if (oauthError === "oauth-client-id")
        setNotice(GOOGLE_OAUTH_CLIENT_ID_ERROR);
      if (oauthError === "oauth-state")
        setNotice(
          "The Google connection expired before it completed. Please try again.",
        );
      if (oauthError === "oauth-exchange")
        setNotice(
          "Google could not complete the connection. Check the OAuth client and redirect URI, then try again.",
        );
      if (parameters.get("connected") === "1")
        setNotice(
          "Saved. The newsletter Gmail account is connected read-only.",
        );
    });
  }, []);
  const save = async () => {
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error || "Could not save settings.");
      const saved = payload as PublicSettings;
      setDraft(settingsDraft(saved));
      onSaved(saved);
      setNotice("Saved. Live pages will use this configuration immediately.");
      return true;
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not save settings.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  };
  const connectGmail = async () => {
    if (
      !draft.newsletters.googleClientId.trim() ||
      (!draft.newsletters.googleClientSecretSet &&
        !draft.newsletters.googleClientSecret?.trim())
    ) {
      setNotice("Add the Google OAuth client ID and secret first.");
      return;
    }
    if (!isGoogleOAuthClientId(draft.newsletters.googleClientId)) {
      setNotice(GOOGLE_OAUTH_CLIENT_ID_ERROR);
      return;
    }
    if (await save()) router.push("/api/auth/google/start");
  };
  const addSource = () =>
    setDraft((value) => ({
      ...value,
      industry: {
        ...value.industry,
        sources: [
          ...value.industry.sources,
          { id: crypto.randomUUID(), name: "", url: "" },
        ],
      },
    }));
  const addAccount = (platform: AudiencePlatform) =>
    setDraft((value) => ({
      ...value,
      audience: {
        accounts: [
          ...value.audience.accounts,
          {
            id: crypto.randomUUID(),
            platform,
            label: platform[0].toUpperCase() + platform.slice(1),
            username: "",
            profileUrl: "",
            accountId: "",
            credential: "",
            credentialSet: false,
          },
        ],
      },
    }));
  const changeSection = (nextSection: SettingsSection) => {
    setSection(nextSection);
    const url = new URL(window.location.href);
    url.searchParams.set("section", nextSection);
    window.history.replaceState({}, "", url);
  };
  const copyBridgePrompt = async () => {
    if (!draft.dailyBrief.sourceLabels.length) {
      setNotice(
        "Add at least one Daily Brief source before copying the bridge prompt.",
      );
      return;
    }
    const endpoint = `${window.location.origin}/api/brief`;
    const prompt = [
      "Create a read-only recurring Daily Brief sync for my local Control Center.",
      `Use only these installed connector sources: ${draft.dailyBrief.sourceLabels.join(", ")}.`,
      `Look back ${draft.dailyBrief.lookbackDays} days and return only actionable messages, meetings, deadlines, decisions, and genuinely useful context.`,
      "Minimize private content: concise titles and summaries only; never include credentials or full message bodies.",
      `POST the result to ${endpoint} as JSON: {\"sources\":[{\"source\":\"each configured source label\",\"status\":\"success|error\",\"error\":\"required only on error\"}],\"items\":[{\"id\":\"required stable provider ID\",\"source\":\"one successful source label\",\"title\":\"...\",\"summary\":\"...\",\"kind\":\"action|meeting|message|info\",\"occurredAt\":\"ISO date\",\"dueAt\":\"optional ISO date\",\"url\":\"optional source URL\"}]}.`,
      "Include every configured source in sources, even when a successful source has zero items. The items for each successful source must be its complete current set; missing prior items will be removed. Mark unreadable connectors as error and omit their items so the dashboard preserves the last successful set while showing the failure. Keep this operation read-only in every connected app.",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(prompt);
      setBridgePromptFallback("");
      setNotice(
        "Saved to clipboard. Paste the bridge prompt into Codex to create the connector sync.",
      );
    } catch {
      setBridgePromptFallback(prompt);
      setNotice(
        "Clipboard access was blocked. Select the complete prompt shown below and copy it manually.",
      );
    }
  };
  const sections: Array<{
    id: SettingsSection;
    label: string;
    icon: typeof Activity;
  }> = [
    { id: "general", label: "General", icon: Settings2 },
    { id: "dailyBrief", label: "Daily brief", icon: LayoutDashboard },
    { id: "industry", label: "Industry", icon: Globe2 },
    { id: "mentions", label: "Mentions", icon: AtSign },
    { id: "newsletters", label: "Newsletters", icon: Mail },
    { id: "audience", label: "Audience", icon: Users },
    { id: "ai", label: "AI curation", icon: Sparkles },
    { id: "integrations", label: "Integrations", icon: Cable },
  ];
  return (
    <div className="view">
      <PageHeading
        eyebrow="Make it yours"
        title="Settings"
        description="A fresh install starts empty. Choose exactly what the dashboard reads and tracks."
        action={
          <button
            className="button button-primary"
            onClick={save}
            disabled={saving}
          >
            {saving ? (
              <RefreshCw className="spin" size={15} />
            ) : (
              <Check size={15} />
            )}{" "}
            Save settings
          </button>
        }
      />
      {notice && (
        <div
          className={classNames(
            "save-notice",
            notice.startsWith("Saved") && "success",
          )}
          role="status"
          aria-live="polite"
        >
          {notice}
        </div>
      )}
      <div className="settings-layout reveal delay-1">
        <aside className="settings-nav">
          {sections.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={section === item.id ? "active" : ""}
                onClick={() => changeSection(item.id)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                <ArrowRight size={14} />
              </button>
            );
          })}
          <div className="settings-security">
            <ShieldCheck size={18} />
            <b>Secrets stay server-side</b>
            <p>Saved credentials are never returned to the browser.</p>
          </div>
        </aside>
        <div className="settings-content" key={section}>
          {section === "dailyBrief" && (
            <Panel className="settings-panel">
              <div className="settings-title"><LayoutDashboard /><div>
                <p className="eyebrow">Your daily snapshot</p><h2>Choose what Today shows</h2>
                <p>Bring the highest-priority items from your other tabs into one quick brief. Each section uses saved results, not another source search.</p>
              </div></div>
              <div className="brief-settings-grid">
                {(["industry", "mentions", "newsletters"] as const).map((category) => (
                  <label className="brief-setting-card" key={category}>
                    <span>{category === "industry" ? <Radio /> : category === "mentions" ? <AtSign /> : <Mail />}</span>
                    <b>{category === "industry" ? "Industry" : category === "mentions" ? "Mentions" : "Newsletters"}</b>
                    <small>{category === "industry" ? "The most important industry developments." : category === "mentions" ? "The mentions most worth your attention." : "Top news from your newsletter reading queue."}</small>
                    <select aria-label={`${category} stories in daily brief`} value={draft.dailyBrief.sections[category]} onChange={(event) => setDraft((value) => ({...value, dailyBrief: {...value.dailyBrief, sections: {...value.dailyBrief.sections, [category]: Number(event.target.value)}}}))}>
                      <option value={0}>Don&apos;t include</option>
                      {[1,2,3,4,5,6,7,8,9,10].map((count) => <option key={count} value={count}>Top {count} {count === 1 ? "story" : "stories"}</option>)}
                    </select>
                  </label>
                ))}
              </div>
              <div className="settings-caveat"><Sparkles size={17} /><p>With a configured AI provider, AI priority and summaries flow into this brief automatically. Without one, saved local ranking is used. Archived stories are excluded, and a short queue is never padded with old news.</p></div>
              <div className="bridge-manual"><b>Want private messages and meetings too?</b><p>That is optional. <button type="button" className="text-button" onClick={() => changeSection("integrations")}>Open Integrations</button> to connect a local automation that can read your private apps. It is not needed for the three sections above.</p></div>
            </Panel>
          )}
          {section === "general" && (
            <Panel className="settings-panel">
              <div className="settings-title">
                <Settings2 />
                <div>
                  <p className="eyebrow">General</p>
                  <h2>Workspace identity</h2>
                  <p>
                    Use any name. No person or company is assumed by default.
                  </p>
                </div>
              </div>
              <div className="settings-field">
                <label>
                  Workspace name
                  <small>Shown in the header and browser title.</small>
                </label>
                <SettingsInput
                  value={draft.general.workspaceName}
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      general: { workspaceName: event.target.value },
                    }))
                  }
                  placeholder="Control Center"
                />
              </div>
            </Panel>
          )}
          {section === "industry" && (
            <Panel className="settings-panel">
              <div className="settings-title">
                <Globe2 />
                <div>
                  <p className="eyebrow">Industry</p>
                  <h2>Sites and industry topics</h2>
                  <p>
                    Add any public homepage or feed. RSS, Atom, and RDF are
                    tried first; when none is available, the collector records a
                    recursive sitemap baseline and reports new pages.
                  </p>
                </div>
              </div>
              <div className="settings-field">
                <label>
                  What matters in this industry?
                  <small>
                    A short niche description helps distinguish consequential
                    updates from adjacent noise. It is used locally and by your
                    selected AI provider, when enabled.
                  </small>
                </label>
                <textarea
                  value={draft.industry.description}
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      industry: {
                        ...value.industry,
                        description: event.target.value,
                      },
                    }))
                  }
                  placeholder="e.g. Commercial robotics, warehouse automation, major product launches, research breakthroughs, funding, and regulation"
                />
              </div>
              <div className="settings-field">
                <label>
                  Daily reading target
                  <small>
                    Discovery remains broad, but only this many high-value
                    updates can appear in the current queue.
                  </small>
                </label>
                <select
                  value={draft.industry.dailyLimit}
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      industry: {
                        ...value.industry,
                        dailyLimit: Number(event.target.value),
                      },
                    }))
                  }
                >
                  <option value={20}>20 updates</option>
                  <option value={25}>25 updates</option>
                  <option value={30}>30 updates</option>
                  <option value={40}>40 updates</option>
                  <option value={50}>50 updates</option>
                </select>
              </div>
              <div className="source-editor">
                <div className="source-editor-head">
                  <b>Tracked sources</b>
                  <button type="button" onClick={addSource}>
                    <Plus size={14} /> Add source
                  </button>
                </div>
                {draft.industry.sources.map((source) => (
                  <div className="source-edit-row" key={source.id}>
                    <SettingsInput
                      aria-label="Source name"
                      value={source.name}
                      onChange={(event) =>
                        setDraft((value) => ({
                          ...value,
                          industry: {
                            ...value.industry,
                            sources: value.industry.sources.map((item) =>
                              item.id === source.id
                                ? { ...item, name: event.target.value }
                                : item,
                            ),
                          },
                        }))
                      }
                      placeholder="Source name"
                    />
                    <SettingsInput
                      aria-label="Source URL"
                      value={source.url}
                      onChange={(event) =>
                        setDraft((value) => ({
                          ...value,
                          industry: {
                            ...value.industry,
                            sources: value.industry.sources.map((item) =>
                              item.id === source.id
                                ? { ...item, url: event.target.value }
                                : item,
                            ),
                          },
                        }))
                      }
                      placeholder="https://example.com"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((value) => ({
                          ...value,
                          industry: {
                            ...value.industry,
                            sources: value.industry.sources.filter(
                              (item) => item.id !== source.id,
                            ),
                          },
                        }))
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                {!draft.industry.sources.length && (
                  <div className="editor-empty">No industry sources yet.</div>
                )}
              </div>
              <TagEditor
                label="Industry topics"
                help="These phrases discover wider current news and act as must-track relevance signals. Watched sites still receive priority, but low-value pages stay in discovery history instead of flooding the reading queue."
                values={draft.industry.keywords}
                onChange={(keywords) =>
                  setDraft((value) => ({
                    ...value,
                    industry: { ...value.industry, keywords },
                  }))
                }
                placeholder="e.g. sustainable packaging"
              />
              <TagEditor
                label="Exclude topics"
                help="Filter recurring noise that is not useful for this niche, such as jobs, sports scores, coupon pages, or unrelated uses of a shared term."
                values={draft.industry.excludedTerms}
                onChange={(excludedTerms) =>
                  setDraft((value) => ({
                    ...value,
                    industry: { ...value.industry, excludedTerms },
                  }))
                }
                placeholder="e.g. job listings"
              />
              <div className="settings-caveat">
                <Radio size={17} />
                <p>
                  Blocked homepages do not stop feed or sitemap discovery. A
                  site that exposes no readable feed or sitemap will show an
                  explicit source error instead of a false success.
                </p>
              </div>
            </Panel>
          )}
          {section === "mentions" && (
            <Panel className="settings-panel">
              <div className="settings-title">
                <AtSign />
                <div>
                  <p className="eyebrow">Mentions</p>
                  <h2>Identity, not loose keywords</h2>
                  <p>
                    Each identity is searched exactly across the past seven
                    days. Direct evidence is high confidence; thinner provider
                    matches are separated into review. Keep up to 12 names,
                    handles, and official websites combined so every source
                    check stays fast and reliable on a laptop.
                  </p>
                </div>
              </div>
              <TagEditor
                label="Names, brands, and unique handles"
                help="Add complete names, brand phrases, and handles. The words inside a phrase are never searched separately; this list shares a 12-identity limit with official websites."
                values={draft.mentions.terms}
                onChange={(terms) =>
                  setDraft((value) => ({
                    ...value,
                    mentions: { ...value.mentions, terms },
                  }))
                }
                placeholder="e.g. Acme Labs"
              />
              <TagEditor
                label="Official websites"
                help="Add official domains. Exact domain matches count as strong identity evidence and improve deduplication; this list shares a 12-identity limit with names and handles."
                values={draft.mentions.websites}
                onChange={(websites) =>
                  setDraft((value) => ({
                    ...value,
                    mentions: { ...value.mentions, websites },
                  }))
                }
                placeholder="e.g. acme.example"
              />
              <TagEditor
                label="Identity anchors"
                help="Add specific roles, locations, products, collaborators, or signature topics that distinguish namesakes."
                values={draft.mentions.identityAnchors}
                onChange={(identityAnchors) =>
                  setDraft((value) => ({
                    ...value,
                    mentions: { ...value.mentions, identityAnchors },
                  }))
                }
                placeholder="e.g. robotics founder"
              />
              <TagEditor
                label="Exclude namesakes and false contexts"
                help="Add words tied to recurring false positives: another person's employer, sport, location, profession, product, or an unrelated meaning of the brand phrase."
                values={draft.mentions.negativeTerms}
                onChange={(negativeTerms) =>
                  setDraft((value) => ({
                    ...value,
                    mentions: { ...value.mentions, negativeTerms },
                  }))
                }
                placeholder="e.g. professional golfer"
              />
              <label className="toggle-row">
                <SettingsInput
                  type="checkbox"
                  checked={draft.mentions.strictMode}
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      mentions: {
                        ...value.mentions,
                        strictMode: event.target.checked,
                      },
                    }))
                  }
                />
                <span>
                  <b>Identity-aware filtering</b>
                  <small>
                    Reject uncorroborated namesakes while retaining contextual
                    matches for review.
                  </small>
                </span>
              </label>
              <label className="toggle-row">
                <SettingsInput
                  type="checkbox"
                  checked={draft.mentions.excludeOwnedSites}
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      mentions: {
                        ...value.mentions,
                        excludeOwnedSites: event.target.checked,
                      },
                    }))
                  }
                />
                <span>
                  <b>Exclude your own websites</b>
                  <small>
                    Official domains strengthen identity verification but do
                    not count as third-party mentions.
                  </small>
                </span>
              </label>
              <div className="settings-caveat">
                <ShieldCheck size={17} />
                <p>
                  Archived results keep their canonical local identity and do
                  not return on later scans. Add precise anchors whenever a
                  brand phrase is also common language.
                </p>
              </div>
            </Panel>
          )}
          {section === "newsletters" && (
            <Panel className="settings-panel">
              <div className="settings-title">
                <Mail />
                <div>
                  <p className="eyebrow">Newsletters</p>
                  <h2>Dedicated Gmail connection</h2>
                  <p>
                    Connect any Google account, including one created only for
                    newsletter subscriptions. Gmail access stays read-only.
                    Newsletter intelligence also needs a cloud or local model
                    configured in AI curation. Issue text goes only to that selected provider.
                  </p>
                </div>
              </div>
              {draft.newsletters.connected ? (
                <div className="connection-card connected">
                  <CheckCircle2 />
                  <div>
                    <b>{draft.newsletters.connectedEmail}</b>
                    <p>Connected with Gmail read-only access.</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch("/api/settings?connection=gmail", {
                        method: "DELETE",
                      });
                      const response = await fetch("/api/settings");
                      const saved = (await response.json()) as PublicSettings;
                      setDraft(settingsDraft(saved));
                      onSaved(saved);
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="connection-card">
                  <Mail />
                  <div>
                    <b>No newsletter mailbox connected</b>
                    <p>
                      Create a dedicated Gmail if you want one, then save OAuth
                      credentials and connect it here.
                    </p>
                  </div>
                  <a
                    className="button button-ghost"
                    href="https://accounts.google.com/signup"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Create Gmail <ArrowUpRight size={14} />
                  </a>
                </div>
              )}
              <div className="credential-grid">
                <div className="settings-field">
                  <label>
                    Google OAuth client ID
                    <small>
                      From a Google Cloud “Web application” OAuth client.
                    </small>
                  </label>
                  <SettingsInput
                    aria-label="Google OAuth client ID"
                    autoCapitalize="none"
                    autoComplete="off"
                    name="google-oauth-client-id"
                    spellCheck={false}
                    value={draft.newsletters.googleClientId}
                    onChange={(event) =>
                      setDraft((value) => ({
                        ...value,
                        newsletters: {
                          ...value.newsletters,
                          googleClientId: event.target.value,
                        },
                      }))
                    }
                    placeholder="…apps.googleusercontent.com"
                  />
                </div>
                <div className="settings-field">
                  <label>
                    Google OAuth client secret
                    <small>
                      {draft.newsletters.googleClientSecretSet
                        ? "A secret is already saved. Leave blank to keep it."
                        : "Stored only in the local server data directory."}
                    </small>
                  </label>
                  <SettingsInput
                    aria-label="Google OAuth client secret"
                    autoComplete="new-password"
                    name="google-oauth-client-secret"
                    type="password"
                    value={draft.newsletters.googleClientSecret || ""}
                    onChange={(event) =>
                      setDraft((value) => ({
                        ...value,
                        newsletters: {
                          ...value.newsletters,
                          googleClientSecret: event.target.value,
                        },
                      }))
                    }
                    placeholder={
                      draft.newsletters.googleClientSecretSet
                        ? "Saved ••••••••"
                        : "Client secret"
                    }
                  />
                </div>
              </div>
              <div className="settings-field">
                <label>
                  Gmail search query
                  <small>
                    Choose which messages count as newsletters using Gmail
                    search syntax. The default watches recent Updates and
                    Promotions.
                  </small>
                </label>
                <SettingsInput
                  value={draft.newsletters.gmailQuery}
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      newsletters: {
                        ...value.newsletters,
                        gmailQuery: event.target.value,
                      },
                    }))
                  }
                  placeholder="newer_than:30d (category:updates OR category:promotions)"
                />
              </div>
              <div className="oauth-actions">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => void connectGmail()}
                  disabled={saving}
                >
                  <KeyRound size={15} />{" "}
                  {saving ? "Saving…" : "Save & choose Gmail account"}
                </button>
                <p>
                  Authorized redirect URI:{" "}
                  <code>
                    {typeof window === "undefined"
                      ? "/api/auth/google/callback"
                      : `${window.location.origin}/api/auth/google/callback`}
                  </code>
                </p>
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Google OAuth credentials <ArrowUpRight size={13} />
                </a>
              </div>
            </Panel>
          )}
          {section === "audience" && (
            <Panel className="settings-panel">
              <div className="settings-title">
                <Users />
                <div>
                  <p className="eyebrow">Audience</p>
                  <h2>Public social profiles</h2>
                  <p>
                    Paste the exact profile or company-page URL for any account.
                    Public checks are keyless; supported official credentials
                    remain optional fallbacks.
                  </p>
                </div>
              </div>
              <div className="provider-buttons">
                <button type="button" onClick={() => addAccount("youtube")}>
                  <Youtube /> YouTube
                </button>
                <button type="button" onClick={() => addAccount("x")}>
                  <X /> X
                </button>
                <button type="button" onClick={() => addAccount("instagram")}>
                  <Instagram /> Instagram
                </button>
                <button type="button" onClick={() => addAccount("facebook")}>
                  <Facebook /> Facebook
                </button>
                <button type="button" onClick={() => addAccount("linkedin")}>
                  <Linkedin /> LinkedIn
                </button>
                <button type="button" onClick={() => addAccount("threads")}>
                  <AtSign /> Threads
                </button>
                <button type="button" onClick={() => addAccount("tiktok")}>
                  <Music2 /> TikTok
                </button>
              </div>
              <div className="account-editor">
                {draft.audience.accounts.map((account) => (
                  <div className="account-card" key={account.id}>
                    <div className="account-card-head">
                      <Label>{account.platform}</Label>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((value) => ({
                            ...value,
                            audience: {
                              accounts: value.audience.accounts.filter(
                                (item) => item.id !== account.id,
                              ),
                            },
                          }))
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="credential-grid">
                      <div className="settings-field">
                        <label>
                          Label
                          <small>
                            How this account appears in the dashboard.
                          </small>
                        </label>
                        <SettingsInput
                          value={account.label}
                          onChange={(event) =>
                            setDraft((value) => ({
                              ...value,
                              audience: {
                                accounts: value.audience.accounts.map((item) =>
                                  item.id === account.id
                                    ? { ...item, label: event.target.value }
                                    : item,
                                ),
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="settings-field">
                        <label>
                          Username or handle
                          <small>
                            Used when a full profile URL is not supplied.
                          </small>
                        </label>
                        <SettingsInput
                          value={account.username}
                          onChange={(event) =>
                            setDraft((value) => ({
                              ...value,
                              audience: {
                                accounts: value.audience.accounts.map((item) =>
                                  item.id === account.id
                                    ? { ...item, username: event.target.value }
                                    : item,
                                ),
                              },
                            }))
                          }
                          placeholder="without the @ symbol"
                        />
                      </div>
                      <div className="settings-field profile-url-field">
                        <label>
                          Public profile URL
                          <small>
                            Must be a profile on the selected platform. Emails
                            and post URLs are rejected.
                          </small>
                        </label>
                        <SettingsInput
                          type="url"
                          fieldKey={`audience-${account.id}-profile-url`}
                          aria-label={`${account.label || account.platform} public profile URL`}
                          value={account.profileUrl || ""}
                          onChange={(event) =>
                            setDraft((value) => ({
                              ...value,
                              audience: {
                                accounts: value.audience.accounts.map((item) =>
                                  item.id === account.id
                                    ? {
                                        ...item,
                                        profileUrl: event.target.value,
                                      }
                                    : item,
                                ),
                              },
                            }))
                          }
                          placeholder={profilePlaceholder(account.platform)}
                        />
                      </div>
                    </div>
                    {["youtube", "x", "instagram", "facebook"].includes(
                      account.platform,
                    ) && (
                      <details className="advanced-credentials">
                        <summary>
                          <KeyRound size={13} /> Optional official API fallback
                        </summary>
                        <p>
                          Only used if the public profile does not expose a
                          readable count.
                        </p>
                        <div className="credential-grid">
                          {(account.platform === "instagram" ||
                            account.platform === "facebook") && (
                            <div className="settings-field">
                              <label>
                                Account or page ID
                                <small>
                                  Only needed for the Meta API fallback.
                                </small>
                              </label>
                              <SettingsInput
                                value={account.accountId}
                                onChange={(event) =>
                                  setDraft((value) => ({
                                    ...value,
                                    audience: {
                                      accounts: value.audience.accounts.map(
                                        (item) =>
                                          item.id === account.id
                                            ? {
                                                ...item,
                                                accountId: event.target.value,
                                              }
                                            : item,
                                      ),
                                    },
                                  }))
                                }
                              />
                            </div>
                          )}
                          <div className="settings-field">
                            <label>
                              {account.platform === "youtube"
                                ? "YouTube Data API key"
                                : account.platform === "x"
                                  ? "X bearer token"
                                  : "Meta access token"}
                              <small>
                                {account.credentialSet
                                  ? "Credential saved. You can remove it below."
                                  : "Optional; stored server-side and excluded from Git."}
                              </small>
                            </label>
                            <SettingsInput
                              type="password"
                              value={account.credential || ""}
                              onChange={(event) =>
                                setDraft((value) => ({
                                  ...value,
                                  audience: {
                                    accounts: value.audience.accounts.map(
                                      (item) =>
                                        item.id === account.id
                                          ? {
                                              ...item,
                                              credential: event.target.value,
                                              clearCredential: false,
                                            }
                                          : item,
                                    ),
                                  },
                                }))
                              }
                              placeholder={
                                account.credentialSet
                                  ? "Saved ••••••••"
                                  : "Optional provider credential"
                              }
                            />
                          </div>
                        </div>
                        {account.credentialSet && (
                          <button
                            className="text-button danger"
                            type="button"
                            onClick={() =>
                              setDraft((value) => ({
                                ...value,
                                audience: {
                                  accounts: value.audience.accounts.map(
                                    (item) =>
                                      item.id === account.id
                                        ? {
                                            ...item,
                                            credential: "",
                                            credentialSet: false,
                                            clearCredential: true,
                                          }
                                        : item,
                                  ),
                                },
                              }))
                            }
                          >
                            <Trash2 size={13} /> Remove saved credential
                          </button>
                        )}
                      </details>
                    )}
                  </div>
                ))}
                {!draft.audience.accounts.length && (
                  <div className="editor-empty">
                    No audience accounts yet. Choose a platform above.
                  </div>
                )}
              </div>
              <div className="settings-caveat">
                <Eye size={17} />
                <p>
                  Public metadata is provider-controlled. Each metric is tied to
                  the canonical account URL, failures preserve only that
                  account&apos;s last verified value, and temporary blocks never
                  become a false zero.
                </p>
              </div>
            </Panel>
          )}
          {section === "ai" && (
            <Panel className="settings-panel"><AiProviderSettings
              value={draft.ai}
              onChange={(ai) => setDraft((value) => ({ ...value, ai }))}
            /></Panel>
          )}
          {section === "integrations" && (
            <Panel className="settings-panel">
              <div className="settings-title">
                <Cable />
                <div>
                  <p className="eyebrow">Optional · advanced setup</p>
                  <h2>Bring private context into Today</h2>
                  <p>
                    Use this only if you want Today to include private messages, meetings, or to-dos from apps such as Slack, Gmail, Granola, or Calendar. Industry, Mentions, Audience, and newsletter collection do not need this page.
                  </p>
                </div>
              </div>
              <div className="integration-explainer">
                <h3>How it works</h3>
                <ol>
                  <li><b>Choose the apps below.</b> These names are labels for incoming summaries, not logins or API keys. Adding a name does not connect the app.</li>
                  <li><b>Save settings, then copy the setup prompt.</b> Paste it into Codex (with the relevant plugins installed), or use your own local script.</li>
                  <li><b>Authorize that automation.</b> It reads only the apps you approve and sends a short summary to this running Control Center. The Today page shows when each source last synced.</li>
                </ol>
                <p>No private integrations? Leave this section empty. Your cross-tab daily snapshot still works.</p>
              </div>
              <TagEditor
                label="Apps to receive summaries from"
                help="Add one name at a time, such as Slack or Google Calendar. The copied setup prompt uses these names to match summaries to the right app."
                values={draft.dailyBrief.sourceLabels}
                onChange={(sourceLabels) =>
                  setDraft((value) => ({
                    ...value,
                    dailyBrief: { ...value.dailyBrief, sourceLabels },
                  }))
                }
                placeholder="e.g. Slack"
              />
              <div className="settings-field">
                <label>
                  Keep private context for
                  <small>
                    The maximum recent sync history available locally. Today
                    and Week apply their own narrower display windows.
                  </small>
                </label>
                <select
                  value={draft.dailyBrief.lookbackDays}
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      dailyBrief: {
                        ...value.dailyBrief,
                        lookbackDays: Number(event.target.value),
                      },
                    }))
                  }
                >
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>
              <div className="bridge-card">
                <div>
                  <p className="eyebrow">Step 2 · after saving</p>
                  <h3>Set up the reader in Codex</h3>
                  <p>
                    The prompt tells Codex to use only the source labels above,
                    minimize private content, stay read-only, report each
                    source&apos;s health, and post stable items to this computer.
                  </p>
                </div>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => void copyBridgePrompt()}
                >
                  <Copy size={15} /> Copy setup prompt
                </button>
                <code>
                  {typeof window === "undefined"
                    ? "/api/brief"
                    : `${window.location.origin}/api/brief`}
                </code>
                {bridgePromptFallback && (
                  <label className="bridge-prompt-fallback">
                    Complete prompt
                    <textarea
                      readOnly
                      value={bridgePromptFallback}
                      onFocus={(event) => event.currentTarget.select()}
                    />
                  </label>
                )}
              </div>
              <div className="bridge-manual">
                <b>Script or local automation</b>
                <p>
                  Send the same JSON contract with{" "}
                  <code>
                    npm run ingest -- --file=/absolute/path/items.json
                  </code>
                  . Stable item IDs prevent duplicates on later runs; source
                  reports record empty checks and connector failures.
                </p>
              </div>
              <div className="settings-caveat">
                <ShieldCheck size={17} />
                <p>
                  Control Center never reaches into Codex or a private provider
                  by itself. A user-approved local automation reads those
                  sources and sends only the minimized overview. This keeps a
                  GitHub install portable without shipping anyone&apos;s account
                  access.
                </p>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

export function ControlCenter() {
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settings, setSettings] = useState<PublicSettings>(emptySettings);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [toast, setToast] = useState("");
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [bootstrapStatus, setBootstrapStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [bootstrapError, setBootstrapError] = useState("");
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const [workspaceSaveError, setWorkspaceSaveError] = useState("");
  const workspaceSaveQueue = useRef(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    window.queueMicrotask(() => {
      const requested = new URLSearchParams(window.location.search).get(
        "tab",
      ) as Tab | null;
      if (
        requested &&
        [...nav.map((item) => item.id), "settings"].includes(requested)
      )
        setActiveTab(requested);
    });
    const load = async () => {
      try {
        const [settingsResponse, workspaceResponse] = await Promise.all([
          fetch("/api/settings", { cache: "no-store" }),
          fetch("/api/workspace", { cache: "no-store" }),
        ]);
        if (!settingsResponse.ok)
          throw new Error(
            `Settings could not be read. Your saved configuration was not changed.${await failureDetail(settingsResponse)}`,
          );
        if (!workspaceResponse.ok)
          throw new Error(
            `Tasks and reminders could not be read. Your saved workspace was not changed.${await failureDetail(workspaceResponse)}`,
          );
        const [loadedSettings, saved] = await Promise.all([
          settingsResponse.json() as Promise<PublicSettings>,
          workspaceResponse.json() as Promise<WorkspaceStateResponse>,
        ]);
        const recovery = readWorkspaceRecovery();
        const legacy: WorkspaceState = saved.legacyBrowserImportAllowed
          ? {
              reminders: readLegacyList<Reminder>("control-center-v2-reminders"),
              tasks: readLegacyList<Task>("control-center-v2-tasks"),
            }
          : { reminders: [], tasks: [] };
        let nextWorkspace: WorkspaceState = saved.initialized
          ? { reminders: saved.reminders, tasks: saved.tasks }
          : legacy;
        const canRecover = saved.initialized || saved.legacyBrowserImportAllowed;
        if (recovery && canRecover) nextWorkspace = recovery.workspace;
        if (!saved.initialized || (recovery && canRecover)) {
          const importResponse = await fetch("/api/workspace", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nextWorkspace),
          });
          if (!importResponse.ok)
            throw new Error(
              `The first-run workspace could not be initialized. No local data was replaced.${await failureDetail(importResponse)}`,
            );
          nextWorkspace = (await importResponse.json()) as WorkspaceState;
        }
        if (cancelled) return;
        setSettings(loadedSettings);
        setReminders(nextWorkspace.reminders);
        setTasks(nextWorkspace.tasks);
        setWorkspaceReady(true);
        setBootstrapStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setBootstrapError(
          error instanceof Error
            ? error.message
            : "Control Center could not read its local data.",
        );
        setBootstrapStatus("error");
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [bootstrapAttempt]);
  useEffect(() => {
    if (!workspaceReady) return;
    const workspace = { reminders, tasks } satisfies WorkspaceState;
    const recovery: WorkspaceRecovery = {
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
      workspace,
    };
    try {
      window.localStorage.setItem(
        "control-center-v2-reminders",
        JSON.stringify(reminders),
      );
      window.localStorage.setItem(
        "control-center-v2-tasks",
        JSON.stringify(tasks),
      );
      window.localStorage.setItem(
        WORKSPACE_RECOVERY_KEY,
        JSON.stringify(recovery),
      );
    } catch {
      // The immediate SQLite write below remains canonical when browser storage is unavailable.
    }
    const save = async () => {
      const response = await fetch("/api/workspace", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workspace),
      });
      if (!response.ok)
        throw new Error(
          `Tasks and reminders could not be saved to SQLite. Keep this page open and retry.${await failureDetail(response)}`,
        );
      try {
        if (readWorkspaceRecovery()?.id === recovery.id)
          window.localStorage.removeItem(WORKSPACE_RECOVERY_KEY);
      } catch {
        // A saved SQLite workspace does not depend on clearing the recovery copy.
      }
      setWorkspaceSaveError("");
    };
    workspaceSaveQueue.current = workspaceSaveQueue.current
      .then(save, save)
      .catch((error) => {
        setWorkspaceSaveError(
          error instanceof Error
            ? error.message
            : "Tasks and reminders could not be saved.",
        );
      });
  }, [reminders, tasks, workspaceReady]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const goTo = (tab: Tab) => {
    setActiveTab(tab);
    setMobileOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    if (tab !== "settings") url.searchParams.delete("section");
    window.history.replaceState({}, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const addReminder = (title: string, note: string, url?: string) => {
    let source = "Manual";
    if (url) {
      try {
        source = new URL(url).hostname.replace("www.", "");
      } catch {
        source = "Saved link";
      }
    }
    setReminders((values) => [
      {
        id: crypto.randomUUID(),
        type: url ? "Link" : "Saved",
        title,
        source,
        createdAt: new Date().toISOString(),
        note: note || "Saved for later.",
        accent: "teal",
        url,
      },
      ...values,
    ]);
    setToast("Saved to reminders");
  };
  const addBriefTask = (item: DailyBriefItem) => {
    const id = `brief:${item.id}`;
    if (tasks.some((task) => task.id === id)) {
      setToast("That brief item is already in tasks");
      return;
    }
    setTasks((values) => [
      {
        id,
        title: item.title,
        description:
          [item.source, item.summary, item.url].filter(Boolean).join(" · ") ||
          "Added from Daily Brief.",
        due: item.dueAt
          ? localDateValue(new Date(item.dueAt))
          : localDateValue(),
        recurrence: "One-time",
        priority: item.kind === "action" ? "High" : "Normal",
        done: false,
        createdAt: new Date().toISOString(),
      },
      ...values,
    ]);
    setToast("Added to tasks");
  };
  const openSettings = (section?: SettingsSection) => {
    const url = new URL(window.location.href);
    if (section) url.searchParams.set("section", section);
    url.searchParams.set("tab", "settings");
    window.history.replaceState({}, "", url);
    setActiveTab("settings");
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const configuredCount = [
    settings.industry.sources.length + settings.industry.keywords.length,
    settings.mentions.terms.length + settings.mentions.websites.length,
    newsletterSetupReady(settings) ? 1 : 0,
    settings.audience.accounts.length,
  ].filter(Boolean).length;
  const current = useMemo(
    () =>
      activeTab === "settings"
        ? "Settings"
        : nav.find((item) => item.id === activeTab)?.label,
    [activeTab],
  );

  if (bootstrapStatus === "loading")
    return (
      <div className="app-loading">
        <Activity />
        <span>Opening Control Center</span>
      </div>
    );
  if (bootstrapStatus === "error")
    return (
      <div className="app-recovery">
        <Panel className="recovery-panel">
          <CircleAlert size={30} />
          <p className="eyebrow">Local data protected</p>
          <h1>Control Center could not open safely</h1>
          <p>{bootstrapError}</p>
          <p>
            No settings, tasks, or reminders were overwritten. Retry the read,
            or run <code>npm run doctor</code> in the app folder for a local
            diagnostic.
          </p>
          <button
            className="button button-primary"
            onClick={() => {
              setBootstrapStatus("loading");
              setBootstrapError("");
              setWorkspaceReady(false);
              setBootstrapAttempt((value) => value + 1);
            }}
          >
            <RefreshCw size={15} /> Retry
          </button>
        </Panel>
      </div>
    );
  return (
    <div className="app-shell">
      <header className="topbar">
        <div
          className="brand-lockup"
          onClick={() => goTo("today")}
          role="button"
          tabIndex={0}
        >
          <span className="brand-mark">
            <Activity size={18} />
          </span>
          <span>
            <b>{settings.general.workspaceName.toUpperCase()}</b>
            <small>CONTROL CENTER</small>
          </span>
        </div>
        <button
          className="mobile-menu"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
        <nav
          className={classNames("main-nav", mobileOpen && "is-open")}
          aria-label="Main navigation"
        >
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={activeTab === item.id ? "active" : ""}
                onClick={() => goTo(item.id)}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="top-actions">
          <button className="status-button" onClick={() => openSettings()}>
            <i className={configuredCount === 4 ? "ready" : ""} />
            <span>{configuredCount}/4 live</span>
          </button>
          <button
            className="icon-button theme-toggle"
            onClick={toggleColorTheme}
            aria-label="Toggle color theme"
            title="Toggle color theme"
          >
            <Sun className="theme-icon-light" size={15} aria-hidden="true" />
            <Moon className="theme-icon-dark" size={15} aria-hidden="true" />
          </button>
          <button
            className={classNames(
              "avatar",
              activeTab === "settings" && "active",
            )}
            onClick={() => openSettings()}
            title="Settings"
          >
            <Settings2 size={15} />
          </button>
        </div>
      </header>
      <main key={activeTab}>
        {workspaceSaveError && (
          <div className="workspace-save-error" role="alert">
            <CircleAlert size={16} />
            <span>{workspaceSaveError}</span>
          </div>
        )}
        {activeTab === "today" && (
          <TodayView
            settings={settings}
            tasks={tasks}
            goTo={goTo}
            openSettings={openSettings}
            addBriefTask={addBriefTask}
          />
        )}{" "}
        {activeTab === "industry" && (
          <IndustryView
            saveStory={(story) =>
              addReminder(story.title, story.summary, story.url)
            }
            openSettings={() => openSettings("industry")}
          />
        )}{" "}
        {activeTab === "mentions" && (
          <MentionsView
            saveStory={(story) =>
              addReminder(story.title, story.summary, story.url)
            }
            openSettings={() => openSettings("mentions")}
          />
        )}{" "}
        {activeTab === "reminders" && (
          <RemindersView
            reminders={reminders}
            addReminder={addReminder}
            archiveReminder={(id, archived) =>
              setReminders((values) =>
                values.map((item) =>
                  item.id === id
                    ? {
                        ...item,
                        archivedAt: archived
                          ? new Date().toISOString()
                          : undefined,
                      }
                    : item,
                ),
              )
            }
          />
        )}{" "}
        {activeTab === "audience" && (
          <AudienceView openSettings={() => openSettings("audience")} />
        )}{" "}
        {activeTab === "newsletters" && (
          <NewslettersView
            addReminder={addReminder}
            openSettings={() => openSettings("newsletters")}
            openAiSettings={() => openSettings("ai")}
          />
        )}{" "}
        {activeTab === "tasks" && (
          <TasksView tasks={tasks} setTasks={setTasks} />
        )}{" "}
        {activeTab === "settings" && (
          <SettingsView
            settings={settings}
            onSaved={(saved) => {
              clearLiveDataCache();
              setSettings(saved);
            }}
          />
        )}
      </main>
      <footer>
        <span>{settings.general.workspaceName}</span>
        <i />
        <span>{current}</span>
        <small>Local-only · Saved to this computer</small>
      </footer>
      {toast && (
        <div className="toast">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
