
const url = "https://remotive.com/remote-jobs/customer-service/customer-retention-manager-2088656";
let hash = 0;
for (let i = 0; i < url.length; i++) {
  const char = url.charCodeAt(i);
  hash = ((hash << 5) - hash) + char;
  hash |= 0; // Convert to 32bit integer
}
const stableId = (hash >>> 0).toString(16).padStart(8, '0');
console.log("URL:", url);
console.log("Stable ID:", stableId);
console.log("Last 4 digits:", stableId.slice(-4));
