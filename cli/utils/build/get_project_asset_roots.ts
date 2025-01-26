import * as path from "path";

import { default as config } from "#/config.json";
import { CLI_DIR } from "#/globals";
import { normalizeParameterPath } from "#/utils/fs/normalize_parameter_path";

/**
 * @param language - locale to use for additional assets
 * @returns list of additional assets based on XRF config and locale
 */
export function getProjectAssetsRoots(language?: string): Array<string> {
  const assetRoots: Array<string> = config.resources.mod_assets_override_folders.map((it) => {
    return path.resolve(CLI_DIR, normalizeParameterPath(it));
  });

  if (language && config.resources.mod_assets_locales[language]) {
    config.resources.mod_assets_locales[language].forEach((it: string) => {
      assetRoots.push(path.resolve(CLI_DIR, normalizeParameterPath(it)));
    });
  }

  return assetRoots;
}
