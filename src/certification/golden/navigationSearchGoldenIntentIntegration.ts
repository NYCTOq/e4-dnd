import { buildGlobalSearchEntries, searchGlobalEntries } from "../../features/search/globalSearchEngine";
import { STATIC_ROUTE_REFERENCE } from "../reference/navigationSearchRouteReference";

const emptyInput={characters:[],campaigns:[],rulesetData:null,homebrewSpellIds:new Set<string>(),homebrewItemIds:new Set<string>(),homebrewMonsterIds:new Set<string>()};
export const GOLDEN_SEARCH_INTENTS = [
  ["karakter oluştur","/builder"],["büyüler","/spellbook"],["envanter","/inventory"],["dinlenme","/rest"],
  ["kampanya takvimi","/calendar"],["görev günlüğü","/quests"],["npc yönetimi","/npcs"],["dünya atlası","/locations"],
  ["alt sınıflar","/subclasses"],["kural setleri","/rulesets"],["geri yükleme","/backup"],["sürüm geçmişi","/updates"]
] as const;
export function buildGoldenSearchIntentReport(){
 const entries=buildGlobalSearchEntries(emptyInput);
 const aliases=STATIC_ROUTE_REFERENCE.flatMap(ref=>ref.aliases.map(alias=>({route:ref.to,alias,rank:searchGlobalEntries(entries,alias).findIndex(x=>x.to===ref.to)})));
 const intents=GOLDEN_SEARCH_INTENTS.map(([query,route])=>{const results=searchGlobalEntries(entries,query);return {query,route,rank:results.findIndex(x=>x.to===route),topRoute:results[0]?.to??null};});
 return {routeCount:STATIC_ROUTE_REFERENCE.length,aliasCount:aliases.length,missingAliases:aliases.filter(x=>x.rank<0),intents,missingIntents:intents.filter(x=>x.rank<0)};
}
