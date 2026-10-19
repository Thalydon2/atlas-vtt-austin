# Atlas VTT (Austin's fork)

A personal fork of [Atlas VTT](https://github.com/atlas-vtt/atlas-vtt) by Fabian Urbanek, licensed
AGPL-3.0 like the original (see `LICENSE`). It installs beside the official plugin under its own id,
`atlas-vtt-austin`, so Obsidian never replaces it with the official release. Turn the official
Atlas VTT off while this one is on: both register the same views.

## What it adds

- **Character sheets**: a Sheets tab in the asset manager and "Create Character Sheet" in its +
  menu. A 5e sheet with core stats, hit points, spells and inventory, saved as it is edited.
  Sheets live in `atlas-vtt/collections/<collection>/characters/`.
- **Sheets as tokens**: "Add to Scene" (or the card's button) places a token with the sheet's
  portrait, hit points and armour class. Cmd/Ctrl+hover shows the sheet at a glance.
- **Pins for players**: the note pin dropdown's "Visible to players" row shows a pin in the local
  player window (Icon), and with "Icon + note", holding Cmd/Ctrl over it shows players its note.
- **Loot to sheets**: the gift button on a rolled item adds it to a character sheet's gear, and
  "Add or remove bases" under the tables list opens the collection's Random tables settings.
- **Item pictures on loot cards**: an item whose base shows an image property (`image`, `art`,
  `cover`, `icon`…), whose note names one in its frontmatter, or whose note embeds an image shows it
  beside its name in the loot roller and the players' loot window. A click enlarges it.
- **Rarity filters**: a None toggle in the loot roller for items with no listed rarity, and the
  rarity words your loot bases use offered for adding under Random tables settings → Item rarities.
- **Shift-pan**: holding Shift while right-dragging the map locks the pan to one axis.

## Getting the creator's updates

```bash
git fetch upstream
git merge upstream/main
npm install
npx tsc --noEmit && npx vitest run --project unit tests/unit/characterSheet.test.ts
```

Then build with `npm run build` and commit. The version in `manifest.json` follows the creator's
(the build refuses anything but `x.y.z` or `x.y.z-beta.N`, and the plugin id already keeps the two
apart); for a change of your own between their releases, raise the last number yourself. Push, then
on GitHub draft a release whose tag is exactly that version and attach `dist/main.js`,
`dist/styles.css` and `manifest.json`. BRAT then updates every device.
