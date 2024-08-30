/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { IncomingWebhook } from "./IncomingWebhook";
import { PolicySummary } from "@aws-sdk/client-fms";
import { AccountWebAcls, FmsPolicy } from "../../../SharedComponents/types/index";
import * as AdaptiveCards from "adaptivecards";
import {getProductPrice}  from "../../../../tools/helpers/pricing";
import { PriceRegions, RegionString } from "../../../../types/config";
import * as packageJsonObject from "../../../../../package.json";
import {addAccount} from "../../helper";

export async function unusedNotificationTeams(AllWAFs: AccountWebAcls[], UniqueUnusedFMSPolicies:  FmsPolicy[], allFMSPolicies: PolicySummary[], bucketName: string, key: string, Webhook: string): Promise<void> {
  const webhook = new IncomingWebhook(Webhook);
  const totalWafs: number = AllWAFs.reduce((acc, account) => acc + account.TotalWafs, 0);
  const wafsInUse: number = AllWAFs.reduce((acc, account) => acc + account.WafsInUse, 0);
  const ignoredWafs: number = AllWAFs.reduce((acc, account) => acc + account.IgnoredWafs, 0);
  const card = new AdaptiveCards.AdaptiveCard();
  card.version = AdaptiveCards.Versions.v1_5;
  card.height = "stretch";

  const logoblock = new AdaptiveCards.Image();
  logoblock.url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABhCAYAAAAgLwTnAAAEsmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS41LjAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyIKICAgIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIgogICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgdGlmZjpJbWFnZUxlbmd0aD0iOTciCiAgIHRpZmY6SW1hZ2VXaWR0aD0iMTAwIgogICB0aWZmOlJlc29sdXRpb25Vbml0PSIyIgogICB0aWZmOlhSZXNvbHV0aW9uPSI3Mi8xIgogICB0aWZmOllSZXNvbHV0aW9uPSI3Mi8xIgogICBleGlmOlBpeGVsWERpbWVuc2lvbj0iMTAwIgogICBleGlmOlBpeGVsWURpbWVuc2lvbj0iOTciCiAgIGV4aWY6Q29sb3JTcGFjZT0iMSIKICAgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIKICAgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIgogICB4bXA6TW9kaWZ5RGF0ZT0iMjAyMi0w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";
  logoblock.size = AdaptiveCards.Size.Large;
  logoblock.style = AdaptiveCards.ImageStyle.Default;
  logoblock.horizontalAlignment = AdaptiveCards.HorizontalAlignment.Center;
  logoblock.spacing = AdaptiveCards.Spacing.None;
  card.addItem(logoblock);

  const subjectblock = new AdaptiveCards.TextBlock();
  subjectblock.text =  "Unutilized Firewall Report";
  subjectblock.wrap = true;
  subjectblock.weight = AdaptiveCards.TextWeight.Bolder;
  subjectblock.size = AdaptiveCards.TextSize.Large;
  card.addItem(subjectblock);

  const UnusedWafsInfo = "The following WebACLs are not attached to any AWS resource:\n\n";
  let accountsArray: {wafName: string, region: string, accounts: string[]}[] = [];
  for (const account of AllWAFs) {
    if(account.TotalWafs - account.WafsInUse > 0){
      for (const region in account.WebACLsPerAccount) {
        if(account.WebACLsPerAccount[region].UnusedWebACLs.length !== 0){
          for(const unusedwaf of account.WebACLsPerAccount[region].UnusedWebACLs) {
            accountsArray = addAccount({wafName: unusedwaf.Name,region},account.AccountAlias, accountsArray);
          }}
      }
    }
  }

  const regiondefinition = new AdaptiveCards.TableColumnDefinition();
  regiondefinition.computedWidth = new AdaptiveCards.SizeAndUnit(2, AdaptiveCards.SizeUnit.Weight);
  regiondefinition.width = new AdaptiveCards.SizeAndUnit(2, AdaptiveCards.SizeUnit.Weight);

  const wafdefinition = new AdaptiveCards.TableColumnDefinition();
  wafdefinition.computedWidth = new AdaptiveCards.SizeAndUnit(3, AdaptiveCards.SizeUnit.Weight);
  wafdefinition.width = new AdaptiveCards.SizeAndUnit(3, AdaptiveCards.SizeUnit.Weight);

  const accountdefinition = new AdaptiveCards.TableColumnDefinition();
  accountdefinition.computedWidth = new AdaptiveCards.SizeAndUnit(2, AdaptiveCards.SizeUnit.Weight);
  accountdefinition.width = new AdaptiveCards.SizeAndUnit(2, AdaptiveCards.SizeUnit.Weight);

  const unusedWafsTable = new AdaptiveCards.Table();
  unusedWafsTable.separator = true;
  unusedWafsTable.spacing = AdaptiveCards.Spacing.Medium;
  unusedWafsTable.firstRowAsHeaders = true;
  unusedWafsTable.showGridLines = true;
  unusedWafsTable.verticalCellContentAlignment = AdaptiveCards.VerticalAlignment.Center;
  unusedWafsTable.addColumn(wafdefinition);
  unusedWafsTable.addColumn(regiondefinition);
  unusedWafsTable.addColumn(accountdefinition);
  unusedWafsTable.gridStyle = "default";
  unusedWafsTable.isVisible = true;
  
  const accountheadertext = new AdaptiveCards.TextBlock();
  accountheadertext.text = "🏷️ Account(s)";

  const regionheadertext = new AdaptiveCards.TextBlock();
  regionheadertext.text = "🌎 Region";

  const wafheadertext = new AdaptiveCards.TextBlock();
  wafheadertext.text = "🔥 Firewall";


  const headerrow = new AdaptiveCards.TableRow();

  const regionheadercell = new AdaptiveCards.TableCell();
  regionheadercell.addItem(regionheadertext);
  const wafheadercell = new AdaptiveCards.TableCell();
  wafheadercell.addItem(wafheadertext);
  const accountheadercell = new AdaptiveCards.TableCell();
  accountheadercell.addItem(accountheadertext);

  const fmsheadercell = new AdaptiveCards.TableCell();
  headerrow.addCell(wafheadercell);
  headerrow.addCell(regionheadercell);
  headerrow.addCell(accountheadercell);
  headerrow.addCell(fmsheadercell);
  unusedWafsTable.addRow(headerrow);

  for (const account of accountsArray.slice(0, 5)) {
    const accountrowtext = new AdaptiveCards.TextBlock();
    accountrowtext.text = account.accounts.join(", ").replace(/, /g, "\\\n");
    const regionrowtext = new AdaptiveCards.TextBlock();
    regionrowtext.text = account.region;
    const wafrowtext = new AdaptiveCards.TextBlock();
    wafrowtext.text = account.wafName;
    wafrowtext.wrap = true;
    const row = new AdaptiveCards.TableRow();
    const regioncell = new AdaptiveCards.TableCell();
    regioncell.addItem(regionrowtext);
    const wafcell = new AdaptiveCards.TableCell();
    wafcell.addItem(wafrowtext);
    const accountcell = new AdaptiveCards.TableCell();
    accountcell.addItem(accountrowtext);


    row.addCell(wafcell);
    row.addCell(regioncell);
    row.addCell(accountcell);
    unusedWafsTable.addRow(row);
  }

  const unusedWafsTextBlock = new AdaptiveCards.TextBlock();
  unusedWafsTextBlock.text = UnusedWafsInfo;
  unusedWafsTextBlock.wrap = true;
  unusedWafsTextBlock.weight = AdaptiveCards.TextWeight.Default;
  card.addItem(unusedWafsTextBlock);
  card.addItem(unusedWafsTable);

  
  const region = process.env.AWS_DEFAULT_REGION || "us-east-1";
  const policyPrice = Number(await getProductPrice(PriceRegions[region as RegionString],"AWSFMS","WAFv2"));
  const webAclPrice = Number(await getProductPrice(PriceRegions[region as RegionString] as PriceRegions,"awswaf",undefined,"Web ACL"));

  const totalcost = (allFMSPolicies.length * policyPrice) + (totalWafs * webAclPrice);
  const potentialsavings = ((UniqueUnusedFMSPolicies.length)*policyPrice) + ((totalWafs - wafsInUse)*webAclPrice);
  const savingsPercentage = (potentialsavings / totalcost) * 100;
  const cardfacts: AdaptiveCards.Fact[] = [];
  cardfacts.push(new AdaptiveCards.Fact("🧮  WebACLs total", totalWafs.toString()));
  cardfacts.push(new AdaptiveCards.Fact("❌  WebACLs ignored", ignoredWafs.toString()));
  cardfacts.push(new AdaptiveCards.Fact("🗑️  WebACLs not used", (totalWafs - wafsInUse).toString()));
  cardfacts.push(new AdaptiveCards.Fact("🧮  FMS Pol total", allFMSPolicies.length.toString()));
  cardfacts.push(new AdaptiveCards.Fact("🚨  FMS Pol not used", UniqueUnusedFMSPolicies.length.toString()));
  cardfacts.push(new AdaptiveCards.Fact("💰  Total Cost", `${totalcost} $`));
  cardfacts.push(new AdaptiveCards.Fact("💸  Potential Savings", `${potentialsavings} ＄`));
  cardfacts.push(new AdaptiveCards.Fact("％   Savings in percent", `${Math.round(savingsPercentage)} %`));
  const facts = new AdaptiveCards.FactSet();
  facts.separator = true;
  facts.facts = cardfacts;
  card.addItem(facts);

  const InfoText =` ℹ firewall cost are calculated based on the AWS Price List API and would occur per month. The calculation is done without considering specifc Rules - so you can exspect to save more money.\n\n All WAF Names from managed WAFs, are shown without the version number suffix.\n\n The Table just shows 5 unused WAFs. The full list is available in the attached file.\n\n
  The report was generated on ${new Date().toLocaleString()} from © [aws firewall factory](https://github.com/globaldatanet/aws-firewall-factory) - 🏷️ Version: ${packageJsonObject.version.toString()}\n`;
  const InfoTextBlock = new AdaptiveCards.TextBlock();
  InfoTextBlock.text = InfoText;
  InfoTextBlock.weight = AdaptiveCards.TextWeight.Default;
  InfoTextBlock.wrap = true;
  InfoTextBlock.separator = true;

  const Action = new AdaptiveCards.OpenUrlAction();
  Action.title = "📄 Latest Unused Firewall Report";
  Action.url = `https://s3.console.aws.amazon.com/s3/object/${bucketName}/${key}?region=${region}`;
  card.addItem(InfoTextBlock);
  card.addAction(Action);
  const response = await webhook.send(card);
  console.log("ℹ️ Teams Notification reponse-Code: " + response?.status);
}