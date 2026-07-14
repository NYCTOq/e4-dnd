import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Character } from "../../core/character/character.types";
import type { RulesetData } from "../../core/rulesets/ruleset.types";
import type { Campaign } from "../../features/campaigns/campaignTypes";
import { navItems } from "../navigation/navItems";

type CommandPaletteProps = {
  characters: Character[];
  campaigns: Campaign[];
  rulesetData: RulesetData | null;
};

type CommandItem = {
  id: string;
  label: string;
  subtitle: string;
  group: string;
  icon: string;
  keywords: string;
  to: string;
};

const MAX_RESULTS = 12;

function normalize(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function CommandPalette({
  characters,
  campaigns,
  rulesetData,
}: CommandPaletteProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const deferredQuery = useDeferredValue(query);

  const commands = useMemo<CommandItem[]>(() => {
    const pageCommands: CommandItem[] = navItems.map((item) => ({
      id: `page-${item.to}`,
      label: item.label,
      subtitle: `${item.group} sayfasÄ±na git`,
      group: "Sayfalar",
      icon: item.icon,
      keywords: `${item.label} ${item.shortLabel} ${item.group}`,
      to: item.to,
    }));

    const actionCommands: CommandItem[] = [
      {
        id: "action-global-search",
        label: "Global aramayÄ± aÃ§",
        subtitle: "TÃ¼m iÃ§eriklerde ayrÄ±ntÄ±lÄ± arama yap",
        group: "HÄ±zlÄ± Aksiyonlar",
        icon: "âŒ•",
        keywords: "global arama search tÃ¼m iÃ§erikler",
        to: "/search",
      },
      {
        id: "action-new-character",
        label: "Yeni karakter oluÅŸtur",
        subtitle: "Character Builder'Ä± aÃ§",
        group: "HÄ±zlÄ± Aksiyonlar",
        icon: "+",
        keywords: "yeni karakter oluÅŸtur builder",
        to: "/builder",
      },
      {
        id: "action-play",
        label: "Play Mode'u aÃ§",
        subtitle: "Masa kullanÄ±m ekranÄ±na git",
        group: "HÄ±zlÄ± Aksiyonlar",
        icon: "â–¶",
        keywords: "oyna play mode masa combat",
        to: "/play-mode",
      },
      {
        id: "action-dice",
        label: "Zar at",
        subtitle: "Dice Roller'Ä± aÃ§",
        group: "HÄ±zlÄ± Aksiyonlar",
        icon: "â—†",
        keywords: "zar dice roll at",
        to: "/dice",
      },
      {
        id: "action-backup",
        label: "Tam yedek al",
        subtitle: "Yedek ve kurtarma ekranÄ±na git",
        group: "HÄ±zlÄ± Aksiyonlar",
        icon: "â†¥",
        keywords: "backup yedek export dÄ±ÅŸa aktar",
        to: "/backup",
      },
    ];

    const characterCommands: CommandItem[] = characters.map((character) => ({
      id: `character-${character.id}`,
      label: character.name,
      subtitle: `${character.className || "SÄ±nÄ±fsÄ±z"} Â· Seviye ${character.level} Â· Karakter`,
      group: "Karakterler",
      icon: "â—ˆ",
      keywords: `${character.name} ${character.playerName} ${character.className} ${character.race} ${character.subclass}`,
      to: `/characters/${character.id}`,
    }));

    const campaignCommands: CommandItem[] = campaigns.map((campaign) => ({
      id: `campaign-${campaign.id}`,
      label: campaign.name,
      subtitle: `${campaign.characterIds.length} karakter Â· ${campaign.quests.filter((quest) => quest.status === "active").length} aktif quest`,
      group: "Campaigns",
      icon: "âœ¦",
      keywords: `${campaign.name} ${campaign.description} campaign quest encounter`,
      to: `/campaigns?campaign=${campaign.id}`,
    }));

    const spellCommands: CommandItem[] = (rulesetData?.spells ?? []).map((spell) => ({
      id: `spell-${spell.id}`,
      label: spell.name,
      subtitle: `${spell.level === 0 ? "Cantrip" : `${spell.level}. seviye`} Â· ${spell.school}`,
      group: "BÃ¼yÃ¼ler",
      icon: "âœ§",
      keywords: `${spell.name} ${spell.school} ${spell.classes.join(" ")} spell bÃ¼yÃ¼`,
      to: `/spellbook?search=${encodeURIComponent(spell.name)}`,
    }));

    const monsterCommands: CommandItem[] = (rulesetData?.monsters ?? []).map((monster) => ({
      id: `monster-${monster.id}`,
      label: monster.name,
      subtitle: `CR ${monster.challengeRating} Â· ${monster.type}`,
      group: "Canavarlar",
      icon: "â™œ",
      keywords: `${monster.name} ${monster.type} ${monster.size} ${monster.challengeRating} monster canavar`,
      to: `/monsters/${monster.id}`,
    }));

    return [
      ...actionCommands,
      ...pageCommands,
      ...characterCommands,
      ...campaignCommands,
      ...spellCommands,
      ...monsterCommands,
    ];
  }, [campaigns, characters, rulesetData]);

  const filteredCommands = useMemo(() => {
    const normalizedQuery = normalize(deferredQuery.trim());

    if (!normalizedQuery) {
      return commands
        .filter((command) => command.group === "HÄ±zlÄ± Aksiyonlar" || command.group === "Sayfalar")
        .slice(0, MAX_RESULTS);
    }

    return commands
      .map((command) => {
        const haystack = normalize(`${command.label} ${command.subtitle} ${command.keywords} ${command.group}`);
        const label = normalize(command.label);
        let score = 0;

        if (label === normalizedQuery) score += 100;
        if (label.startsWith(normalizedQuery)) score += 60;
        if (label.includes(normalizedQuery)) score += 35;
        if (haystack.includes(normalizedQuery)) score += 15;

        const words = normalizedQuery.split(/\s+/).filter(Boolean);
        score += words.filter((word) => haystack.includes(word)).length * 8;

        return { command, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.command.label.localeCompare(b.command.label, "tr"))
      .slice(0, MAX_RESULTS)
      .map((entry) => entry.command);
  }, [commands, deferredQuery]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((current) => !current);
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setQuery("");
    setActiveIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function closePalette() {
    setIsOpen(false);
    setQuery("");
    setActiveIndex(0);
  }

  function runCommand(command: CommandItem) {
    closePalette();
    navigate(command.to);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closePalette();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        filteredCommands.length ? (current + 1) % filteredCommands.length : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        filteredCommands.length
          ? (current - 1 + filteredCommands.length) % filteredCommands.length
          : 0,
      );
      return;
    }

    if (event.key === "Enter" && filteredCommands[activeIndex]) {
      event.preventDefault();
      runCommand(filteredCommands[activeIndex]);
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        className="command-palette-trigger"
        onClick={() => setIsOpen(true)}
        aria-label="HÄ±zlÄ± komut menÃ¼sÃ¼nÃ¼ aÃ§"
        title="HÄ±zlÄ± komutlar (Ctrl + K)"
      >
        <span aria-hidden="true">âŒ˜</span>
        <span>HÄ±zlÄ± Git</span>
        <kbd>Ctrl K</kbd>
      </button>
    );
  }

  return (
    <div
      className="command-palette-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closePalette();
      }}
    >
      <section
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="HÄ±zlÄ± komut menÃ¼sÃ¼"
      >
        <div className="command-palette-search">
          <span aria-hidden="true">âŒ•</span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Sayfa, karakter, campaign, bÃ¼yÃ¼ veya canavar ara..."
            aria-label="Komut ara"
            aria-controls="command-palette-results"
            aria-activedescendant={filteredCommands[activeIndex]?.id}
          />
          <kbd>Esc</kbd>
        </div>

        <div className="command-palette-results" id="command-palette-results" role="listbox">
          {filteredCommands.length ? (
            filteredCommands.map((command, index) => (
              <button
                type="button"
                id={command.id}
                role="option"
                aria-selected={index === activeIndex}
                className={index === activeIndex ? "command-result active" : "command-result"}
                key={command.id}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => runCommand(command)}
              >
                <span className="command-result-icon" aria-hidden="true">{command.icon}</span>
                <span className="command-result-copy">
                  <strong>{command.label}</strong>
                  <small>{command.subtitle}</small>
                </span>
                <span className="command-result-group">{command.group}</span>
              </button>
            ))
          ) : (
            <div className="command-palette-empty">
              <strong>SonuÃ§ bulunamadÄ±.</strong>
              <span>AramayÄ± biraz sadeleÅŸtir. Bazen bÃ¼yÃ¼ adlarÄ± bile insanlardan daha karmaÅŸÄ±k.</span>
            </div>
          )}
        </div>

        <footer className="command-palette-footer">
          <span><kbd>â†‘</kbd><kbd>â†“</kbd> gezin</span>
          <span><kbd>Enter</kbd> aÃ§</span>
          <span><kbd>Esc</kbd> kapat</span>
        </footer>
      </section>
    </div>
  );
}

