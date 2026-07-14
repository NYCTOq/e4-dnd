import { useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { navGroups, navItems } from "../navigation/navItems";
import { StorageRecoveryCenter } from "../errors/StorageRecoveryCenter";
import { PwaUpdateManager } from "../pwa/PwaUpdateManager";
import { PwaInstallGuide } from "../pwa/PwaInstallGuide";
import { useAppSettings } from "../settings/AppSettingsProvider";
import { RouteAccessibility } from "../navigation/RouteAccessibility";

const START_ROUTE_SESSION_KEY = "e4_dnd_start_route_applied_v1";

export function AppFrame({ children }: { children: React.ReactNode }) {
  const mobileItems = navItems.filter((item) => item.mobile);
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useAppSettings();

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
      <a className="skip-link" href="#main-content">
        Ana içeriğe geç
      </a>
      <RouteAccessibility />

      <div className="aurora aurora-one" aria-hidden="true" />
      <div className="aurora aurora-two" aria-hidden="true" />

      <aside className="sidebar" aria-label="Uygulama menüsü">
        <NavLink to="/" className="brand" aria-label="E4 D&D ana sayfa">
          <div className="brand-icon">E4</div>

          <div>
            <strong>E4 D&D</strong>
            <span>Everything for D&D</span>
          </div>
        </NavLink>

        <nav className="side-nav" aria-label="Ana navigasyon">
          {navGroups.map((group) => (
            <div className="nav-group" key={group}>
              <span className="nav-group-label">{group}</span>

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
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <main id="main-content" className="content" tabIndex={-1}>
        {children}
      </main>

      <StorageRecoveryCenter />
      <PwaUpdateManager />
      <PwaInstallGuide />

      <nav className="bottom-nav" aria-label="Mobil navigasyon">
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
            <span>{item.shortLabel}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
