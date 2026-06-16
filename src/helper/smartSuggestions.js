const UPPER_LIMIT_NUTRIENTS = new Set(['SODIUM']);

export const safeFoodPrice = (value) => {
  if (value == null || value === 'N/A') return Infinity;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Infinity;
};

export const getFoodKey = (food) => (
  food?.fdcId || food?.id || food?.description || food?.name
)?.toString();

export const getPackageNutrientAmount = (food, nutrientKey) => {
  const portionGrams = Number(food?.portionGrams || food?.package_size_grams || 100);
  const amountPer100g = Number(food?.allNutrients?.[nutrientKey]?.amount || 0);
  if (!Number.isFinite(portionGrams) || !Number.isFinite(amountPer100g)) return 0;
  return (amountPer100g / 100) * portionGrams;
};

const isAutoSelectableFood = (food) => {
  const description = (food?.description || food?.name || '').toLowerCase();
  const blockedKeywords = [
    'mustard',
    'ketchup',
    'soy sauce',
    'hot sauce',
    'vinegar',
    'pickle',
    'mayonnaise',
    'table salt',
    'salt, iodized',
    'margarine',
    'shortening',
    'lard',
    'bouillon',
    'protein isolate',
    'whey protein',
  ];
  return !blockedKeywords.some(keyword => description.includes(keyword));
};

const getCandidateScore = ({ candidate, remaining, alreadyInDay }) => {
  const incrementalCost = alreadyInDay ? 0 : candidate.price;
  const coversRemaining = candidate.amount + 0.0001 >= remaining;

  if (coversRemaining) {
    return {
      coverageTier: 0,
      incrementalCost,
      price: candidate.price,
      waste: candidate.amount - remaining,
      valueScore: 0,
    };
  }

  return {
    coverageTier: 1,
    incrementalCost,
    price: candidate.price,
    waste: 0,
    valueScore: candidate.amount / candidate.price,
  };
};

const sortTargetsForDailyFill = (targets, foods) => {
  const pricedFoods = foods.filter(food => safeFoodPrice(food.storePrice) < Infinity);

  return [...targets].sort((a, b) => {
    const scoreTarget = (target) => {
      const dailyTarget = Number(target?.total_target_value || 0);
      const fullCoverageCandidates = pricedFoods
        .map(food => ({
          amount: getPackageNutrientAmount(food, target.nutrient_key),
          price: safeFoodPrice(food.storePrice),
        }))
        .filter(candidate => candidate.amount + 0.0001 >= dailyTarget);

      if (!fullCoverageCandidates.length) {
        return { count: Infinity, cheapest: Infinity };
      }

      const cheapest = Math.min(...fullCoverageCandidates.map(candidate => candidate.price));
      return { count: fullCoverageCandidates.length, cheapest };
    };

    const aScore = scoreTarget(a);
    const bScore = scoreTarget(b);

    if (aScore.count !== bScore.count) return aScore.count - bScore.count;
    if (aScore.cheapest !== bScore.cheapest) return bScore.cheapest - aScore.cheapest;
    return String(a.nutrient_key).localeCompare(String(b.nutrient_key));
  });
};

export const buildLowestSpendDailySelections = ({
  targets,
  foods,
  days = 1,
  skipNutrients = UPPER_LIMIT_NUTRIENTS,
}) => {
  const normalizedDays = Math.max(1, Math.floor(Number(days) || 1));
  const activeTargets = (targets || [])
    .filter(target => target?.nutrient_key && Number(target.total_target_value) > 0)
    .filter(target => !skipNutrients.has(target.nutrient_key));

  const foodPool = (foods || [])
    .filter(food => getFoodKey(food))
    .filter(food => safeFoodPrice(food.storePrice) < Infinity)
    .filter(isAutoSelectableFood);

  const orderedTargets = sortTargetsForDailyFill(activeTargets, foodPool);
  const selectedQuantities = {};
  const selectedFoodsById = {};
  const selectedByNutrient = {};
  const unavailableAfterPreviousDays = new Set();

  for (let dayIndex = 0; dayIndex < normalizedDays; dayIndex += 1) {
    const selectedThisDay = new Set();
    const coveredThisDay = {};

    orderedTargets.forEach(target => {
      const nutrientKey = target.nutrient_key;
      const dailyTarget = Number(target.total_target_value || 0);
      const alreadyCovered = coveredThisDay[nutrientKey] || 0;
      const remaining = Math.max(0, dailyTarget - alreadyCovered);

      if (remaining <= 0.0001) return;

      const candidates = foodPool
        .filter(food => {
          const foodKey = getFoodKey(food);
          return !unavailableAfterPreviousDays.has(foodKey);
        })
        .map(food => {
          const foodKey = getFoodKey(food);
          return {
            food,
            foodKey,
            price: safeFoodPrice(food.storePrice),
            amount: getPackageNutrientAmount(food, nutrientKey),
            alreadyInDay: selectedThisDay.has(foodKey),
          };
        })
        .filter(candidate => candidate.amount > 0);

      if (!candidates.length) return;

      candidates.sort((a, b) => {
        const aScore = getCandidateScore({ candidate: a, remaining, alreadyInDay: a.alreadyInDay });
        const bScore = getCandidateScore({ candidate: b, remaining, alreadyInDay: b.alreadyInDay });

        if (aScore.coverageTier !== bScore.coverageTier) return aScore.coverageTier - bScore.coverageTier;
        if (aScore.incrementalCost !== bScore.incrementalCost) return aScore.incrementalCost - bScore.incrementalCost;
        if (aScore.coverageTier === 1 && aScore.valueScore !== bScore.valueScore) {
          return bScore.valueScore - aScore.valueScore;
        }
        if (aScore.price !== bScore.price) return aScore.price - bScore.price;
        if (aScore.waste !== bScore.waste) return aScore.waste - bScore.waste;
        return String(a.food.description || a.food.name || '').localeCompare(String(b.food.description || b.food.name || ''));
      });

      const best = candidates[0];
      selectedQuantities[best.foodKey] = 1;
      selectedFoodsById[best.foodKey] = { ...best.food, fdcId: best.foodKey };
      selectedThisDay.add(best.foodKey);
      selectedByNutrient[nutrientKey] = selectedByNutrient[nutrientKey] || [];
      if (!selectedByNutrient[nutrientKey].includes(best.foodKey)) {
        selectedByNutrient[nutrientKey].push(best.foodKey);
      }

      orderedTargets.forEach(otherTarget => {
        const otherKey = otherTarget.nutrient_key;
        coveredThisDay[otherKey] = (coveredThisDay[otherKey] || 0)
          + getPackageNutrientAmount(best.food, otherKey);
      });
    });

    selectedThisDay.forEach(foodKey => unavailableAfterPreviousDays.add(foodKey));
  }

  return {
    selectedQuantities,
    selectedFoods: Object.values(selectedFoodsById),
    selectedByNutrient,
  };
};
