import {Config, Prerequisites} from "../lib/types/config";

import {  owasptopTen, prequisites, ipSetsManagedTest} from "./examples";

export const configs : { [key: string]: Config } = {
  owasptopTen,
  ipSetsManagedTest,
};

export const prereq : { [key: string]: Prerequisites } = {
  prequisites,
};