import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import type {
  DndItemData,
  DndMonsterData,
  DndSpellData,
  RulesetData,
} from "../../core/rulesets/ruleset.types";
import type {
  Character,
  CharacterDraft,
} from "../../core/character/character.types";
import type { Campaign } from "../campaigns/campaignTypes";
import type { CampaignTemplateId } from "../campaigns/campaignTemplates";
const Dashboard = lazy(() =>
  import("../dashboard/Dashboard").then((module) => ({ default: module.Dashboard })),
);
const Characters = lazy(() =>
  import("../characters/Characters").then((module) => ({ default: module.Characters })),
);
const CharacterDetail = lazy(() =>
  import("../characters/CharacterDetail").then((module) => ({
    default: module.CharacterDetail,
  })),
);
const CharacterCompare = lazy(() =>
  import("../characters/CharacterCompare").then((module) => ({
    default: module.CharacterCompare,
  })),
);
const CharacterEditor = lazy(() =>
  import("../characters/CharacterEditor").then((module) => ({
    default: module.CharacterEditor,
  })),
);
const Builder = lazy(() =>
  import("../builder/Builder").then((module) => ({ default: module.Builder })),
);
const MonsterLibrary = lazy(() =>
  import("../monsters/MonsterLibrary").then((module) => ({
    default: module.MonsterLibrary,
  })),
);
const MonsterDetail = lazy(() =>
  import("../monsters/MonsterLibrary").then((module) => ({
    default: module.MonsterDetail,
  })),
);
const Campaigns = lazy(() =>
  import("../campaigns/Campaigns").then((module) => ({ default: module.Campaigns })),
);
const Spellbook = lazy(() =>
  import("../spellbook/Spellbook").then((module) => ({ default: module.Spellbook })),
);
const Inventory = lazy(() =>
  import("../inventory/Inventory").then((module) => ({ default: module.Inventory })),
);
const HomebrewLab = lazy(() =>
  import("../homebrew/HomebrewLab").then((module) => ({ default: module.HomebrewLab })),
);
const PlayMode = lazy(() =>
  import("../play-mode/PlayMode").then((module) => ({ default: module.PlayMode })),
);
const Dice = lazy(() =>
  import("../dice/Dice").then((module) => ({ default: module.Dice })),
);
const DataBackup = lazy(() =>
  import("../backup/DataBackup").then((module) => ({ default: module.DataBackup })),
);
const Library = lazy(() =>
  import("../library/Library").then((module) => ({ default: module.Library })),
);
const Settings = lazy(() =>
  import("../settings/Settings").then((module) => ({ default: module.Settings })),
);
const PlayerTestCenter = lazy(() =>
  import("../player-test/PlayerTestCenter").then((module) => ({ default: module.PlayerTestCenter })),
);
const RulesetCenterPage = lazy(() =>
  import("../rulesets/RulesetCenterPage").then((module) => ({ default: module.RulesetCenterPage })),
);
const ClassCatalogPage = lazy(() =>
  import("../classes/ClassCatalogPage").then((module) => ({ default: module.ClassCatalogPage })),
);
const SubclassCatalogPage = lazy(() =>
  import("../subclasses/SubclassCatalogPage").then((module) => ({ default: module.SubclassCatalogPage })),
);
const OriginCatalogPage = lazy(() =>
  import("../origins/OriginCatalogPage").then((module) => ({ default: module.OriginCatalogPage })),
);
const FeatCatalogPage = lazy(() =>
  import("../feats/FeatCatalogPage").then((module) => ({ default: module.FeatCatalogPage })),
);
const ReleaseHistory = lazy(() =>
  import("../updates/ReleaseHistory").then((module) => ({ default: module.ReleaseHistory })),
);
const HelpCenter = lazy(() =>
  import("../help/HelpCenter").then((module) => ({ default: module.HelpCenter })),
);
const GlobalSearch = lazy(() =>
  import("../search/GlobalSearchPage").then((module) => ({ default: module.GlobalSearch })),
);
const CollectionsPage = lazy(() =>
  import("../collections/CollectionsPage").then((module) => ({ default: module.CollectionsPage })),
);
const SessionPlannerPage = lazy(() =>
  import("../session-planner/SessionPlannerPage").then((module) => ({ default: module.SessionPlannerPage })),
);
const NpcManagerPage = lazy(() =>
  import("../npc-manager/NpcManagerPage").then((module) => ({ default: module.NpcManagerPage })),
);
const WorldAtlasPage = lazy(() =>
  import("../locations/WorldAtlasPage").then((module) => ({ default: module.WorldAtlasPage })),
);
const FactionsPage = lazy(() =>
  import("../factions/FactionsPage").then((module) => ({ default: module.FactionsPage })),
);
const QuestJournalPage = lazy(() =>
  import("../quests/QuestJournalPage").then((module) => ({ default: module.QuestJournalPage })),
);
const LootTrackerPage = lazy(() =>
  import("../loot/LootTrackerPage").then((module) => ({ default: module.LootTrackerPage })),
);
const CombatTrackerPage = lazy(() =>
  import("../combat-tracker/CombatTrackerPage").then((module) => ({ default: module.CombatTrackerPage })),
);
const RestCenterPage = lazy(() =>
  import("../rest/RestCenterPage").then((module) => ({ default: module.RestCenterPage })),
);
const CampaignCalendarPage = lazy(() =>
  import("../downtime/CampaignCalendarPage").then((module) => ({ default: module.CampaignCalendarPage })),
);

import type { BackupImportOptions, FullBackupData } from "../backup/fullBackup";

type AppRoutesProps = {
  characters: Character[];
  campaigns: Campaign[];
  homebrewSpells: DndSpellData[];
  homebrewItems: DndItemData[];
  homebrewMonsters: DndMonsterData[];
  effectiveRulesetData: RulesetData | null;
  isRulesetLoading: boolean;
  rulesetError: string | null;
  onCreateCharacter: (draft: CharacterDraft) => void;
  onUpdateCharacter: (character: Character) => void;
  onReplaceCharacters: (characters: Character[]) => void;
  onDeleteCharacter: (id: string) => boolean;
  onDuplicateCharacter: (id: string) => Character | null;
  onImportCharacters: (characters: Character[]) => void;
  onWipeCharacters: () => void;
  onImportFullBackup: (data: FullBackupData, options: BackupImportOptions) => void;
  onWipeAllData: () => void;
  onCreateCampaign: (
    name: string,
    description: string,
    templateId: CampaignTemplateId,
  ) => void;
  onUpdateCampaign: (campaign: Campaign) => void;
  onDeleteCampaign: (id: string) => void;
  onCreateHomebrewSpell: (spell: DndSpellData) => void;
  onDeleteHomebrewSpell: (id: string) => void;
  onCreateHomebrewItem: (item: DndItemData) => void;
  onDeleteHomebrewItem: (id: string) => void;
  onCreateHomebrewMonster: (monster: DndMonsterData) => void;
  onDeleteHomebrewMonster: (id: string) => void;
};

export function AppRoutes({
  characters,
  campaigns,
  homebrewSpells,
  homebrewItems,
  homebrewMonsters,
  effectiveRulesetData,
  isRulesetLoading,
  rulesetError,
  onCreateCharacter,
  onUpdateCharacter,
  onReplaceCharacters,
  onDeleteCharacter,
  onDuplicateCharacter,
  onImportCharacters,
  onWipeCharacters,
  onImportFullBackup,
  onWipeAllData,
  onCreateCampaign,
  onUpdateCampaign,
  onDeleteCampaign,
  onCreateHomebrewSpell,
  onDeleteHomebrewSpell,
  onCreateHomebrewItem,
  onDeleteHomebrewItem,
  onCreateHomebrewMonster,
  onDeleteHomebrewMonster,
}: AppRoutesProps) {
  return (
    <Suspense
      fallback={
        <div className="route-loading" role="status" aria-live="polite">
          <span className="route-loading-orb">d20</span>
          <strong>Sayfa hazırlanıyor...</strong>
        </div>
      }
    >
      <Routes>
      <Route
        path="/"
        element={
          <Dashboard
            characters={characters}
            campaigns={campaigns}
            rulesetData={effectiveRulesetData}
            homebrewCount={
              homebrewSpells.length + homebrewItems.length + homebrewMonsters.length
            }
          />
        }
      />

      <Route
        path="/characters"
        element={
          <Characters
            characters={characters}
            onDeleteCharacter={onDeleteCharacter}
            onDuplicateCharacter={onDuplicateCharacter}
            onImportCharacters={onImportCharacters}
          />
        }
      />

      <Route
        path="/characters/compare"
        element={<CharacterCompare characters={characters} />}
      />

      <Route
        path="/characters/:characterId/edit"
        element={
          <CharacterEditor
            characters={characters}
            rulesetData={effectiveRulesetData}
            isRulesetLoading={isRulesetLoading}
            rulesetError={rulesetError}
            onUpdateCharacter={onUpdateCharacter}
          />
        }
      />

      <Route
        path="/characters/:characterId"
        element={
          <CharacterDetail
            characters={characters}
            rulesetData={effectiveRulesetData}
            onUpdateCharacter={onUpdateCharacter}
            onDeleteCharacter={onDeleteCharacter}
          />
        }
      />

      <Route
        path="/builder"
        element={
          <Builder
            onCreateCharacter={onCreateCharacter}
            rulesetData={effectiveRulesetData}
            isRulesetLoading={isRulesetLoading}
            rulesetError={rulesetError}
          />
        }
      />

      <Route
        path="/play-mode"
        element={
          <PlayMode
            characters={characters}
            rulesetData={effectiveRulesetData}
            onUpdateCharacter={onUpdateCharacter}
          />
        }
      />
      <Route path="/dice" element={<Dice />} />

      <Route
        path="/session-planner"
        element={<SessionPlannerPage campaigns={campaigns} />}
      />

      <Route
        path="/npcs"
        element={<NpcManagerPage campaigns={campaigns} />}
      />

      <Route
        path="/locations"
        element={<WorldAtlasPage campaigns={campaigns} />}
      />

      <Route
        path="/factions"
        element={<FactionsPage campaigns={campaigns} />}
      />

      <Route
        path="/quests"
        element={<QuestJournalPage campaigns={campaigns} />}
      />
      <Route
        path="/loot"
        element={<LootTrackerPage campaigns={campaigns} characters={characters} />}
      />
      <Route
        path="/combat"
        element={<CombatTrackerPage campaigns={campaigns} characters={characters} monsters={effectiveRulesetData?.monsters ?? []} />}
      />

      <Route path="/rest" element={<RestCenterPage characters={characters} onReplaceCharacters={onReplaceCharacters} />} />
      <Route path="/calendar" element={<CampaignCalendarPage campaigns={campaigns} characters={characters} />} />

      <Route
        path="/spellbook"
        element={
          <Spellbook
            rulesetData={effectiveRulesetData}
            isRulesetLoading={isRulesetLoading}
            rulesetError={rulesetError}
          />
        }
      />

      <Route
        path="/monsters/:monsterId"
        element={
          <MonsterDetail
            rulesetData={effectiveRulesetData}
            isRulesetLoading={isRulesetLoading}
            rulesetError={rulesetError}
          />
        }
      />

      <Route
        path="/monsters"
        element={
          <MonsterLibrary
            rulesetData={effectiveRulesetData}
            isRulesetLoading={isRulesetLoading}
            rulesetError={rulesetError}
          />
        }
      />

      <Route
        path="/inventory"
        element={
          <Inventory
            rulesetData={effectiveRulesetData}
            isRulesetLoading={isRulesetLoading}
            rulesetError={rulesetError}
          />
        }
      />

      <Route
        path="/campaigns"
        element={
          <Campaigns
            characters={characters}
            campaigns={campaigns}
            rulesetData={effectiveRulesetData}
            onCreateCampaign={onCreateCampaign}
            onUpdateCampaign={onUpdateCampaign}
            onDeleteCampaign={onDeleteCampaign}
          />
        }
      />

      <Route
        path="/backup"
        element={
          <DataBackup
            characters={characters}
            campaigns={campaigns}
            homebrewSpells={homebrewSpells}
            homebrewItems={homebrewItems}
            homebrewMonsters={homebrewMonsters}
            onImportCharacters={onImportCharacters}
            onImportFullBackup={onImportFullBackup}
            onWipeCharacters={onWipeCharacters}
            onWipeAllData={onWipeAllData}
          />
        }
      />

      <Route
        path="/library"
        element={
          <Library
            rulesetData={effectiveRulesetData}
            isRulesetLoading={isRulesetLoading}
            rulesetError={rulesetError}
          />
        }
      />

      <Route path="/rulesets" element={<RulesetCenterPage rulesetData={effectiveRulesetData} />} />
      <Route path="/classes" element={<ClassCatalogPage rulesetData={effectiveRulesetData} />} />
      <Route path="/subclasses" element={<SubclassCatalogPage rulesetData={effectiveRulesetData} />} />
      <Route path="/origins" element={<OriginCatalogPage rulesetData={effectiveRulesetData} />} />
      <Route path="/feats" element={<FeatCatalogPage rulesetData={effectiveRulesetData} />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/player-test" element={<PlayerTestCenter characters={characters} rulesetData={effectiveRulesetData} />} />

      <Route path="/updates" element={<ReleaseHistory />} />

      <Route path="/help" element={<HelpCenter />} />


      <Route
        path="/collections"
        element={
          <CollectionsPage
            characters={characters}
            campaigns={campaigns}
            rulesetData={effectiveRulesetData}
            homebrewSpells={homebrewSpells}
            homebrewItems={homebrewItems}
            homebrewMonsters={homebrewMonsters}
          />
        }
      />

      <Route
        path="/search"
        element={
          <GlobalSearch
            characters={characters}
            campaigns={campaigns}
            rulesetData={effectiveRulesetData}
            homebrewSpells={homebrewSpells}
            homebrewItems={homebrewItems}
            homebrewMonsters={homebrewMonsters}
            isRulesetLoading={isRulesetLoading}
            rulesetError={rulesetError}
          />
        }
      />

      <Route
        path="/homebrew-lab"
        element={
          <HomebrewLab
            homebrewSpells={homebrewSpells}
            homebrewItems={homebrewItems}
            homebrewMonsters={homebrewMonsters}
            onCreateHomebrewSpell={onCreateHomebrewSpell}
            onDeleteHomebrewSpell={onDeleteHomebrewSpell}
            onCreateHomebrewItem={onCreateHomebrewItem}
            onDeleteHomebrewItem={onDeleteHomebrewItem}
            onCreateHomebrewMonster={onCreateHomebrewMonster}
            onDeleteHomebrewMonster={onDeleteHomebrewMonster}
          />
        }
      />
      </Routes>
    </Suspense>
  );
}
