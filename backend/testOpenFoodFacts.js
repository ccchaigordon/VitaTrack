const fetchFromOpenFoodFacts = require("./src/utils/fetchFromOpenFoodFacts");

(async () => {
  const result = await fetchFromOpenFoodFacts("2 bananas");
  console.log(result);
})();