import { Component, type ErrorInfo, type ReactNode } from "react";
import { downloadEmergencyStorageSnapshot } from "../../core/storage/safeStorage";

type Props = { children: ReactNode };
type State = { hasError: boolean; errorMessage: string };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : "Bilinmeyen uygulama hatası",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("E4 D&D render error", error, info);
  }

  private resetView = () => {
    this.setState({ hasError: false, errorMessage: "" });
    window.history.pushState({}, "", "/");
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="fatal-error-shell">
        <section className="fatal-error-card">
          <span className="eyebrow">Güvenli Mod</span>
          <h1>Bu ekran çöktü, verilerin değil.</h1>
          <p>
            Hata uygulamanın geri kalanına yayılmadan durduruldu. Yenilemeden önce
            localStorage verilerinin acil kopyasını indirebilirsin.
          </p>
          <code>{this.state.errorMessage}</code>
          <div className="fatal-error-actions">
            <button type="button" onClick={downloadEmergencyStorageSnapshot}>
              Acil veri kopyasını indir
            </button>
            <button type="button" className="primary-action" onClick={this.resetView}>
              Ana sayfada yeniden başlat
            </button>
          </div>
        </section>
      </main>
    );
  }
}
