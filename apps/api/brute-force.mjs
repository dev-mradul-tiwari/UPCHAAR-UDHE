import { RoomServiceClient } from 'livekit-server-sdk';

const apiKey = 'APIAR7mtWQuP9bP';
const baseSecretTemplate = 'vrZuSqjXUQNBfw[I]9y[O1]8h[O2]H1QQvxuwH[O3]at[O4]WwXheR3rN';

const charOptions = {
  '[I]': ['I', 'l', '1'],
  '[O1]': ['O', '0'],
  '[O2]': ['O', '0'],
  '[O3]': ['O', '0'],
  '[O4]': ['0', 'O'],
};

// Generate all combinations
let combinations = [baseSecretTemplate];

for (const [placeholder, options] of Object.entries(charOptions)) {
  const nextCombinations = [];
  for (const combo of combinations) {
    for (const opt of options) {
      nextCombinations.push(combo.replace(placeholder, opt));
    }
  }
  combinations = nextCombinations;
}

console.log(`Generated ${combinations.length} possible secrets to test...`);

// Mock Date just in case clock skew is also a factor
const OriginalDate = global.Date;
const fakeTime = new OriginalDate("2024-09-21T00:00:00Z").getTime();
function FakeDate(...args) {
  if (args.length === 0) return new OriginalDate(fakeTime);
  return new OriginalDate(...args);
}
FakeDate.prototype = OriginalDate.prototype;
FakeDate.now = () => fakeTime;
FakeDate.parse = OriginalDate.parse;
FakeDate.UTC = OriginalDate.UTC;
global.Date = FakeDate;

async function testSecret(secret) {
  try {
    const svc = new RoomServiceClient('https://upchaar-8bbftdwu.livekit.cloud', apiKey, secret);
    await svc.listRooms();
    return secret; // If it doesn't throw, we found it!
  } catch (e) {
    return null;
  }
}

async function run() {
  const batchSize = 10;
  for (let i = 0; i < combinations.length; i += batchSize) {
    const batch = combinations.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(testSecret));
    const found = results.find(r => r !== null);
    if (found) {
      console.log(`\nSUCCESS! FOUND THE CORRECT SECRET:`);
      console.log(found);
      process.exit(0);
    }
  }
  console.log("\nFailed to find the correct secret among the combinations.");
}

run().catch(console.error);
