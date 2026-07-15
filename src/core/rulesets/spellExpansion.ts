import type { DndSpellData } from "./ruleset.types";

type Edition = "dnd_2014" | "dnd_2024";
type Seed = [string, number, string, DndSpellData["effectType"], string[], string, Partial<DndSpellData>?];
const seeds: Seed[] = [
  ["Banishment",4,"Abjuration","control",["Cleric","Paladin","Sorcerer","Warlock","Wizard"],"Bir hedefi geçici olarak başka bir düzleme uzaklaştırır.",{concentration:true,saveAbility:"cha",conditionEffect:"Banished",target:"One creature"}],
  ["Death Ward",4,"Abjuration","defense",["Cleric","Paladin"],"Hedefi ölümcül bir darbeye veya ani ölüm etkisine karşı bir kez korur.",{duration:"8 hours"}],
  ["Freedom of Movement",4,"Abjuration","movement",["Cleric","Druid","Ranger"],"Hedefin büyülü hareket engellerini aşmasını kolaylaştırır.",{duration:"1 hour"}],
  ["Guardian of Faith",4,"Conjuration","summoning",["Cleric"],"Belirlenen alanı koruyan sabit bir kutsal muhafız oluşturur.",{damageType:"radiant",saveAbility:"dex",area:"10-foot radius"}],
  ["Commune",5,"Divination","utility",["Cleric"],"İlahi bir kaynaktan sınırlı sayıda kısa yanıt almaya çalışırsın.",{ritual:true}],
  ["Dispel Evil and Good",5,"Abjuration","defense",["Cleric","Paladin"],"Düzlemsel yaratıklara karşı koruma ve etki sonlandırma seçenekleri sağlar.",{concentration:true,duration:"Up to 1 minute"}],
  ["Flame Strike",5,"Evocation","damage",["Cleric"],"Dikey bir kutsal ateş sütunu alandaki hedeflere fire ve radiant hasar verir.",{damageDice:"8d6",damageType:"fire/radiant",saveAbility:"dex",area:"10-foot radius, 40-foot-high cylinder",scaling:{mode:"slot",dicePerStep:"1d6"}}],
  ["Hallow",5,"Evocation","utility",["Cleric"],"Geniş bir alanı uzun süreli kutsal veya yasaklı bölgeye dönüştürür.",{castingTime:"24 hours",duration:"Until dispelled",materialCost:"1,000 gp",materialConsumed:true,area:"60-foot radius"}],
  ["Raise Dead",5,"Necromancy","healing",["Bard","Cleric","Paladin"],"Kısa süre önce ölen bir yaratığı bedensel eksikleri yoksa hayata döndürür.",{castingTime:"1 hour",materialCost:"500 gp",materialConsumed:true}],
  ["Blade Barrier",6,"Evocation","damage",["Cleric"],"Dönen bıçaklardan oluşan tehlikeli ve görüşü zorlaştıran bir duvar kurar.",{concentration:true,damageDice:"6d10",damageType:"slashing",saveAbility:"dex",area:"Wall",duration:"Up to 10 minutes"}],
  ["Create Undead",6,"Necromancy","summoning",["Cleric","Warlock","Wizard"],"Cesetlerden sınırlı süre kontrol edilebilen undead hizmetkârlar oluşturur.",{castingTime:"1 minute",duration:"24 hours",materialCost:"150 gp"}],
  ["Find the Path",6,"Divination","utility",["Bard","Cleric","Druid"],"Aynı düzlemde bilinen sabit bir konuma giden en doğrudan rotayı gösterir.",{concentration:true,duration:"Up to 1 day",materialCost:"100 gp"}],
  ["Forbiddance",6,"Abjuration","defense",["Cleric"],"Büyük bir alanı planar travel ve seçilen yaratık türlerine karşı korur.",{ritual:true,castingTime:"10 minutes",duration:"24 hours",area:"40,000 square feet",materialCost:"1,000 gp"}],
  ["Harm",6,"Necromancy","damage",["Cleric"],"Tek bir hedefin yaşam gücünü ağır necrotic hasarla azaltır.",{damageDice:"14d6",damageType:"necrotic",saveAbility:"con",target:"One creature"}],
  ["Heal",6,"Abjuration","healing",["Cleric","Druid"],"Tek hedefe yüksek miktarda sabit healing verir ve bazı durumları kaldırır.",{healingDice:"70",target:"One creature",scaling:{mode:"slot",flatPerStep:10}}],
  ["Heroes' Feast",6,"Conjuration","defense",["Cleric","Druid"],"Partinin uzun süreli savunma ve dayanıklılığını artıran büyülü bir ziyafet oluşturur.",{castingTime:"10 minutes",duration:"24 hours",materialCost:"1,000 gp",materialConsumed:true}],
  ["Conjure Celestial",7,"Conjuration","summoning",["Cleric"],"Sınırlı challenge seviyesinde celestial bir müttefik çağırır.",{concentration:true,duration:"Up to 1 hour",castingTime:"1 minute"}],
  ["Divine Word",7,"Evocation","control",["Cleric"],"Düşük HP'li düşmanlara giderek ağırlaşan ilahi etkiler uygular.",{castingTime:"1 bonus action",saveAbility:"cha",area:"30-foot radius",conditionEffect:"Deafened/Stunned"}],
  ["Etherealness",7,"Transmutation","movement",["Bard","Cleric","Sorcerer","Warlock","Wizard"],"Kullanıcıyı Ethereal Plane sınırına geçirerek maddi engelleri aşmasını sağlar.",{duration:"Up to 8 hours",scaling:{mode:"slot",additionalTargetsPerStep:2}}],
  ["Fire Storm",7,"Evocation","damage",["Cleric","Druid","Sorcerer"],"Birden fazla bitişik alanda şekillendirilebilen büyük bir ateş fırtınası oluşturur.",{damageDice:"7d10",damageType:"fire",saveAbility:"dex",area:"Ten 10-foot cubes"}],
  ["Plane Shift",7,"Conjuration","movement",["Cleric","Druid","Sorcerer","Warlock","Wizard"],"Bir grubu başka bir düzleme taşır veya tek hedefi planar olarak sürgün etmeye çalışır.",{materialCost:"250 gp",saveAbility:"cha",target:"Up to eight creatures"}],
  ["Regenerate",7,"Transmutation","healing",["Bard","Cleric","Druid"],"Hedefe süre boyunca yenilenme verir ve kayıp uzuvların geri gelmesini sağlar.",{healingDice:"4d8+15",duration:"1 hour"}],
  ["Resurrection",7,"Necromancy","healing",["Bard","Cleric"],"Uzun süre önce ölmüş bir yaratığı uygun bedeni varsa hayata döndürür.",{castingTime:"1 hour",materialCost:"1,000 gp",materialConsumed:true}],
  ["Symbol",7,"Abjuration","control",["Bard","Cleric","Wizard"],"Tetiklendiğinde seçilen güçlü büyülü etkiyi yayan kalıcı bir glyph oluşturur.",{castingTime:"1 minute",duration:"Until dispelled",materialCost:"1,000 gp",materialConsumed:true,area:"60-foot radius"}],
  ["Antimagic Field",8,"Abjuration","defense",["Cleric","Wizard"],"Yakındaki büyüleri ve magic item etkilerini geçici olarak baskılayan alan oluşturur.",{concentration:true,duration:"Up to 1 hour",area:"10-foot-radius sphere"}],
  ["Control Weather",8,"Transmutation","utility",["Cleric","Druid","Wizard"],"Geniş bölgenin hava koşullarını kademeli biçimde değiştirir.",{concentration:true,castingTime:"10 minutes",duration:"Up to 8 hours",area:"5-mile radius"}],
  ["Earthquake",8,"Transmutation","damage",["Cleric","Druid","Sorcerer"],"Geniş alanda zemin, yapılar ve concentration üzerinde yıkıcı sarsıntı oluşturur.",{concentration:true,saveAbility:"dex",area:"100-foot radius",duration:"Up to 1 minute"}],
  ["Holy Aura",8,"Abjuration","defense",["Cleric"],"Yakındaki müttefikleri saldırılara ve bazı extraplanar etkilere karşı güçlendirir.",{concentration:true,duration:"Up to 1 minute",area:"30-foot radius",materialCost:"1,000 gp"}],
  ["Astral Projection",9,"Necromancy","movement",["Cleric","Warlock","Wizard"],"Grubun astral bedenlerini Astral Plane'e gönderir.",{castingTime:"1 hour",duration:"Special",materialCost:"1,100 gp",materialConsumed:true,target:"Up to nine creatures"}],
  ["Gate",9,"Conjuration","movement",["Cleric","Sorcerer","Wizard"],"Başka bir düzleme geçit açar veya bilinen bir varlığı geçide çağırır.",{concentration:true,duration:"Up to 1 minute",materialCost:"5,000 gp"}],
  ["Mass Heal",9,"Abjuration","healing",["Cleric"],"Görüş alanındaki hedefler arasında çok büyük bir healing havuzu paylaştırır.",{healingDice:"700",target:"Multiple creatures"}],
  ["True Resurrection",9,"Necromancy","healing",["Cleric","Druid"],"Çok uzun süre önce ölen bir yaratığı yeni beden oluşturarak hayata döndürebilir.",{castingTime:"1 hour",materialCost:"25,000 gp",materialConsumed:true}],
];

function build(seed:Seed, ruleset:Edition):DndSpellData {
  const [name,level,school,effectType,classes,description,extra={}] = seed;
  return { id:`${name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}${ruleset === "dnd_2024" ? "-2024" : ""}`, name, level, school,
    castingTime:"1 action", range:"60 feet", components:["V","S"], duration:"Instantaneous", concentration:false, ritual:false,
    classes, description, effectType, source: ruleset === "dnd_2024" ? "2024 expansion" : "2014 expansion", ...extra };
}
export const SPELL_EXPANSION_2014 = seeds.map((seed)=>build(seed,"dnd_2014"));
export const SPELL_EXPANSION_2024 = seeds.map((seed)=>build(seed,"dnd_2024"));
