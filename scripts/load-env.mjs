/**
 * EN: Shared env loader for the e2e scripts. Reads .env.local first, then the
 * central secrets file (~/.secrets/projets.env, or CENTRAL_ENV_FILE). The
 * first file to define a key wins, and variables already set are never
 * overridden (process.loadEnvFile semantics). No value is ever printed.
 * FR : Chargeur d'environnement commun aux scripts e2e. Lit .env.local
 * d'abord, puis le fichier de secrets central (~/.secrets/projets.env, ou
 * CENTRAL_ENV_FILE). Le premier fichier qui definit une cle gagne, et une
 * variable deja definie n'est jamais ecrasee. Aucune valeur n'est affichee.
 */
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const files = [
  ".env.local",
  process.env.CENTRAL_ENV_FILE ?? join(homedir(), ".secrets", "projets.env"),
];
for (const file of files) {
  if (existsSync(file)) process.loadEnvFile(file);
}

export const env = process.env;
