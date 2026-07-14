import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageShell } from "../../shared/layout/PageShell";

type HelpCategory = "Başlangıç" | "Oyuncu" | "DM" | "Veri" | "PWA";

type HelpArticle = {
  id: string;
  category: HelpCategory;
  title: string;
  summary: string;
  steps: string[];
  links?: Array<{ label: string; to: string }>;
  keywords: string;
};

const HELP_ARTICLES: readonly HelpArticle[] = [
  {
    id: "first-character",
    category: "Başlangıç",
    title: "İlk karakterini oluştur",
    summary: "Builder ile temel bilgileri gir, karakteri kaydet ve detay ekranına geç.",
    steps: [
      "Character Builder ekranını aç.",
      "İsim, class, race, level ve ability değerlerini doldur.",
      "Review adımında özeti kontrol edip karakteri oluştur.",
      "Karakter detayından spell, inventory ve equipment bilgilerini tamamla.",
    ],
    links: [
      { label: "Builder'ı aç", to: "/builder" },
      { label: "Karakterlere git", to: "/characters" },
    ],
    keywords: "karakter builder oluştur class race ability başlangıç",
  },
  {
    id: "play-mode",
    category: "Oyuncu",
    title: "Masada Play Mode kullan",
    summary: "HP, condition, spell slot, kısa dinlenme ve hızlı zarları sade ekrandan yönet.",
    steps: [
      "Play Mode ekranında aktif karakteri seç.",
      "Hasar ve iyileştirme butonlarıyla HP'yi güncelle.",
      "Condition ve concentration durumlarını gerektiğinde aç veya kapat.",
      "Hazır büyüleri cast ederek slot kullanımını otomatik takip et.",
    ],
    links: [{ label: "Play Mode'u aç", to: "/play-mode" }],
    keywords: "play mode hp condition concentration spell slot combat oyuncu",
  },
  {
    id: "campaign-start",
    category: "DM",
    title: "Campaign kur ve parti ekle",
    summary: "Hazır şablon seç, karakterleri bağla ve quest ile session notlarını toplamaya başla.",
    steps: [
      "Campaigns ekranından yeni campaign oluştur.",
      "Sade, klasik, story-heavy veya encounter-heavy şablon seç.",
      "Party bölümünden kayıtlı karakterleri campaign'e bağla.",
      "Quest, NPC ve session notlarını ihtiyaç oldukça ekle.",
    ],
    links: [{ label: "Campaigns'i aç", to: "/campaigns" }],
    keywords: "campaign dm party quest npc template şablon",
  },
  {
    id: "encounter-tools",
    category: "DM",
    title: "Encounter araçlarını isteğe göre aç",
    summary: "Temel initiative ve HP takibi sabit kalır; gelişmiş DM araçları campaign bazında isteğe bağlıdır.",
    steps: [
      "Campaign içinde encounter oluştur ve participant ekle.",
      "DM Araçları bölümünden gerekli modülleri etkinleştir.",
      "Difficulty, rolls, conditions ve loot araçlarını ayrı ayrı açabilirsin.",
      "Sade Mod ile ekstra araçların tamamını tek tuşla kapatabilirsin.",
    ],
    links: [{ label: "Encounter yönetimine git", to: "/campaigns" }],
    keywords: "encounter initiative difficulty loot condition combat rolls dm tools sade",
  },
  {
    id: "homebrew",
    category: "DM",
    title: "Homebrew içerik oluştur",
    summary: "Custom spell, item ve monster üret; bunları normal library verileriyle birlikte kullan.",
    steps: [
      "Homebrew Lab içinde içerik türünü seç.",
      "Gerekli alanları doldur; taslak otomatik kaydedilir.",
      "Kaydettiğin içerik ilgili Spellbook, Inventory veya Monster Library ekranına düşer.",
      "Custom monster'ları campaign encounter'larına da ekleyebilirsin.",
    ],
    links: [{ label: "Homebrew Lab'i aç", to: "/homebrew-lab" }],
    keywords: "homebrew custom spell item monster npc içerik",
  },
  {
    id: "backup",
    category: "Veri",
    title: "Tam yedek al ve güvenli geri yükle",
    summary: "Karakter, campaign, homebrew, favoriler ve ayarları tek JSON dosyasında koru.",
    steps: [
      "Yedek & Kurtarma ekranından tam yedeği indir.",
      "Dosyayı cihaz dışında da sakla.",
      "Geri yüklerken önce önizlemeyi kontrol et.",
      "Birleştir veya üzerine yaz modunu ve veri türlerini bilinçli seç.",
    ],
    links: [{ label: "Yedek ekranını aç", to: "/backup" }],
    keywords: "backup yedek import export restore geri yükle json veri",
  },
  {
    id: "local-data",
    category: "Veri",
    title: "Yerel kayıt mantığını anla",
    summary: "Veriler tarayıcı localStorage alanında tutulur; farklı tarayıcı, profil veya port ayrı kayıt alanı kullanabilir.",
    steps: [
      "Geliştirmede her zaman 5173 portunu kullan.",
      "Tarayıcı verilerini temizlemeden önce tam yedek al.",
      "Başka cihaza geçerken JSON yedeğini içe aktar.",
      "Bozuk kayıt algılanırsa Kurtarma Merkezi'ndeki karantina dosyasını indir.",
    ],
    links: [
      { label: "Yedek & Kurtarma", to: "/backup" },
      { label: "Ayarlar", to: "/settings" },
    ],
    keywords: "localstorage port browser tarayıcı veri kayıp kurtarma",
  },
  {
    id: "install-pwa",
    category: "PWA",
    title: "Uygulamayı bilgisayara veya telefona kur",
    summary: "E4 D&D'yi tarayıcı sekmesi yerine bağımsız uygulama gibi kullan.",
    steps: [
      "Kurulum rehberini veya tarayıcıdaki yükleme simgesini aç.",
      "Windows/Android'de Uygulamayı yükle seçeneğini kullan.",
      "iPhone/iPad'de Safari Paylaş menüsünden Ana Ekrana Ekle seç.",
      "Yeni sürüm geldiğinde uygulama içindeki güncelleme bildirimini onayla.",
    ],
    links: [{ label: "Dashboard'a dön", to: "/" }],
    keywords: "pwa install yükle windows android iphone ios offline çevrimdışı",
  },
  {
    id: "shortcuts",
    category: "Başlangıç",
    title: "Hızlı erişim ve klavye kısayolları",
    summary: "Menüler arasında dolaşmadan sayfa, karakter, campaign, spell veya monster bul.",
    steps: [
      "Ctrl + K veya macOS'ta Cmd + K ile komut paletini aç.",
      "Arama yazıp ok tuşlarıyla sonuçlarda gezin.",
      "Enter ile seçili sonucu aç, Escape ile paleti kapat.",
      "Klavye kullanırken Ana içeriğe geç bağlantısı ve görünür odak halkalarından yararlan.",
    ],
    keywords: "ctrl k command palette kısayol keyboard klavye erişilebilirlik",
  },
] as const;

const CATEGORIES: readonly HelpCategory[] = ["Başlangıç", "Oyuncu", "DM", "Veri", "PWA"];
const CHECKLIST_KEY = "e4_dnd_onboarding_checklist_v1";

const QUICK_START_ITEMS = [
  { id: "character", label: "İlk karakterimi oluşturdum", to: "/builder" },
  { id: "play", label: "Play Mode'u denedim", to: "/play-mode" },
  { id: "campaign", label: "Bir campaign oluşturdum", to: "/campaigns" },
  { id: "backup", label: "Tam yedek aldım", to: "/backup" },
] as const;

function loadChecklist() {
  try {
    const value = localStorage.getItem(CHECKLIST_KEY);
    if (!value) return [] as string[];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [] as string[];
  }
}

export function HelpCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("search") ?? "");
  const [category, setCategory] = useState<HelpCategory | "Tümü">("Tümü");
  const [completed, setCompleted] = useState<string[]>(loadChecklist);

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");

    return HELP_ARTICLES.filter((article) => {
      const matchesCategory = category === "Tümü" || article.category === category;
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;

      const haystack = `${article.title} ${article.summary} ${article.keywords} ${article.steps.join(" ")}`
        .toLocaleLowerCase("tr-TR");
      return haystack.includes(normalizedQuery);
    });
  }, [category, query]);

  const progress = Math.round((completed.length / QUICK_START_ITEMS.length) * 100);

  function toggleChecklist(id: string) {
    setCompleted((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      try {
        localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
      } catch {
        // localStorage kapalıysa checklist yalnızca mevcut oturumda çalışır.
      }
      return next;
    });
  }

  return (
    <PageShell
      eyebrow="Yardım"
      title="Yardım Merkezi"
      description="E4 D&D'nin temel akışlarını kısa rehberlerle öğren. Her düğmenin kutsal metnini okumaya gerek yok; işe yarayan kısmı burada."
    >
      <section className="help-quick-start" aria-labelledby="quick-start-title">
        <div className="help-section-heading">
          <div>
            <span className="mini-label">Hızlı başlangıç</span>
            <h2 id="quick-start-title">İlk kurulum kontrolü</h2>
            <p>Bu liste zorunlu değil. Uygulama bürokrasi üretmesin diye sadece yol gösteriyor.</p>
          </div>
          <div className="help-progress" aria-label={`Tamamlanma yüzde ${progress}`}>
            <strong>%{progress}</strong>
            <span>{completed.length}/{QUICK_START_ITEMS.length} tamamlandı</span>
          </div>
        </div>

        <div className="help-checklist">
          {QUICK_START_ITEMS.map((item) => {
            const isDone = completed.includes(item.id);
            return (
              <div className={isDone ? "help-check-item completed" : "help-check-item"} key={item.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => toggleChecklist(item.id)}
                  />
                  <span>{item.label}</span>
                </label>
                <Link to={item.to}>Aç</Link>
              </div>
            );
          })}
        </div>
      </section>

      <section className="help-search-panel" aria-label="Yardım arama ve filtreleri">
        <label>
          Yardımda ara
          <input
            type="search"
            value={query}
            onChange={(event) => {
                  const nextQuery = event.target.value;
                  setQuery(nextQuery);
                  const nextParams = new URLSearchParams(searchParams);
                  if (nextQuery) nextParams.set("search", nextQuery);
                  else nextParams.delete("search");
                  setSearchParams(nextParams, { replace: true });
                }}
            placeholder="Örn. yedek, encounter, spell slot..."
          />
        </label>

        <div className="help-category-filter" role="group" aria-label="Yardım kategorisi">
          {["Tümü", ...CATEGORIES].map((item) => (
            <button
              type="button"
              key={item}
              className={category === item ? "active" : ""}
              onClick={() => setCategory(item as HelpCategory | "Tümü")}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="help-article-grid" aria-label="Yardım makaleleri">
        {filteredArticles.length ? filteredArticles.map((article) => (
          <article className="help-article-card" key={article.id}>
            <header>
              <span className="help-category-badge">{article.category}</span>
              <h2>{article.title}</h2>
              <p>{article.summary}</p>
            </header>

            <details>
              <summary>Adımları göster</summary>
              <ol>
                {article.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </details>

            {article.links?.length ? (
              <div className="help-article-actions">
                {article.links.map((link) => (
                  <Link className="secondary-action" to={link.to} key={link.to}>
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </article>
        )) : (
          <div className="empty-panel">Bu arama ve filtrelerle eşleşen yardım kaydı yok.</div>
        )}
      </section>

      <section className="help-emergency-card">
        <div>
          <span className="mini-label">Bir şey ters giderse</span>
          <h2>Önce veriyi koru, sonra düğmelere saldır</h2>
          <p>Uygulama açılıyorsa tam yedek al. Veri bozukluğu bildirimi varsa Kurtarma Merkezi'nden karantina dosyasını indir.</p>
        </div>
        <div className="help-article-actions">
          <Link className="primary-action" to="/backup">Yedek & Kurtarma</Link>
          <Link className="secondary-action" to="/updates">Sürüm geçmişi</Link>
        </div>
      </section>
    </PageShell>
  );
}
