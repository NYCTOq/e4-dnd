import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageShell } from "../../shared/layout/PageShell";

type HelpCategory = "BaÅŸlangÄ±Ã§" | "Oyuncu" | "DM" | "Veri" | "PWA";

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
    category: "BaÅŸlangÄ±Ã§",
    title: "Ä°lk karakterini oluÅŸtur",
    summary: "Builder ile temel bilgileri gir, karakteri kaydet ve detay ekranÄ±na geÃ§.",
    steps: [
      "Character Builder ekranÄ±nÄ± aÃ§.",
      "Ä°sim, class, race, level ve ability deÄŸerlerini doldur.",
      "Review adÄ±mÄ±nda Ã¶zeti kontrol edip karakteri oluÅŸtur.",
      "Karakter detayÄ±ndan spell, inventory ve equipment bilgilerini tamamla.",
    ],
    links: [
      { label: "Builder'Ä± aÃ§", to: "/builder" },
      { label: "Karakterlere git", to: "/characters" },
    ],
    keywords: "karakter builder oluÅŸtur class race ability baÅŸlangÄ±Ã§",
  },
  {
    id: "play-mode",
    category: "Oyuncu",
    title: "Masada Play Mode kullan",
    summary: "HP, condition, spell slot, kÄ±sa dinlenme ve hÄ±zlÄ± zarlarÄ± sade ekrandan yÃ¶net.",
    steps: [
      "Play Mode ekranÄ±nda aktif karakteri seÃ§.",
      "Hasar ve iyileÅŸtirme butonlarÄ±yla HP'yi gÃ¼ncelle.",
      "Condition ve concentration durumlarÄ±nÄ± gerektiÄŸinde aÃ§ veya kapat.",
      "HazÄ±r bÃ¼yÃ¼leri cast ederek slot kullanÄ±mÄ±nÄ± otomatik takip et.",
    ],
    links: [{ label: "Play Mode'u aÃ§", to: "/play-mode" }],
    keywords: "play mode hp condition concentration spell slot combat oyuncu",
  },
  {
    id: "campaign-start",
    category: "DM",
    title: "Campaign kur ve parti ekle",
    summary: "HazÄ±r ÅŸablon seÃ§, karakterleri baÄŸla ve quest ile session notlarÄ±nÄ± toplamaya baÅŸla.",
    steps: [
      "Campaigns ekranÄ±ndan yeni campaign oluÅŸtur.",
      "Sade, klasik, story-heavy veya encounter-heavy ÅŸablon seÃ§.",
      "Party bÃ¶lÃ¼mÃ¼nden kayÄ±tlÄ± karakterleri campaign'e baÄŸla.",
      "Quest, NPC ve session notlarÄ±nÄ± ihtiyaÃ§ oldukÃ§a ekle.",
    ],
    links: [{ label: "Campaigns'i aÃ§", to: "/campaigns" }],
    keywords: "campaign dm party quest npc template ÅŸablon",
  },
  {
    id: "encounter-tools",
    category: "DM",
    title: "Encounter araÃ§larÄ±nÄ± isteÄŸe gÃ¶re aÃ§",
    summary: "Temel initiative ve HP takibi sabit kalÄ±r; geliÅŸmiÅŸ DM araÃ§larÄ± campaign bazÄ±nda isteÄŸe baÄŸlÄ±dÄ±r.",
    steps: [
      "Campaign iÃ§inde encounter oluÅŸtur ve participant ekle.",
      "DM AraÃ§larÄ± bÃ¶lÃ¼mÃ¼nden gerekli modÃ¼lleri etkinleÅŸtir.",
      "Difficulty, rolls, conditions ve loot araÃ§larÄ±nÄ± ayrÄ± ayrÄ± aÃ§abilirsin.",
      "Sade Mod ile ekstra araÃ§larÄ±n tamamÄ±nÄ± tek tuÅŸla kapatabilirsin.",
    ],
    links: [{ label: "Encounter yÃ¶netimine git", to: "/campaigns" }],
    keywords: "encounter initiative difficulty loot condition combat rolls dm tools sade",
  },
  {
    id: "homebrew",
    category: "DM",
    title: "Homebrew iÃ§erik oluÅŸtur",
    summary: "Custom spell, item ve monster Ã¼ret; bunlarÄ± normal library verileriyle birlikte kullan.",
    steps: [
      "Homebrew Lab iÃ§inde iÃ§erik tÃ¼rÃ¼nÃ¼ seÃ§.",
      "Gerekli alanlarÄ± doldur; taslak otomatik kaydedilir.",
      "KaydettiÄŸin iÃ§erik ilgili Spellbook, Inventory veya Monster Library ekranÄ±na dÃ¼ÅŸer.",
      "Custom monster'larÄ± campaign encounter'larÄ±na da ekleyebilirsin.",
    ],
    links: [{ label: "Homebrew Lab'i aÃ§", to: "/homebrew-lab" }],
    keywords: "homebrew custom spell item monster npc iÃ§erik",
  },
  {
    id: "backup",
    category: "Veri",
    title: "Tam yedek al ve gÃ¼venli geri yÃ¼kle",
    summary: "Karakter, campaign, homebrew, favoriler ve ayarlarÄ± tek JSON dosyasÄ±nda koru.",
    steps: [
      "Yedek & Kurtarma ekranÄ±ndan tam yedeÄŸi indir.",
      "DosyayÄ± cihaz dÄ±ÅŸÄ±nda da sakla.",
      "Geri yÃ¼klerken Ã¶nce Ã¶nizlemeyi kontrol et.",
      "BirleÅŸtir veya Ã¼zerine yaz modunu ve veri tÃ¼rlerini bilinÃ§li seÃ§.",
    ],
    links: [{ label: "Yedek ekranÄ±nÄ± aÃ§", to: "/backup" }],
    keywords: "backup yedek import export restore geri yÃ¼kle json veri",
  },
  {
    id: "local-data",
    category: "Veri",
    title: "Yerel kayÄ±t mantÄ±ÄŸÄ±nÄ± anla",
    summary: "Veriler tarayÄ±cÄ± localStorage alanÄ±nda tutulur; farklÄ± tarayÄ±cÄ±, profil veya port ayrÄ± kayÄ±t alanÄ± kullanabilir.",
    steps: [
      "GeliÅŸtirmede her zaman 5173 portunu kullan.",
      "TarayÄ±cÄ± verilerini temizlemeden Ã¶nce tam yedek al.",
      "BaÅŸka cihaza geÃ§erken JSON yedeÄŸini iÃ§e aktar.",
      "Bozuk kayÄ±t algÄ±lanÄ±rsa Kurtarma Merkezi'ndeki karantina dosyasÄ±nÄ± indir.",
    ],
    links: [
      { label: "Yedek & Kurtarma", to: "/backup" },
      { label: "Ayarlar", to: "/settings" },
    ],
    keywords: "localstorage port browser tarayÄ±cÄ± veri kayÄ±p kurtarma",
  },
  {
    id: "install-pwa",
    category: "PWA",
    title: "UygulamayÄ± bilgisayara veya telefona kur",
    summary: "E4 D&D'yi tarayÄ±cÄ± sekmesi yerine baÄŸÄ±msÄ±z uygulama gibi kullan.",
    steps: [
      "Kurulum rehberini veya tarayÄ±cÄ±daki yÃ¼kleme simgesini aÃ§.",
      "Windows/Android'de UygulamayÄ± yÃ¼kle seÃ§eneÄŸini kullan.",
      "iPhone/iPad'de Safari PaylaÅŸ menÃ¼sÃ¼nden Ana Ekrana Ekle seÃ§.",
      "Yeni sÃ¼rÃ¼m geldiÄŸinde uygulama iÃ§indeki gÃ¼ncelleme bildirimini onayla.",
    ],
    links: [{ label: "Dashboard'a dÃ¶n", to: "/" }],
    keywords: "pwa install yÃ¼kle windows android iphone ios offline Ã§evrimdÄ±ÅŸÄ±",
  },
  {
    id: "shortcuts",
    category: "BaÅŸlangÄ±Ã§",
    title: "HÄ±zlÄ± eriÅŸim ve klavye kÄ±sayollarÄ±",
    summary: "MenÃ¼ler arasÄ±nda dolaÅŸmadan sayfa, karakter, campaign, spell veya monster bul.",
    steps: [
      "Ctrl + K veya macOS'ta Cmd + K ile komut paletini aÃ§.",
      "Arama yazÄ±p ok tuÅŸlarÄ±yla sonuÃ§larda gezin.",
      "Enter ile seÃ§ili sonucu aÃ§, Escape ile paleti kapat.",
      "Klavye kullanÄ±rken Ana iÃ§eriÄŸe geÃ§ baÄŸlantÄ±sÄ± ve gÃ¶rÃ¼nÃ¼r odak halkalarÄ±ndan yararlan.",
    ],
    keywords: "ctrl k command palette kÄ±sayol keyboard klavye eriÅŸilebilirlik",
  },
] as const;

const CATEGORIES: readonly HelpCategory[] = ["BaÅŸlangÄ±Ã§", "Oyuncu", "DM", "Veri", "PWA"];
const CHECKLIST_KEY = "e4_dnd_onboarding_checklist_v1";

const QUICK_START_ITEMS = [
  { id: "character", label: "Ä°lk karakterimi oluÅŸturdum", to: "/builder" },
  { id: "play", label: "Play Mode'u denedim", to: "/play-mode" },
  { id: "campaign", label: "Bir campaign oluÅŸturdum", to: "/campaigns" },
  { id: "backup", label: "Tam yedek aldÄ±m", to: "/backup" },
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
  const [category, setCategory] = useState<HelpCategory | "TÃ¼mÃ¼">("TÃ¼mÃ¼");
  const [completed, setCompleted] = useState<string[]>(loadChecklist);

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");

    return HELP_ARTICLES.filter((article) => {
      const matchesCategory = category === "TÃ¼mÃ¼" || article.category === category;
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
        // localStorage kapalÄ±ysa checklist yalnÄ±zca mevcut oturumda Ã§alÄ±ÅŸÄ±r.
      }
      return next;
    });
  }

  return (
    <PageShell
      eyebrow="YardÄ±m"
      title="YardÄ±m Merkezi"
      description="E4 D&D'nin temel akÄ±ÅŸlarÄ±nÄ± kÄ±sa rehberlerle Ã¶ÄŸren. Her dÃ¼ÄŸmenin kutsal metnini okumaya gerek yok; iÅŸe yarayan kÄ±smÄ± burada."
    >
      <section className="help-quick-start" aria-labelledby="quick-start-title">
        <div className="help-section-heading">
          <div>
            <span className="mini-label">HÄ±zlÄ± baÅŸlangÄ±Ã§</span>
            <h2 id="quick-start-title">Ä°lk kurulum kontrolÃ¼</h2>
            <p>Bu liste zorunlu deÄŸil. Uygulama bÃ¼rokrasi Ã¼retmesin diye sadece yol gÃ¶steriyor.</p>
          </div>
          <div className="help-progress" aria-label={`Tamamlanma yÃ¼zde ${progress}`}>
            <strong>%{progress}</strong>
            <span>{completed.length}/{QUICK_START_ITEMS.length} tamamlandÄ±</span>
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
                <Link to={item.to}>AÃ§</Link>
              </div>
            );
          })}
        </div>
      </section>

      <section className="help-search-panel" aria-label="YardÄ±m arama ve filtreleri">
        <label>
          YardÄ±mda ara
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
            placeholder="Ã–rn. yedek, encounter, spell slot..."
          />
        </label>

        <div className="help-category-filter" role="group" aria-label="YardÄ±m kategorisi">
          {["TÃ¼mÃ¼", ...CATEGORIES].map((item) => (
            <button
              type="button"
              key={item}
              className={category === item ? "active" : ""}
              onClick={() => setCategory(item as HelpCategory | "TÃ¼mÃ¼")}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="help-article-grid" aria-label="YardÄ±m makaleleri">
        {filteredArticles.length ? filteredArticles.map((article) => (
          <article className="help-article-card" key={article.id}>
            <header>
              <span className="help-category-badge">{article.category}</span>
              <h2>{article.title}</h2>
              <p>{article.summary}</p>
            </header>

            <details>
              <summary>AdÄ±mlarÄ± gÃ¶ster</summary>
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
          <div className="empty-panel">Bu arama ve filtrelerle eÅŸleÅŸen yardÄ±m kaydÄ± yok.</div>
        )}
      </section>

      <section className="help-emergency-card">
        <div>
          <span className="mini-label">Bir ÅŸey ters giderse</span>
          <h2>Ã–nce veriyi koru, sonra dÃ¼ÄŸmelere saldÄ±r</h2>
          <p>Uygulama aÃ§Ä±lÄ±yorsa tam yedek al. Veri bozukluÄŸu bildirimi varsa Kurtarma Merkezi'nden karantina dosyasÄ±nÄ± indir.</p>
        </div>
        <div className="help-article-actions">
          <Link className="primary-action" to="/backup">Yedek & Kurtarma</Link>
          <Link className="secondary-action" to="/updates">SÃ¼rÃ¼m geÃ§miÅŸi</Link>
        </div>
      </section>
    </PageShell>
  );
}

