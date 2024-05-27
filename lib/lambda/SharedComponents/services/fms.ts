import { FMSClient, ListMemberAccountsCommand, ListMemberAccountsCommandInput, ListMemberAccountsResponse, ListPoliciesCommand, PolicySummary, ListPoliciesRequest } from "@aws-sdk/client-fms";


/**
 *
 *   Returns a MemberAccounts object that lists the member accounts in the administrator's Amazon Web Services organization.
 *   Either an Firewall Manager administrator or the organization's management account can make this request.
 * @returns MemberAccounts
 */
const listMemberAccounts = async (client: FMSClient, token: undefined | string, maxResults = 10) => {
  try {
    const input: ListMemberAccountsCommandInput = {
      NextToken: token,
      MaxResults: maxResults,
    };

    const command = new ListMemberAccountsCommand(input);
    const response: ListMemberAccountsResponse = await client.send(command);
    
    return {
      memberAccounts: response.MemberAccounts,
      nextToken: response.NextToken,
    };
  } catch (error) {
    console.error("Error listing member accounts:", error);
    throw error;
  }
};

/**
 * Pagination for listMemberAccounts
 */
export async function paginateGetMemberAccounts(): Promise<string[]> {
  const client = new FMSClient({region: process.env.AWS_DEFAULT_REGION});
  const memberAccounts: string[] = [];
  let token = undefined;
  try {
    do {
      const { memberAccounts: accounts, nextToken } = await listMemberAccounts(client, token);
      if (accounts){
        memberAccounts.push(...accounts);
      }
      token = nextToken;
    } while (token);

    return memberAccounts;
  } catch (error) {
    console.error("Error paginating member accounts:", error);
    throw error;
  }
}

/**
 * List all policies per region and return if the policy is a WAFV2 policy
 * @param region AWS REGION
 * @returns PolicySummary[]
 */
export async function listAllPolicies(region: string): Promise<PolicySummary[]> {
  const client = new FMSClient({region});
  const policies: PolicySummary[] = [];
  let nextToken: string | undefined = undefined;

  do {
    const input: ListPoliciesRequest = {
      MaxResults: 100, // Adjust the number of results per request as needed
      NextToken: nextToken
    };
    try {
      const command = new ListPoliciesCommand(input);
      const response = await client.send(command);

      if (response.PolicyList) {
        for (const policy of response.PolicyList) {
          if(policy.SecurityServiceType  === "WAFV2") {
            policies.push(policy);
          }
        }
      }
      nextToken = response.NextToken;
    } catch (error) {
      console.error("Error listing policies: ", error);
      nextToken = undefined; // Exit loop on error
    }
  } while (nextToken);

  return policies;
}