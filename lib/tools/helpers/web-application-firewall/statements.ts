import * as cdk from "aws-cdk-lib";
import { waf} from "../../../types/config/index";
import { aws_wafv2 as wafv2 } from "aws-cdk-lib";
/**
 * Function to transform RuleStatements
 * @param rule Rule
 * @param prefix string
 * @param stage string
 * @param ipSets cdk.aws_wafv2.CfnIPSet[]
 * @param regexPatternSets cdk.aws_wafv2.CfnRegexPatternSet[]
 */
export function transformWafRuleStatements(rule: waf.Rule, prefix: string, stage: string, webAclName: string, ipSets?: cdk.aws_wafv2.CfnIPSet[], regexPatternSets?: cdk.aws_wafv2.CfnRegexPatternSet[]) {
  const notStatement = rule.statement.notStatement as waf.NotStatementProperty | undefined;
  const ipSetReferenceStatement = rule.statement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
  const regexPatternSetReferenceStatement = rule.statement.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
  const rateBasedStatement = rule.statement.rateBasedStatement as wafv2.CfnWebACL.RateBasedStatementProperty | undefined;

  if(notStatement) {
    const adjustedstatement = handleNotStatement(notStatement, prefix, stage, webAclName, ipSets, regexPatternSets);
    rule.statement = adjustedstatement;
  }
  const andStatement = rule.statement.andStatement as wafv2.CfnWebACL.AndStatementProperty | undefined;

  if (andStatement) {
    const statements = andStatement.statements as cdk.aws_wafv2.CfnWebACL.StatementProperty[];
    handleAndOrStatement (statements, prefix, stage, webAclName, ipSets, regexPatternSets);
  }
  
  const orStatement = rule.statement.orStatement as wafv2.CfnWebACL.OrStatementProperty | undefined;
  
  if (orStatement) {
    const statements = orStatement.statements as cdk.aws_wafv2.CfnWebACL.StatementProperty[];
    handleAndOrStatement (statements, prefix, stage, webAclName, ipSets, regexPatternSets);
  }
  
  let statement : wafv2.CfnWebACL.StatementProperty;
  if (ipSetReferenceStatement && ipSets) {
    statement = getActualIpReferenceStatementInStatement(ipSetReferenceStatement, prefix, stage, webAclName, ipSets);
  } else if(regexPatternSetReferenceStatement && regexPatternSets) {
    statement = getActualRegexPatternSetReferenceStatementProperty(regexPatternSetReferenceStatement, prefix, stage, regexPatternSets);
  } else if (andStatement) {
    statement = { andStatement };
  } else if (orStatement) {
    statement = { orStatement };
  } else if (rateBasedStatement) {
    const newstatement = handleRateBasedStatement(rateBasedStatement, prefix, stage, webAclName, ipSets, regexPatternSets);
    statement = newstatement;
  }
  else {
    statement = rule.statement;
  }
  return statement;
}

/**
   * Function to return the actual IPSetReferenceStatementProperty
   * @param ipSetReferenceStatement wafv2.CfnWebACL.IPSetReferenceStatementProperty
   * @param prefix string
   * @param stage string
   * @param ipSets cdk.aws_wafv2.CfnIPSet[]
   */
function getActualIpReferenceStatementInStatement(ipSetReferenceStatement: wafv2.CfnWebACL.IPSetReferenceStatementProperty, prefix: string, stage: string, webAclName: string, ipSets: cdk.aws_wafv2.CfnIPSet[]) {
  let actualIpSetReferenceStatement: wafv2.CfnWebACL.IPSetReferenceStatementProperty;
  if (ipSetReferenceStatement.arn.startsWith("arn")) {
    actualIpSetReferenceStatement = ipSetReferenceStatement;
  } else {
    const foundIpSet = ipSets.find((ipSet) => ipSet.name === `${prefix}-${stage}-${webAclName}-${ipSetReferenceStatement.arn}`);
    if (foundIpSet === undefined) throw new Error(`IPSet ${ipSetReferenceStatement.arn} not found in stack`);
    actualIpSetReferenceStatement = {
      arn: cdk.Fn.getAtt(foundIpSet.logicalId, "Arn").toString(),
      ipSetForwardedIpConfig: ipSetReferenceStatement.ipSetForwardedIpConfig
    };
  }
  const statement : wafv2.CfnWebACL.StatementProperty = {
    ipSetReferenceStatement: actualIpSetReferenceStatement
  };
  return statement;
}

/**
   * Function to return the actual RegexPatternSetReferenceStatementProperty
   * @param regexPatternSetStatement wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty
   * @param prefix string
   * @param stage string
   * @param regexPatternSets cdk.aws_wafv2.CfnRegexPatternSet[]
   */
function getActualRegexPatternSetReferenceStatementProperty(regexPatternSetStatement: wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty, prefix: string, stage: string, regexPatternSets: cdk.aws_wafv2.CfnRegexPatternSet[]) {
  let actualRegexPAtternSetReferenceStatement: wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty;
  if (regexPatternSetStatement.arn.startsWith("arn")) {
    actualRegexPAtternSetReferenceStatement = regexPatternSetStatement;
  } else {
    const foundRegexPatternSet = regexPatternSets.find((regexPatternSet) => regexPatternSet.name === `${prefix}-${stage}-${regexPatternSetStatement.arn}`);
    if (foundRegexPatternSet === undefined) throw new Error(`RegexPatternSet ${regexPatternSetStatement.arn} not found in stack`);
    actualRegexPAtternSetReferenceStatement = {
      arn: cdk.Fn.getAtt(foundRegexPatternSet.logicalId, "Arn").toString(),
      fieldToMatch: regexPatternSetStatement.fieldToMatch,
      textTransformations: regexPatternSetStatement.textTransformations
    };
  }
  const statement : wafv2.CfnWebACL.StatementProperty = {
    regexPatternSetReferenceStatement: actualRegexPAtternSetReferenceStatement
  };
  return statement;
}

/**
   * Function to transform RuleStatements in NotStatements
   * @param notStatement wafv2.CfnWebACL.NotStatementProperty
   * @param prefix string
   * @param stage string
   * @param ipSets cdk.aws_wafv2.CfnIPSet[]
   * @param regexPatternSets cdk.aws_wafv2.CfnRegexPatternSet[]
   * @returns adjustedNotStatement
   */
function handleNotStatement(notStatement: wafv2.CfnWebACL.NotStatementProperty, prefix: string, stage: string, webAclName: string, ipSets?: cdk.aws_wafv2.CfnIPSet[], regexPatternSets?: cdk.aws_wafv2.CfnRegexPatternSet[]) {
  let statement = notStatement.statement as wafv2.CfnWebACL.StatementProperty;
  const notipSetReferenceStatement = statement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
  if (notipSetReferenceStatement && ipSets) {
    statement = getActualIpReferenceStatementInStatement(notipSetReferenceStatement, prefix, stage, webAclName, ipSets);
  }
  const notregexPatternSetReferenceStatement = statement.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
  if(notregexPatternSetReferenceStatement && regexPatternSets) {
    statement = getActualRegexPatternSetReferenceStatementProperty(notregexPatternSetReferenceStatement, prefix, stage, regexPatternSets);
  }
  const adjustedStatement = {notStatement: {statement}};
  return adjustedStatement as wafv2.CfnWebACL.StatementProperty;
}

/**
   * Function to transform RuleStatements in And- and OrStatements
   * @param statements wafv2.CfnWebACL.StatementProperty[]
   * @param prefix string
   * @param stage string
   * @param ipSets cdk.aws_wafv2.CfnIPSet[]
   * @param regexPatternSets cdk.aws_wafv2.CfnRegexPatternSet[]
   */
function handleAndOrStatement(statements: wafv2.CfnWebACL.StatementProperty[], prefix: string, stage: string, webAclName: string, ipSets?: cdk.aws_wafv2.CfnIPSet[], regexPatternSets?: cdk.aws_wafv2.CfnRegexPatternSet[]){
  for (let i=0; i<statements.length; i++) {
    const ipSetReferenceStatement = statements[i].ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
    if (ipSetReferenceStatement && ipSets) {
      statements[i] = getActualIpReferenceStatementInStatement(ipSetReferenceStatement, prefix, stage, webAclName, ipSets);
    }
    const regexPatternSetReferenceStatement = statements[i].regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
    if(regexPatternSetReferenceStatement && regexPatternSets) {
      statements[i] = getActualRegexPatternSetReferenceStatementProperty(regexPatternSetReferenceStatement, prefix, stage, regexPatternSets);
    }
    const notStatement = statements[i].notStatement as wafv2.CfnWebACL.NotStatementProperty | undefined;
    if(notStatement && (ipSets || regexPatternSets)) {
      const adjustedstatement = handleNotStatement(notStatement, prefix, stage, webAclName, ipSets, regexPatternSets);
      statements[i] = adjustedstatement;
    }
    const rateBasedStatement = statements[i].rateBasedStatement as wafv2.CfnWebACL.RateBasedStatementProperty | undefined;
    if(rateBasedStatement && (ipSets || regexPatternSets)) {
      const adjustedstatement = handleRateBasedStatement(rateBasedStatement, prefix, stage, webAclName, ipSets, regexPatternSets);
      statements[i] = adjustedstatement;
    }
  }
}


/**
   * Function to transform RuleStatements in RateBasedStatements
   * @param statements wafv2.CfnWebACL.RateBasedStatementProperty
   * @param prefix string
   * @param stage string
   * @param ipSets cdk.aws_wafv2.CfnIPSet[]
   * @param regexPatternSets cdk.aws_wafv2.CfnRegexPatternSet[]
   */
function handleRateBasedStatement(rateBasedStatement: wafv2.CfnWebACL.RateBasedStatementProperty, prefix: string, stage: string, webAclName: string, ipSets?: cdk.aws_wafv2.CfnIPSet[], regexPatternSets?: cdk.aws_wafv2.CfnRegexPatternSet[]) {
  const scopeDownStatement = rateBasedStatement.scopeDownStatement as wafv2.CfnWebACL.StatementProperty | undefined;
  if(scopeDownStatement) {
    const ipSetReferenceStatement = scopeDownStatement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
    if (ipSetReferenceStatement && ipSets) {
      const actualIpSetReferenceStatement = getActualIpReferenceStatementInStatement(ipSetReferenceStatement, prefix, stage, webAclName, ipSets);
      rateBasedStatement = {
        ...rateBasedStatement,
        scopeDownStatement: actualIpSetReferenceStatement
      };
      return {rateBasedStatement} as wafv2.CfnWebACL.StatementProperty;
    }
    const regexPatternSetReferenceStatement = scopeDownStatement.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
    if (regexPatternSetReferenceStatement && regexPatternSets) {
      const actualRegexPatternSetReferenceStatement = getActualRegexPatternSetReferenceStatementProperty(regexPatternSetReferenceStatement, prefix, stage, regexPatternSets);
      rateBasedStatement = {
        ...rateBasedStatement,
        scopeDownStatement: actualRegexPatternSetReferenceStatement
      };
      return {rateBasedStatement} as wafv2.CfnWebACL.StatementProperty;
    }
  }
  return {rateBasedStatement} as wafv2.CfnWebACL.StatementProperty;
}

/**
 * The function converts the value of all properties with supplied name into a Uint8Array
 * @param rulesObject Rules Object or Array of Rules Object
 * @param propertyName name of the properties which have to be converted
 * @returns converted Rules
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertPropValuesToUint8Array(rulesObject: Record<string, any>, propertyName: string): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convertedObject: Record<string, any> = {};
  for (const origKey in rulesObject) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    if (Object.prototype.hasOwnProperty.call(rulesObject, origKey)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      let value = rulesObject[origKey];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (value instanceof Array || (value !== null && value.constructor === Object)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        value = convertPropValuesToUint8Array(value, propertyName);
      }
      if (origKey === propertyName) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        value = convertStringToUint8Array(value);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      convertedObject[origKey] = value;
    }
  }
  return convertedObject;
}

/**
 * The function returns Uint8 representation of a string
 * @param stringToConvert string which has to be converted to Uint8Array
 * @returns the desired Uint8Array representation of the string
 */
export function convertStringToUint8Array(stringToConvert: string): Uint8Array {
  const buf = new ArrayBuffer(stringToConvert.length * 2); // 2 bytes for each char
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = stringToConvert.length; i < strLen; i++) {
    bufView[i] = stringToConvert.charCodeAt(i);
  }
  return bufView;
}
