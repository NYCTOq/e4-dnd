import { expect, test, type Page } from "@playwright/test";
import { installKnownAppState } from "./support/appState";

// v6.1D1: deterministic shell bootstrap for physical E2E tests.
const __E4_E2E_APP_VERSION__ = "6.2.0";
test.beforeEach(async ({ page }) => {
  await page.addInitScript((appVersion) => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1", appVersion);
  }, __E4_E2E_APP_VERSION__);
});

const baseCharacter = {
  id:"hub-e2e",name:"Hub E2E",playerName:"QA",ruleset:"dnd_2024",race:"Human",className:"Fighter",classLevels:[{className:"Fighter",level:5}],subclass:"Champion",background:"Soldier",featIds:[],skillProficiencies:["Athletics"],expertiseSkills:[],toolProficiencies:[],languages:["Common"],level:5,
  abilities:{str:16,dex:14,con:14,int:10,wis:12,cha:8},maxHp:42,currentHp:42,tempHp:0,armorClass:17,armorClassMode:"manual",knownSpellIds:[],preparedSpellIds:[],spellSlots:[],inventory:[],equippedArmorId:null,equippedShieldId:null,equippedWeaponIds:[],gold:10,deathSaves:{successes:0,failures:0},hitDice:[{die:10,max:5,used:0}],resources:[],exhaustion:0,conditions:[],conditionDurations:{},concentrating:false,activeEffects:[],notes:"v5.122D",createdAt:"2026-07-28T00:00:00.000Z",updatedAt:"2026-07-28T00:00:00.000Z"
};

async function expectAction(page:Page,surface:"dashboard"|"characters"|"detail",label:string,route:RegExp){
  const link=page.getByTestId(`character-hub-action-${surface}-hub-e2e`);
  await expect(link).toBeVisible();
  await expect(link).toHaveText(label);
  await link.click();
  await expect(page).toHaveURL(route);
}

for (const state of [
  {id:"ready",hp:42,label:"Karakteri Aç",route:/\/characters\/hub-e2e$/},
  {id:"wounded",hp:23,label:"Oyuna Dön",route:/\/play-mode\?character=hub-e2e$/},
  {id:"critical",hp:0,label:"Karakteri Kurtar",route:/\/play-mode\?character=hub-e2e$/},
] as const) {
  test(`${state.id} character keeps one action across dashboard list and detail`,async({page})=>{
    const character={...baseCharacter,currentHp:state.hp,updatedAt:`2026-07-28T00:00:0${state.hp===42?3:state.hp===23?2:1}.000Z`};
    await installKnownAppState(page,[character]);
    await page.goto("/");
    await expectAction(page,"dashboard",state.label,state.route);
    await page.goto("/characters");
    await expectAction(page,"characters",state.label,state.route);
    await page.goto("/characters/hub-e2e");
    await expectAction(page,"detail",state.label,state.route);
  });
}

test("empty dashboard exposes the canonical create action",async({page})=>{
  await installKnownAppState(page,[]);
  await page.goto("/");
  const link=page.getByTestId("character-hub-action-dashboard-empty");
  await expect(link).toBeVisible();
  await expect(link).toHaveText("Karakter Oluştur");
  await link.click();
  await expect(page).toHaveURL(/\/builder$/);
});
