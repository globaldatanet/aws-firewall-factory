import * as cdk from "aws-cdk-lib";
import { aws_fms as fms } from "aws-cdk-lib";
/**
 * Interface for Shield Configuration in the Firewall Factory
 */
export interface ShieldConfig {
    readonly General: {
      /**
       * Defines a Prefix which will be added to all resources.
       */
      readonly Prefix: string;
      /**
       * Defines a Stage which will be added to all resources.
       */
      readonly Stage: string;
      /**
       * Defines the selected logging option for the WAF.
       */
      readonly LoggingConfiguration: "S3" | "Firehose";
      /**
       * Define KMS Key to be used for Kinesis Firehose.
       */
      readonly FireHoseKeyArn?: string;
      /**
       * Define Name of the S3 Bucket where the Firewall logs will be stored.
       */
      readonly S3LoggingBucketName: string;
      readonly DeployHash?: string;
      /**
       * Defines the domain(s) that can be checked to audit your WAF.
       */
      readonly SecuredDomain: Array<string>;
      /**
       * Defines whether to set up a dashboard for your firewall in the central security account. To use this feature, cross-account functionality must be enabled in CloudWatch.
       */
      readonly CreateDashboard?: boolean;
    };
    readonly WebAcl: {
      /**
       * Replace web ACLs that are currently associated with in-scope resources with the web ACLs created by this policy - Default is False
       */
      readonly OverrideCustomerWebACLAssociation?: boolean;
    };
  
    defaultActionType: "ALLOW" | "DENY" | "COUNT" | "NONE";
    /**
     * Indicates if the policy should be automatically applied to new resources.
     *
     * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-fms-policy.html#cfn-fms-policy-remediationenabled
     */
    readonly remediationEnabled: boolean | cdk.IResolvable;
    /**
     * An array of `ResourceType` objects.
     *
     * Use this only to specify multiple resource types. To specify a single resource type, use `ResourceType` .
     *
     * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-fms-policy.html#cfn-fms-policy-resourcetypelist
     */
    readonly resourceTypeList?: Array<string>;
    /**
     * The type of resource protected by or in scope of the policy.
     *
     * This is in the format shown in the [AWS Resource Types Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html) . To apply this policy to multiple resource types, specify a resource type of `ResourceTypeList` and then specify the resource types in a `ResourceTypeList` .
     *
     * The following are valid resource types for each Firewall Manager policy type:
     *
     * - AWS WAF Classic - `AWS::ApiGateway::Stage` , `AWS::CloudFront::Distribution` , and `AWS::ElasticLoadBalancingV2::LoadBalancer` .
     * - AWS WAF - `AWS::ApiGateway::Stage` , `AWS::ElasticLoadBalancingV2::LoadBalancer` , and `AWS::CloudFront::Distribution` .
     * - DNS Firewall, AWS Network Firewall , and third-party firewall - `AWS::EC2::VPC` .
     * - AWS Shield Advanced - `AWS::ElasticLoadBalancingV2::LoadBalancer` , `AWS::ElasticLoadBalancing::LoadBalancer` , `AWS::EC2::EIP` , and `AWS::CloudFront::Distribution` .
     * - Security group content audit - `AWS::EC2::SecurityGroup` , `AWS::EC2::NetworkInterface` , and `AWS::EC2::Instance` .
     * - Security group usage audit - `AWS::EC2::SecurityGroup` .
     *
     * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-fms-policy.html#cfn-fms-policy-resourcetype
     */
    readonly resourceType?: string;
    /**
     * The name of the AWS Firewall Manager policy.
     *
     * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-fms-policy.html#cfn-fms-policy-policyname
     */
    readonly policyName: string;
    /**
     * Specifies the AWS account IDs and AWS Organizations organizational units (OUs) to include in the policy.
     *
     * Specifying an OU is the equivalent of specifying all accounts in the OU and in any of its child OUs, including any child OUs and accounts that are added at a later time.
     *
     * You can specify inclusions or exclusions, but not both. If you specify an `IncludeMap` , AWS Firewall Manager applies the policy to all accounts specified by the `IncludeMap` , and does not evaluate any `ExcludeMap` specifications. If you do not specify an `IncludeMap` , then Firewall Manager applies the policy to all accounts except for those specified by the `ExcludeMap` .
     *
     * You can specify account IDs, OUs, or a combination:
     *
     * - Specify account IDs by setting the key to `ACCOUNT` . For example, the following is a valid map: `{“ACCOUNT” : [“accountID1”, “accountID2”]}` .
     * - Specify OUs by setting the key to `ORGUNIT` . For example, the following is a valid map: `{“ORGUNIT” : [“ouid111”, “ouid112”]}` .
     * - Specify accounts and OUs together in a single map, separated with a comma. For example, the following is a valid map: `{“ACCOUNT” : [“accountID1”, “accountID2”], “ORGUNIT” : [“ouid111”, “ouid112”]}` .
     *
     * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-fms-policy.html#cfn-fms-policy-includemap
     */
    readonly includeMap?: fms.CfnPolicy.IEMapProperty;
    /**
     * Specifies the AWS account IDs and AWS Organizations organizational units (OUs) to exclude from the policy.
     *
     * Specifying an OU is the equivalent of specifying all accounts in the OU and in any of its child OUs, including any child OUs and accounts that are added at a later time.
     *
     * You can specify inclusions or exclusions, but not both. If you specify an `IncludeMap` , AWS Firewall Manager applies the policy to all accounts specified by the `IncludeMap` , and does not evaluate any `ExcludeMap` specifications. If you do not specify an `IncludeMap` , then Firewall Manager applies the policy to all accounts except for those specified by the `ExcludeMap` .
     *
     * You can specify account IDs, OUs, or a combination:
     *
     * - Specify account IDs by setting the key to `ACCOUNT` . For example, the following is a valid map: `{“ACCOUNT” : [“accountID1”, “accountID2”]}` .
     * - Specify OUs by setting the key to `ORGUNIT` . For example, the following is a valid map: `{“ORGUNIT” : [“ouid111”, “ouid112”]}` .
     * - Specify accounts and OUs together in a single map, separated with a comma. For example, the following is a valid map: `{“ACCOUNT” : [“accountID1”, “accountID2”], “ORGUNIT” : [“ouid111”, “ouid112”]}` .
     *
     * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-fms-policy.html#cfn-fms-policy-excludemap
     */
    readonly excludeMap?: fms.CfnPolicy.IEMapProperty;
    /**
     * Used only when tags are specified in the `ResourceTags` property.
     *
     * If this property is `True` , resources with the specified tags are not in scope of the policy. If it's `False` , only resources with the specified tags are in scope of the policy.
     *
     * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-fms-policy.html#cfn-fms-policy-excluderesourcetags
     */
    readonly excludeResourceTags: boolean;
  }