import { useEffect, useMemo, useState } from "react";
import type {
  DndItemData,
  DndMonsterData,
  DndSpellData,
  RulesetData,
} from "../../core/rulesets/ruleset.types";
import { loadRuleset } from "../../core/rulesets/rulesetLoader";
import type {
  Character,
  CharacterDraft,
} from "../../core/character/character.types";
import {
  loadCharacters,
  saveCharacters,
} from "../../core/storage/characterStorage";
import "../../App.css";
import { createCharacterFromDraft } from "../characters/characterShared";
import type { Campaign } from "../campaigns/campaignTypes";
import {
  getCampaignTemplate,
  type CampaignTemplateId,
} from "../campaigns/campaignTemplates";
import { loadCampaigns, saveCampaigns } from "../campaigns/campaignStorage";
import {
  loadHomebrewItems,
  loadHomebrewMonsters,
  loadHomebrewSpells,
  saveHomebrewItems,
  saveHomebrewMonsters,
  saveHomebrewSpells,
  loadHomebrewPackages,
  HOMEBREW_PACKAGES_CHANGED_EVENT,
} from "../homebrew/homebrewStorage";
import { AppFrame } from "../../shared/layout/AppFrame";
import { AppRoutes } from "./AppRoutes";
import type { BackupImportOptions, FullBackupData } from "../backup/fullBackup";
import { mergeRecordsById, mergeUniqueStrings } from "../backup/backupImport";
import { loadFavoriteMonsterIds, saveFavoriteMonsterIds } from "../monsters/monsterUtils";
import { useAppSettings } from "../../shared/settings/AppSettingsProvider";
import { useDebouncedEffect } from "../../shared/state/useDebouncedEffect";
import type { HomebrewPackage } from "../../core/homebrew/homebrewFoundation";
import { mergeHomebrewIntoRuleset } from "../../core/homebrew/homebrewBuilderIntegration";

function App() {
  const { settings, updateSettings, resetSettings } = useAppSettings();
  const [characters, setCharacters] = useState<Character[]>(() =>
    loadCharacters(),
  );

  const [rulesetData, setRulesetData] = useState<RulesetData | null>(null);
  const [isRulesetLoading, setIsRulesetLoading] = useState(true);
  const [rulesetError, setRulesetError] = useState<string | null>(null);

  const [homebrewSpells, setHomebrewSpells] = useState<DndSpellData[]>(() =>
    loadHomebrewSpells(),
  );
  const [homebrewItems, setHomebrewItems] = useState<DndItemData[]>(() =>
    loadHomebrewItems(),
  );
  const [homebrewMonsters, setHomebrewMonsters] = useState<DndMonsterData[]>(
    () => loadHomebrewMonsters(),
  );
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => loadCampaigns());
  const [homebrewPackages, setHomebrewPackages] = useState<HomebrewPackage[]>(() => loadHomebrewPackages());

  const effectiveRulesetData = useMemo<RulesetData | null>(() => {
    if (!rulesetData) {
      return null;
    }

    const withPackages = mergeHomebrewIntoRuleset(rulesetData, homebrewPackages);
    if (!withPackages) return null;
    return {
      ...withPackages,
      spells: [...withPackages.spells, ...homebrewSpells.filter((spell) => !withPackages.spells.some((item) => item.id === spell.id))],
      items: [...withPackages.items, ...homebrewItems.filter((item) => !withPackages.items.some((existing) => existing.id === item.id))],
      monsters: [...withPackages.monsters, ...homebrewMonsters],
    };
  }, [rulesetData, homebrewPackages, homebrewSpells, homebrewItems, homebrewMonsters]);


  useEffect(() => {
    const refreshHomebrewPackages = () => setHomebrewPackages(loadHomebrewPackages());
    window.addEventListener(HOMEBREW_PACKAGES_CHANGED_EVENT, refreshHomebrewPackages);
    window.addEventListener("storage", refreshHomebrewPackages);
    return () => {
      window.removeEventListener(HOMEBREW_PACKAGES_CHANGED_EVENT, refreshHomebrewPackages);
      window.removeEventListener("storage", refreshHomebrewPackages);
    };
  }, []);
  useEffect(() => {
    let isMounted = true;

    async function loadRulesetData() {
      try {
        const data = await loadRuleset(settings.defaultRuleset);

        if (isMounted) {
          setRulesetData(data);
          setRulesetError(null);
        }
      } catch (error) {
        if (isMounted) {
          setRulesetError(
            error instanceof Error
              ? error.message
              : "Ruleset data yüklenemedi.",
          );
        }
      } finally {
        if (isMounted) {
          setIsRulesetLoading(false);
        }
      }
    }

    loadRulesetData();

    return () => {
      isMounted = false;
    };
  }, [settings.defaultRuleset]);

  useDebouncedEffect(characters, saveCharacters, 350, { skipInitial: true });
  useDebouncedEffect(homebrewSpells, saveHomebrewSpells, 350, { skipInitial: true });
  useDebouncedEffect(homebrewItems, saveHomebrewItems, 350, { skipInitial: true });
  useDebouncedEffect(homebrewMonsters, saveHomebrewMonsters, 350, { skipInitial: true });
  useDebouncedEffect(campaigns, saveCampaigns, 350, { skipInitial: true });

  function handleCreateCharacter(draft: CharacterDraft) {
    const character = createCharacterFromDraft(draft);
    setCharacters((current) => [character, ...current]);
  }

  function handleReplaceCharacters(nextCharacters: Character[]) {
    setCharacters(nextCharacters);
  }

  function handleUpdateCharacter(updatedCharacter: Character) {
    setCharacters((current) =>
      current.map((character) =>
        character.id === updatedCharacter.id ? updatedCharacter : character,
      ),
    );
  }

  function handleDeleteCharacter(id: string): boolean {
    const character = characters.find((item) => item.id === id);

    if (!character) {
      return false;
    }

    const confirmed = confirm(`${character.name} silinsin mi? Geri dönüş yok.`);

    if (!confirmed) {
      return false;
    }

    setCharacters((current) => current.filter((item) => item.id !== id));
    return true;
  }


  function handleDuplicateCharacter(id: string): Character | null {
    const source = characters.find((character) => character.id === id);

    if (!source) {
      return null;
    }

    const now = new Date().toISOString();
    const duplicate: Character = {
      ...structuredClone(source),
      id: crypto.randomUUID(),
      name: `${source.name} (Kopya)`,
      createdAt: now,
      updatedAt: now,
    };

    setCharacters((current) => [duplicate, ...current]);
    return duplicate;
  }

  function handleImportCharacters(importedCharacters: Character[]) {
    setCharacters(importedCharacters);
  }

  function handleWipeCharacters() {
    setCharacters([]);
  }


  function handleImportFullBackup(
    data: FullBackupData,
    options: BackupImportOptions,
  ) {
    const { sections, mode } = options;

    if (sections.characters) {
      setCharacters((current) =>
        mode === "merge" ? mergeRecordsById(current, data.characters) : data.characters,
      );
    }

    if (sections.campaigns) {
      setCampaigns((current) =>
        mode === "merge" ? mergeRecordsById(current, data.campaigns) : data.campaigns,
      );
    }

    if (sections.homebrewSpells) {
      setHomebrewSpells((current) =>
        mode === "merge" ? mergeRecordsById(current, data.homebrewSpells) : data.homebrewSpells,
      );
    }

    if (sections.homebrewItems) {
      setHomebrewItems((current) =>
        mode === "merge" ? mergeRecordsById(current, data.homebrewItems) : data.homebrewItems,
      );
    }

    if (sections.homebrewMonsters) {
      setHomebrewMonsters((current) =>
        mode === "merge" ? mergeRecordsById(current, data.homebrewMonsters) : data.homebrewMonsters,
      );
    }

    if (sections.favoriteMonsterIds) {
      const favoriteIds =
        mode === "merge"
          ? mergeUniqueStrings(loadFavoriteMonsterIds(), data.favoriteMonsterIds)
          : data.favoriteMonsterIds;
      saveFavoriteMonsterIds(favoriteIds);
    }

    if (sections.appSettings) {
      updateSettings(data.appSettings);
    }
  }

  function handleWipeAllData() {
    setCharacters([]);
    setCampaigns([]);
    setHomebrewSpells([]);
    setHomebrewItems([]);
    setHomebrewMonsters([]);
    saveFavoriteMonsterIds([]);
    resetSettings();
  }

  function handleCreateCampaign(
    name: string,
    description: string,
    templateId: CampaignTemplateId,
  ) {
    const now = new Date().toISOString();
    const template = getCampaignTemplate(templateId);
    const defaultEncounterTools =
      settings.campaignToolProfile === "full"
        ? {
            difficulty: true,
            loot: true,
            conditions: true,
            combatRolls: true,
          }
        : settings.campaignToolProfile === "balanced"
          ? {
              difficulty: true,
              loot: false,
              conditions: true,
              combatRolls: false,
            }
          : {
              difficulty: false,
              loot: false,
              conditions: false,
              combatRolls: false,
            };

    setCampaigns((current) => [
      {
        id: crypto.randomUUID(),
        name,
        description,
        characterIds: [],
        sessionNotes: [],
        npcNotes: [],
        quests: [],
        encounters: [],
        timelineEntries: [],
        timelineEnabled: template.timelineEnabled,
        encounterTools: template.encounterTools ?? defaultEncounterTools,
        createdAt: now,
        updatedAt: now,
      },
      ...current,
    ]);
  }

  function handleUpdateCampaign(updatedCampaign: Campaign) {
    setCampaigns((current) =>
      current.map((campaign) =>
        campaign.id === updatedCampaign.id ? updatedCampaign : campaign,
      ),
    );
  }

  function handleDeleteCampaign(id: string) {
    const campaign = campaigns.find((item) => item.id === id);

    if (!campaign) {
      return;
    }

    const confirmed = confirm(
      `${campaign.name} silinsin mi? Campaign mezarlığına uğurluyoruz.`,
    );

    if (!confirmed) {
      return;
    }

    setCampaigns((current) => current.filter((item) => item.id !== id));
  }

  function handleCreateHomebrewSpell(spell: DndSpellData) {
    setHomebrewSpells((current) => [spell, ...current]);
  }

  function handleDeleteHomebrewSpell(id: string) {
    const confirmed = confirm(
      "Bu custom spell silinsin mi? Evren biraz sadeleşecek.",
    );

    if (!confirmed) {
      return;
    }

    setHomebrewSpells((current) => current.filter((spell) => spell.id !== id));
  }

  function handleCreateHomebrewItem(item: DndItemData) {
    setHomebrewItems((current) => [item, ...current]);
  }

  function handleDeleteHomebrewItem(id: string) {
    const confirmed = confirm(
      "Bu custom item silinsin mi? Çanta biraz hafifleyecek.",
    );

    if (!confirmed) {
      return;
    }

    setHomebrewItems((current) => current.filter((item) => item.id !== id));
  }

  function handleCreateHomebrewMonster(monster: DndMonsterData) {
    setHomebrewMonsters((current) => [monster, ...current]);
  }

  function handleDeleteHomebrewMonster(id: string) {
    const confirmed = confirm(
      "Bu custom monster/NPC silinsin mi? Oyuncular kısa süreliğine güvende kalacak.",
    );

    if (!confirmed) {
      return;
    }

    setHomebrewMonsters((current) =>
      current.filter((monster) => monster.id !== id),
    );
  }

  return (
    <AppFrame
      characters={characters}
      campaigns={campaigns}
      rulesetData={effectiveRulesetData}
    >
      <AppRoutes
        characters={characters}
        campaigns={campaigns}
        homebrewSpells={homebrewSpells}
        homebrewItems={homebrewItems}
        homebrewMonsters={homebrewMonsters}
        effectiveRulesetData={effectiveRulesetData}
        isRulesetLoading={isRulesetLoading}
        rulesetError={rulesetError}
        onCreateCharacter={handleCreateCharacter}
        onUpdateCharacter={handleUpdateCharacter}
        onReplaceCharacters={handleReplaceCharacters}
        onDeleteCharacter={handleDeleteCharacter}
        onDuplicateCharacter={handleDuplicateCharacter}
        onImportCharacters={handleImportCharacters}
        onWipeCharacters={handleWipeCharacters}
        onImportFullBackup={handleImportFullBackup}
        onWipeAllData={handleWipeAllData}
        onCreateCampaign={handleCreateCampaign}
        onUpdateCampaign={handleUpdateCampaign}
        onDeleteCampaign={handleDeleteCampaign}
        onCreateHomebrewSpell={handleCreateHomebrewSpell}
        onDeleteHomebrewSpell={handleDeleteHomebrewSpell}
        onCreateHomebrewItem={handleCreateHomebrewItem}
        onDeleteHomebrewItem={handleDeleteHomebrewItem}
        onCreateHomebrewMonster={handleCreateHomebrewMonster}
        onDeleteHomebrewMonster={handleDeleteHomebrewMonster}
      />
    </AppFrame>
  );
}

export default App;
