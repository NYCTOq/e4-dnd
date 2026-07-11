import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { PageShell } from "../../shared/layout/PageShell";

export function Dashboard() {
  return (
    <PageShell
      eyebrow="Everything for D&D"
      title="E4 D&D"
      description="Karakter oluşturma, homebrew yönetimi ve normal oyun akışı için PWA tabanlı yeni başlangıç."
    >
      <div className="hero-grid">
        <motion.div
          className="hero-card main-hero"
          whileHover={{ y: -6, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 240, damping: 20 }}
        >
          <div className="d20-orb">D20</div>

          <h2>Yeni kampanya başlıyor.</h2>

          <p>
            Bu proje sıfırdan kuruldu. Eski dosyalar rehber olacak ama bu app
            temiz mimariyle ilerleyecek. Nihayet klasörler birbirini yemeyecek,
            en azından bugün.
          </p>

          <div className="quick-actions">
            <NavLink to="/builder" className="primary-action">
              Karakter Oluştur
            </NavLink>

            <NavLink to="/characters" className="secondary-action">
              Karakterlere Git
            </NavLink>
          </div>
        </motion.div>

        <motion.div className="status-card" whileHover={{ y: -5 }}>
          <span>v0.1 hedefi</span>
          <strong>PWA Foundation</strong>
          <p>Dashboard, karakter listesi, builder, play mode ve zar sistemi.</p>
        </motion.div>

        <motion.div className="status-card" whileHover={{ y: -5 }}>
          <span>Yayın</span>
          <strong>Web + PWA</strong>
          <p>Store yok. Kullanıcı web’den açacak, ana ekrana ekleyecek.</p>
        </motion.div>

        <motion.div className="status-card" whileHover={{ y: -5 }}>
          <span>Maliyet</span>
          <strong>0 TL başlangıç</strong>
          <p>Cloudflare Pages veya GitHub Pages ile ücretsiz yayın.</p>
        </motion.div>
      </div>
    </PageShell>
  );
}
