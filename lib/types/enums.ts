/**
 * These typescript enums used in aws firewall manager
 *
 * @see https://www.typescriptlang.org/docs/handbook/enums.html
 * @see https://aws.amazon.com/en/firewall-manager/
 */

/**
 * Specifies whether this is for an Amazon CloudFront distribution or for a regional application.
 * A regional application can be
 * - an Application Load Balancer (ALB),
 * - an Amazon API Gateway REST API,
 * - an AWS AppSync GraphQL API,
 * - an Amazon Cognito user pool,
 * - an AWS App Runner service,
 * - or an AWS Verified Access instance.
 *
 * Valid Values are CLOUDFRONT and REGIONAL.
 *
 * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-wafv2-webacl.html
 */
export enum WebAclScope {
  CLOUDFRONT = "CLOUDFRONT",
  REGIONAL = "REGIONAL"
}

/**
 * List of REGIONAL AWS Managed Rule Groups
 * @see  https://docs.aws.amazon.com/waf/latest/APIReference/API_ListAvailableManagedRuleGroups.html
 * @see https://docs.aws.amazon.com/cli/latest/reference/wafv2/list-available-managed-rule-groups.html
 * SDK command:
 * Regional:
 *  aws wafv2 list-available-managed-rule-groups --scope REGIONAL |jq -r ".[] | .[] | .Name"
 * Cloudfront
 *  aws wafv2 list-available-managed-rule-groups --scope REGIONAL --region=us-east-1|jq -r ".[] | .[] | .Name"
 */
export enum AwsManagedRules {
  COMMON_RULE_SET = "AWSManagedRulesCommonRuleSet",
  ADMIN_PROTECTION_RULE_SET = "AWSManagedRulesAdminProtectionRuleSet",
  KNOWN_BAD_INPUTS_RULE_SET = "AWSManagedRulesKnownBadInputsRuleSet",
  SQLI_RULE_SET = "AWSManagedRulesSQLiRuleSet",
  LINUX_RULE_SET = "AWSManagedRulesLinuxRuleSet",
  UNIX_RULE_SET = "AWSManagedRulesUnixRuleSet",
  WINDOWS_RULE_SET = "AWSManagedRulesWindowsRuleSet",
  PHP_RULE_SET = "AWSManagedRulesPHPRuleSet",
  WORDPRESS_RULE_SET = "AWSManagedRulesWordPressRuleSet",
  AMAZON_IP_REPUTATION_LIST = "AWSManagedRulesAmazonIpReputationList",
  ANONYMOUS_IP_LIST = "AWSManagedRulesAnonymousIpList",
  BOT_CONTROL_RULE_SET = "AWSManagedRulesBotControlRuleSet",
  ATP_RULE_SET = "AWSManagedRulesATPRuleSet",
  ACFP_RULE_SET = "AWSManagedRulesACFPRuleSet"
}

/**
 * Enum for Labels which are related to AWSManagedRulesATPRuleSet & AWSManagedRulesBotControlRuleSet
 */
export enum AwsManagedRulesGeneralLabels{
  ManagedTokenRejectedNotSolved = "awswaf:managed:token:rejected:not_solved",
  ManagedTokenRejectedExpired = "awswaf:managed:token:rejected:expired",
  ManagedTokenRejectedDomainMismatch = "awswaf:managed:token:rejected:domain_mismatch",
  ManagedTokenRejectedInvalid = "awswaf:managed:token:rejected:invalid",
  ManagedCaptchaRejected = "awswaf:managed:captcha:rejected",
  ManagedCaptchaAccepted = "awswaf:managed:captcha:accepted",
  ManagedCaptchaRejectedNotSolved = "awswaf:managed:captcha:rejected:not_solved",
  ManagedCaptchaRejectedExpired = "awswaf:managed:captcha:rejected:expired",
  ManagedCaptchaRejectedDomainMismatch = "awswaf:managed:captcha:rejected:domain_mismatch",
  ManagedCaptchaRejectedInvalid = "awswaf:managed:captcha:rejected:invalid"
}

/**
 * Enum for AWSManagedRulesACFPRuleSet Rules
 */
export enum ACFP_RULE_SET_RULES {
  UnsupportedCognitoIDP = "UnsupportedCognitoIDP",
  AllRequests = "AllRequests",
  RiskScoreHigh = "RiskScoreHigh",
  SignalCredentialCompromised = "SignalCredentialCompromised",
  SignalClientHumanInteractivityAbsentLow = "SignalClientHumanInteractivityAbsentLow",
  AutomatedBrowser = "AutomatedBrowser",
  BrowserInconsistency  = "BrowserInconsistency",
  VolumetricIpHigh = "VolumetricIpHigh",
  VolumetricSessionHigh = "VolumetricSessionHigh",
  AttributeUsernameTraversalHigh = "AttributeUsernameTraversalHigh",
  VolumetricPhoneNumberHigh = "VolumetricPhoneNumberHigh",
  VolumetricAddressHigh = "VolumetricAddressHigh",
  VolumetricAddressLow = "VolumetricAddressLow",
  VolumetricIPSuccessfulResponse = "VolumetricIPSuccessfulResponse",
  VolumetricSessionSuccessfulResponse = "VolumetricSessionSuccessfulResponse",
  VolumetricSessionTokenReuseIp = "VolumetricSessionTokenReuseIp",
}

/**
 * Enum for AWSManagedRulesACFPRuleSet Labels
 */
export enum ACFP_RULE_SET_LABELS {
  UnsupportedCognitoIDP = "awswaf:managed:aws:acfp:unsupported:cognito_idp",
  VolumetricSessionHigh ="awswaf:managed:aws:acfp:aggregate:volumetric:session:creation:high",
  VolumetricSessionMedium ="awswaf:managed:aws:acfp:aggregate:volumetric:session:creation:medium",
  VolumetricSessionLow ="awswaf:managed:aws:acfp:aggregate:volumetric:session:creation:low",
  VolumetricSessionSessionFailedCreationResponseHigh = "awswaf:managed:aws:acfp:aggregate:volumetric:session:failed_creation_response:high",
  VolumetricSessionSessionFailedCreationResponseMedium = "awswaf:managed:aws:acfp:aggregate:volumetric:session:failed_creation_response:medium",
  VolumetricSessionSessionFailedCreationResponseLow = "awswaf:managed:aws:acfp:aggregate:volumetric:session:failed_creation_response:low",
  VolumetricSessionSuccessfulResponseHigh = "awswaf:managed:aws:acfp:aggregate:volumetric:session:successful_creation_response:high",
  VolumetricSessionSuccessfulResponseMedium = "awswaf:managed:aws:acfp:aggregate:volumetric:session:successful_creation_response:medium",
  VolumetricSessionSuccessfulResponseLow = "awswaf:managed:aws:acfp:aggregate:volumetric:session:successful_creation_response:low",
  VolumetricSessionFailedResponseHigh = " awswaf:managed:aws:acfp:aggregate:volumetric:session:failed_creation_response:high",
  VolumetricSessionFailedResponseMedium = " awswaf:managed:aws:acfp:aggregate:volumetric:session:failed_creation_response:medium",
  VolumetricSessionFailedResponseLow = " awswaf:managed:aws:acfp:aggregate:volumetric:session:failed_creation_response:low",
  VolumetricSessionTokenReuseIp ="awswaf:managed:aws:acfp:aggregate:volumetric:session:creation:token_reuse:ip",
  VolumetricPhoneNumberHigh ="awswaf:managed:aws:acfp:aggregate:volumetric:phone_number:high",
  VolumetricPhoneNumberMedium ="awswaf:managed:aws:acfp:aggregate:volumetric:phone_number:medium",
  VolumetricPhoneNumberLow ="awswaf:managed:aws:acfp:aggregate:volumetric:phone_number:low",
  VolumetricCreationHigh = "awswaf:managed:aws:acfp:aggregate:volumetric:ip:creation:high",
  VolumetricCreationMedium = "awswaf:managed:aws:acfp:aggregate:volumetric:ip:creation:medium",
  VolumetricCreationLow ="awswaf:managed:aws:acfp:aggregate:volumetric:ip:creation:low",
  VolumetricIpSuccessFulCreationHigh ="awswaf:managed:aws:acfp:aggregate:volumetric:ip:successful_creation_response:high",
  VolumetricIpSuccessFulCreationMedium="awswaf:managed:aws:acfp:aggregate:volumetric:ip:successful_creation_response:medium",
  VolumetricIpSuccessFulCreationLow ="awswaf:managed:aws:acfp:aggregate:volumetric:ip:successful_creation_response:low",
  VolumetricIpFailedCreationHigh ="awswaf:managed:aws:acfp:aggregate:volumetric:ip:failed_creation_response:high",
  VolumetricIpFailedCreationMedium="awswaf:managed:aws:acfp:aggregate:volumetric:ip:failed_creation_response:medium",
  VolumetricIpFailedCreationLow ="awswaf:managed:aws:acfp:aggregate:volumetric:ip:failed_creation_response:low",
  VolumetricAddressHigh ="awswaf:managed:aws:acfp:aggregate:volumetric:address:high",
  VolumetricAddressMedium="awswaf:managed:aws:acfp:aggregate:volumetric:address:medium",
  VolumetricAddressLow ="awswaf:managed:aws:acfp:aggregate:volumetric:address:low",
  AttributeUsernameTraversalHigh ="awswaf:managed:aws:acfp:aggregate:attribute:username_traversal:creation:high",
  AttributeUsernameTraversalMedium="awswaf:managed:aws:acfp:aggregate:attribute:username_traversal:creation:medium",
  AttributeUsernameTraversalLow= "awswaf:managed:aws:acfp:aggregate:attribute:username_traversal:creation:low",
  AutomatedBrowser ="awswaf:managed:aws:acfp:signal:automated_browser",
  BrowserInconsistency ="awswaf:managed:aws:acfp:signal:browser_inconsistency",
  SignalCredentialCompromised ="awswaf:managed:aws:acfp:signal:credential_compromised",
  SignalMissingCredential ="awswaf:managed:aws:acfp:signal:missing_credential",
  SignalCreationPage ="awswaf:managed:aws:acfp:signal:creation_page",
  SignalRegistrationPage ="awswaf:managed:aws:acfp:signal:registration_page",
  SignalFormDetected ="awswaf:managed:aws:acfp:signal:form_detected",
  SignalClientHumanInteractivityAbsentHigh ="awswaf:managed:aws:acfp:signal:client:human_interactivity:high",
  SignalClientHumanInteractivityAbsentMedium ="awswaf:managed:aws:acfp:signal:client:human_interactivity:medium",
  SignalClientHumanInteractivityAbsentLow ="awswaf:managed:aws:acfp:signal:client:human_interactivity:low",
  SignalClientHumanInteractivityInsufficientData ="awswaf:managed:aws:acfp:signal:client:human_interactivity:insufficient_data",
  RiskScoreHigh ="awswaf:managed:aws:acfp:risk_score:high",
  RiskScoreMedium ="awswaf:managed:aws:acfp:risk_score:medium",
  RiskScoreLow ="awswaf:managed:aws:acfp:risk_score:low",
  RiskScoreEvaluationFailed = "awswaf:managed:aws:acfp:risk_score:evaluation_failed",
  RiskScoreContributorIpReputationHigh = "awswaf:managed:aws:acfp:risk_score:contributor:ip_reputation:high",
  RiskScoreContributorIpReputationMedium = "awswaf:managed:aws:acfp:risk_score:contributor:ip_reputation:medium",
  RiskScoreContributorIpReputationLow = "awswaf:managed:aws:acfp:risk_score:contributor:ip_reputation:low",
  RiskScoreContributorIpReputationEvaluationFailed = "awswaf:managed:aws:acfp:risk_score:contributor:ip_reputation:evaluation_failed",
  RiskScoreContributorStolenCredentialsCredentialPairHigh ="awswaf:managed:aws:acfp:risk_score:contributor:stolen_credentials_credential_pair:high",
  RiskScoreContributorStolenCredentialsCredentialPairMedium ="awswaf:managed:aws:acfp:risk_score:contributor:stolen_credentials_credential_pair:medium",
  RiskScoreContributorStolenCredentialsCredentialPairLow ="awswaf:managed:aws:acfp:risk_score:contributor:stolen_credentials_credential_pair:low",
  RiskScoreContributorStolenCredentialsCredentialPairEvaluationFailed ="awswaf:managed:aws:acfp:risk_score:contributor:stolen_credentials_credential_pair:evaluation_failed",
}

/**
 * Enum for AWSManagedRulesATPRuleSet Rules
 */
export enum ATP_RULE_SET_RULES {
  UnsupportedCognitoIDP = "UnsupportedCognitoIDP",
  VolumetricIpHigh = "VolumetricIpHigh",
  VolumetricSession = "VolumetricSession",
  AttributeCompromisedCredentials = "AttributeCompromisedCredentials",
  AttributeUsernameTraversal = "AttributeUsernameTraversal",
  AttributePasswordTraversal = "AttributePasswordTraversal",
  AttributeLongSession = "AttributeLongSession",
  TokenRejected = "TokenRejected",
  SignalMissingCredential = "SignalMissingCredential",
}

/**
 * Enum for AWSManagedRulesATPRuleSet Labels
 */
export enum ATP_RULE_SET_LABELS {
  UnsupportedCognitoIDP = "awswaf:managed:aws:atp:unsupported:cognito_idp",
  VolumetricIpHigh = "awswaf:managed:aws:atp:aggregate:volumetric:ip:high",
  VolumetricIpMedium = "awswaf:managed:aws:atp:aggregate:volumetric:ip:medium",
  VolumetricIpLow = "awswaf:managed:aws:atp:aggregate:volumetric:ip:low",
  VolumemetricIpFailedLoginResponseHigh = "awswaf:managed:aws:atp:aggregate:volumetric:ip:failed_login_response:high",
  VolumemetricIpFailedLoginResponseMedium = "awswaf:managed:aws:atp:aggregate:volumetric:ip:failed_login_response:medium",
  VolumemetricIpFailedLoginResponseLow = "awswaf:managed:aws:atp:aggregate:volumetric:ip:failed_login_response:low",
  VolumemetricIpSuccessfulLoginResponse_high = "awswaf:managed:aws:atp:aggregate:volumetric:ip:successful_login_response:high",
  VolumemetricIpSuccessfulLoginResponse_medium = "awswaf:managed:aws:atp:aggregate:volumetric:ip:successful_login_response:medium",
  VolumemetricIpSuccessfulLoginResponse_low = "awswaf:managed:aws:atp:aggregate:volumetric:ip:successful_login_response:low",
  VolumetricSession = "awswaf:managed:aws:atp:aggregate:volumetric:session",
  VolumetricSessionFailedLoginResponseHigh = "awswaf:managed:aws:atp:aggregate:volumetric:session:failed_login_response:high",
  VolumetricSessionFailedLoginResponseMedium = "awswaf:managed:aws:atp:aggregate:volumetric:session:failed_login_response:medium",
  VolumetricSessionFailedLoginResponseLow = "awswaf:managed:aws:atp:aggregate:volumetric:session:failed_login_response:low",
  VolumetricSessionSuccessfulLoginResponseHigh = "awswaf:managed:aws:atp:aggregate:volumetric:session:successful_login_response:high",
  VolumetricSessionSuccessfulLoginResponseMedium = "awswaf:managed:aws:atp:aggregate:volumetric:session:successful_login_response:medium",
  VolumetricSessionSuccessfulLoginResponseLow = "awswaf:managed:aws:atp:aggregate:volumetric:session:successful_login_response:low",
  VolumetricSessiontokenReuseIp = "awswaf:managed:aws:atp:aggregate:volumetric:session:token_reuse:ip",
  AttributeLongSession = "awswaf:managed:aws:atp:aggregate:attribute:long_session",
  AttributeCompromisedCredentials = "awswaf:managed:aws:atp:aggregate:attribute:compromised_credentials",
  AttributeUsernameTraversal = "awswaf:managed:aws:atp:aggregate:attribute:username_traversal",
  AttributePasswordTraversal = "awswaf:managed:aws:atp:aggregate:attribute:password_traversal",
  SignalMissingCompromised = "awswaf:managed:aws:atp:signal:credential_compromised",
  SignalMissingCredential = "awswaf:managed:aws:atp:signal:missing_credential",
  TokenRejected = "awswaf:managed:token:rejected",
  TokenAccepted = "awswaf:managed:token:accepted",
  TokenAbsent = "awswaf:managed:token:absent",
  CaptchaAbsent = "awswaf:managed:captcha:absent",
  SuspiciousTlsFingerprint= "awswaf:managed:aws:atp:aggregate:attribute:suspicious_tls_fingerprint"
}


/**
 * Enum for AWSManagedRulesBotControlRuleSet Rules
 */
export enum BOT_CONTROL_RULE_SET_RULES {
  CategoryAdvertising = "CategoryAdvertising",
  CategoryArchiver = "CategoryArchiver",
  CategoryContentFetcher = "CategoryContentFetcher",
  CategoryEmailClient   = "CategoryEmailClient",
  CategoryHttpLibrary = "CategoryHttpLibrary",
  CategoryLinkChecker = "CategoryLinkChecker",
  CategoryMiscellaneous = "CategoryMiscellaneous",
  CategoryMonitoring = "CategoryMonitoring",
  CategoryScrapingFramework = "CategoryScrapingFramework",
  CategorySearchEngine  = "CategorySearchEngine",
  CategorySecurity = "CategorySecurity",
  CategorySeo = "CategorySeo",
  CategorySocialMedia = "CategorySocialMedia",
  CategoryAI = "CategoryAI",
  SignalAutomatedBrowser = "SignalAutomatedBrowser",
  SignalKnownBotDataCenter = "SignalKnownBotDataCenter",
  SignalNonBrowserUserAgent = "SignalNonBrowserUserAgent",
  TGT_VolumetricIpTokenAbsent = "TGT_VolumetricIpTokenAbsent",
  TGT_VolumetricSession = "TGT_VolumetricSession",
  TGT_SignalAutomatedBrowser = "TGT_SignalAutomatedBrowser",
  TGT_SignalBrowserInconsistency = "TGT_SignalBrowserInconsistency",
  TGT_TokenReuseIp = "TGT_TokenReuseIp",
  TGT_ML_CoordinatedActivityMedium = "TGT_ML_CoordinatedActivityMedium",
  TGT_ML_CoordinatedActivityHigh = "TGT_ML_CoordinatedActivityHigh",
}

/**
 * Enum for AWSManagedRulesBotControlRuleSet Labels
 */
export enum BOT_CONTROL_RULE_SET_LABELS {
  CategoryAdvertising = "awswaf:managed:aws:bot-control:bot:category:advertising",
  CategoryAi = "awswaf:managed:aws:bot-control:bot:category:ai",
  CategoryArchiver = "awswaf:managed:aws:bot-control:bot:category:archiver",
  CategoryContentFetcher = "awswaf:managed:aws:bot-control:bot:category:content_fetcher",
  CategoryEmailClient = "awswaf:managed:aws:bot-control:bot:category:email_client",
  CategoryHttpLibrary = "awswaf:managed:aws:bot-control:bot:category:http_library",
  CategoryLinkChecker = "awswaf:managed:aws:bot-control:bot:category:link_checker",
  CategoryMiscellaneous = "awswaf:managed:aws:bot-control:bot:category:miscellaneous",
  CategoryMonitoring = "awswaf:managed:aws:bot-control:bot:category:monitoring",
  CategoryScrapingFramework = "awswaf:managed:aws:bot-control:bot:category:scraping_framework",
  CategorySearchEngine = "awswaf:managed:aws:bot-control:bot:category:search_engine",
  CategorySecurity = "awswaf:managed:aws:bot-control:bot:category:security",
  CategorySeo = "awswaf:managed:aws:bot-control:bot:category:seo",
  CategorySocialMedia = "awswaf:managed:aws:bot-control:bot:category:social_media",
  DeveloperPlatformVerified = "awswaf:managed:aws:bot-control:bot:developer_platform:verified",
  NameAasaBot = "awswaf:managed:aws:bot-control:bot:name:aasa_bot",
  NameAcunetix = "awswaf:managed:aws:bot-control:bot:name:acunetix",
  NameAdidxbot = "awswaf:managed:aws:bot-control:bot:name:adidxbot",
  NameAdmantx = "awswaf:managed:aws:bot-control:bot:name:admantx",
  NameAhrefsbot = "awswaf:managed:aws:bot-control:bot:name:ahrefsbot",
  NameAlexabot = "awswaf:managed:aws:bot-control:bot:name:alexabot",
  NameAmazonAdbot = "awswaf:managed:aws:bot-control:bot:name:amazon_adbot",
  NameAmazonbot = "awswaf:managed:aws:bot-control:bot:name:amazonbot",
  NameApache = "awswaf:managed:aws:bot-control:bot:name:apache",
  NameAppInsights = "awswaf:managed:aws:bot-control:bot:name:app_insights",
  NameApplebot = "awswaf:managed:aws:bot-control:bot:name:applebot",
  NameAxios = "awswaf:managed:aws:bot-control:bot:name:axios",
  NameBaidu = "awswaf:managed:aws:bot-control:bot:name:baidu",
  NameBarkrowler = "awswaf:managed:aws:bot-control:bot:name:barkrowler",
  NameBingbot = "awswaf:managed:aws:bot-control:bot:name:bingbot",
  NameBitly = "awswaf:managed:aws:bot-control:bot:name:bitly",
  NameBlexbot = "awswaf:managed:aws:bot-control:bot:name:blexbot",
  NameBomborabot = "awswaf:managed:aws:bot-control:bot:name:bomborabot",
  NameBooko = "awswaf:managed:aws:bot-control:bot:name:booko",
  NameBotify = "awswaf:managed:aws:bot-control:bot:name:botify",
  NameBrandVerity = "awswaf:managed:aws:bot-control:bot:name:brand_verity",
  NameBytespider = "awswaf:managed:aws:bot-control:bot:name:bytespider",
  NameCcbot = "awswaf:managed:aws:bot-control:bot:name:ccbot",
  NameChatgpt = "awswaf:managed:aws:bot-control:bot:name:chatgpt",
  NameChatgptUser = "awswaf:managed:aws:bot-control:bot:name:chatgpt_user",
  NameCheckmarkNetwork = "awswaf:managed:aws:bot-control:bot:name:checkmark_network",
  NameChromeLighthouse = "awswaf:managed:aws:bot-control:bot:name:chrome_lighthouse",
  NameClickagy = "awswaf:managed:aws:bot-control:bot:name:clickagy",
  NameCliqzbot = "awswaf:managed:aws:bot-control:bot:name:cliqzbot",
  NameCloudflare = "awswaf:managed:aws:bot-control:bot:name:cloudflare",
  NameCoccoc = "awswaf:managed:aws:bot-control:bot:name:coccoc",
  NameComodo = "awswaf:managed:aws:bot-control:bot:name:comodo",
  NameCrawler4j = "awswaf:managed:aws:bot-control:bot:name:crawler4j",
  NameCriteobot = "awswaf:managed:aws:bot-control:bot:name:criteobot",
  NameCurl = "awswaf:managed:aws:bot-control:bot:name:curl",
  NameCxensebot = "awswaf:managed:aws:bot-control:bot:name:cxensebot",
  NameDatadogSyntheticMonitor = "awswaf:managed:aws:bot-control:bot:name:datadog_synthetic_monitor",
  NameDataforseobot = "awswaf:managed:aws:bot-control:bot:name:dataforseobot",
  NameDatanyze = "awswaf:managed:aws:bot-control:bot:name:datanyze",
  NameDeepcrawl = "awswaf:managed:aws:bot-control:bot:name:deepcrawl",
  NameDetectify = "awswaf:managed:aws:bot-control:bot:name:detectify",
  NameDiscordbot = "awswaf:managed:aws:bot-control:bot:name:discordbot",
  NameDocomo = "awswaf:managed:aws:bot-control:bot:name:docomo",
  NameDotbot = "awswaf:managed:aws:bot-control:bot:name:dotbot",
  NameDrupal = "awswaf:managed:aws:bot-control:bot:name:drupal",
  NameDuckduckbot = "awswaf:managed:aws:bot-control:bot:name:duckduckbot",
  NameDuckduckgoFaviconsBot = "awswaf:managed:aws:bot-control:bot:name:duckduckgo_favicons_bot",
  NameEchoboxbot = "awswaf:managed:aws:bot-control:bot:name:echoboxbot",
  NameEmbedly = "awswaf:managed:aws:bot-control:bot:name:embedly",
  NameEzooms = "awswaf:managed:aws:bot-control:bot:name:ezooms",
  NameFacebook = "awswaf:managed:aws:bot-control:bot:name:facebook",
  NameFacebot = "awswaf:managed:aws:bot-control:bot:name:facebot",
  NameFeedburner = "awswaf:managed:aws:bot-control:bot:name:feedburner",
  NameFeedfinder = "awswaf:managed:aws:bot-control:bot:name:feedfinder",
  NameFeedspot = "awswaf:managed:aws:bot-control:bot:name:feedspot",
  NameFindlinks = "awswaf:managed:aws:bot-control:bot:name:findlinks",
  NameFlipboard = "awswaf:managed:aws:bot-control:bot:name:flipboard",
  NameFreshpingbot = "awswaf:managed:aws:bot-control:bot:name:freshpingbot",
  NameGarlik = "awswaf:managed:aws:bot-control:bot:name:garlik",
  NameGenieo = "awswaf:managed:aws:bot-control:bot:name:genieo",
  NameGetintent = "awswaf:managed:aws:bot-control:bot:name:getintent",
  NameGoHttp = "awswaf:managed:aws:bot-control:bot:name:go_http",
  NameGoogleAdsbot = "awswaf:managed:aws:bot-control:bot:name:google_adsbot",
  NameGoogleAdsense = "awswaf:managed:aws:bot-control:bot:name:google_adsense",
  NameGoogleApis = "awswaf:managed:aws:bot-control:bot:name:google_apis",
  NameGoogleAppEngine = "awswaf:managed:aws:bot-control:bot:name:google_app_engine",
  NameGoogleAppsScript = "awswaf:managed:aws:bot-control:bot:name:google_apps_script",
  NameGoogleAssociationService = "awswaf:managed:aws:bot-control:bot:name:google_association_service",
  NameGoogleCommonCrawler = "awswaf:managed:aws:bot-control:bot:name:google_common_crawler",
  NameGoogleFavicon = "awswaf:managed:aws:bot-control:bot:name:google_favicon",
  NameGoogleFeedfetcher = "awswaf:managed:aws:bot-control:bot:name:google_feedfetcher",
  NameGoogleImageproxy = "awswaf:managed:aws:bot-control:bot:name:google_imageproxy",
  NameGoogleInspectionTool = "awswaf:managed:aws:bot-control:bot:name:google_inspection_tool",
  NameGoogleMediapartners = "awswaf:managed:aws:bot-control:bot:name:google_mediapartners",
  NameGoogleOther = "awswaf:managed:aws:bot-control:bot:name:google_other",
  NameGooglePagerenderer = "awswaf:managed:aws:bot-control:bot:name:google_pagerenderer",
  NameGooglePublisherCenter = "awswaf:managed:aws:bot-control:bot:name:google_publisher_center",
  NameGoogleReadAloud = "awswaf:managed:aws:bot-control:bot:name:google_read_aloud",
  NameGoogleSiteVerification = "awswaf:managed:aws:bot-control:bot:name:google_site_verification",
  NameGoogleSpecialCaseCrawler = "awswaf:managed:aws:bot-control:bot:name:google_special_case_crawler",
  NameGoogleStorebot = "awswaf:managed:aws:bot-control:bot:name:google_storebot",
  NameGoogleUserTriggeredFetcher = "awswaf:managed:aws:bot-control:bot:name:google_user_triggered_fetcher",
  NameGoogleWebPreview = "awswaf:managed:aws:bot-control:bot:name:google_web_preview",
  NameGooglebot = "awswaf:managed:aws:bot-control:bot:name:googlebot",
  NameGoogleweblight = "awswaf:managed:aws:bot-control:bot:name:googleweblight",
  NameGptbot = "awswaf:managed:aws:bot-control:bot:name:gptbot",
  NameGrapeshot = "awswaf:managed:aws:bot-control:bot:name:grapeshot",
  NameGrub = "awswaf:managed:aws:bot-control:bot:name:grub",
  NameGtmetrix = "awswaf:managed:aws:bot-control:bot:name:gtmetrix",
  NameGuzzle = "awswaf:managed:aws:bot-control:bot:name:guzzle",
  NameHarvester = "awswaf:managed:aws:bot-control:bot:name:harvester",
  NameHatena = "awswaf:managed:aws:bot-control:bot:name:hatena",
  NameHeritrix = "awswaf:managed:aws:bot-control:bot:name:heritrix",
  NameHubspot = "awswaf:managed:aws:bot-control:bot:name:hubspot",
  NameIchiro = "awswaf:managed:aws:bot-control:bot:name:ichiro",
  NameIframely = "awswaf:managed:aws:bot-control:bot:name:iframely",
  NameInternetArchive = "awswaf:managed:aws:bot-control:bot:name:internet_archive",
  NameIsecbot = "awswaf:managed:aws:bot-control:bot:name:isecbot",
  NameJakarta = "awswaf:managed:aws:bot-control:bot:name:jakarta",
  NameJava = "awswaf:managed:aws:bot-control:bot:name:java",
  NameJersey = "awswaf:managed:aws:bot-control:bot:name:jersey",
  NameLibhttp = "awswaf:managed:aws:bot-control:bot:name:libhttp",
  NameLibperl = "awswaf:managed:aws:bot-control:bot:name:libperl",
  NameLinespider = "awswaf:managed:aws:bot-control:bot:name:Linespider",
  Namelinespider = "awswaf:managed:aws:bot-control:bot:name:linespider",
  NameLinguee = "awswaf:managed:aws:bot-control:bot:name:linguee",
  NameLinkchecker = "awswaf:managed:aws:bot-control:bot:name:linkchecker",
  NameLinkdex = "awswaf:managed:aws:bot-control:bot:name:linkdex",
  NameLinkedin = "awswaf:managed:aws:bot-control:bot:name:linkedin",
  NameLinklint = "awswaf:managed:aws:bot-control:bot:name:linklint",
  NameLinkscan = "awswaf:managed:aws:bot-control:bot:name:linkscan",
  NameLinkup = "awswaf:managed:aws:bot-control:bot:name:linkup",
  NameLinkwalker = "awswaf:managed:aws:bot-control:bot:name:linkwalker",
  NameLivelapbot = "awswaf:managed:aws:bot-control:bot:name:livelapbot",
  NameLydia = "awswaf:managed:aws:bot-control:bot:name:lydia",
  NameMagpie = "awswaf:managed:aws:bot-control:bot:name:magpie",
  NameMailru = "awswaf:managed:aws:bot-control:bot:name:mailru",
  NameMarfeel = "awswaf:managed:aws:bot-control:bot:name:marfeel",
  NameMauibot = "awswaf:managed:aws:bot-control:bot:name:mauibot",
  NameMaverick = "awswaf:managed:aws:bot-control:bot:name:maverick",
  NameMediatoolkitbot = "awswaf:managed:aws:bot-control:bot:name:mediatoolkitbot",
  NameMegaindex = "awswaf:managed:aws:bot-control:bot:name:megaindex",
  NameMicrosoftPreview = "awswaf:managed:aws:bot-control:bot:name:microsoft_preview",
  NameMiniflux = "awswaf:managed:aws:bot-control:bot:name:miniflux",
  NameMixrankbot = "awswaf:managed:aws:bot-control:bot:name:mixrankbot",
  NameMj12bot = "awswaf:managed:aws:bot-control:bot:name:mj12bot",
  NameMoatbot = "awswaf:managed:aws:bot-control:bot:name:moatbot",
  NameMojeek = "awswaf:managed:aws:bot-control:bot:name:mojeek",
  NameMoodlebot = "awswaf:managed:aws:bot-control:bot:name:moodlebot",
  NameMsnbot = "awswaf:managed:aws:bot-control:bot:name:msnbot",
  NameNetvibes = "awswaf:managed:aws:bot-control:bot:name:netvibes",
  NameNewrelicSyntheticMonitor = "awswaf:managed:aws:bot-control:bot:name:newrelic_synthetic_monitor",
  NameNewspaper = "awswaf:managed:aws:bot-control:bot:name:newspaper",
  NameNimbostratus = "awswaf:managed:aws:bot-control:bot:name:nimbostratus",
  NameNode_fetch = "awswaf:managed:aws:bot-control:bot:name:node_fetch",
  NameOkhttp = "awswaf:managed:aws:bot-control:bot:name:okhttp",
  NameOutlook = "awswaf:managed:aws:bot-control:bot:name:outlook",
  NamePandalytics = "awswaf:managed:aws:bot-control:bot:name:pandalytics",
  NamePaperlibot = "awswaf:managed:aws:bot-control:bot:name:paperlibot",
  NamePetalbot = "awswaf:managed:aws:bot-control:bot:name:petalbot",
  NamePhpcrawl = "awswaf:managed:aws:bot-control:bot:name:phpcrawl",
  NamePingability = "awswaf:managed:aws:bot-control:bot:name:pingability",
  NamePingdom = "awswaf:managed:aws:bot-control:bot:name:pingdom",
  NamePinterest = "awswaf:managed:aws:bot-control:bot:name:pinterest",
  NamePocket = "awswaf:managed:aws:bot-control:bot:name:pocket",
  NameProctorio = "awswaf:managed:aws:bot-control:bot:name:proctorio",
  NameProximic = "awswaf:managed:aws:bot-control:bot:name:proximic",
  NamePrtg = "awswaf:managed:aws:bot-control:bot:name:prtg",
  NamePsbot = "awswaf:managed:aws:bot-control:bot:name:psbot",
  NamePython = "awswaf:managed:aws:bot-control:bot:name:python",
  NamePythonRequests = "awswaf:managed:aws:bot-control:bot:name:python_requests",
  NamQwantify = "awswaf:managed:aws:bot-control:bot:name:qwantify",
  NameRedditbot = "awswaf:managed:aws:bot-control:bot:name:redditbot",
  NameRiddler = "awswaf:managed:aws:bot-control:bot:name:riddler",
  NameRogerbot = "awswaf:managed:aws:bot-control:bot:name:rogerbot",
  NameRoute53_health_check = "awswaf:managed:aws:bot-control:bot:name:route53_health_check",
  NameRuby = "awswaf:managed:aws:bot-control:bot:name:ruby",
  NameScrapy = "awswaf:managed:aws:bot-control:bot:name:scrapy",
  NameSeekportbot = "awswaf:managed:aws:bot-control:bot:name:seekportbot",
  NameSemanticscholarbot = "awswaf:managed:aws:bot-control:bot:name:semanticscholarbot",
  NameSemrushbot = "awswaf:managed:aws:bot-control:bot:name:semrushbot",
  NameSentibot = "awswaf:managed:aws:bot-control:bot:name:sentibot",
  NameSerpstatbot = "awswaf:managed:aws:bot-control:bot:name:serpstatbot",
  NameSimilarTech = "awswaf:managed:aws:bot-control:bot:name:similar_tech",
  NameSiteImprove = "awswaf:managed:aws:bot-control:bot:name:site_improve",
  NameSlackImages = "awswaf:managed:aws:bot-control:bot:name:slack_images",
  NameSlackbot = "awswaf:managed:aws:bot-control:bot:name:slackbot",
  NameSnapchat = "awswaf:managed:aws:bot-control:bot:name:snapchat",
  NameSnoopy = "awswaf:managed:aws:bot-control:bot:name:snoopy",
  NameSogou = "awswaf:managed:aws:bot-control:bot:name:sogou",
  NameSteeler = "awswaf:managed:aws:bot-control:bot:name:steeler",
  NameStudyPartner = "awswaf:managed:aws:bot-control:bot:name:study_partner",
  NameSumologic = "awswaf:managed:aws:bot-control:bot:name:sumologic",
  NameSuperfeedr = "awswaf:managed:aws:bot-control:bot:name:superfeedr",
  NameTaboolabot = "awswaf:managed:aws:bot-control:bot:name:taboolabot",
  NameTelegram = "awswaf:managed:aws:bot-control:bot:name:telegram",
  NameTinEye = "awswaf:managed:aws:bot-control:bot:name:tin_eye",
  NameTinyRss = "awswaf:managed:aws:bot-control:bot:name:tiny_rss",
  NameTrendictionbot = "awswaf:managed:aws:bot-control:bot:name:trendictionbot",
  NameTwitter = "awswaf:managed:aws:bot-control:bot:name:twitter",
  NameUptimerobot = "awswaf:managed:aws:bot-control:bot:name:uptimerobot",
  NameW3c = "awswaf:managed:aws:bot-control:bot:name:w3c",
  NameW3cValidationServices = "awswaf:managed:aws:bot-control:bot:name:w3c_validation_services",
  NameWappalyzer = "awswaf:managed:aws:bot-control:bot:name:wappalyzer",
  NameWebCopier = "awswaf:managed:aws:bot-control:bot:name:web_copier",
  NameWget = "awswaf:managed:aws:bot-control:bot:name:wget",
  NameWhatsapp = "awswaf:managed:aws:bot-control:bot:name:whatsapp",
  NameWordpressScanner = "awswaf:managed:aws:bot-control:bot:name:wordpress_scanner",
  NameYacy = "awswaf:managed:aws:bot-control:bot:name:yacy",
  NameYahoo = "awswaf:managed:aws:bot-control:bot:name:yahoo",
  NameYahoo_mail = "awswaf:managed:aws:bot-control:bot:name:yahoo_mail",
  NameYandexbot = "awswaf:managed:aws:bot-control:bot:name:yandexbot",
  NameYanga = "awswaf:managed:aws:bot-control:bot:name:yanga",
  NameZyborg = "awswaf:managed:aws:bot-control:bot:name:zyborg",
  OrganizationGoogle = "awswaf:managed:aws:bot-control:bot:organization:google",
  OrganizationMicrosoft = "awswaf:managed:aws:bot-control:bot:organization:microsoft",
  Unverified = "awswaf:managed:aws:bot-control:bot:unverified",
  UserTriggeredVerified = "awswaf:managed:aws:bot-control:bot:user_triggered:verified",
  Verified = "awswaf:managed:aws:bot-control:bot:verified",
  SignalAutomatedBrowser = "awswaf:managed:aws:bot-control:signal:automated_browser",
  SignalKnownBotDataCenter = "awswaf:managed:aws:bot-control:signal:known_bot_data_center",
  SignalNonBrowserHeader = "awswaf:managed:aws:bot-control:signal:non_browser_header",
  SignalNonBrowserUserAgent = "awswaf:managed:aws:bot-control:signal:non_browser_user_agent",
  TokenRejected = "awswaf:managed:token:rejected",
  tokenAccepted = "awswaf:managed:token:accepted",
  TokenAbsent = "awswaf:managed:token:absent",
  TGT_ML_CoordinatedActivityMedium = "awswaf:managed:aws:bot-control:targeted:aggregate:coordinated_activity:medium",
  TGT_ML_CoordinatedActivityHigh = "awswaf:managed:aws:bot-control:targeted:aggregate:coordinated_activity:high",
  TGT_VolumetricIpTokenAbsent = "awswaf:managed:aws:bot-control:targeted:aggregate:volumetric:ip:token_absent",
  TGT_VolumetricSessionHigh = "awswaf:managed:aws:bot-control:targeted:aggregate:volumetric:session:high",
  TGT_VolumetricSessiosMedium = "awswaf:managed:aws:bot-control:targeted:aggregate:volumetric:session:medium",
  TGT_VolumetricSessionLow = "awswaf:managed:aws:bot-control:targeted:aggregate:volumetric:session:low",
  TGT_TokenReuseIp = "awswaf:managed:aws:bot-control:targeted:aggregate:volumetric:session:token_reuse:ip",
  TGT_SignalAutomatedBrowser = "awswaf:managed:aws:bot-control:targeted:signal:automated_browser",
  TGT_SignalBrowserInconsistency = "awswaf:managed:aws:bot-control:targeted:signal:browser_inconsistency",
}

/**
 * Enum for AWSManagedRulesAnonymousIpList Rules
 */
export enum ANONYMOUS_IP_LIST_RULES {
  AnonymousIPList = "AnonymousIPList",
  HostingProviderIPList = "HostingProviderIPList"
}

/**
 * Enum for AWSManagedRulesAnonymousIpList Labels
 */
export enum ANONYMOUS_IP_LIST_LABELS {
  AnonymousIPList = "awswaf:managed:aws:anonymous-ip-list:AnonymousIPList",
  HostingProviderIPList = "awswaf:managed:aws:anonymous-ip-list:HostingProviderIPList",
}


/**
 * Enum for AWSManagedRulesAmazonIpReputationList Rules
 */
export enum AMAZON_IpReputationLIST_RULES {
  AWSManagedIPReputationList = "AWSManagedIPReputationList",
  AWSManagedReconnaissanceList  = "AWSManagedReconnaissanceList",
  AWSManagedIPDDoSList  = "AWSManagedIPDDoSList"
}

/**
 * Enum for AWSManagedRulesAmazonIpReputationList Labels
 */
export enum AMAZON_IpReputationLIST_LABELS {
  AWSManagedIPDDoSList = "awswaf:managed:aws:amazon-ip-list:AWSManagedIPDDoSList",
  AWSManagedIPReputationList = "awswaf:managed:aws:amazon-ip-list:AWSManagedIPReputationList",
  AWSManagedReconnaissanceList = "awswaf:managed:aws:amazon-ip-list:AWSManagedReconnaissanceList",
}

/**
 * Enum for AWSManagedRulesWordPressRuleSet Rules
 */
export enum WORDPRESS_RULE_SET_RULES {
  WordPressExploitableCommands_QUERYSTRING = "WordPressExploitableCommands_QUERYSTRING",
  WordPressExploitablePaths_URIPATH  = "WordPressExploitablePaths_URIPATH"
}

/**
 * Enum for AWSManagedRulesWordPressRuleSet Labels
 */
export enum WORDPRESS_RULE_SET_LABELS {
  WordPressExploitableCommands_QUERYSTRING = "awswaf:managed:aws:wordpress-app:WordPressExploitableCommands_QUERYSTRING",
  WordPressExploitablePaths_URIPATH = "awswaf:managed:aws:wordpress-app:WordPressExploitablePaths_URIPATH",
}

/**
 * Enum for AWSManagedRulesPHPRuleSet Rules
 */
export enum PHP_RULE_SET_RULES {
  PHPHighRiskMethodsVariables_HEADER = "PHPHighRiskMethodsVariables_HEADER",
  PHPHighRiskMethodsVariables_QUERYSTRING = "PHPHighRiskMethodsVariables_QUERYSTRING",
  PHPHighRiskMethodsVariables_BODY = "PHPHighRiskMethodsVariables_BODY"
}

/**
 * Enum for AWSManagedRulesPHPRuleSet Labels
 */
export enum PHP_RULE_SET_LABELS {
  PHPHighRiskMethodsVariables_HEADER = "awswaf:managed:aws:php-app:PHPHighRiskMethodsVariables_Header",
  PHPHighRiskMethodsVariables_QUERYSTRING = "awswaf:managed:aws:php-app:PHPHighRiskMethodsVariables_QueryString",
  PHPHighRiskMethodsVariables_BODY = "awswaf:managed:aws:php-app:PHPHighRiskMethodsVariables_Body",
}

/**
 * Enum for AWSManagedRulesWindowsRuleSet Rules
 */
export enum WINDOWS_RULE_SET_RULES {
  WindowsShellCommands_COOKIE = "WindowsShellCommands_COOKIE",
  WindowsShellCommands_QUERYARGUMENTS = "WindowsShellCommands_QUERYARGUMENTS",
  WindowsShellCommands_BODY = "WindowsShellCommands_BODY",
  PowerShellCommands_COOKIE = "PowerShellCommands_COOKIE",
  PowerShellCommands_QUERYARGUMENTS = "PowerShellCommands_QUERYARGUMENTS",
  PowerShellCommands_BODY = "PowerShellCommands_BODY"
}

/**
 * Enum for AWSManagedRulesWindowsRuleSet Labels
 */
export enum WINDOWS_RULE_SET_LABELS {
  WindowsShellCommands_COOKIE = "awswaf:managed:aws:windows-os:WindowsShellCommands_Cookie",
  WindowsShellCommands_BODY = "awswaf:managed:aws:windows-os:WindowsShellCommands_Body",
  PowerShellCommands_COOKIE = "awswaf:managed:aws:windows-os:PowerShellCommands_Cookie",
  WindowsShellCommands_QUERYARGUMENTS = "awswaf:managed:aws:windows-os:WindowsShellCommands_QueryArguments",
  PowerShellCommands_QUERYARGUMENTS = "awswaf:managed:aws:windows-os:PowerShellCommands_QueryArguments",
  PowerShellCommands_BODY = "awswaf:managed:aws:windows-os:PowerShellCommands_Body",
}

/**
 * Enum for AWSManagedRulesUnixRuleSet Rules
 */
export enum UNIX_RULE_SET_RULES {
  UNIXShellCommandsVariables_QUERYARGUMENTS = "UNIXShellCommandsVariables_QUERYARGUMENTS",
  UNIXShellCommandsVariables_BODY = "UNIXShellCommandsVariables_BODY",
}

/**
 * Enum for AWSManagedRulesUnixRuleSet Labels
 */
export enum UNIX_RULE_SET_LABELS {
  UNIXShellCommandsVariables_BODY = "awswaf:managed:aws:posix-os:UNIXShellCommandsVariables_Body",
  UNIXShellCommandsVariables_QUERYARGUMENTS = "awswaf:managed:aws:posix-os:UNIXShellCommandsVariables_QueryArguments",
}

/**
 * Enum for AWSManagedRulesLinuxRuleSet Rules
 */
export enum LINUX_RULE_SET_RULES {
  LFI_URIPATH = "LFI_URIPATH",
  LFI_QUERYSTRING = "LFI_QUERYSTRING",
  LFI_HEADER  = "LFI_HEADER",
}
/**
 * Enum for AWSManagedRulesLinuxRuleSet Labels
 */
export enum LINUX_RULE_SET_LABELS {
  LFI_QUERYSTRING = "awswaf:managed:aws:linux-os:LFI_QueryString",
  LFI_URIPATH = "awswaf:managed:aws:linux-os:LFI_URIPath",
  LFI_HEADER = "awswaf:managed:aws:linux-os:LFI_Header",
}

/**
 * Enum for AWSManagedRulesSQLiRuleSet Rules
 */
export enum SQLI_RULE_SET_RULES {
  SQLiExtendedPatterns_QUERYARGUMENTS = "SQLiExtendedPatterns_QUERYARGUMENTS",
  SQLi_QUERYARGUMENTS = "SQLi_QUERYARGUMENTS",
  SQLiExtendedPatterns_BODY = "SQLiExtendedPatterns_BODY",
  SQLi_BODY = "SQLi_BODY",
  SQLi_COOKIE = "SQLi_COOKIE",
  SQLi_URIPATH  = "SQLi_URIPATH",
  SQLi_URIPATH_RC_COUNT = "SQLi_URIPATH_RC_COUNT",
  SQLi_COOKIE_RC_COUNT = "SQLi_COOKIE_RC_COUNT",
  SQLi_BODY_RC_COUNT = "SQLi_BODY_RC_COUNT",
  SQLi_QUERYARGUMENTS_RC_COUNT = "SQLi_QUERYARGUMENTS_RC_COUNT",
  SQLiExtendedPatterns_QUERYARGUMENTS_RC_COUNT = "SQLiExtendedPatterns_QUERYARGUMENTS_RC_COUNT"
}
/**
 * Enum for AWSManagedRulesSQLiRuleSet Labels
 */
export enum SQLI_RULE_SET_LABELS {
  SQLi_URIPATH = "awswaf:managed:aws:sql-database:SQLi_URIPath",
  SQLiExtendedPatterns_QUERYARGUMENTS = "awswaf:managed:aws:sql-database:SQLiExtendedPatterns_QueryArguments",
  SQLi_QUERYARGUMENTS = "awswaf:managed:aws:sql-database:SQLi_QueryArguments",
  SQLi_BODY = "awswaf:managed:aws:sql-database:SQLi_Body",
  SQLi_COOKIE = "awswaf:managed:aws:sql-database:SQLi_Cookie",
  SQLiExtendedPatterns_BODY = "awswaf:managed:aws:sql-database:SQLiExtendedPatterns_Body",
  SQLi_Cookie_RC_COUNT = "awswaf:managed:aws:sql-database:SQLi_Cookie_RC_COUNT",
  SQLi_Body_RC_COUNT = "awswaf:managed:aws:sql-database:SQLi_Body_RC_COUNT",
  SQLi_QueryArguments_RC_COUNT = "awswaf:managed:aws:sql-database:SQLi_QueryArguments_RC_COUNT",
  SQLi_URIPath_RC_COUNT = "awswaf:managed:aws:sql-database:SQLi_URIPath_RC_COUNT",
  SQLiExtendedPatterns_QueryArguments_RC_COUNT = "awswaf:managed:aws:sql-database:SQLiExtendedPatterns_QueryArguments_RC_COUNT"
}

/**
 * Enum for AWSManagedRulesKnownBadInputsRuleSet Rules
 */
export enum KNOWN_BAD_INPUTS_RULE_SET_RULES {
  Log4JRCE_HEADER_RC_COUNT = "Log4JRCE_HEADER_RC_COUNT",
  Log4JRCE_URIPATH_RC_COUNT = "Log4JRCE_URIPATH_RC_COUNT",
  Log4JRCE_BODY_RC_COUNT  = "Log4JRCE_BODY_RC_COUNT",
  Log4JRCE_QUERYSTRING_RC_COUNT = "Log4JRCE_QUERYSTRING_RC_COUNT",
  Host_localhost_HEADER_RC_COUNT  = "Host_localhost_HEADER_RC_COUNT",
  JavaDeserializationRCE_HEADER_RC_COUNT  = "JavaDeserializationRCE_HEADER_RC_COUNT",
  JavaDeserializationRCE_QUERYSTRING_RC_COUNT = "JavaDeserializationRCE_QUERYSTRING_RC_COUNT",
  JavaDeserializationRCE_URIPATH_RC_COUNT   = "JavaDeserializationRCE_URIPATH_RC_COUNT",
  JavaDeserializationRCE_BODY_RC_COUNT = "JavaDeserializationRCE_BODY_RC_COUNT",
  JavaDeserializationRCE_BODY = "JavaDeserializationRCE_BODY",
  JavaDeserializationRCE_URIPATH = "JavaDeserializationRCE_URIPATH",
  JavaDeserializationRCE_QUERYSTRING = "JavaDeserializationRCE_QUERYSTRING",
  JavaDeserializationRCE_HEADER   = "JavaDeserializationRCE_HEADER",
  Host_localhost_HEADER   = "Host_localhost_HEADER",
  PROPFIND_METHOD   = "PROPFIND_METHOD",
  ExploitablePaths_URIPATH  = "ExploitablePaths_URIPATH",
  Log4JRCE_QUERYSTRING = "Log4JRCE_QUERYSTRING",
  Log4JRCE_BODY   = "Log4JRCE_BODY",
  Log4JRCE_URIPATH  = "Log4JRCE_URIPATH",
  Log4JRCE_HEADER  = "Log4JRCE_HEADER",
}

/**
 * Enum for AWSManagedRulesKnownBadInputsRuleSet Labels
 */
export enum KNOWN_BAD_INPUTS_RULE_SET_LABELS {
  Host_localhost_HEADER_RC_COUNT = "awswaf:managed:aws:known-bad-inputs:Host_Localhost_Header_RC_COUNT",
  JavaDeserializationRCE_QUERYSTRING_RC_COUNT = "awswaf:managed:aws:known-bad-inputs:JavaDeserializationRCE_QueryString_RC_COUNT",
  Log4JRCE_QUERYSTRING_RC_COUNT = "awswaf:managed:aws:known-bad-inputs:Log4JRCE_QueryString_RC_COUNT",
  Log4JRCE_BODY_RC_COUNT = "awswaf:managed:aws:known-bad-inputs:Log4JRCE_Body_RC_COUNT",
  Log4JRCE_URIPATH = "awswaf:managed:aws:known-bad-inputs:Log4JRCE_URIPath",
  ExploitablePaths_URIPATH = "awswaf:managed:aws:known-bad-inputs:ExploitablePaths_URIPath",
  JavaDeserializationRCE_BODY = "awswaf:managed:aws:known-bad-inputs:JavaDeserializationRCE_Body",
  Log4JRCE_QUERYSTRING = "awswaf:managed:aws:known-bad-inputs:Log4JRCE_QueryString",
  Log4JRCE_URIPATH_RC_COUNT = "awswaf:managed:aws:known-bad-inputs:Log4JRCE_URIPath_RC_COUNT",
  PROPFIND_METHOD = "awswaf:managed:aws:known-bad-inputs:Propfind_Method",
  JavaDeserializationRCE_BODY_RC_COUNT = "awswaf:managed:aws:known-bad-inputs:JavaDeserializationRCE_Body_RC_COUNT",
  JavaDeserializationRCE_HEADER_RC_COUNT = "awswaf:managed:aws:known-bad-inputs:JavaDeserializationRCE_Header_RC_COUNT",
  Log4JRCE_HEADER_RC_COUNT = "awswaf:managed:aws:known-bad-inputs:Log4JRCE_Header_RC_COUNT",
  JavaDeserializationRCE_URIPATH = "awswaf:managed:aws:known-bad-inputs:JavaDeserializationRCE_URIPath",
  Host_localhost_HEADER = "awswaf:managed:aws:known-bad-inputs:Host_Localhost_Header",
  JavaDeserializationRCE_QUERYSTRING = "awswaf:managed:aws:known-bad-inputs:JavaDeserializationRCE_QueryString",
  JavaDeserializationRCE_HEADER = "awswaf:managed:aws:known-bad-inputs:JavaDeserializationRCE_Header",
  JavaDeserializationRCE_URIPATH_RC_COUNT = "awswaf:managed:aws:known-bad-inputs:JavaDeserializationRCE_URIPath_RC_COUNT",
  Log4JRCE_BODY = "awswaf:managed:aws:known-bad-inputs:Log4JRCE_Body",
  Log4JRCE_HEADER = "awswaf:managed:aws:known-bad-inputs:Log4JRCE_Header",
}

/**
 * Enum for AWSManagedRulesCommonRuleSet Rules
 */
export enum COMMON_RULE_SET_RULES {
  NoUserAgent_HEADER = "NoUserAgent_HEADER",
  UserAgent_BadBots_HEADER = "UserAgent_BadBots_HEADER",
  SizeRestrictions_QUERYSTRING = "SizeRestrictions_QUERYSTRING",
  SizeRestrictions_Cookie_HEADER = "SizeRestrictions_Cookie_HEADER",
  SizeRestrictions_BODY = "SizeRestrictions_BODY",
  SizeRestrictions_URIPATH = "SizeRestrictions_URIPATH",
  EC2MetaDataSSRF_BODY  = "EC2MetaDataSSRF_BODY",
  EC2MetaDataSSRF_COOKIE  = "EC2MetaDataSSRF_COOKIE",
  EC2MetaDataSSRF_URIPATH = "EC2MetaDataSSRF_URIPATH",
  EC2MetaDataSSRF_QUERYARGUMENTS = "EC2MetaDataSSRF_QUERYARGUMENTS",
  GenericLFI_BODY = "GenericLFI_BODY",
  GenericLFI_QUERYARGUMENTS = "GenericLFI_QUERYARGUMENTS",
  GenericLFI_URIPATH  = "GenericLFI_URIPATH",
  GenericRFI_BODY = "GenericRFI_BODY",
  GenericRFI_QUERYARGUMENTS = "GenericRFI_QUERYARGUMENTS",
  GenericRFI_URIPATH  = "GenericRFI_URIPATH",
  CrossSiteScripting_COOKIE = "CrossSiteScripting_COOKIE",
  CrossSiteScripting_QUERYARGUMENTS = "CrossSiteScripting_QUERYARGUMENTS",
  CrossSiteScripting_BODY = "CrossSiteScripting_BODY",
  CrossSiteScripting_URIPATH  = "CrossSiteScripting_URIPATH",
  RestrictedExtensions_URIPATH = "RestrictedExtensions_URIPATH",
  RestrictedExtensions_QUERYARGUMENTS = "RestrictedExtensions_QUERYARGUMENTS",
}

/**
 * Enum for AWSManagedRulesCommonRuleSet Labels
 */
export enum COMMON_RULE_SET_LABELS {
  GenericLFI_QUERYARGUMENTS = "awswaf:managed:aws:core-rule-set:GenericLFI_QueryArguments",
  SizeRestrictions_Cookie_HEADER = "awswaf:managed:aws:core-rule-set:SizeRestrictions_Cookie_Header",
  EC2MetaDataSSRF_URIPATH = "awswaf:managed:aws:core-rule-set:EC2MetaDataSSRF_URIPath",
  NoUserAgent_HEADER = "awswaf:managed:aws:core-rule-set:NoUserAgent_Header",
  EC2MetaDataSSRF_BODY = "awswaf:managed:aws:core-rule-set:EC2MetaDataSSRF_Body",
  GenericLFI_URIPATH = "awswaf:managed:aws:core-rule-set:GenericLFI_URIPath",
  GenericRFI_URIPATH = "awswaf:managed:aws:core-rule-set:GenericRFI_URIPath",
  SizeRestrictions_QUERYSTRING = "awswaf:managed:aws:core-rule-set:SizeRestrictions_QueryString",
  SizeRestrictions_BODY = "awswaf:managed:aws:core-rule-set:SizeRestrictions_Body",
  GenericRFI_BODY = "awswaf:managed:aws:core-rule-set:GenericRFI_Body",
  UserAgent_BadBots_HEADER = "awswaf:managed:aws:core-rule-set:BadBots_Header",
  SizeRestrictions_URIPATH = "awswaf:managed:aws:core-rule-set:SizeRestrictions_URIPath",
  GenericLFI_BODY = "awswaf:managed:aws:core-rule-set:GenericLFI_Body",
  RestrictedExtensions_QUERYARGUMENTS = "awswaf:managed:aws:core-rule-set:RestrictedExtensions_QueryArguments",
  CrossSiteScripting_URIPATH = "awswaf:managed:aws:core-rule-set:CrossSiteScripting_URIPath",
  CrossSiteScripting_BODY = "awswaf:managed:aws:core-rule-set:CrossSiteScripting_Body",
  RestrictedExtensions_URIPATH = "awswaf:managed:aws:core-rule-set:RestrictedExtensions_URIPath",
  EC2MetaDataSSRF_COOKIE = "awswaf:managed:aws:core-rule-set:EC2MetaDataSSRF_Cookie",
  GenericRFI_QUERYARGUMENTS = "awswaf:managed:aws:core-rule-set:GenericRFI_QueryArguments",
  CrossSiteScripting_QUERYARGUMENTS = "awswaf:managed:aws:core-rule-set:CrossSiteScripting_QueryArguments",
  CrossSiteScripting_COOKIE = "awswaf:managed:aws:core-rule-set:CrossSiteScripting_Cookie",
  EC2MetaDataSSRF_QUERYARGUMENTS = "awswaf:managed:aws:core-rule-set:EC2MetaDataSSRF_QueryArguments",

}

/**
 * Enum for AWSManagedRulesAdminProtectionRuleSet Rules
 */
export enum ADMIN_PROTECTION_RULE_SET_RULES {
  AdminProtection_URIPATH = "AdminProtection_URIPATH",
}

/**
 * Enum for AWSManagedRulesAdminProtectionRuleSet Labels
 */
export enum ADMIN_PROTECTION_RULE_SET_LABELS {
  AdminProtection_URIPATH = "awswaf:managed:aws:admin-protection:AdminProtection_URIPath",
}

/**
 * AWS Managed roule Group Vendor
 */
export enum ManagedRuleGroupVendor {
  AWS = "AWS"
}

/**
 * AWS WAF Content Type
 *
 * The type of content in the payload that you are defining in the Content string.
 *
 * @see https://docs.aws.amazon.com/waf/latest/APIReference/API_CustomResponseBody.html
 */
export enum CustomResponseBodiesContentType {
  APPLICATION_JSON = "APPLICATION_JSON",
  TEXT_HTML = "TEXT_HTML",
  TEXT_PLAIN = "TEXT_PLAIN",
}

/**
 * enum for supported webacl types
 * following types are waiting for support if you need a GraphQLApi Firewall just use an ApiGateway:Stage Firewall
 *  - "AWS::Cognito::UserPool"
 *  - "AWS::AppSync::GraphQLApi"
 */
export enum WebAclTypeEnum {
  ELASTICLOADBALANCINGV2_LOADBALANCER = "AWS::ElasticLoadBalancingV2::LoadBalancer",
  CLOUDFRONT_DISTRIBUTION = "AWS::CloudFront::Distribution",
  APIGATEWAYV2_API = "AWS::ApiGatewayV2::Api",
  APIGATEWAY_STAGE = "AWS::ApiGateway::Stage",
  COGNITO_USERPOOL = "AWS::Cognito::UserPool",
  APPSYNC_GRAPHQLAPI  = "AWS::AppSync::GraphQLApi"
}