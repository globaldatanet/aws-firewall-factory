import {waf, prerequisites, shield, autoUpdatedManagedIpSets} from "../lib/types/config";

import {  owasptopTen, prequisites, ipSetsManagedTest, shieldConfigExample} from "./examples";
import * as tests_waf from "./tests_waf";
import * as tests_autoUpdatedManagedIpSets from "./tests_autoUpdatedManagedIpSets"
export const configs : { [key: string]: waf.WafConfig } = {
  owasptopTen,
  ipSetsManagedTest,
  ...tests_waf,
};
export const shieldConfigs : { [key: string]: shield.ShieldConfig } = {
  shieldConfigExample
};
export const prereq : { [key: string]: prerequisites.PrerequisitesConfig } = {
  prequisites,
};

export const autoUpdatedManagedIpSetsConfigs : { [key: string]: autoUpdatedManagedIpSets.AutoUpdatedManagedIpSetsConfig } = {
  ...tests_autoUpdatedManagedIpSets,
};