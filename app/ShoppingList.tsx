const {
  error
} =
  await supabase
    .from(
      "shopping_items"
    )
    .insert({
      user_id:
        session.user.id,

      household_id:
        householdId,

      name:
        name.trim(),

      quantity:
        quantity.trim() ||
        null,

      category,

      completed:
        false
    });
