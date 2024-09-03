import { AccountWebAcls, FmsPolicy } from "../SharedComponents/types/index";


/**
 * Detect unused FMS Policies - That means we can delete the whole FMS Policy and not only the WebACL
 * @param {AccountWebAcls[]} data
 * @returns {Promise<WebACLs[]>}
 */
export function detectUnusedFmsPolicies(data: AccountWebAcls[]): FmsPolicy[] {
  const unusedFirewalls: FmsPolicy[] = [];
  const unusedFirewallsByName: { [name: string]: boolean } = {};

  // Function to check if a firewall name is in use
  const isFirewallNameInUse = (name: string) => {
    for (const account of data) {
      for (const regionData of Object.values(account.WebACLsPerAccount)) {
        if (regionData.WebACLsInUse.some(firewall => firewall.Name === name)) {
          return true;
        }
      }
    }
    return false;
  };

  data.forEach(account => {
    Object.values(account.WebACLsPerAccount).forEach(regionData => {
      regionData.UnusedWebACLs.forEach(firewall => {
        if (
          !unusedFirewallsByName[firewall.Name] && // Check if the firewall name is not already added
          firewall.Name.startsWith("FMManagedWebACLV2") && // Check if the firewall name starts with the specified prefix - This is to identify the FMS Policies
          !isFirewallNameInUse(firewall.Name) // Check if the firewall name is not in use in any other WebACLsInUse array
        ) {
          unusedFirewalls.push({ Name: firewall.Name, Scope: firewall.Scope});
          unusedFirewallsByName[firewall.Name] = true;
        }
      });
    });
  });

  return unusedFirewalls;
}

/**
 * Detect unused FMS Policies - That means we can delete the whole FMS Policy and not only the WebACL
 * @param {AccountWebAcls[]} data
 * @returns {Promise<WebACLs[]>}
 */
export function detectUniqueFmsPolicies(data: AccountWebAcls[]): FmsPolicy[] {
  const uniqueFirewalls: FmsPolicy[] = [];
  const uniqueFirewallsbyName: { [name: string]: boolean } = {};


  data.forEach(account => {
    Object.values(account.WebACLsPerAccount).forEach(regionData => {
      regionData.UnusedWebACLs.forEach(firewall => {
        if (
          !uniqueFirewallsbyName[firewall.Name] && // Check if the firewall name is not already added
          firewall.Name.startsWith("FMManagedWebACLV2")// Check if the firewall name starts with the specified prefix - This is to identify the FMS Policies
        ) {
          uniqueFirewalls.push({ Name: firewall.Name, Scope: firewall.Scope});
          uniqueFirewallsbyName[firewall.Name] = true;
        }
      });
      regionData.WebACLsInUse.forEach(firewall => {
        if (
          !uniqueFirewallsbyName[firewall.Name] && // Check if the firewall name is not already added
          firewall.Name.startsWith("FMManagedWebACLV2")// Check if the firewall name starts with the specified prefix - This is to identify the FMS Policies
        ) {
          uniqueFirewalls.push({ Name: firewall.Name, Scope: firewall.Scope});
          uniqueFirewallsbyName[firewall.Name] = true;
        }
      });
      regionData.IgnoredWebACLs.forEach(firewall => {
        if (
          !uniqueFirewallsbyName[firewall.Name] && // Check if the firewall name is not already added
          firewall.Name.startsWith("FMManagedWebACLV2")// Check if the firewall name starts with the specified prefix - This is to identify the FMS Policies
        ) {
          uniqueFirewalls.push({ Name: firewall.Name, Scope: firewall.Scope});
          uniqueFirewallsbyName[firewall.Name] = true;
        }
      });
    });
  });

  return uniqueFirewalls;
}


/**
 * Function to add an account to the accountsArray - This is used to create a table for Team Notifications
 * @param wafRegionKey {wafName: string, region: string}
 * @param account string
 * @param accountsArray {wafName: string, region: string, accounts: string[]}[]
 * @returns 
 */
export function addAccount(wafRegionKey: {wafName: string, region: string}, account: string, accountsArray: {wafName: string, region: string, accounts: string[]}[]): {wafName: string, region: string, accounts: string[]}[] {
  const entry = accountsArray.find(
    (item) =>
      item.wafName === wafRegionKey.wafName && item.region === wafRegionKey.region
  );

  if (entry) {
    entry.accounts.push(account);
  } else {
    accountsArray.push({ ...wafRegionKey, accounts: [account] });
  }
  return accountsArray;
}