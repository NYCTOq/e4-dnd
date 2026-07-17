import { useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { navGroups, navItems } from "../navigation/navItems";
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

export function AppFrame({ children, characters, campaigns, rulesetData }: AppFrameProps) {
  const mobileItems = navItems.filter((item) => item.mobile);
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const { t } = useI18n();

  useEffect(() => {
    try {
      if (sessionStorage.getItem(START_ROUTE_SESSION_KEY)) {
        return;
      }

      sessionStorage.setItem(START_ROUTE_SESSION_KEY, "true");

      if (location.pathname === "/" && settings.startRoute !== "/") {
        navigate(settings.startRoute, { replace: true });
      }
    } catch {
      // sessionStorage kapalıysa Dashboard normal şekilde açılır.
    }
  }, [location.pathname, navigate, settings.startRoute]);

  return (
    <div className="app">
      <InterfaceTranslationBridge />
      <a className="skip-link" href="#main-content">
        {t("nav.skip","Ana içeriğe geç")}
      </a>
      <RouteAccessibility />

      <div className="aurora aurora-one" aria-hidden="true" />
      <div className="aurora aurora-two" aria-hidden="true" />

      <aside className="sidebar" aria-label={t("nav.sidebar","Uygulama menüsü")}>
        <NavLink to="/" className="brand" aria-label={t("nav.home","E4 D&D ana sayfa")}>
          <div className="brand-icon">E4</div>

          <div>
            <strong>E4 D&D</strong>
            <span>Everything for D&D</span>
          </div>
        </NavLink>

        <nav className="side-nav" aria-label={t("nav.main","Ana navigasyon")}>
          {navGroups.map((group) => (
            <div className="nav-group" key={group}>
              <span className="nav-group-label">{t(`nav.group.${group}`,group)}</span>

              <div className="nav-group-items">
                {navItems
                  .filter((item) => item.group === group)
                  .map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      className={({ isActive }) =>
                        isActive ? "nav-item active" : "nav-item"
                      }
                    >
                      <span className="nav-item-icon" aria-hidden="true">
                        {item.icon}
                      </span>
                      <span>{t(`nav.${item.to}`,item.label)}</span>
                    </NavLink>
                  ))}
              </div>
            </div>
          ))}
        </nav>

        <ReleaseNotesDialog />
      </aside>

      <main id="main-content" className="content" tabIndex={-1}>
        {children}
      </main>

      <CommandPalette
        characters={characters}
        campaigns={campaigns}
        rulesetData={rulesetData}
      />

      <StorageRecoveryCenter />
      <PwaUpdateManager />
      <PwaInstallGuide />

      <nav className="bottom-nav" aria-label={t("nav.mobile","Mobil navigasyon")}>
        {mobileItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              isActive ? "bottom-item active" : "bottom-item"
            }
          >
            <span className="bottom-item-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{t(`short.${item.to}`,item.shortLabel)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
