import React from 'react';
import { ABILITIES, SKILLS, type Ability, type ProficiencyLevel, type Skill } from '../../../characterSheet/characterSheetTypes';
import {
  abilityModifier,
  initiative,
  nextProficiency,
  passivePerception,
  proficiencyBonus,
  savingThrowBonus,
  signed,
  skillBonus,
  withLevel,
} from '../../../characterSheet/characterSheetRules';
import { NumberField, StatTile, TextField, type SheetPanelProps } from './SheetFields';
import { t } from '../../../i18n';

const PROFICIENCY_MARKS: Record<ProficiencyLevel, string> = { 0: '○', 1: '●', 2: '◉' };

type TextKey = 'playerName' | 'race' | 'background' | 'alignment' | 'className' | 'subclass';

const IDENTITY_FIELDS: readonly { key: TextKey; label: () => string }[] = [
  { key: 'playerName', label: () => t('characterSheet.field.playerName') },
  { key: 'race', label: () => t('characterSheet.field.race') },
  { key: 'background', label: () => t('characterSheet.field.background') },
  { key: 'alignment', label: () => t('characterSheet.field.alignment') },
  { key: 'className', label: () => t('characterSheet.field.className') },
  { key: 'subclass', label: () => t('characterSheet.field.subclass') },
];

function IdentitySection({ sheet, update, readOnly }: SheetPanelProps): React.JSX.Element {
  const setText = (key: TextKey) => (value: string): void => update((current) => ({ ...current, [key]: value }));
  return (
    <section className="atlas-cs-section">
      <div className="atlas-cs-grid">
        {IDENTITY_FIELDS.map(({ key, label }) => (
          <TextField key={key} label={label()} value={sheet[key]} onChange={setText(key)} disabled={readOnly} />
        ))}
        <NumberField label={t('characterSheet.field.level')} value={sheet.level} min={1} max={20} disabled={readOnly} onCommit={(value) => update((current) => withLevel(current, value))} />
        <NumberField label={t('characterSheet.field.experience')} value={sheet.experience} min={0} max={99999999} disabled={readOnly} onCommit={(value) => update((current) => ({ ...current, experience: value }))} />
      </div>
    </section>
  );
}

function CombatSection({ sheet, update, readOnly }: SheetPanelProps): React.JSX.Element {
  return (
    <section className="atlas-cs-section">
      <div className="atlas-cs-grid">
        <NumberField label={t('characterSheet.field.armorClass')} value={sheet.armorClass} min={0} max={99} disabled={readOnly} onCommit={(value) => update((current) => ({ ...current, armorClass: value }))} />
        <NumberField label={t('characterSheet.field.speed')} value={sheet.speed} min={0} max={999} disabled={readOnly} onCommit={(value) => update((current) => ({ ...current, speed: value }))} />
        <NumberField label={t('characterSheet.field.initiativeBonus')} value={sheet.initiativeBonus} min={-20} max={20} disabled={readOnly} onCommit={(value) => update((current) => ({ ...current, initiativeBonus: value }))} />
      </div>
      <div className="atlas-cs-tiles">
        <StatTile label={t('characterSheet.derived.proficiencyBonus')} value={signed(proficiencyBonus(sheet.level))} />
        <StatTile label={t('characterSheet.derived.initiative')} value={signed(initiative(sheet))} />
        <StatTile label={t('characterSheet.derived.passivePerception')} value={String(passivePerception(sheet))} />
      </div>
    </section>
  );
}

function AbilitiesSection({ sheet, update, readOnly }: SheetPanelProps): React.JSX.Element {
  const setScore = (ability: Ability, value: number): void =>
    update((current) => ({ ...current, abilities: { ...current.abilities, [ability]: value } }));
  const setSave = (ability: Ability, value: boolean): void =>
    update((current) => ({ ...current, saveProficiencies: { ...current.saveProficiencies, [ability]: value } }));
  return (
    <section className="atlas-cs-section">
      <h4 className="atlas-cs-heading">{t('characterSheet.section.abilities')}</h4>
      <div className="atlas-cs-abilities">
        {ABILITIES.map((ability) => {
          const name = t(`characterSheet.ability.${ability}`);
          return (
            <div key={ability} className="atlas-cs-ability">
              <span className="atlas-cs-ability-name">{t(`characterSheet.abilityShort.${ability}`)}</span>
              <span className="atlas-cs-ability-modifier">{signed(abilityModifier(sheet.abilities[ability]))}</span>
              <NumberField label={name} hideLabel value={sheet.abilities[ability]} min={1} max={30} disabled={readOnly} onCommit={(value) => setScore(ability, value)} />
              <label className="atlas-cs-check">
                <input
                  type="checkbox"
                  checked={sheet.saveProficiencies[ability]}
                  disabled={readOnly}
                  aria-label={t('characterSheet.saveProficient', { ability: name })}
                  onChange={(event) => setSave(ability, event.target.checked)}
                />
                <span aria-hidden="true">{signed(savingThrowBonus(sheet, ability))}</span>
              </label>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SkillsSection({ sheet, update, readOnly }: SheetPanelProps): React.JSX.Element {
  const cycle = (skill: Skill): void => update((current) => ({
    ...current,
    skillProficiencies: { ...current.skillProficiencies, [skill]: nextProficiency(current.skillProficiencies[skill]) },
  }));
  return (
    <section className="atlas-cs-section">
      <h4 className="atlas-cs-heading">{t('characterSheet.section.skills')}</h4>
      <ul className="atlas-cs-skills">
        {SKILLS.map(({ id }) => {
          const level = sheet.skillProficiencies[id];
          const name = t(`characterSheet.skill.${id}`);
          return (
            <li key={id} className="atlas-cs-skill">
              <button
                type="button"
                className="atlas-cs-skill-button"
                disabled={readOnly}
                onClick={() => cycle(id)}
                aria-label={t('characterSheet.skillProficiency', { skill: name, level: t(`characterSheet.proficiency.${level}`) })}
              >
                <span className="atlas-cs-skill-mark" aria-hidden="true">{PROFICIENCY_MARKS[level]}</span>
                <span className="atlas-cs-skill-bonus" aria-hidden="true">{signed(skillBonus(sheet, id))}</span>
                <span className="atlas-cs-skill-name" aria-hidden="true">{name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function CoreTab(props: SheetPanelProps): React.JSX.Element {
  return (
    <>
      <IdentitySection {...props} />
      <CombatSection {...props} />
      <AbilitiesSection {...props} />
      <SkillsSection {...props} />
    </>
  );
}

