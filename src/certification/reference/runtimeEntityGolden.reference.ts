export const RUNTIME_ENTITY_GOLDEN = {
  feats: [
    {
      id: "2014-feat-combat-package",
      edition: "dnd_2014",
      level: 10,
      names: ["Alert", "Mobile", "Tough"],
      expected: {
        alertInitiativeBonus: 5,
        speedBonus: 10,
        toughHpBonus: 20,
        luckyUses: 0,
        passivePerceptionBonus: 0,
      },
    },
    {
      id: "2024-feat-awareness-package",
      edition: "dnd_2024",
      level: 9,
      names: ["Alert", "Lucky", "Observant"],
      expected: {
        alertInitiativeBonus: 4,
        speedBonus: 0,
        toughHpBonus: 0,
        luckyUses: 4,
        passivePerceptionBonus: 5,
      },
    },
  ],
  spells: [
    {
      id: "fire-bolt-save-resistance",
      rolledDamage: 30,
      saveSucceeded: true,
      onSuccessfulSave: "half",
      relation: "resistant",
      expectedDamage: 7,
    },
    {
      id: "cure-wounds-upcast",
      currentHp: 18,
      maxHp: 30,
      healing: 5,
      expectedHealing: 23,
    },
  ],
  items: [
    {
      id: "speed-and-heroism",
      effects: ["item:potion-speed", "item:potion-heroism"],
      expected: {
        armorClassBonus: 2,
        speedMultiplier: 2,
        dexSaveMode: "advantage",
        attackSaveBonusDice: "1d4",
      },
      expectedTempHp: 10,
    },
  ],
  subclasses: [
    {
      id: "champion-2014",
      level: 15,
      expected: { criticalThreshold: 18 },
    },
    {
      id: "order-domain",
      level: 3,
      expectedAction: {
        type: "action",
        resourceId: "channel-divinity",
      },
    },
  ],
} as const;
