/**
 * version.ts, source unique de verite pour le numero de version affiche.
 * On lit directement package.json : impossible d'avoir une version
 * "en dur" desynchronisee dans l'interface.
 */
import pkg from "../../package.json";

export const APP_VERSION: string = pkg.version;
