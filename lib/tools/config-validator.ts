import Ajv, {JSONSchemaType} from "ajv";
import { Config , Prerequisites, IPSet} from "../types/config";
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

const ipsets = TJS.getProgramFromFiles(
  [resolve("lib/types/ipset.ts")],
  compilerOptions
);

const wafschema = TJS.generateSchema(program, "Config", settings);

const prerequisitesschema = TJS.generateSchema(program, "Prerequisites", settings);

const ipSetsSchema = TJS.generateSchema(ipsets, "IPSet", settings);

const ajv = new Ajv();

export const validatewaf = ajv.compile(wafschema as JSONSchemaType<Config>);

export const validateIPSets = ajv.compile(ipSetsSchema as JSONSchemaType<IPSet>);

export const validateprerequisites = ajv.compile(prerequisitesschema as JSONSchemaType<Prerequisites>);