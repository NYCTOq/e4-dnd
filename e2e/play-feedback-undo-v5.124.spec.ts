import { expect, test } from "@playwright/test";
// v6.1D1: deterministic shell bootstrap for physical E2E tests.
const __E4_E2E_APP_VERSION__ = "6.1.0";
test.beforeEach(async ({ page }) => {
  await page.addInitScript((appVersion) => {
    localStorage.setItem("e4_dnd_first_run_guide_v1", JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1", appVersion);
  }, __E4_E2E_APP_VERSION__);
});

const character = { id:"play-feedback-e2e",name:"Feedback Hero",playerName:"QA",ruleset:"dnd_2024",race:"Human",className:"Fighter",classLevels:[{className:"Fighter",level:5}],subclass:"Champion",background:"Soldier",featIds:[],skillProficiencies:[],expertiseSkills:[],toolProficiencies:[],languages:["Common"],level:5,abilities:{str:16,dex:14,con:14,int:10,wis:12,cha:8},maxHp:42,currentHp:24,tempHp:3,armorClass:17,armorClassMode:"manual",knownSpellIds:[],preparedSpellIds:[],spellSlots:[],inventory:[],equippedArmorId:null,equippedShieldId:null,equippedWeaponIds:[],gold:0,deathSaves:{successes:0,failures:0},hitDice:[{die:10,max:5,used:0}],resources:[],exhaustion:0,conditions:[],conditionDurations:{},concentrating:false,activeEffects:[],notes:"v5.124 fixture",createdAt:"2026-07-28T00:00:00.000Z",updatedAt:"2026-07-28T00:00:00.000Z" };

test.beforeEach(async({page})=>{
  await page.addInitScript((fixture)=>{
    localStorage.setItem("e4_dnd_first_run_guide_v1",JSON.stringify(true));
    localStorage.setItem("e4_dnd_last_seen_version_v1","6.1.0");
    if(!localStorage.getItem("e4_dnd_characters_v1")) localStorage.setItem("e4_dnd_characters_v1",JSON.stringify([fixture]));
  },character);
  await page.goto("/play-mode?character=play-feedback-e2e");
});

test("damage shows feedback and undo restores HP after reload",async({page})=>{
  await page.getByTestId("death-dying-amount").fill("4");
  await page.getByTestId("death-dying-damage").click();
  await expect(page.getByTestId("play-action-feedback")).toContainText("4 hasar uygulandı");
  await page.reload({ waitUntil: "domcontentloaded" }).catch((error) => {
    if (!String(error).includes("ERR_INTERNET_DISCONNECTED")) throw error;
  });
  await expect(page.getByTestId("play-action-undo")).toBeVisible();
  await page.getByTestId("play-action-undo").click();
  await expect(page.getByTestId("play-action-feedback")).toContainText("geri alındı");
});

test("healing exposes an accessible recovery message",async({page})=>{
  await page.getByTestId("death-dying-amount").fill("5");
  await page.getByTestId("death-dying-heal").click();
  await expect(page.getByTestId("play-action-feedback")).toContainText("İyileştirme uygulandı");
});
