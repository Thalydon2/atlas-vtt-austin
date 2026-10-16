import React, { useRef } from 'react';
import type { App } from 'obsidian';
import { ImagePlus, User, X } from 'lucide-react';
import { Button } from '../../../packages/components/primitives/button';
import { IMAGE_PRESETS, optimizeImage } from '../../../imageProcessing/imageProcessing';
import { writeAssetImage } from '../../../services/assetImageFiles';
import { resourceUrl } from '../../../packages/components/asset-manager/utils/assetFormatters';
import { showAtlasToast } from '../AtlasToast';
import { t } from '../../../i18n';

const PORTRAIT_PRESET = { maxWidth: 512, maxHeight: 512, quality: IMAGE_PRESETS.token.quality };

/** Converts an uploaded image and stores it with the token art; resolves to its vault path. */
async function storePortrait(app: App, characterName: string, file: File): Promise<string> {
  const { image } = await optimizeImage(file, PORTRAIT_PRESET, { webpOnly: true });
  return writeAssetImage(app, characterName || 'portrait', await image.arrayBuffer());
}

interface CharacterPortraitProps {
  app: App | null | undefined;
  path: string;
  characterName: string;
  disabled: boolean;
  /** The new portrait's path, or '' when it was removed. */
  onChange: (path: string) => void;
}

export function CharacterPortrait({ app, path, characterName, disabled, onChange }: CharacterPortraitProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const url = app ? resourceUrl(app, path) : '';
  const label = t(url ? 'characterSheet.portrait.change' : 'characterSheet.portrait.choose');

  const choose = (file: File): void => {
    if (!app) return;
    storePortrait(app, characterName, file).then(onChange, (error: unknown) => {
      showAtlasToast(t('characterSheet.portrait.failed', { error: error instanceof Error ? error.message : String(error) }));
    });
  };

  return (
    <div className="atlas-cs-portrait">
      <button type="button" className="atlas-cs-portrait-button" disabled={disabled || !app} aria-label={label} onClick={() => inputRef.current?.click()}>
        {url ? <img src={url} alt="" draggable={false} /> : disabled ? <User /> : <ImagePlus />}
      </button>
      {url && !disabled && (
        <Button variant="ghost" size="icon" className="atlas-cs-portrait-remove" aria-label={t('characterSheet.portrait.remove')} onClick={() => onChange('')}>
          <X />
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="atlas-hidden-file-input"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) choose(file);
        }}
      />
    </div>
  );
}
