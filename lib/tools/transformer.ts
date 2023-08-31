/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/naming-convention */
import { aws_wafv2 as wafv2 } from "aws-cdk-lib";
import { NotStatement, LabelMatchStatement, OrStatement, AndStatement, XssMatchStatement, SqliMatchStatement, RegexPatternSetReferenceStatement, Statement,
  IPSetReferenceStatement, SizeConstraintStatement, Rule, RegexMatchStatement, RateBasedStatement,
  ByteMatchStatement, GeoMatchStatement } from "@aws-sdk/client-wafv2";
import {convertStringToUint8Array} from "./helpers";

/**
 * The function will map a CDK ByteMatchStatement Property to a SDK ByteMatchStatement Property
 * @param statement object of a CDK ByteMatchStatement Property
 * @return configuration object of a SDK ByteMatchStatement Property
 */
export function transformByteMatchStatement(statement: wafv2.CfnWebACL.ByteMatchStatementProperty): ByteMatchStatement {
  const bmst = statement as wafv2.CfnWebACL.ByteMatchStatementProperty | undefined;
  let ByteMatchStatement = undefined;
  if (bmst) {
    let FieldToMatch = undefined;
    if (bmst.fieldToMatch) {
      const ftm = bmst.fieldToMatch as wafv2.CfnWebACL.FieldToMatchProperty;
      let Body = undefined;
      if (ftm.body) {
        const ftmBody = ftm.body as wafv2.CfnWebACL.BodyProperty;
        Body = {
          OversizeHandling: ftmBody.oversizeHandling ? ftmBody.oversizeHandling as string : undefined,
        };
      }
      let SingleHeader = undefined;
      if(ftm.singleHeader){
        SingleHeader = {
          Name: ftm.singleHeader.name,
        };
      }
      let SingleQueryArgument = undefined;
      if(ftm.singleQueryArgument){
        SingleQueryArgument ={
          Name: ftm.singleQueryArgument.name,
        };
      }
      let UriPath = undefined;
      if(ftm.uriPath){
        UriPath ={
          Path: ftm.uriPath.path,
        };
      }
      let JsonBody = undefined;
      if (ftm.jsonBody) {
        const ftmJsonBody = ftm.jsonBody as wafv2.CfnWebACL.JsonBodyProperty;
        let IncludedPaths = undefined;
        let MatchPattern = undefined;
        if(ftmJsonBody.matchPattern){
          const mp = ftmJsonBody.matchPattern as wafv2.CfnWebACL.JsonMatchPatternProperty;
          IncludedPaths = mp.includedPaths as string[];
          MatchPattern = {
            IncludedPaths,
            All: mp.all,
          };
        }
        JsonBody = {
          OversizeHandling: ftmJsonBody.oversizeHandling ? ftmJsonBody.oversizeHandling as string : undefined,
          MatchPattern,
        };
      }
      let Cookies = undefined;
      if(ftm.cookies){
        const fmtCookies = ftm.cookies as wafv2.CfnWebACL.CookiesProperty;
        let MatchPattern = undefined;
        if(fmtCookies.matchPattern){
          const cmp = fmtCookies.matchPattern as wafv2.CfnWebACL.CookieMatchPatternProperty;
          MatchPattern = {
            IncludedCookies: cmp.includedCookies as string[],
            ExcludedCookies: cmp.excludedCookies as string[],
            All: cmp.all,
          };
        }
        Cookies = {
          MatchPattern,
          MatchScope: fmtCookies.matchScope,
          OversizeHandling: fmtCookies.oversizeHandling as string,
        };
      }
      let Headers = undefined;
      if(ftm.headers){
        const fmtHeaders = ftm.headers as wafv2.CfnWebACL.HeadersProperty;
        let MatchPattern = undefined;
        if(fmtHeaders.matchPattern){
          const hmp = fmtHeaders.matchPattern as wafv2.CfnWebACL.HeaderMatchPatternProperty;
          MatchPattern = {
            IncludedHeaders: hmp.includedHeaders as string[],
            ExcludedHeaders: hmp.excludedHeaders as string[],
            All: hmp.all,
          };
        }
        Headers = {
          MatchPattern,
          MatchScope: fmtHeaders.matchScope,
          OversizeHandling: fmtHeaders.oversizeHandling as string,
        };
      }
      FieldToMatch = {
        AllQueryArguments: ftm.allQueryArguments,
        Body,
        SingleHeader,
        UriPath,
        SingleQueryArgument,
        Method: ftm.method,
        QueryString: ftm.queryString,
        JsonBody,
        Cookies,
        Headers
      };
    }
    let TextTransformations = undefined;
    if (bmst.textTransformations) {
      TextTransformations = [];
      (bmst.textTransformations as wafv2.CfnWebACL.TextTransformationProperty[]).forEach((tt) => {
        TextTransformations?.push({
          Priority: tt.priority,
          Type: tt.type
        });
      });
    }
    ByteMatchStatement = {
      PositionalConstraint: bmst.positionalConstraint ? bmst.positionalConstraint : undefined,
      SearchString: bmst.searchString ? convertStringToUint8Array(bmst.searchString) : undefined,
      TextTransformations,
      FieldToMatch
    };
  }
  return ByteMatchStatement as ByteMatchStatement;
}

/**
 * The function will map a CDK RegexMatchStatement Property to a SDK RegexMatchStatement Property
 * @param statement object of a CDK RegexMatchStatement Property
 * @return configuration object of a SDK RegexMatchStatement Property
 */
export function transformRegexMatchStatement(statement: wafv2.CfnWebACL.RegexMatchStatementProperty): RegexMatchStatement {
  const rest = statement as wafv2.CfnWebACL.RegexMatchStatementProperty | undefined;
  let RegexMatchStatement = undefined;
  if (rest) {
    let FieldToMatch = undefined;
    if (rest.fieldToMatch) {
      const ftm = rest.fieldToMatch as wafv2.CfnWebACL.FieldToMatchProperty;
      let Body = undefined;
      if (ftm.body) {
        const ftmBody = ftm.body as wafv2.CfnWebACL.BodyProperty;
        Body = {
          OversizeHandling: ftmBody.oversizeHandling ? ftmBody.oversizeHandling as string : undefined,
        };
      }
      let SingleHeader = undefined;
      if(ftm.singleHeader){
        SingleHeader = {
          Name: ftm.singleHeader.name,
        };
      }
      let SingleQueryArgument = undefined;
      if(ftm.singleQueryArgument){
        SingleQueryArgument ={
          Name: ftm.singleQueryArgument.name,
        };
      }
      let UriPath = undefined;
      if(ftm.uriPath){
        UriPath ={
          Path: ftm.uriPath.path,
        };
      }
      let JsonBody = undefined;
      if (ftm.jsonBody) {
        const ftmJsonBody = ftm.jsonBody as wafv2.CfnWebACL.JsonBodyProperty;
        let IncludedPaths = undefined;
        let MatchPattern = undefined;
        if(ftmJsonBody.matchPattern){
          const mp = ftmJsonBody.matchPattern as wafv2.CfnWebACL.JsonMatchPatternProperty;
          IncludedPaths = mp.includedPaths as string[];
          MatchPattern = {
            IncludedPaths,
            All: mp.all,
          };
        }
        JsonBody = {
          OversizeHandling: ftmJsonBody.oversizeHandling ? ftmJsonBody.oversizeHandling as string : undefined,
          MatchPattern,
        };
      }
      let Cookies = undefined;
      if(ftm.cookies){
        const fmtCookies = ftm.cookies as wafv2.CfnWebACL.CookiesProperty;
        let MatchPattern = undefined;
        if(fmtCookies.matchPattern){
          const cmp = fmtCookies.matchPattern as wafv2.CfnWebACL.CookieMatchPatternProperty;
          MatchPattern = {
            IncludedCookies: cmp.includedCookies as string[],
            ExcludedCookies: cmp.excludedCookies as string[],
            All: cmp.all,
          };
        }
        Cookies = {
          MatchPattern,
          MatchScope: fmtCookies.matchScope,
          OversizeHandling: fmtCookies.oversizeHandling as string,
        };
      }
      let Headers = undefined;
      if(ftm.headers){
        const fmtHeaders = ftm.headers as wafv2.CfnWebACL.HeadersProperty;
        let MatchPattern = undefined;
        if(fmtHeaders.matchPattern){
          const hmp = fmtHeaders.matchPattern as wafv2.CfnWebACL.HeaderMatchPatternProperty;
          MatchPattern = {
            IncludedHeaders: hmp.includedHeaders as string[],
            ExcludedHeaders: hmp.excludedHeaders as string[],
            All: hmp.all,
          };
        }
        Headers = {
          MatchPattern,
          MatchScope: fmtHeaders.matchScope,
          OversizeHandling: fmtHeaders.oversizeHandling as string,
        };
      }
      FieldToMatch = {
        AllQueryArguments: ftm.allQueryArguments,
        Body,
        SingleHeader,
        UriPath,
        SingleQueryArgument,
        Method: ftm.method,
        QueryString: ftm.queryString,
        JsonBody,
        Cookies,
        Headers
      };
    }
    let TextTransformations = undefined;
    if (rest.textTransformations) {
      TextTransformations = [];
      (rest.textTransformations as wafv2.CfnWebACL.TextTransformationProperty[]).forEach((tt) => {
        TextTransformations?.push({
          Priority: tt.priority,
          Type: tt.type
        });
      });
    }
    RegexMatchStatement = {
      RegexString: rest.regexString,
      TextTransformations,
      FieldToMatch
    };
  }
  return RegexMatchStatement as RegexMatchStatement;
}

/**
 * The function will map a CDK GeoMatchStatement Property to a SDK GeoMatchStatement Property
 * @param statement object of a CDK GeoMatchStatement Property
 * @return configuration object of a SDK GeoMatchStatement Property
 */
export function transformGeoMatchStatement(statement: wafv2.CfnWebACL.GeoMatchStatementProperty): GeoMatchStatement {
  const gmst = statement as wafv2.CfnWebACL.GeoMatchStatementProperty | undefined;
  let GeoMatchStatement = undefined;
  if (gmst) {
    let ForwardedIPConfig = undefined;
    if (gmst.forwardedIpConfig) {
      const fic = gmst.forwardedIpConfig as wafv2.CfnWebACL.ForwardedIPConfigurationProperty;
      ForwardedIPConfig ={
        FallbackBehavior: fic.fallbackBehavior,
        HeaderName: fic.headerName
      };
    }
    GeoMatchStatement = {
      ForwardedIPConfig,
      CountryCodes: gmst.countryCodes
    };
  }
  return GeoMatchStatement as GeoMatchStatement;
}

/**
 * The function will map a CDK SizeConstraintStatement Property to a SDK SizeConstraintStatement Property
 * @param statement object of a CDK SizeConstraintStatement Property
 * @return configuration object of a SDK SizeConstraintStatement Property
 */
export function transformSizeConstraintStatement(statement: wafv2.CfnWebACL.SizeConstraintStatementProperty): SizeConstraintStatement {
  const szst = statement as wafv2.CfnWebACL.SizeConstraintStatementProperty | undefined;
  let SizeConstraintStatement = undefined;
  if (szst) {
    let FieldToMatch = undefined;
    if (szst.fieldToMatch) {
      const ftm = szst.fieldToMatch as wafv2.CfnWebACL.FieldToMatchProperty;
      let Body = undefined;
      if (ftm.body) {
        const ftmBody = ftm.body as wafv2.CfnWebACL.BodyProperty;
        Body = {
          OversizeHandling: ftmBody.oversizeHandling ? ftmBody.oversizeHandling as string : undefined,
        };
      }
      let SingleHeader = undefined;
      if(ftm.singleHeader){
        SingleHeader = {
          Name: ftm.singleHeader.name,
        };
      }
      let SingleQueryArgument = undefined;
      if(ftm.singleQueryArgument){
        SingleQueryArgument ={
          Name: ftm.singleQueryArgument.name,
        };
      }
      let UriPath = undefined;
      if(ftm.uriPath){
        UriPath ={
          Path: ftm.uriPath.path,
        };
      }
      let JsonBody = undefined;
      if (ftm.jsonBody) {
        const ftmJsonBody = ftm.jsonBody as wafv2.CfnWebACL.JsonBodyProperty;
        let IncludedPaths = undefined;
        let MatchPattern = undefined;
        if(ftmJsonBody.matchPattern){
          const mp = ftmJsonBody.matchPattern as wafv2.CfnWebACL.JsonMatchPatternProperty;
          IncludedPaths = mp.includedPaths as string[];
          MatchPattern = {
            IncludedPaths,
            All: mp.all,
          };
        }
        JsonBody = {
          OversizeHandling: ftmJsonBody.oversizeHandling ? ftmJsonBody.oversizeHandling as string : undefined,
          MatchPattern,
        };
      }
      let Cookies = undefined;
      if(ftm.cookies){
        const fmtCookies = ftm.cookies as wafv2.CfnWebACL.CookiesProperty;
        let MatchPattern = undefined;
        if(fmtCookies.matchPattern){
          const cmp = fmtCookies.matchPattern as wafv2.CfnWebACL.CookieMatchPatternProperty;
          MatchPattern = {
            IncludedCookies: cmp.includedCookies as string[],
            ExcludedCookies: cmp.excludedCookies as string[],
            All: cmp.all,
          };
        }
        Cookies = {
          MatchPattern,
          MatchScope: fmtCookies.matchScope,
          OversizeHandling: fmtCookies.oversizeHandling as string,
        };
      }
      let Headers = undefined;
      if(ftm.headers){
        const fmtHeaders = ftm.headers as wafv2.CfnWebACL.HeadersProperty;
        let MatchPattern = undefined;
        if(fmtHeaders.matchPattern){
          const hmp = fmtHeaders.matchPattern as wafv2.CfnWebACL.HeaderMatchPatternProperty;
          MatchPattern = {
            IncludedHeaders: hmp.includedHeaders as string[],
            ExcludedHeaders: hmp.excludedHeaders as string[],
            All: hmp.all,
          };
        }
        Headers = {
          MatchPattern,
          MatchScope: fmtHeaders.matchScope,
          OversizeHandling: fmtHeaders.oversizeHandling as string,
        };
      }

      FieldToMatch = {
        AllQueryArguments: ftm.allQueryArguments,
        Body,
        SingleHeader,
        UriPath,
        SingleQueryArgument,
        Method: ftm.method,
        QueryString: ftm.queryString,
        JsonBody,
        Cookies,
        Headers
      };
    }
    let TextTransformations = undefined;
    if (szst.textTransformations) {
      TextTransformations = [];
      (szst.textTransformations as wafv2.CfnWebACL.TextTransformationProperty[]).forEach((tt) => {
        TextTransformations?.push({
          Priority: tt.priority,
          Type: tt.type
        });
      });
    }
    SizeConstraintStatement = {
      TextTransformations,
      FieldToMatch,
      ComparisonOperator: szst.comparisonOperator,
      Size: szst.size,
    };
  }
  return SizeConstraintStatement as SizeConstraintStatement;
}

/**
 * The function will map a CDK IPSetReferenceStatement Property to a SDK IPSetReferenceStatement Property
 * @param statement object of a CDK IPSetReferenceStatement Property
 * @return configuration object of a SDK IPSetReferenceStatement Property
 */
export function transformIPSetReferenceStatement(statement: wafv2.CfnWebACL.IPSetReferenceStatementProperty): IPSetReferenceStatement {
  const ipsst = statement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
  let IPSetReferenceStatement = undefined;
  if (ipsst) {
    let IPSetForwardedIPConfig = undefined;
    if (ipsst.ipSetForwardedIpConfig) {
      const fic = ipsst.ipSetForwardedIpConfig as wafv2.CfnWebACL.IPSetForwardedIPConfigurationProperty;
      IPSetForwardedIPConfig = {
        FallbackBehavior: fic.fallbackBehavior,
        HeaderName: fic.headerName,
        Position: fic.position,
      };
    }
    IPSetReferenceStatement = {
      ARN: ipsst.arn,
      IPSetForwardedIPConfig,
    };
  }
  return IPSetReferenceStatement as IPSetReferenceStatement;
}

/**
 * The function will map a CDK RegexPatternSetReferenceStatement Property to a SDK RegexPatternSetReferenceStatement Property
 * @param statement object of a CDK RegexPatternSetReferenceStatement Property
 * @return configuration object of a SDK RegexPatternSetReferenceStatement Property
 */
export function transformRegexPatternSetReferenceStatement(statement: wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty): RegexPatternSetReferenceStatement {
  const regpst = statement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
  let RegexPatternSetReferenceStatement = undefined;
  if (regpst) {
    let FieldToMatch = undefined;
    if (regpst.fieldToMatch) {
      const ftm = regpst.fieldToMatch as wafv2.CfnWebACL.FieldToMatchProperty;
      let Body = undefined;
      if (ftm.body) {
        const ftmBody = ftm.body as wafv2.CfnWebACL.BodyProperty;
        Body = {
          OversizeHandling: ftmBody.oversizeHandling ? ftmBody.oversizeHandling as string : undefined,
        };
      }
      let SingleHeader = undefined;
      if(ftm.singleHeader){
        SingleHeader = {
          Name: ftm.singleHeader.name,
        };
      }
      let SingleQueryArgument = undefined;
      if(ftm.singleQueryArgument){
        SingleQueryArgument ={
          Name: ftm.singleQueryArgument.name,
        };
      }
      let UriPath = undefined;
      if(ftm.uriPath){
        UriPath ={
          Path: ftm.uriPath.path,
        };
      }
      let JsonBody = undefined;
      if (ftm.jsonBody) {
        const ftmJsonBody = ftm.jsonBody as wafv2.CfnWebACL.JsonBodyProperty;
        let IncludedPaths = undefined;
        let MatchPattern = undefined;
        if(ftmJsonBody.matchPattern){
          const mp = ftmJsonBody.matchPattern as wafv2.CfnWebACL.JsonMatchPatternProperty;
          IncludedPaths = mp.includedPaths as string[];
          MatchPattern = {
            IncludedPaths,
            All: mp.all,
          };
        }
        JsonBody = {
          OversizeHandling: ftmJsonBody.oversizeHandling ? ftmJsonBody.oversizeHandling as string : undefined,
          MatchPattern,
        };
      }
      let Cookies = undefined;
      if(ftm.cookies){
        const fmtCookies = ftm.cookies as wafv2.CfnWebACL.CookiesProperty;
        let MatchPattern = undefined;
        if(fmtCookies.matchPattern){
          const cmp = fmtCookies.matchPattern as wafv2.CfnWebACL.CookieMatchPatternProperty;
          MatchPattern = {
            IncludedCookies: cmp.includedCookies as string[],
            ExcludedCookies: cmp.excludedCookies as string[],
            All: cmp.all,
          };
        }
        Cookies = {
          MatchPattern,
          MatchScope: fmtCookies.matchScope,
          OversizeHandling: fmtCookies.oversizeHandling as string,
        };
      }
      let Headers = undefined;
      if(ftm.headers){
        const fmtHeaders = ftm.headers as wafv2.CfnWebACL.HeadersProperty;
        let MatchPattern = undefined;
        if(fmtHeaders.matchPattern){
          const hmp = fmtHeaders.matchPattern as wafv2.CfnWebACL.HeaderMatchPatternProperty;
          MatchPattern = {
            IncludedHeaders: hmp.includedHeaders as string[],
            ExcludedHeaders: hmp.excludedHeaders as string[],
            All: hmp.all,
          };
        }
        Headers = {
          MatchPattern,
          MatchScope: fmtHeaders.matchScope,
          OversizeHandling: fmtHeaders.oversizeHandling as string,
        };
      }
      FieldToMatch = {
        AllQueryArguments: ftm.allQueryArguments,
        Body,
        SingleHeader,
        UriPath,
        SingleQueryArgument,
        Method: ftm.method,
        QueryString: ftm.queryString,
        JsonBody,
        Cookies,
        Headers
      };
    }
    let TextTransformations = undefined;
    if (regpst.textTransformations) {
      TextTransformations = [];
      (regpst.textTransformations as wafv2.CfnWebACL.TextTransformationProperty[]).forEach((tt) => {
        TextTransformations?.push({
          Priority: tt.priority,
          Type: tt.type
        });
      });
    }
    RegexPatternSetReferenceStatement = {
      TextTransformations,
      FieldToMatch,
      ARN: regpst.arn,
    };
  }
  return RegexPatternSetReferenceStatement as RegexPatternSetReferenceStatement;
}

/**
 * The function will map a CDK SqliMatchStatement Property to a SDK SqliMatchStatement Property
 * @param statement object of a CDK SqliMatchStatement Property
 * @return configuration object of a SDK SqliMatchStatement Property
 */
export function transformSqliMatchStatement(statement: wafv2.CfnWebACL.SqliMatchStatementProperty): SqliMatchStatement {
  const sqlst = statement as wafv2.CfnWebACL.SqliMatchStatementProperty | undefined;
  let SqliMatchStatement = undefined;
  if (sqlst) {
    let FieldToMatch = undefined;
    if (sqlst.fieldToMatch) {
      const ftm = sqlst.fieldToMatch as wafv2.CfnWebACL.FieldToMatchProperty;
      let Body = undefined;
      if (ftm.body) {
        const ftmBody = ftm.body as wafv2.CfnWebACL.BodyProperty;
        Body = {
          OversizeHandling: ftmBody.oversizeHandling ? ftmBody.oversizeHandling as string : undefined,
        };
      }
      let SingleHeader = undefined;
      if(ftm.singleHeader){
        SingleHeader = {
          Name: ftm.singleHeader.name,
        };
      }
      let SingleQueryArgument = undefined;
      if(ftm.singleQueryArgument){
        SingleQueryArgument ={
          Name: ftm.singleQueryArgument.name,
        };
      }
      let UriPath = undefined;
      if(ftm.uriPath){
        UriPath ={
          Path: ftm.uriPath.path,
        };
      }
      let JsonBody = undefined;
      if (ftm.jsonBody) {
        const ftmJsonBody = ftm.jsonBody as wafv2.CfnWebACL.JsonBodyProperty;
        let IncludedPaths = undefined;
        let MatchPattern = undefined;
        if(ftmJsonBody.matchPattern){
          const mp = ftmJsonBody.matchPattern as wafv2.CfnWebACL.JsonMatchPatternProperty;
          IncludedPaths = mp.includedPaths as string[];
          MatchPattern = {
            IncludedPaths,
            All: mp.all,
          };
        }
        JsonBody = {
          OversizeHandling: ftmJsonBody.oversizeHandling ? ftmJsonBody.oversizeHandling as string : undefined,
          MatchPattern,
        };
      }
      let Cookies = undefined;
      if(ftm.cookies){
        const fmtCookies = ftm.cookies as wafv2.CfnWebACL.CookiesProperty;
        let MatchPattern = undefined;
        if(fmtCookies.matchPattern){
          const cmp = fmtCookies.matchPattern as wafv2.CfnWebACL.CookieMatchPatternProperty;
          MatchPattern = {
            IncludedCookies: cmp.includedCookies as string[],
            ExcludedCookies: cmp.excludedCookies as string[],
            All: cmp.all,
          };
        }
        Cookies = {
          MatchPattern,
          MatchScope: fmtCookies.matchScope,
          OversizeHandling: fmtCookies.oversizeHandling as string,
        };
      }
      let Headers = undefined;
      if(ftm.headers){
        const fmtHeaders = ftm.headers as wafv2.CfnWebACL.HeadersProperty;
        let MatchPattern = undefined;
        if(fmtHeaders.matchPattern){
          const hmp = fmtHeaders.matchPattern as wafv2.CfnWebACL.HeaderMatchPatternProperty;
          MatchPattern = {
            IncludedHeaders: hmp.includedHeaders as string[],
            ExcludedHeaders: hmp.excludedHeaders as string[],
            All: hmp.all,
          };
        }
        Headers = {
          MatchPattern,
          MatchScope: fmtHeaders.matchScope,
          OversizeHandling: fmtHeaders.oversizeHandling as string,
        };
      }
      FieldToMatch = {
        AllQueryArguments: ftm.allQueryArguments,
        Body,
        SingleHeader,
        UriPath,
        SingleQueryArgument,
        Method: ftm.method,
        QueryString: ftm.queryString,
        JsonBody,
        Cookies,
        Headers
      };
    }
    let TextTransformations = undefined;
    if (sqlst.textTransformations) {
      TextTransformations = [];
      (sqlst.textTransformations as wafv2.CfnWebACL.TextTransformationProperty[]).forEach((tt) => {
        TextTransformations?.push({
          Priority: tt.priority,
          Type: tt.type
        });
      });
    }
    SqliMatchStatement = {
      TextTransformations,
      FieldToMatch,
      SensitivityLevel: sqlst.sensitivityLevel,
    };
  }
  return SqliMatchStatement as SqliMatchStatement;
}

/**
 * The function will map a CDK XssMatchStatement Property to a SDK XssMatchStatement Property
 * @param statement object of a CDK XssMatchStatement Property
 * @return configuration object of a SDK XssMatchStatement Property
 */
export function transformXssMatchStatement(statement: wafv2.CfnWebACL.XssMatchStatementProperty): XssMatchStatement {
  const xsst = statement as wafv2.CfnWebACL.XssMatchStatementProperty | undefined;
  let XssMatchStatement = undefined;
  if (xsst) {
    let FieldToMatch = undefined;
    if (xsst.fieldToMatch) {
      const ftm = xsst.fieldToMatch as wafv2.CfnWebACL.FieldToMatchProperty;
      let Body = undefined;
      if (ftm.body) {
        const ftmBody = ftm.body as wafv2.CfnWebACL.BodyProperty;
        Body = {
          OversizeHandling: ftmBody.oversizeHandling ? ftmBody.oversizeHandling as string : undefined,
        };
      }
      let SingleHeader = undefined;
      if(ftm.singleHeader){
        SingleHeader = {
          Name: ftm.singleHeader.name,
        };
      }
      let SingleQueryArgument = undefined;
      if(ftm.singleQueryArgument){
        SingleQueryArgument ={
          Name: ftm.singleQueryArgument.name,
        };
      }
      let UriPath = undefined;
      if(ftm.uriPath){
        UriPath ={
          Path: ftm.uriPath.path,
        };
      }
      let JsonBody = undefined;
      if (ftm.jsonBody) {
        const ftmJsonBody = ftm.jsonBody as wafv2.CfnWebACL.JsonBodyProperty;
        let IncludedPaths = undefined;
        let MatchPattern = undefined;
        if(ftmJsonBody.matchPattern){
          const mp = ftmJsonBody.matchPattern as wafv2.CfnWebACL.JsonMatchPatternProperty;
          IncludedPaths = mp.includedPaths as string[];
          MatchPattern = {
            IncludedPaths,
            All: mp.all,
          };
        }
        JsonBody = {
          OversizeHandling: ftmJsonBody.oversizeHandling ? ftmJsonBody.oversizeHandling as string : undefined,
          MatchPattern,
        };
      }
      let Cookies = undefined;
      if(ftm.cookies){
        const fmtCookies = ftm.cookies as wafv2.CfnWebACL.CookiesProperty;
        let MatchPattern = undefined;
        if(fmtCookies.matchPattern){
          const cmp = fmtCookies.matchPattern as wafv2.CfnWebACL.CookieMatchPatternProperty;
          MatchPattern = {
            IncludedCookies: cmp.includedCookies as string[],
            ExcludedCookies: cmp.excludedCookies as string[],
            All: cmp.all,
          };
        }
        Cookies = {
          MatchPattern,
          MatchScope: fmtCookies.matchScope,
          OversizeHandling: fmtCookies.oversizeHandling as string,
        };
      }
      let Headers = undefined;
      if(ftm.headers){
        const fmtHeaders = ftm.headers as wafv2.CfnWebACL.HeadersProperty;
        let MatchPattern = undefined;
        if(fmtHeaders.matchPattern){
          const hmp = fmtHeaders.matchPattern as wafv2.CfnWebACL.HeaderMatchPatternProperty;
          MatchPattern = {
            IncludedHeaders: hmp.includedHeaders as string[],
            ExcludedHeaders: hmp.excludedHeaders as string[],
            All: hmp.all,
          };
        }
        Headers = {
          MatchPattern,
          MatchScope: fmtHeaders.matchScope,
          OversizeHandling: fmtHeaders.oversizeHandling as string,
        };
      }
      FieldToMatch = {
        AllQueryArguments: ftm.allQueryArguments,
        Body,
        SingleHeader,
        UriPath,
        SingleQueryArgument,
        Method: ftm.method,
        QueryString: ftm.queryString,
        JsonBody,
        Cookies,
        Headers
      };
    }
    let TextTransformations = undefined;
    if (xsst.textTransformations) {
      TextTransformations = [];
      (xsst.textTransformations as wafv2.CfnWebACL.TextTransformationProperty[]).forEach((tt) => {
        TextTransformations?.push({
          Priority: tt.priority,
          Type: tt.type
        });
      });
    }
    XssMatchStatement ={
      TextTransformations,
      FieldToMatch,
    };
  }
  return XssMatchStatement as XssMatchStatement;
}

/**
 * The function will map a CDK And/OrStatement Property to a SDK And/OrStatement Property  Property
 * @param statement object of a CDK And/OrStatement Property  Property
 * @return configuration object of a SDK And/OrStatement Property  Property
 */
export function transformConcatenatedStatement(statement: wafv2.CfnWebACL.AndStatementProperty | wafv2.CfnWebACL.OrStatementProperty, isandStatement:boolean): AndStatement | OrStatement | undefined {
  const Statements = [];
  let ConcatenatedStatement = undefined;
  if(statement.statements && Array.isArray(statement.statements)){
    for (const currentstatement of statement.statements as wafv2.CfnWebACL.StatementProperty[]) {
      const Statement: Statement ={};
      let ByteMatchStatement = undefined;
      let GeoMatchStatement = undefined;
      let IPSetReferenceStatement = undefined;
      let RegexPatternSetReferenceStatement = undefined;
      let SizeConstraintStatement = undefined;
      let SqliMatchStatement = undefined;
      let XssMatchStatement = undefined;
      let LabelMatchStatement = undefined;
      let NotStatement = undefined;
      let RegexMatchStatement = undefined;
      let RateBasedStatement = undefined;
      switch(Object.keys(currentstatement)[0]){
        case "byteMatchStatement":
          ByteMatchStatement = transformByteMatchStatement(currentstatement.byteMatchStatement as wafv2.CfnWebACL.ByteMatchStatementProperty);
          Statement.ByteMatchStatement = ByteMatchStatement as ByteMatchStatement;
          break;
        case "geoMatchStatement":
          GeoMatchStatement = transformGeoMatchStatement(currentstatement.geoMatchStatement as wafv2.CfnWebACL.GeoMatchStatementProperty);
          Statement.GeoMatchStatement = GeoMatchStatement as GeoMatchStatement;
          break;
        case "ipSetReferenceStatement":
          IPSetReferenceStatement = transformIPSetReferenceStatement(currentstatement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty);
          Statement.IPSetReferenceStatement = IPSetReferenceStatement as IPSetReferenceStatement;
          break;
        case "regexPatternSetReferenceStatement":
          RegexPatternSetReferenceStatement = transformRegexPatternSetReferenceStatement(currentstatement.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty);
          Statement.RegexPatternSetReferenceStatement = RegexPatternSetReferenceStatement as RegexPatternSetReferenceStatement;
          break;
        case "sizeConstraintStatement":
          SizeConstraintStatement = transformSizeConstraintStatement(currentstatement.sizeConstraintStatement as wafv2.CfnWebACL.SizeConstraintStatementProperty);
          Statement.SizeConstraintStatement = SizeConstraintStatement as SizeConstraintStatement;
          break;
        case "sqliMatchStatement":
          SqliMatchStatement = transformSqliMatchStatement(currentstatement.sqliMatchStatement as wafv2.CfnWebACL.SqliMatchStatementProperty);
          Statement.SqliMatchStatement = SqliMatchStatement as SqliMatchStatement;
          break;
        case "xssMatchStatement":
          XssMatchStatement = transformXssMatchStatement(currentstatement.xssMatchStatement as wafv2.CfnWebACL.XssMatchStatementProperty);
          Statement.XssMatchStatement = XssMatchStatement as XssMatchStatement;
          break;
        case "labelMatchStatement":
          LabelMatchStatement = transformLabelMatchStatement(currentstatement.labelMatchStatement as wafv2.CfnWebACL.LabelMatchStatementProperty);
          Statement.LabelMatchStatement = LabelMatchStatement as LabelMatchStatement;
          break;
        case  "notStatement":
          NotStatement = tranformNotStatement(currentstatement.notStatement as wafv2.CfnWebACL.NotStatementProperty);
          Statement.NotStatement = NotStatement as NotStatement;
          break;
        case "regexMatchStatement":
          RegexMatchStatement = transformRegexMatchStatement(currentstatement.regexMatchStatement as wafv2.CfnWebACL.RegexMatchStatementProperty);
          Statement.RegexMatchStatement = RegexMatchStatement as RegexMatchStatement;
          break;
        case "rateBasedStatement":
          RateBasedStatement = tranformRateBasedStatement(currentstatement.rateBasedStatement as wafv2.CfnWebACL.RateBasedStatementProperty);
          Statement.RateBasedStatement = RateBasedStatement as RateBasedStatement;
          break;
        default:
          break;
      }
      Statements.push(Statement);
    }
    ConcatenatedStatement = {Statements};
    if(isandStatement){
      return ConcatenatedStatement as AndStatement;
    }
    else{
      return ConcatenatedStatement as OrStatement;
    }
  }
  else{
    return undefined;
  }
}

/**
 * The function will map a CDK LabelMatchStatement Property to a SDK LabelMatchStatement Property
 * @param statement object of a CDK LabelMatchStatement Property
 * @return configuration object of a SDK LabelMatchStatement Property
 */
export function transformLabelMatchStatement(statement: wafv2.CfnWebACL.LabelMatchStatementProperty): LabelMatchStatement {
  const lst = statement as wafv2.CfnWebACL.LabelMatchStatementProperty | undefined;
  let LabelMatchStatement = undefined;
  if (lst) {
    LabelMatchStatement = {
      Scope: lst.scope,
      Key: lst.key,
    };
  }
  return LabelMatchStatement as LabelMatchStatement;
}

/**
 * The function will map a CDK NotStatement Property to a SDK NotStatement Property
 * @param statement object of a CDK NotStatement Property
 * @return configuration object of a SDK NotStatement Property
 */
export function tranformNotStatement(statement: wafv2.CfnWebACL.NotStatementProperty): NotStatement {
  const nst = statement as wafv2.CfnWebACL.NotStatementProperty | undefined;
  let NotStatement = undefined;
  if (nst && nst.statement) {
    const Statement: Statement ={};
    let ByteMatchStatement = undefined;
    let GeoMatchStatement = undefined;
    let IPSetReferenceStatement = undefined;
    let RegexPatternSetReferenceStatement = undefined;
    let SizeConstraintStatement = undefined;
    let SqliMatchStatement = undefined;
    let XssMatchStatement = undefined;
    let LabelMatchStatement = undefined;
    let RegexMatchStatement = undefined;
    let RateBasedStatement = undefined;
    switch(Object.keys(nst.statement)[0]){
      case "byteMatchStatement":
        ByteMatchStatement = transformByteMatchStatement((nst.statement as wafv2.CfnWebACL.StatementProperty).byteMatchStatement as wafv2.CfnWebACL.ByteMatchStatementProperty);
        Statement.ByteMatchStatement = ByteMatchStatement as ByteMatchStatement;
        break;
      case "geoMatchStatement":
        GeoMatchStatement = transformGeoMatchStatement((nst.statement as wafv2.CfnWebACL.StatementProperty).geoMatchStatement as wafv2.CfnWebACL.GeoMatchStatementProperty);
        Statement.GeoMatchStatement = GeoMatchStatement as GeoMatchStatement;
        break;
      case "ipSetReferenceStatement":
        IPSetReferenceStatement = transformIPSetReferenceStatement((nst.statement as wafv2.CfnWebACL.StatementProperty).ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty);
        Statement.IPSetReferenceStatement = IPSetReferenceStatement as IPSetReferenceStatement;
        break;
      case "regexPatternSetReferenceStatement":
        RegexPatternSetReferenceStatement = transformRegexPatternSetReferenceStatement((nst.statement as wafv2.CfnWebACL.StatementProperty).regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty);
        Statement.RegexPatternSetReferenceStatement = RegexPatternSetReferenceStatement as RegexPatternSetReferenceStatement;
        break;
      case "sizeConstraintStatement":
        SizeConstraintStatement = transformSizeConstraintStatement((nst.statement as wafv2.CfnWebACL.StatementProperty).sizeConstraintStatement as wafv2.CfnWebACL.SizeConstraintStatementProperty);
        Statement.SizeConstraintStatement = SizeConstraintStatement as SizeConstraintStatement;
        break;
      case "sqliMatchStatement":
        SqliMatchStatement = transformSqliMatchStatement((nst.statement as wafv2.CfnWebACL.StatementProperty).sqliMatchStatement as wafv2.CfnWebACL.SqliMatchStatementProperty);
        Statement.SqliMatchStatement = SqliMatchStatement as SqliMatchStatement;
        break;
      case "xssMatchStatement":
        XssMatchStatement = transformXssMatchStatement((nst.statement as wafv2.CfnWebACL.StatementProperty).xssMatchStatement as wafv2.CfnWebACL.XssMatchStatementProperty);
        Statement.XssMatchStatement = XssMatchStatement as XssMatchStatement;
        break;
      case "labelMatchStatement":
        LabelMatchStatement = transformLabelMatchStatement((nst.statement as wafv2.CfnWebACL.StatementProperty).labelMatchStatement as wafv2.CfnWebACL.LabelMatchStatementProperty);
        Statement.LabelMatchStatement = LabelMatchStatement as LabelMatchStatement;
        break;
      case "regexMatchStatement":
        RegexMatchStatement = transformRegexMatchStatement((nst.statement as wafv2.CfnWebACL.StatementProperty).regexMatchStatement as wafv2.CfnWebACL.RegexMatchStatementProperty);
        Statement.RegexMatchStatement = RegexMatchStatement as RegexMatchStatement;
        break;
      case "rateBasedStatement":
        RateBasedStatement = tranformRateBasedStatement((nst.statement as wafv2.CfnWebACL.StatementProperty).rateBasedStatement as wafv2.CfnWebACL.RateBasedStatementProperty);
        Statement.RateBasedStatement = RateBasedStatement as RateBasedStatement;
        break;
      default:
        break;
    }
    NotStatement = {Statement};
  }
  return NotStatement as NotStatement;
}

/**
 * The function will map a CDK RateBasedStatement Property to a SDK RateBasedStatement Property
 * @param statement object of a CDK RateBasedStatement Property
 * @return configuration object of a SDK RateBasedStatement Property
 */
export function tranformRateBasedStatement(statement: wafv2.CfnWebACL.RateBasedStatementProperty): RateBasedStatement {
  const rbst = statement as wafv2.CfnWebACL.RateBasedStatementProperty | undefined;
  let RateBasedStatement = undefined;
  if (rbst && rbst.scopeDownStatement) {
    const Statement: Statement ={};
    let ByteMatchStatement = undefined;
    let GeoMatchStatement = undefined;
    let IPSetReferenceStatement = undefined;
    let RegexPatternSetReferenceStatement = undefined;
    let SizeConstraintStatement = undefined;
    let SqliMatchStatement = undefined;
    let XssMatchStatement = undefined;
    let LabelMatchStatement = undefined;
    let RegexMatchStatement = undefined;
    switch(Object.keys(rbst.scopeDownStatement)[0]){
      case "byteMatchStatement":
        ByteMatchStatement = transformByteMatchStatement((rbst.scopeDownStatement as wafv2.CfnWebACL.StatementProperty).byteMatchStatement as wafv2.CfnWebACL.ByteMatchStatementProperty);
        Statement.ByteMatchStatement = ByteMatchStatement as ByteMatchStatement;
        break;
      case "geoMatchStatement":
        GeoMatchStatement = transformGeoMatchStatement((rbst.scopeDownStatement as wafv2.CfnWebACL.StatementProperty).geoMatchStatement as wafv2.CfnWebACL.GeoMatchStatementProperty);
        Statement.GeoMatchStatement = GeoMatchStatement as GeoMatchStatement;
        break;
      case "ipSetReferenceStatement":
        IPSetReferenceStatement = transformIPSetReferenceStatement((rbst.scopeDownStatement as wafv2.CfnWebACL.StatementProperty).ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty);
        Statement.IPSetReferenceStatement = IPSetReferenceStatement as IPSetReferenceStatement;
        break;
      case "regexPatternSetReferenceStatement":
        RegexPatternSetReferenceStatement = transformRegexPatternSetReferenceStatement((rbst.scopeDownStatement as wafv2.CfnWebACL.StatementProperty).regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty);
        Statement.RegexPatternSetReferenceStatement = RegexPatternSetReferenceStatement as RegexPatternSetReferenceStatement;
        break;
      case "sizeConstraintStatement":
        SizeConstraintStatement = transformSizeConstraintStatement((rbst.scopeDownStatement as wafv2.CfnWebACL.StatementProperty).sizeConstraintStatement as wafv2.CfnWebACL.SizeConstraintStatementProperty);
        Statement.SizeConstraintStatement = SizeConstraintStatement as SizeConstraintStatement;
        break;
      case "sqliMatchStatement":
        SqliMatchStatement = transformSqliMatchStatement((rbst.scopeDownStatement as wafv2.CfnWebACL.StatementProperty).sqliMatchStatement as wafv2.CfnWebACL.SqliMatchStatementProperty);
        Statement.SqliMatchStatement = SqliMatchStatement as SqliMatchStatement;
        break;
      case "xssMatchStatement":
        XssMatchStatement = transformXssMatchStatement((rbst.scopeDownStatement as wafv2.CfnWebACL.StatementProperty).xssMatchStatement as wafv2.CfnWebACL.XssMatchStatementProperty);
        Statement.XssMatchStatement = XssMatchStatement as XssMatchStatement;
        break;
      case "labelMatchStatement":
        LabelMatchStatement = transformLabelMatchStatement((rbst.scopeDownStatement as wafv2.CfnWebACL.StatementProperty).labelMatchStatement as wafv2.CfnWebACL.LabelMatchStatementProperty);
        Statement.LabelMatchStatement = LabelMatchStatement as LabelMatchStatement;
        break;
      case "regexMatchStatement":
        RegexMatchStatement = transformRegexMatchStatement((rbst.scopeDownStatement as wafv2.CfnWebACL.StatementProperty).regexMatchStatement as wafv2.CfnWebACL.RegexMatchStatementProperty);
        Statement.RegexMatchStatement = RegexMatchStatement as RegexMatchStatement;
        break;
      default:
        break;
    }
    let ForwardedIPConfig = undefined;
    if (rbst.forwardedIpConfig) {
      const fic = rbst.forwardedIpConfig as wafv2.CfnWebACL.ForwardedIPConfigurationProperty;
      ForwardedIPConfig ={
        FallbackBehavior: fic.fallbackBehavior,
        HeaderName: fic.headerName
      };
    }
    RateBasedStatement = {
      ForwardedIPConfig,
      ScopeDownStatement: Statement,
      Limit: rbst.limit,
    };
  }
  return RateBasedStatement as RateBasedStatement;
}


/**
 * The function will map a CDK Rule Property to a SDK Rule Property
 * @param cdkRule configuration object of a CDK Rule Property
 * @return configuration object of a SDK Rule Property
 */
export function transformCdkRuletoSdkRule(cdkRule: wafv2.CfnWebACL.RuleProperty): Rule {
  const action = (cdkRule.action as wafv2.CfnWebACL.RuleActionProperty) as wafv2.CfnWebACL.RuleActionProperty | undefined;
  let Action = undefined;
  if (action) {
    let Captcha = undefined;
    if (action.captcha) {
      const ac = action.captcha as wafv2.CfnWebACL.CaptchaActionProperty;
      if(ac.customRequestHandling){
        const crh = ac.customRequestHandling as wafv2.CfnWebACL.CustomRequestHandlingProperty;
        const InsertHeaders: { Name: string; Value: string; }[]= [];
        if(crh.insertHeaders){
          (crh.insertHeaders as wafv2.CfnWebACL.CustomHTTPHeaderProperty[]).forEach((h) => {
            InsertHeaders?.push({
              Name: h.name,
              Value: h.value
            });
          });
        }
        Captcha = {
          CustomRequestHandling: {
            InsertHeaders,
          },
        };
      }
      Captcha = {};
    }
    let Allow = undefined;
    if (action.allow) {
      const al = action.allow as wafv2.CfnWebACL.AllowActionProperty;
      if(al.customRequestHandling){
        const crh = al.customRequestHandling as wafv2.CfnWebACL.CustomRequestHandlingProperty;
        const InsertHeaders: { Name: string; Value: string; }[]= [];
        if(crh.insertHeaders){
          (crh.insertHeaders as wafv2.CfnWebACL.CustomHTTPHeaderProperty[]).forEach((h) => {
            InsertHeaders?.push({
              Name: h.name,
              Value: h.value
            });
          });
        }
        Allow = {
          CustomRequestHandling: {
            InsertHeaders,
          },
        };
      }
      Allow = {};
    }

    let Block = undefined;
    if (action.block) {
      const bl = action.block as wafv2.CfnWebACL.BlockActionProperty;
      let CustomResponse = undefined;
      if(bl.customResponse){
        const cr = bl.customResponse as wafv2.CfnWebACL.CustomResponseProperty;
        const CustomResponseHeaders: { Name: string; Value: string; }[]= [];
        if(cr.responseHeaders){
          (cr.responseHeaders as wafv2.CfnWebACL.CustomHTTPHeaderProperty[]).forEach((h) => {
            CustomResponseHeaders?.push({
              Name: h.name,
              Value: h.value
            });
          });
        }
        CustomResponse = {
          ResponseCode: cr.responseCode,
          CustomResponseBodyKey: cr.customResponseBodyKey,
          ResponseHeaders: CustomResponseHeaders,
        };
      }
      Block = {
        CustomResponse,
      };
    }
  
    let Count = undefined;
    if (action.count) {
      const ct = action.count as wafv2.CfnWebACL.CountActionProperty;
      if(ct.customRequestHandling){
        const crh = ct.customRequestHandling as wafv2.CfnWebACL.CustomRequestHandlingProperty;
        const InsertHeaders: { Name: string; Value: string; }[]= [];
        if(crh.insertHeaders){
          (crh.insertHeaders as wafv2.CfnWebACL.CustomHTTPHeaderProperty[]).forEach((h) => {
            InsertHeaders?.push({
              Name: h.name,
              Value: h.value
            });
          });
        }
        Count = {
          CustomRequestHandling: {
            InsertHeaders,
          },
        };
      }
      Count = {};
    }

    let Challenge = undefined;
    if (action.challenge) {
      const ch = action.challenge as wafv2.CfnWebACL.ChallengeActionProperty;
      if(ch.customRequestHandling){
        const crh = ch.customRequestHandling as wafv2.CfnWebACL.CustomRequestHandlingProperty;
        const InsertHeaders: { Name: string; Value: string; }[]= [];
        if(crh.insertHeaders){
          (crh.insertHeaders as wafv2.CfnWebACL.CustomHTTPHeaderProperty[]).forEach((h) => {
            InsertHeaders?.push({
              Name: h.name,
              Value: h.value
            });
          });
        }
        Challenge = {
          CustomRequestHandling: {
            InsertHeaders,
          },
        };
      }
      Challenge = {};
    }
    Action = {
      Allow,
      Block,
      Count,
      Captcha,
      Challenge,
    };
  }
  const vc = (cdkRule.visibilityConfig as wafv2.CfnWebACL.VisibilityConfigProperty) as wafv2.CfnWebACL.VisibilityConfigProperty | undefined;
  let VisibilityConfig = undefined;
  if(vc){
    VisibilityConfig  = {
      CloudWatchMetricsEnabled: vc.cloudWatchMetricsEnabled as boolean,
      MetricName: vc.metricName,
      SampledRequestsEnabled: vc.sampledRequestsEnabled as boolean,
    };
  }

  const oa = (cdkRule.overrideAction as wafv2.CfnWebACL.OverrideActionProperty) as wafv2.CfnWebACL.OverrideActionProperty | undefined;
  let OverrideAction = undefined;
  if(oa){
    OverrideAction ={
      Count: oa.count,
      None: oa.none
    };
  }

  const rl = cdkRule.ruleLabels as wafv2.CfnWebACL.LabelProperty[] | undefined;
  let RuleLabels = undefined;
  if (rl) {
    RuleLabels = [];
    rl.forEach((l) => {
      RuleLabels?.push({
        Name: l.name
      });
    }
    );
  }

  const cC = (cdkRule.captchaConfig as wafv2.CfnWebACL.CaptchaConfigProperty) as wafv2.CfnWebACL.CaptchaConfigProperty | undefined;
  let CaptchaConfig = undefined;
  if(cC){
    let ImmunityTimeProperty = undefined;
    if(cC.immunityTimeProperty){
      const ccIt =  cC.immunityTimeProperty as wafv2.CfnWebACL.ImmunityTimePropertyProperty;
      ImmunityTimeProperty = {
        ImmunityTime : ccIt.immunityTime,
      };
    }
    CaptchaConfig = {
      ImmunityTimeProperty,
    };
  }

  const cConfig = (cdkRule.challengeConfig as wafv2.CfnWebACL.ChallengeConfigProperty) as wafv2.CfnWebACL.ChallengeConfigProperty | undefined;
  let ChallengeConfig = undefined;
  if(cConfig){
    let ImmunityTimeProperty = undefined;
    if(cConfig.immunityTimeProperty){
      const ccIt = cConfig.immunityTimeProperty as wafv2.CfnWebACL.ImmunityTimePropertyProperty;
      ImmunityTimeProperty = {
        ImmunityTime : ccIt.immunityTime,
      };
    }
    ChallengeConfig = {
      ImmunityTimeProperty,
    };
  }

  let ByteMatchStatement = undefined;
  let GeoMatchStatement = undefined;
  let IPSetReferenceStatement = undefined;
  let RegexPatternSetReferenceStatement = undefined;
  let SizeConstraintStatement = undefined;
  let SqliMatchStatement = undefined;
  let XssMatchStatement = undefined;
  let AndStatement = undefined;
  let OrStatement = undefined;
  let LabelMatchStatement = undefined;
  let NotStatement = undefined;
  let RegexMatchStatement = undefined;
  let RateBasedStatement = undefined;

  switch(Object.keys(cdkRule.statement)[0]){
    case "byteMatchStatement":
      ByteMatchStatement = transformByteMatchStatement((cdkRule.statement as wafv2.CfnWebACL.StatementProperty).byteMatchStatement as wafv2.CfnWebACL.ByteMatchStatementProperty);
      break;
    case "geoMatchStatement":
      GeoMatchStatement = transformGeoMatchStatement((cdkRule.statement as wafv2.CfnWebACL.StatementProperty).geoMatchStatement as wafv2.CfnWebACL.GeoMatchStatementProperty);
      break;
    case "ipSetReferenceStatement":
      IPSetReferenceStatement = transformIPSetReferenceStatement((cdkRule.statement as wafv2.CfnWebACL.StatementProperty).ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty);
      break;
    case "regexPatternSetReferenceStatement":
      RegexPatternSetReferenceStatement = transformRegexPatternSetReferenceStatement((cdkRule.statement as wafv2.CfnWebACL.StatementProperty).regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty);
      break;
    case "sizeConstraintStatement":
      SizeConstraintStatement = transformSizeConstraintStatement((cdkRule.statement as wafv2.CfnWebACL.StatementProperty).sizeConstraintStatement as wafv2.CfnWebACL.SizeConstraintStatementProperty);
      break;
    case "sqliMatchStatement":
      SqliMatchStatement = transformSqliMatchStatement((cdkRule.statement as wafv2.CfnWebACL.StatementProperty).sqliMatchStatement as wafv2.CfnWebACL.SqliMatchStatementProperty);
      break;
    case "xssMatchStatement":
      XssMatchStatement = transformXssMatchStatement((cdkRule.statement as wafv2.CfnWebACL.StatementProperty).xssMatchStatement as wafv2.CfnWebACL.XssMatchStatementProperty);
      break;
    case "andStatement":
      AndStatement = transformConcatenatedStatement((cdkRule.statement as wafv2.CfnWebACL.StatementProperty).andStatement as wafv2.CfnWebACL.AndStatementProperty, true);
      break;
    case "orStatement":
      OrStatement = transformConcatenatedStatement((cdkRule.statement as wafv2.CfnWebACL.StatementProperty).orStatement as wafv2.CfnWebACL.OrStatementProperty, false);
      break;
    case "labelMatchStatement":
      LabelMatchStatement = transformLabelMatchStatement((cdkRule.statement as wafv2.CfnWebACL.StatementProperty).labelMatchStatement as wafv2.CfnWebACL.LabelMatchStatementProperty);
      break;
    case  "notStatement":
      NotStatement = tranformNotStatement((cdkRule.statement as wafv2.CfnWebACL.StatementProperty).notStatement as wafv2.CfnWebACL.NotStatementProperty);
      break;
    case "regexMatchStatement":
      RegexMatchStatement = transformRegexMatchStatement((cdkRule.statement as wafv2.CfnWebACL.StatementProperty).regexMatchStatement as wafv2.CfnWebACL.RegexMatchStatementProperty);
      break;
    case "rateBasedStatement":
      RateBasedStatement = tranformRateBasedStatement((cdkRule.statement as wafv2.CfnWebACL.StatementProperty).rateBasedStatement as wafv2.CfnWebACL.RateBasedStatementProperty);
      break;
    default:
      break;
  }
  const rule: Rule = {
    Name: cdkRule.name,
    Priority: cdkRule.priority,
    Statement: {
      ByteMatchStatement,
      GeoMatchStatement,
      IPSetReferenceStatement,
      RegexPatternSetReferenceStatement,
      SizeConstraintStatement,
      SqliMatchStatement,
      XssMatchStatement,
      AndStatement,
      OrStatement,
      LabelMatchStatement,
      NotStatement,
      RegexMatchStatement,
      RateBasedStatement,
    },
    Action,
    OverrideAction,
    CaptchaConfig,
    ChallengeConfig,
    VisibilityConfig,
    RuleLabels
  };
  return rule;
}