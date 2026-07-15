import type { AbilityKey } from "../character/character.types";
import type { DndFeatData, FeatCategory } from "./ruleset.types";

type Edition = "dnd_2014" | "dnd_2024";
const feat = (id:string,name:string,ruleset:Edition,category:FeatCategory,summary:string,benefits:string[], options:Partial<DndFeatData>={}):DndFeatData => ({ id,name,ruleset,category,summary,benefits,...options });
const general2014 = (id:string,name:string,summary:string, benefits:string[], options:Partial<DndFeatData>={}) => feat(id,name,"dnd_2014","general",summary,benefits,options);
const general2024 = (id:string,name:string,summary:string, benefits:string[], abilities?:AbilityKey[]) => feat(id,name,"dnd_2024","general",summary,benefits,{ prerequisite:{minimumLevel:4}, abilityOptions:abilities, choiceType:abilities?.length ? "ability" : undefined, choiceCount:abilities?.length ? 1 : undefined });

export const FEAT_EXPANSION_2014:DndFeatData[] = [
  general2014("actor","Actor","Taklit, performans ve sahte kimlik oyunlarını geliştirir.",["CHA artışı seçeneği","Taklit ve Deception desteği"],{abilityOptions:["cha"],choiceType:"ability",choiceCount:1}),
  general2014("charger","Charger","Hareket sonrasında saldırı veya itme baskısı kurar.",["Dash sonrası saldırı desteği"]),
  general2014("crossbow-expert","Crossbow Expert","Crossbow kullanımındaki yakın mesafe ve loading sorunlarını azaltır.",["Loading kolaylığı","Yakın mesafe ranged saldırı desteği"]),
  general2014("defensive-duelist","Defensive Duelist","Finesse silahla reaction savunması sağlar.",["Reaction ile AC artışı"],{prerequisite:{abilityMinimums:{dex:13}}}),
  general2014("dual-wielder","Dual Wielder","İki silahlı dövüş seçeneklerini genişletir.",["Dual wield savunma ve ekipman desteği"]),
  general2014("dungeon-delver","Dungeon Delver","Tuzak ve gizli tehlikeleri fark etmeyi kolaylaştırır.",["Trap savunması","Secret door algısı"]),
  general2014("elemental-adept","Elemental Adept","Seçilen elemental hasarın dirençlere karşı güvenilirliğini artırır.",["Bir elemental damage type seçimi"],{prerequisite:{spellcasting:true}}),
  general2014("great-weapon-master","Great Weapon Master","Ağır silahlarla yüksek riskli güçlü saldırıları destekler.",["Heavy weapon hasarı","Bonus saldırı fırsatı"]),
  general2014("inspiring-leader","Inspiring Leader","Kısa konuşmayla partiye temporary HP sağlar.",["Parti temporary HP desteği"],{prerequisite:{abilityMinimums:{cha:13}}}),
  general2014("keen-mind","Keen Mind","Yön, zaman ve ayrıntı hatırlama yeteneğini geliştirir.",["INT artışı seçeneği","Hafıza ve yön bulma desteği"],{abilityOptions:["int"],choiceType:"ability",choiceCount:1}),
  general2014("lightly-armored","Lightly Armored","Light Armor kullanımını ve fiziksel skoru geliştirir.",["Light Armor proficiency"],{abilityOptions:["str","dex"],choiceType:"ability",choiceCount:1}),
  general2014("mage-slayer","Mage Slayer","Yakınındaki spellcasterları baskı altında tutar.",["Reaction saldırısı","Spell savunması"]),
  general2014("martial-adept","Martial Adept","Sınırlı Battle Master maneuver erişimi verir.",["Maneuver seçimi","Superiority Die"]),
  general2014("medium-armor-master","Medium Armor Master","Medium Armor ile hareket ve savunmayı iyileştirir.",["Dex AC sınırı desteği","Stealth kolaylığı"],{prerequisite:{abilityMinimums:{dex:13}}}),
  general2014("observant","Observant","Pasif algı ve dudak okuma becerisini geliştirir.",["WIS veya INT artışı","Passive Perception/Investigation desteği"],{abilityOptions:["int","wis"],choiceType:"ability",choiceCount:1}),
  general2014("polearm-master","Polearm Master","Polearm ile bonus saldırı ve yaklaşana reaction sağlar.",["Bonus Action saldırı","Opportunity Attack alanı"]),
  general2014("resilient","Resilient","Seçilen ability ve saving throw alanını güçlendirir.",["Bir ability artışı","Saving throw proficiency"],{abilityOptions:["str","dex","con","int","wis","cha"],choiceType:"ability",choiceCount:1,repeatable:true}),
  general2014("ritual-caster","Ritual Caster","Seçilen class listesinden ritual büyüler öğrenmeni sağlar.",["Ritual spellbook"],{prerequisite:{abilityMinimums:{int:13,wis:13}},choiceType:"spells",choiceCount:2}),
  general2014("sharpshooter","Sharpshooter","Uzak menzil ve cover cezalarını azaltıp güçlü atış seçeneği verir.",["Range ve cover desteği","Yüksek riskli hasar"]),
  general2014("shield-master","Shield Master","Shield ile itme ve Dexterity savunması sağlar.",["Bonus Action shove","DEX save savunması"]),
  general2014("skulker","Skulker","Gizlenmiş ranged saldırı ve loş ışık kullanımını geliştirir.",["Stealth saldırı desteği"],{prerequisite:{abilityMinimums:{dex:13}}}),
  general2014("spell-sniper","Spell Sniper","Spell attack menzilini ve cover geçişini iyileştirir.",["Spell range desteği","Attack cantrip seçimi"],{prerequisite:{spellcasting:true},choiceType:"spells",choiceCount:1}),
  general2014("weapon-master","Weapon Master","Seçilen silahlarda proficiency ve ability artışı sağlar.",["Dört weapon proficiency"],{abilityOptions:["str","dex"],choiceType:"ability",choiceCount:1}),
];

export const FEAT_EXPANSION_2024:DndFeatData[] = [
  general2024("actor-2024","Actor","Taklit ve sosyal sızma yeteneğini geliştirir.",["CHA artışı","Deception/Performance desteği"],["cha"]),
  general2024("crossbow-expert-2024","Crossbow Expert","Crossbow saldırı akışını hızlandırır.",["Loading ve yakın mesafe desteği"],["dex"]),
  general2024("dual-wielder-2024","Dual Wielder","İki silahlı dövüş eylemlerini geliştirir.",["Dual wield saldırı ve savunma desteği"],["str","dex"]),
  general2024("elemental-adept-2024","Elemental Adept","Bir elemental damage type seçerek dirençlere karşı güvenilirlik kazanırsın.",["Elemental hasar uzmanlığı"],["int","wis","cha"]),
  general2024("fey-touched-2024","Fey-Touched","Teleport ve enchantment/divination büyüsü kazandırır.",["Misty Step","Ek level 1 spell"],["int","wis","cha"]),
  general2024("inspiring-leader-2024","Inspiring Leader","Partiye dinlenme sonrası temporary HP sağlar.",["Parti savunma desteği"],["wis","cha"]),
  general2024("mage-slayer-2024","Mage Slayer","Concentration ve büyülü etkiler kullanan hedefleri cezalandırır.",["Caster baskısı","Mental save desteği"],["str","dex"]),
  general2024("piercer-2024","Piercer","Piercing damage zarlarını daha güvenilir kılar.",["Damage reroll","Critical bonus"],["str","dex"]),
  general2024("polearm-master-2024","Polearm Master","Polearm ile bonus saldırı ve reaction alanı sağlar.",["Bonus Action attack","Reactive strike"],["str","dex"]),
  general2024("resilient-2024","Resilient","Bir ability ve ona bağlı saving throw proficiency kazanırsın.",["Ability artışı","Saving throw proficiency"],["str","dex","con","int","wis","cha"]),
  general2024("sentinel-2024","Sentinel","Yakın dövüş alanını reaction ile kontrol eder.",["Movement denial","Reaction attack"],["str","dex"]),
  general2024("sharpshooter-2024","Sharpshooter","Ranged saldırılarda cover ve yakın mesafe baskısını azaltır.",["Ranged accuracy desteği"],["dex"]),
  general2024("skill-expert-2024","Skill Expert","Bir skill proficiency ve Expertise kazandırır.",["Skill proficiency","Expertise"],["str","dex","con","int","wis","cha"]),
  general2024("slasher-2024","Slasher","Slashing saldırılarla hedef hareketini baskılar.",["Speed azaltma","Critical debuff"],["str","dex"]),
  general2024("telekinetic-2024","Telekinetic","Zihinsel itme ve görünmez Mage Hand yeteneği verir.",["Bonus Action shove","Mage Hand"],["int","wis","cha"]),
];
