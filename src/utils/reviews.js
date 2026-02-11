// Deterministic product review generator for static builds
// Uses seeded PRNG so results are identical across builds

function djb2Hash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function createRNG(seed) {
  let state = seed;
  return function next() {
    state = (state * 1664525 + 1013904223) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

const FIRST_NAMES = [
  "Sarah", "James", "Liam", "Emma", "Jack", "Olivia", "Noah", "Charlotte",
  "Ethan", "Mia", "Lucas", "Amelia", "Mason", "Isla", "Oliver", "Ava",
  "William", "Chloe", "Thomas", "Grace", "Cooper", "Zoe", "Harry", "Ella",
  "Charlie", "Lily", "Oscar", "Sophie", "Leo", "Ruby", "Archer", "Harper",
  "Henry", "Matilda", "Riley", "Sienna", "Kai", "Layla", "Hunter", "Willow",
  "Max", "Phoebe", "Alexander", "Evie", "Daniel", "Ivy", "Ryan", "Aria",
  "Jake", "Luna", "Ben", "Jade", "Sam", "Tara", "Brooke", "Tyler",
  "Dylan", "Maddison", "Caleb", "Ellie", "Josh", "Scarlett", "Aiden", "Bella",
  "Mitchell", "Hannah", "Nathan", "Paige", "Connor", "Georgia", "Blake", "Poppy",
  "Cameron", "Stella", "Beau", "Violet", "Finn", "Jasmine", "Marcus", "Caitlin",
  "Patrick", "Tegan", "Shane", "Bianca", "Darcy", "Tahlia"
];

const LAST_INITIALS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
];

const REVIEW_TITLES = [
  "Great quality!",
  "Exactly what I needed",
  "Good but could be better",
  "Excellent flavour",
  "Decent product",
  "Love it!",
  "Highly recommend",
  "Solid purchase",
  "Not bad at all",
  "Amazing value",
  "Best I've tried",
  "Really impressed",
  "Better than expected",
  "Would buy again",
  "Perfect for me",
  "Very satisfied",
  "Good everyday vape",
  "Smooth and consistent",
  "Top notch",
  "Couldn't be happier",
  "Five stars from me",
  "Pleasantly surprised",
  "Great flavour, great clouds",
  "Does the job well",
  "Nice and reliable",
  "Super happy with this",
  "Wish I bought sooner",
  "Good quality for the price",
  "Fantastic product",
  "Pretty average honestly",
  "Not what I expected",
  "Disappointing",
  "Won't buy again",
  "Meh, it's okay",
  "Could be better",
  "Great clouds!",
  "Smooth hit every time",
  "Awesome throat hit",
  "My new daily driver",
  "Just okay",
  "Brilliant quality",
  "Feels premium",
  "Quick delivery too!",
  "Perfect upgrade",
  "Really enjoying this",
  "Flavour is unreal",
  "Compact and powerful",
  "Easy to use",
  "Great for beginners",
  "Best value around",
  "Stylish and functional",
  "No complaints",
  "Does exactly what it should"
];

const POSITIVE_BODIES = [
  "Amazing throat hit, super smooth. Would buy again without hesitation.",
  "Been using this for a few weeks now and I'm really impressed with the flavour and vapour production. Definitely worth the money.",
  "Exactly what I was looking for. Great quality and the flavour is spot on.",
  "This is hands down the best product I've tried. The flavour is incredible and it lasts ages.",
  "Really happy with this purchase. Performs just as described and the flavour is top notch.",
  "I've tried heaps of different products and this one is easily in my top three. Highly recommend to anyone.",
  "Solid build quality and great performance. Can't fault it at all.",
  "The flavour on this is unreal. Smooth draw and really satisfying. Will definitely be ordering again.",
  "Bought this on a whim and it's become my go-to. Absolutely love it.",
  "Great product, fast shipping from Vapelink as always. Very happy.",
  "Perfect for all-day vaping. Not too harsh, not too mild. Just right.",
  "Upgraded from my old device and the difference is night and day. So much better.",
  "Super impressed with the quality. Works flawlessly straight out of the box.",
  "Best purchase I've made in a while. The clouds are massive and the flavour is clean.",
  "Really enjoy using this every day. Consistent performance and great taste.",
  "Mates recommended this to me and they were spot on. Great product.",
  "Absolutely loving this. The flavour profiles come through really well and the vapour production is solid.",
  "Can't believe how good this is for the price. Punches well above its weight.",
  "So smooth, no harshness at all. Perfect throat hit every time.",
  "This ticks all the boxes for me. Quality build, great flavour, long lasting. What more could you want?",
  "Better than I expected honestly. The draw is smooth and the battery life is impressive.",
  "Brilliant product. I've already recommended it to a few mates.",
  "Really consistent flavour from start to finish. No drop-off in quality at all.",
  "Top quality product. Works perfectly and the flavour is amazing every single time."
];

const NEUTRAL_BODIES = [
  "Does the job. Nothing special but reliable.",
  "It's alright. Gets the job done but I've had better. Wouldn't say no to trying something else next time.",
  "Decent product for the price. Not the best I've used but certainly not the worst either.",
  "Pretty standard really. Works fine, flavour is okay, nothing to write home about.",
  "It's fine. Does what it says on the box. Might try a different one next time just for variety.",
  "Average product. The flavour is decent but the draw could be a bit smoother.",
  "Serviceable. It works and does what I need but I'm not blown away by it.",
  "Middle of the road for me. Some things are good, some could be improved. Overall it's okay.",
  "Not bad, not great. Flavour is passable and it works consistently at least.",
  "Reasonable quality. I'd give it a solid three out of five.",
  "It does the job day to day. Nothing exciting but nothing wrong with it either.",
  "Okay product. The flavour could be a bit more pronounced but otherwise fine."
];

const NEGATIVE_BODIES = [
  "Not what I expected. Flavour was off and the draw felt too tight.",
  "Disappointed with this one. The flavour wasn't great and it didn't last as long as I'd hoped.",
  "Wouldn't recommend. Had issues with it from day one and the flavour was pretty bland.",
  "Not a fan. The throat hit was way too harsh for my liking and the flavour was underwhelming.",
  "Pretty let down by this. Expected much better based on the description. Flavour was weak.",
  "Didn't enjoy this at all. Harsh draw and barely any flavour. Went back to my old product."
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(timestamp) {
  const d = new Date(timestamp);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const mon = MONTHS[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day} ${mon} ${year}`;
}

function pickWeightedRating(rand) {
  const r = rand();
  if (r < 0.40) return 5;
  if (r < 0.70) return 4;
  if (r < 0.90) return 3;
  if (r < 0.95) return 2;
  return 1;
}

function pickBody(rating, rand) {
  if (rating >= 4) {
    return POSITIVE_BODIES[Math.floor(rand() * POSITIVE_BODIES.length)];
  }
  if (rating === 3) {
    return NEUTRAL_BODIES[Math.floor(rand() * NEUTRAL_BODIES.length)];
  }
  return NEGATIVE_BODIES[Math.floor(rand() * NEGATIVE_BODIES.length)];
}

// Date range: 2024-01-01 to 2026-02-01
const DATE_START = new Date("2024-01-01T00:00:00Z").getTime();
const DATE_END = new Date("2026-02-01T00:00:00Z").getTime();
const DATE_RANGE = DATE_END - DATE_START;

export function generateReviews(handle) {
  const seed = djb2Hash(handle);
  const rand = createRNG(seed);

  const reviewCount = 10 + Math.floor(rand() * 91); // 10-100
  const reviews = [];

  for (let i = 0; i < reviewCount; i++) {
    const firstName = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const lastInit = LAST_INITIALS[Math.floor(rand() * LAST_INITIALS.length)];
    const rating = pickWeightedRating(rand);
    const timestamp = DATE_START + Math.floor(rand() * DATE_RANGE);
    const title = REVIEW_TITLES[Math.floor(rand() * REVIEW_TITLES.length)];
    const body = pickBody(rating, rand);
    const verified = rand() < 0.7;

    reviews.push({
      id: `${handle}-${i}`,
      name: `${firstName} ${lastInit}.`,
      rating,
      date: formatDate(timestamp),
      title,
      body,
      verified,
      _ts: timestamp,
    });
  }

  // Sort newest first
  reviews.sort((a, b) => b._ts - a._ts);

  // Remove internal timestamp
  reviews.forEach((r) => delete r._ts);

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const averageRating = Math.round((sum / reviews.length) * 10) / 10;

  return {
    reviews,
    averageRating,
    totalReviews: reviews.length,
  };
}

export function getStarDistribution(reviews) {
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of reviews) {
    dist[r.rating]++;
  }
  return dist;
}
