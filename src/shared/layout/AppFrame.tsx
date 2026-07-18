import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { getMobileQuickItems, getNavGroupForPath, navGroups, navItems, type NavGroup } from "../navigation/navItems";
import { StorageRecoveryCenter } from "../errors/StorageRecoveryCenter";
import { PwaUpdateManager } from "../pwa/PwaUpdateManager";
import { PwaInstallGuide } from "../pwa/PwaInstallGuide";
import { useAppSettings } from "../settings/AppSettingsProvider";
import { RouteAccessibility } from "../navigation/RouteAccessibility";
import { CommandPalette } from "../commands/CommandPalette";
import { ReleaseNotesDialog } from "../release/ReleaseNotesDialog";
import type { Character } from "../../core/character/character.types";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import type { Campaign } from "../../features/campaigns/campaignTypes";
import { useI18n } from "../i18n/useI18n";
import { InterfaceTranslationBridge } from "../i18n/InterfaceTranslationBridge";

const START_ROUTE_SESSION_KEY = "e4_dnd_start_route_applied_v1";

type AppFrameProps = {
  children: React.ReactNode;
  characters: Character[];
  campaigns: Campaign[];
  rulesetData: RulesetData | null;
};

function NavigationGroups({
  openGroups,
  onToggle,
  onNavigate,
  compact = false,
}: {
  openGroups: ReadonlySet<NavGroup>;
  onToggle: (group: NavGroup) => void;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className={compact ? "nav-accordion nav-accordion-mobile" : "nav-accordion"}>
      {navGroups.map((group) => {
        const isOpen = openGroups.has(group);
        const groupItems = navItems.filter((item) => item.group === group);
        return (
          <section className={isOpen ? "nav-group open" : "nav-group"} key={group}>
            <button
              type="button"
              className="nav-group-toggle"
              aria-expanded={isOpen}
              aria-controls={`nav-group-${compact ? "mobile" : "desktop"}-${group}`}
              onClick={() => onToggle(group)}
            >
              <span>{t(`nav.group.${group}`, group)}</span>
              <span className="nav-group-count">{groupItems.length}</span>
              <span className="nav-group-chevron" aria-hidden="true">⌄</span>
            </button>
            <div
              id={`nav-group-${compact ? "mobile" : "desktop"}-${group}`}
              className="nav-group-items"
              hidden={!isOpen}
            >
              {groupItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={onNavigate}
                  className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                >
                  <span className="nav-item-icon" aria-hidden="true">{item.icon}</span>
                  <span>{t(`nav.${item.to}`, item.label)}</span>
                </NavLink>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function AppFrame({ children, characters, campaigns, rulesetData }: AppFrameProps) {
  const mobileItems = useMemo(() => getMobileQuickItems(), []);
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const { t } = useI18n();
  const activeGroup = getNavGroupForPath(location.pathname);
  const [desktopGroups, setDesktopGroups] = useState<Set<NavGroup>>(() => new Set([activeGroup]));
  const [mobileGroups, setMobileGroups] = useState<Set<NavGroup>>(() => new Set([activeGroup]));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileDrawerRef = useRef<HTMLDivElement>(null);

  const toggleGroup = (setter: React.Dispatch<React.SetStateAction<Set<NavGroup>>>, group: NavGroup) => {
    setter((current) => {
      const next = new Set(current);
      if (next.has(group)) next.delete(group); else next.add(group);
      return next;
    });
  };

  useEffect(() => {
    setDesktopGroups((current) => new Set(current).add(activeGroup));
    setMobileGroups((current) => new Set(current).add(activeGroup));
    setMobileMenuOpen(false);

    // PWA/mobile route transitions must never inherit a stale dialog scroll lock.
    const hasOpenModal = document.querySelector('[aria-modal="true"]');
    if (!hasOpenModal) {
      document.body.style.removeProperty("overflow");
      document.documentElement.style.removeProperty("overflow");
    }
  }, [activeGroup, location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const opener = mobileMenuButtonRef.current;
    document.body.style.overflow = "hidden";
    const firstFocusable = mobileDrawerRef.current?.querySelector<HTMLElement>("button, a[href]");
    firstFocusable?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(START_ROUTE_SESSION_KEY)) return;
      sessionStorage.setItem(START_ROUTE_SESSION_KEY, "true");
      if (location.pathname === "/" && settings.startRoute !== "/") navigate(settings.startRoute, { replace: true });
    } catch {
      // sessionStorage kapalıysa Dashboard normal şekilde açılır.
    }
  }, [location.pathname, navigate, settings.startRoute]);

  return (
    <div className="app">
      <InterfaceTranslationBridge />
      <a className="skip-link" href="#main-content">{t("nav.skip", "Ana içeriğe geç")}</a>
      <RouteAccessibility />
      <div className="aurora aurora-one" aria-hidden="true" />
      <div className="aurora aurora-two" aria-hidden="true" />

      <aside className="sidebar" aria-label={t("nav.sidebar", "Uygulama menüsü")}>
        <NavLink to="/" className="brand" aria-label={t("nav.home", "E4 D&D ana sayfa")}>
          <div className="brand-icon">E4</div>
          <div><strong>E4 D&D</strong><span>Everything for D&D</span></div>
        </NavLink>
        <nav className="side-nav" aria-label={t("nav.main", "Ana navigasyon")}>
          <NavigationGroups openGroups={desktopGroups} onToggle={(group) => toggleGroup(setDesktopGroups, group)} />
        </nav>
        <ReleaseNotesDialog />
      </aside>

      <main id="main-content" className="content" tabIndex={-1}>{children}</main>

      <CommandPalette characters={characters} campaigns={campaigns} rulesetData={rulesetData} />
      <StorageRecoveryCenter />
      <PwaUpdateManager />
      <PwaInstallGuide />

      <nav className="bottom-nav" aria-label={t("nav.mobile", "Mobil navigasyon")}>
        {mobileItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === "/"} className={({ isActive }) => isActive ? "bottom-item active" : "bottom-item"}>
            <span className="bottom-item-icon" aria-hidden="true">{item.icon}</span>
            <span>{t(`short.${item.to}`, item.shortLabel)}</span>
          </NavLink>
        ))}
        <button
          ref={mobileMenuButtonRef}
          type="button"
          className={mobileMenuOpen ? "bottom-item bottom-menu-trigger active" : "bottom-item bottom-menu-trigger"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation-drawer"
          onClick={() => setMobileMenuOpen(true)}
        >
          <span className="bottom-item-icon" aria-hidden="true">☰</span>
          <span>{t("nav.more", "Menü")}</span>
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="mobile-nav-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setMobileMenuOpen(false);
        }}>
          <div
            ref={mobileDrawerRef}
            id="mobile-navigation-drawer"
            className="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.all", "Tüm menü")}
          >
            <header className="mobile-nav-head">
              <div><strong>{t("nav.all", "Tüm menü")}</strong><span>{t("nav.choose", "Bir bölüm seç")}</span></div>
              <button type="button" className="mobile-nav-close" onClick={() => setMobileMenuOpen(false)} aria-label={t("nav.close", "Menüyü kapat")}>×</button>
            </header>
            <NavigationGroups
              compact
              openGroups={mobileGroups}
              onToggle={(group) => toggleGroup(setMobileGroups, group)}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
