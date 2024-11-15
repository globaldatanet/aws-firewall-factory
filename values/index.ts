import {WafConfig, ShieldConfig, PrerequisitesConfig, AutoUpdatedManagedIpSetsConfig} from "../lib/types/config";

import {  owasptopTen, prequisites, ipSetsManagedTest, shieldConfigExample} from "./examples";
import * as tests_waf from "./tests_waf";
import * as tests_autoUpdatedManagedIpSets from "./tests_autoUpdatedManagedIpSets";
export const configs : { [key: string]: WafConfig } = {
  owasptopTen,
  ipSetsManagedTest,
  ...tests_waf,
};
export const shieldConfigs : { [key: string]: ShieldConfig } = {
  shieldConfigExample
};
export const prereq : { [key: string]: PrerequisitesConfig } = {
  prequisites,
};

export const autoUpdatedManagedIpSetsConfigs : { [key: string]: AutoUpdatedManagedIpSetsConfig } = {
  ...tests_autoUpdatedManagedIpSets,
};