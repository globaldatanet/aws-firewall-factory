import {paginateGetMemberAccounts} from "../SharedComponents/services/fms";

/**
 * Lambda function handler
 * @param {any} Event
 * @returns {Promise<string[]>} MemberAccounts
 */
export const handler = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Event: any,
): Promise<string[]> => {
  console.log("Lambda is invoked with:" + JSON.stringify(Event));
  const memberAccounts = paginateGetMemberAccounts();
  return memberAccounts;
};