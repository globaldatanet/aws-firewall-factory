import Ajv, {JSONSchemaType} from "ajv";
<<<<<<< HEAD
import { Config , Prerequisites, IPSet} from "../types/config";
=======
import { Config , Prerequisites} from "../types/config";
import { IPSet } from "../types/ipset";
>>>>>>> 6e7db7ab (Add repo managed IPSets + refactor bin)
import { resolve } from "path";
import * as TJS from "typescript-json-schema";

const settings: TJS.PartialArgs = {
  required: true,
  noExtraProps: true
};

const compilerOptions: TJS.CompilerOptions = {
  strictNullChecks: true,
};

const program = TJS.getProgramFromFiles(
  [resolve("lib/types/config.ts")],
  compilerOptions
);

<<<<<<< HEAD
=======
const ipsets = TJS.getProgramFromFiles(
  [resolve("lib/types/ipset.ts")],
  compilerOptions
);
>>>>>>> 6e7db7ab (Add repo managed IPSets + refactor bin)

const wafschema = TJS.generateSchema(program, "Config", settings);

const prerequisitesschema = TJS.generateSchema(program, "Prerequisites", settings);

<<<<<<< HEAD
const ipSetsSchema = TJS.generateSchema(program, "IPSet", settings);
=======
const ipSetsSchema = TJS.generateSchema(ipsets, "IPSet", settings);
>>>>>>> 6e7db7ab (Add repo managed IPSets + refactor bin)

const ajv = new Ajv();

export const validatewaf = ajv.compile(wafschema as JSONSchemaType<Config>);

export const validateIPSets = ajv.compile(ipSetsSchema as JSONSchemaType<IPSet>);

export const validateprerequisites = ajv.compile(prerequisitesschema as JSONSchemaType<Prerequisites>);