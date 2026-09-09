mealIngredients.map(
  ingredient => ({
    user_id:
      session.user.id,

    household_id:
      householdId,

    name:
      ingredient.name,

    quantity:
      ingredient.quantity,

    category:
      ingredient.category,

    completed:
      false
  })
)
