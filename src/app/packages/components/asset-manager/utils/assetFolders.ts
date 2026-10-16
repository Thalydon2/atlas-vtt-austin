import { TFolder, type App } from 'obsidian';
import { ATLAS_VTT_DIR, type Tab } from '../types';
import { assetTypeOfTab, tabHasFolders } from './tabKinds';

const FOLDER_ID_PREFIX = 'folder-';

/** Character sheets are `character` records, whose files lie in `characters/`. */
const FOLDER_OF_TYPE: Partial<Record<ReturnType<typeof assetTypeOfTab>, string>> = { sheets: 'characters' };

/** The vault folder holding a tab's assets in a collection; player characters lie among the tokens. */
export function tabFolderPath(collection: string, tab: Tab): string {
  const type = assetTypeOfTab(tab);
  return `${ATLAS_VTT_DIR}/collections/${collection}/${FOLDER_OF_TYPE[type] ?? type}`;
}

/** Asset manager folders are identified by their vault path. */
export function folderIdOf(vaultPath: string): string {
  return `${FOLDER_ID_PREFIX}${vaultPath}`;
}

export function vaultPathOfFolder(folderId: string): string {
  return folderId.startsWith(FOLDER_ID_PREFIX) ? folderId.slice(FOLDER_ID_PREFIX.length) : folderId;
}

/** True when the folder still exists inside the tab's folder of the collection. */
export function isFolderOfTab(app: App, folderId: string, collection: string, tab: Tab): boolean {
  if (!tabHasFolders(tab)) return false;
  const path = vaultPathOfFolder(folderId);
  return path.startsWith(`${tabFolderPath(collection, tab)}/`) && app.vault.getAbstractFileByPath(path) instanceof TFolder;
}
