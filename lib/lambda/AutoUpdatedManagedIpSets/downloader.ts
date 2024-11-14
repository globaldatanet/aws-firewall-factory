import axios from "axios";
import * as fs from "fs";



// Helper function to download a File based indicate on the URL
export async function downloadFile(downloadUrl: string,searchRegexOnUrl: RegExp, outputType: string ): Promise<string> {
  let savePath = "";

  try {
    // Fetch the download page
    console.log(`ℹ️  Fetching the download page from: ${downloadUrl}`);
    console.log(`🔎 Searching for the download link using the regex: ${searchRegexOnUrl.source}`);
    console.log(`⦂  Output type: ${outputType}`);
    const downloadPage = await axios.get(downloadUrl);
    const downloadLinkMatch = downloadPage.data.match(searchRegexOnUrl);
    if (!downloadLinkMatch) {
      console.error("❌  Failed to find the download link");
      throw new Error("❌  Failed to find the download link");
    }
    const downloadLink = downloadLinkMatch[0];

    if (downloadLink) {
      // Download the actual file
      const response = await axios.get(downloadLink, { responseType: "arraybuffer" });
      console.log(`🔗  Found the download link: ${downloadLink} - Downloading file`);
      savePath = `/tmp/${downloadLink.split("/").pop()?.replaceAll("?", "")?.replaceAll("=", "")}.${outputType.toLowerCase()}`;
      // Save the file to the specified path
      fs.writeFileSync(savePath, response.data, "utf8");
      console.log(`📂  File saved to ${savePath}`);
    }
  }
  catch (error) {
    console.error(`❌  Error downloading the file: ${error}`);
    throw new Error(`❌  Error downloading the file: ${error}`);
  }
  return savePath;
}