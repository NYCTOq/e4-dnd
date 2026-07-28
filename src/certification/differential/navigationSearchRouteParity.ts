import { navItems } from "../../shared/navigation/navItems";
import { buildGlobalSearchEntries, searchGlobalEntries } from "../../features/search/globalSearchEngine";
import { STATIC_ROUTE_REFERENCE } from "../reference/navigationSearchRouteReference";

const emptyInput={characters:[],campaigns:[],rulesetData:null,homebrewSpellIds:new Set<string>(),homebrewItemIds:new Set<string>(),homebrewMonsterIds:new Set<string>()};
export type AliasResult={alias:string;rank:number;topRoute:string|null};
export type RouteParityRow={to:string;nav:boolean;search:boolean;command:boolean;aliasChecks:number;aliasFailures:string[];aliasAmbiguities:string[];aliasResults:AliasResult[]};
export function buildRouteParityMatrix():RouteParityRow[]{
 const entries=buildGlobalSearchEntries(emptyInput);
 return STATIC_ROUTE_REFERENCE.map(ref=>{
  const nav=navItems.some(x=>x.to===ref.to&&x.label===ref.label&&x.shortLabel===ref.shortLabel&&x.group===ref.group);
  const search=entries.some(x=>x.category==="Sayfa"&&x.to===ref.to&&x.title===ref.label);
  const command=navItems.some(x=>x.to===ref.to);
  const aliases=[ref.label,ref.shortLabel,...ref.aliases];
  const aliasResults=aliases.map(alias=>{const results=searchGlobalEntries(entries,alias);return {alias,rank:results.findIndex(x=>x.to===ref.to),topRoute:results[0]?.to??null};});
  const aliasFailures=aliasResults.filter(result=>result.rank<0).map(result=>result.alias);
  const aliasAmbiguities=aliasResults.filter(result=>result.rank>0).map(result=>result.alias);
  return {to:ref.to,nav,search,command,aliasChecks:aliases.length,aliasFailures,aliasAmbiguities,aliasResults};
 });
}
export function summarizeRouteParity(){const rows=buildRouteParityMatrix();return {routes:rows.length,aliasChecks:rows.reduce((n,r)=>n+r.aliasChecks,0),orphanRoutes:rows.filter(r=>!r.nav).map(r=>r.to),deadSearchTargets:rows.filter(r=>!r.search).map(r=>r.to),commandMismatches:rows.filter(r=>!r.command).map(r=>r.to),aliasFailures:rows.flatMap(r=>r.aliasFailures.map(alias=>`${r.to}:${alias}`)),aliasAmbiguities:rows.flatMap(r=>r.aliasAmbiguities.map(alias=>`${r.to}:${alias}`)),rows};}
