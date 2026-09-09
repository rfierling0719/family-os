"use client";

import {
  FormEvent,
  useEffect,
  useState
} from "react";

import {
  supabase
} from "./lib/supabase";

import {
  useFamily
} from "./FamilyProvider";

import RecipeLibrary, {
  Recipe,
  RecipeIngredient
} from "./RecipeLibrary";


type Meal = {
  id: string;
  meal_date: string;
  meal_name: string;
  notes: string | null;
  recipe_id: string | null;
};


type Ingredient = {
  id: string;
  meal_plan_id: string;
  name: string;
  quantity: string | null;
  category: string;
};


const categories = [
  "Produce",
  "Meat",
  "Dairy",
  "Bakery",
  "Pantry",
  "Frozen",
  "Household",
  "Other"
];


export default function MealPlanner() {
  const {
    session,
    householdId
  } =
    useFamily();


  const [
    meals,
    setMeals
  ] =
    useState<Meal[]>([]);


  const [
    ingredients,
    setIngredients
  ] =
    useState<Ingredient[]>([]);


  const [
    recipes,
    setRecipes
  ] =
    useState<Recipe[]>([]);


  const [
    recipeIngredients,
    setRecipeIngredients
  ] =
    useState<
      RecipeIngredient[]
    >([]);


  const [
    selectedDate,
    setSelectedDate
  ] =
    useState("");


  const [
    mealName,
    setMealName
  ] =
    useState("");


  const [
    notes,
    setNotes
  ] =
    useState("");


  const [
    selectedRecipeId,
    setSelectedRecipeId
  ] =
    useState("");


  const [
    suggestedRecipeId,
    setSuggestedRecipeId
  ] =
    useState("");


  const [
    ingredientName,
    setIngredientName
  ] =
    useState("");


  const [
    ingredientQuantity,
    setIngredientQuantity
  ] =
    useState("");


  const [
    ingredientCategory,
    setIngredientCategory
  ] =
    useState("Other");


  const [
    message,
    setMessage
  ] =
    useState("");


  const [
    savingMeal,
    setSavingMeal
  ] =
    useState(false);


  const [
    addingIngredient,
    setAddingIngredient
  ] =
    useState(false);


  const [
    addingToShopping,
    setAddingToShopping
  ] =
    useState(false);


  const [
    applyingRecipe,
    setApplyingRecipe
  ] =
    useState(false);


  const [
    planningWeek,
    setPlanningWeek
  ] =
    useState(false);


  function dateValue(
    date: Date
  ) {
    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        "0"
      );

    return `${year}-${month}-${day}`;
  }


  function getWeekDates() {
    const today =
      new Date();

    const monday =
      new Date(today);

    const difference =
      today.getDay() ===
      0
        ? -6
        : 1 -
          today.getDay();

    monday.setDate(
      monday.getDate() +
        difference
    );

    return Array.from(
      {
        length: 7
      },
      (
        _,
        index
      ) => {
        const date =
          new Date(
            monday
          );

        date.setDate(
          monday.getDate() +
            index
        );

        return date;
      }
    );
  }


  const days =
    getWeekDates();


  async function loadData() {
    if (!householdId) {
      return;
    }

    const start =
      dateValue(
        days[0]
      );

    const end =
      dateValue(
        days[6]
      );


    const [
      mealResult,
      recipeResult,
      recipeIngredientResult
    ] =
      await Promise.all([
        supabase
          .from(
            "meal_plans"
          )
          .select(
            "id,meal_date,meal_name,notes,recipe_id"
          )
          .eq(
            "household_id",
            householdId
          )
          .gte(
            "meal_date",
            start
          )
          .lte(
            "meal_date",
            end
          )
          .order(
            "meal_date"
          ),

        supabase
          .from(
            "recipes"
          )
          .select(
            "id,name,description,category,favorite"
          )
          .eq(
            "household_id",
            householdId
          )
          .order(
            "favorite",
            {
              ascending:
                false
            }
          )
          .order(
            "name"
          ),

        supabase
          .from(
            "recipe_ingredients"
          )
          .select(
            "id,recipe_id,name,quantity,category"
          )
          .eq(
            "household_id",
            householdId
          )
      ]);


    if (
      mealResult.error
    ) {
      console.error(
        "Unable to load meals:",
        mealResult.error
      );

      setMessage(
        `Unable to load meals: ${mealResult.error.message}`
      );

      return;
    }


    if (
      recipeResult.error
    ) {
      console.error(
        "Unable to load recipes:",
        recipeResult.error
      );

      setMessage(
        `Unable to load recipes: ${recipeResult.error.message}`
      );

      return;
    }


    if (
      recipeIngredientResult.error
    ) {
      console.error(
        "Unable to load recipe ingredients:",
        recipeIngredientResult.error
      );

      setMessage(
        `Unable to load recipe ingredients: ${recipeIngredientResult.error.message}`
      );

      return;
    }


    const loadedMeals =
      (mealResult.data ||
        []) as Meal[];


    setMeals(
      loadedMeals
    );


    setRecipes(
      (recipeResult.data ||
        []) as Recipe[]
    );


    setRecipeIngredients(
      (recipeIngredientResult.data ||
        []) as RecipeIngredient[]
    );


    if (
      loadedMeals.length ===
      0
    ) {
      setIngredients(
        []
      );

      return;
    }


    const {
      data:
        ingredientData,

      error:
        ingredientError
    } =
      await supabase
        .from(
          "meal_ingredients"
        )
        .select(
          "id,meal_plan_id,name,quantity,category"
        )
        .eq(
          "household_id",
          householdId
        )
        .in(
          "meal_plan_id",
          loadedMeals.map(
            meal =>
              meal.id
          )
        );


    if (
      ingredientError
    ) {
      console.error(
        "Unable to load ingredients:",
        ingredientError
      );

      setMessage(
        `Unable to load ingredients: ${ingredientError.message}`
      );

      return;
    }


    setIngredients(
      (ingredientData ||
        []) as Ingredient[]
    );
  }


  useEffect(() => {
    if (!householdId) {
      return;
    }

    loadData();


    const channel =
      supabase
        .channel(
          `meal-planner-${householdId}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema:
              "public",
            table:
              "meal_plans",
            filter:
              `household_id=eq.${householdId}`
          },
          () => {
            loadData();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema:
              "public",
            table:
              "meal_ingredients",
            filter:
              `household_id=eq.${householdId}`
          },
          () => {
            loadData();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema:
              "public",
            table:
              "recipes",
            filter:
              `household_id=eq.${householdId}`
          },
          () => {
            loadData();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema:
              "public",
            table:
              "recipe_ingredients",
            filter:
              `household_id=eq.${householdId}`
          },
          () => {
            loadData();
          }
        )
        .subscribe();


    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [householdId]);


  function selectedMeal() {
    return meals.find(
      meal =>
        meal.meal_date ===
        selectedDate
    );
  }


  function chooseDay(
    date: Date
  ) {
    const value =
      dateValue(
        date
      );

    const existing =
      meals.find(
        meal =>
          meal.meal_date ===
          value
      );


    setSelectedDate(
      value
    );


    setMealName(
      existing?.meal_name ||
        ""
    );


    setNotes(
      existing?.notes ||
        ""
    );


    setSelectedRecipeId(
      existing?.recipe_id ||
        ""
    );


    setMessage("");
  }


  async function saveMeal(
    event: FormEvent
  ) {
    event.preventDefault();

    setMessage("");


    if (!session) {
      setMessage(
        "You are not signed in."
      );

      return;
    }


    if (!householdId) {
      setMessage(
        "Your household could not be loaded."
      );

      return;
    }


    if (!selectedDate) {
      setMessage(
        "Choose a day first."
      );

      return;
    }


    if (!mealName.trim()) {
      setMessage(
        "Enter a meal name."
      );

      return;
    }


    setSavingMeal(
      true
    );


    const {
      error
    } =
      await supabase
        .from(
          "meal_plans"
        )
        .upsert(
          {
            user_id:
              session.user.id,

            household_id:
              householdId,

            meal_date:
              selectedDate,

            meal_name:
              mealName.trim(),

            notes:
              notes.trim() ||
              null,

            recipe_id:
              null,

            updated_at:
              new Date().toISOString()
          },
          {
            onConflict:
              "household_id,meal_date"
          }
        );


    if (error) {
      console.error(
        "Unable to save meal:",
        error
      );

      setMessage(
        `Unable to save meal: ${error.message}`
      );

      setSavingMeal(
        false
      );

      return;
    }


    setSelectedRecipeId(
      ""
    );

    setMessage(
      "Meal saved."
    );

    await loadData();

    setSavingMeal(
      false
    );
  }


  async function copyRecipeToDate(
    recipe: Recipe,
    targetDate: string
  ) {
    if (
      !session ||
      !householdId
    ) {
      throw new Error(
        "Household session is unavailable."
      );
    }


    const {
      data:
        savedMeal,

      error:
        mealError
    } =
      await supabase
        .from(
          "meal_plans"
        )
        .upsert(
          {
            user_id:
              session.user.id,

            household_id:
              householdId,

            meal_date:
              targetDate,

            meal_name:
              recipe.name,

            notes:
              recipe.description,

            recipe_id:
              recipe.id,

            updated_at:
              new Date().toISOString()
          },
          {
            onConflict:
              "household_id,meal_date"
          }
        )
        .select(
          "id"
        )
        .single();


    if (mealError) {
      throw new Error(
        mealError.message
      );
    }


    const mealPlanId =
      savedMeal.id;


    const {
      error:
        deleteError
    } =
      await supabase
        .from(
          "meal_ingredients"
        )
        .delete()
        .eq(
          "meal_plan_id",
          mealPlanId
        );


    if (deleteError) {
      throw new Error(
        deleteError.message
      );
    }


    const ingredientsForRecipe =
      recipeIngredients.filter(
        ingredient =>
          ingredient.recipe_id ===
          recipe.id
      );


    if (
      ingredientsForRecipe.length >
      0
    ) {
      const {
        error:
          ingredientError
      } =
        await supabase
          .from(
            "meal_ingredients"
          )
          .insert(
            ingredientsForRecipe.map(
              ingredient => ({
                household_id:
                  householdId,

                meal_plan_id:
                  mealPlanId,

                name:
                  ingredient.name,

                quantity:
                  ingredient.quantity,

                category:
                  ingredient.category
              })
            )
          );


      if (
        ingredientError
      ) {
        throw new Error(
          ingredientError.message
        );
      }
    }
  }


  async function applySelectedRecipe() {
    setMessage("");


    if (!selectedDate) {
      setMessage(
        "Choose a day first."
      );

      return;
    }


    const recipe =
      recipes.find(
        item =>
          item.id ===
          selectedRecipeId
      );


    if (!recipe) {
      setMessage(
        "Choose a saved recipe first."
      );

      return;
    }


    setApplyingRecipe(
      true
    );


    try {
      await copyRecipeToDate(
        recipe,
        selectedDate
      );


      setMealName(
        recipe.name
      );


      setNotes(
        recipe.description ||
          ""
      );


      setMessage(
        `"${recipe.name}" added to the meal plan.`
      );


      await loadData();
    } catch (error) {
      console.error(
        error
      );

      setMessage(
        error instanceof
          Error
          ? `Unable to use recipe: ${error.message}`
          : "Unable to use recipe."
      );
    }


    setApplyingRecipe(
      false
    );
  }


  function getSuggestion() {
    if (
      recipes.length ===
      0
    ) {
      setMessage(
        "Add some recipes to your Recipe Library first."
      );

      return;
    }


    const recipesUsedThisWeek =
      new Set(
        meals
          .map(
            meal =>
              meal.recipe_id
          )
          .filter(
            Boolean
          )
      );


    let available =
      recipes.filter(
        recipe =>
          !recipesUsedThisWeek.has(
            recipe.id
          )
      );


    if (
      available.length ===
      0
    ) {
      available =
        recipes;
    }


    const favoriteOptions =
      available.filter(
        recipe =>
          recipe.favorite
      );


    const pool =
      favoriteOptions.length >
      0
        ? [
            ...available,
            ...favoriteOptions
          ]
        : available;


    const randomRecipe =
      pool[
        Math.floor(
          Math.random() *
            pool.length
        )
      ];


    setSuggestedRecipeId(
      randomRecipe.id
    );

    setMessage("");
  }


  async function useSuggestion() {
    const recipe =
      recipes.find(
        item =>
          item.id ===
          suggestedRecipeId
      );


    if (!recipe) {
      return;
    }


    let targetDate =
      selectedDate;


    if (!targetDate) {
      const emptyDay =
        days.find(
          day =>
            !meals.some(
              meal =>
                meal.meal_date ===
                dateValue(
                  day
                )
            )
        );


      if (!emptyDay) {
        setMessage(
          "Choose a day to replace with the suggested meal."
        );

        return;
      }


      targetDate =
        dateValue(
          emptyDay
        );


      setSelectedDate(
        targetDate
      );
    }


    setApplyingRecipe(
      true
    );


    try {
      await copyRecipeToDate(
        recipe,
        targetDate
      );


      setMealName(
        recipe.name
      );


      setNotes(
        recipe.description ||
          ""
      );


      setSelectedRecipeId(
        recipe.id
      );


      setMessage(
        `"${recipe.name}" added to the week.`
      );


      await loadData();
    } catch (error) {
      setMessage(
        error instanceof
          Error
          ? `Unable to add suggested meal: ${error.message}`
          : "Unable to add suggested meal."
      );
    }


    setApplyingRecipe(
      false
    );
  }


  function shuffleRecipes(
    source:
      Recipe[]
  ) {
    const shuffled =
      [...source];


    for (
      let index =
        shuffled.length -
        1;
      index > 0;
      index--
    ) {
      const randomIndex =
        Math.floor(
          Math.random() *
            (index + 1)
        );


      [
        shuffled[index],
        shuffled[randomIndex]
      ] = [
        shuffled[randomIndex],
        shuffled[index]
      ];
    }


    return shuffled;
  }


  async function planMyWeek() {
    setMessage("");


    if (
      recipes.length ===
      0
    ) {
      setMessage(
        "Add some recipes to your Recipe Library first."
      );

      return;
    }


    const emptyDates =
      days
        .map(
          day =>
            dateValue(
              day
            )
        )
        .filter(
          date =>
            !meals.some(
              meal =>
                meal.meal_date ===
                date
            )
        );


    if (
      emptyDates.length ===
      0
    ) {
      setMessage(
        "This week already has meals planned for every day."
      );

      return;
    }


    setPlanningWeek(
      true
    );


    const alreadyUsed =
      new Set(
        meals
          .map(
            meal =>
              meal.recipe_id
          )
          .filter(
            Boolean
          )
      );


    const unusedRecipes =
      recipes.filter(
        recipe =>
          !alreadyUsed.has(
            recipe.id
          )
      );


    let pool =
      shuffleRecipes(
        unusedRecipes.length >
          0
          ? unusedRecipes
          : recipes
      );


    try {
      for (
        let index = 0;
        index <
        emptyDates.length;
        index++
      ) {
        if (
          index > 0 &&
          index %
            pool.length ===
            0
        ) {
          pool =
            shuffleRecipes(
              recipes
            );
        }


        const recipe =
          pool[
            index %
              pool.length
          ];


        await copyRecipeToDate(
          recipe,
          emptyDates[index]
        );
      }


      setMessage(
        `${emptyDates.length} meal${
          emptyDates.length ===
          1
            ? ""
            : "s"
        } planned for the week. Existing meals were left unchanged.`
      );


      await loadData();
    } catch (error) {
      console.error(
        error
      );

      setMessage(
        error instanceof
          Error
          ? `Unable to finish planning the week: ${error.message}`
          : "Unable to finish planning the week."
      );
    }


    setPlanningWeek(
      false
    );
  }


  async function addIngredient(
    event: FormEvent
  ) {
    event.preventDefault();

    setMessage("");


    const meal =
      selectedMeal();


    if (!householdId) {
      setMessage(
        "Your household could not be loaded."
      );

      return;
    }


    if (!meal) {
      setMessage(
        "Save the meal first."
      );

      return;
    }


    if (
      !ingredientName.trim()
    ) {
      setMessage(
        "Enter an ingredient."
      );

      return;
    }


    setAddingIngredient(
      true
    );


    const {
      error
    } =
      await supabase
        .from(
          "meal_ingredients"
        )
        .insert({
          household_id:
            householdId,

          meal_plan_id:
            meal.id,

          name:
            ingredientName.trim(),

          quantity:
            ingredientQuantity.trim() ||
            null,

          category:
            ingredientCategory
        });


    if (error) {
      console.error(
        "Unable to add ingredient:",
        error
      );

      setMessage(
        `Unable to add ingredient: ${error.message}`
      );

      setAddingIngredient(
        false
      );

      return;
    }


    setIngredientName("");
    setIngredientQuantity("");
    setIngredientCategory(
      "Other"
    );


    await loadData();

    setAddingIngredient(
      false
    );
  }


  async function deleteIngredient(
    id: string
  ) {
    setMessage("");


    const {
      error
    } =
      await supabase
        .from(
          "meal_ingredients"
        )
        .delete()
        .eq(
          "id",
          id
        );


    if (error) {
      setMessage(
        `Unable to delete ingredient: ${error.message}`
      );

      return;
    }


    await loadData();
  }


  async function addIngredientsToShopping() {
    setMessage("");


    const meal =
      selectedMeal();


    if (!meal) {
      setMessage(
        "Save the meal first."
      );

      return;
    }


    if (!session) {
      setMessage(
        "You are not signed in."
      );

      return;
    }


    if (!householdId) {
      setMessage(
        "Your household could not be loaded."
      );

      return;
    }


    const mealIngredients =
      ingredients.filter(
        ingredient =>
          ingredient.meal_plan_id ===
          meal.id
      );


    if (
      mealIngredients.length ===
      0
    ) {
      setMessage(
        "Add ingredients first."
      );

      return;
    }


    setAddingToShopping(
      true
    );


    const {
      error
    } =
      await supabase
        .from(
          "shopping_items"
        )
        .insert(
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
        );


    if (error) {
      setMessage(
        `Unable to add ingredients to Shopping: ${error.message}`
      );

      setAddingToShopping(
        false
      );

      return;
    }


    setMessage(
      `${mealIngredients.length} ingredient${
        mealIngredients.length ===
        1
          ? ""
          : "s"
      } added to Shopping.`
    );


    setAddingToShopping(
      false
    );
  }


  const currentMeal =
    selectedMeal();


  const currentIngredients =
    currentMeal
      ? ingredients.filter(
          item =>
            item.meal_plan_id ===
            currentMeal.id
        )
      : [];


  const suggestedRecipe =
    recipes.find(
      recipe =>
        recipe.id ===
        suggestedRecipeId
    ) || null;


  return (
    <div>
      <div
        className="section-header"
      >
        <div>
          <h2>
            Weekly meals
          </h2>

          <p>
            Plan dinner manually,
            choose from your recipes,
            or let Family OS build
            the week.
          </p>
        </div>


        <button
          className="btn"
          type="button"
          onClick={
            planMyWeek
          }
          disabled={
            planningWeek ||
            recipes.length ===
              0
          }
        >
          {planningWeek
            ? "Planning..."
            : "✦ Plan my week"}
        </button>
      </div>


      <div
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "minmax(0, 1fr) minmax(260px, 0.38fr)",

          gap:
            "16px",

          marginTop:
            "20px"
        }}
      >
        <div
          style={{
            padding:
              "16px",

            border:
              "1px solid var(--border)",

            borderRadius:
              "var(--radius-md)",

            background:
              "var(--surface-soft)"
          }}
        >
          <div
            className="section-header"
          >
            <div>
              <h3>
                Choose from your
                recipes
              </h3>

              <div
                className="muted-small"
              >
                Select a day below,
                then pick one of your
                saved recipes.
              </div>
            </div>
          </div>


          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "minmax(0, 1fr) auto",

              gap:
                "10px",

              marginTop:
                "12px"
            }}
          >
            <select
              value={
                selectedRecipeId
              }
              onChange={
                event =>
                  setSelectedRecipeId(
                    event.target.value
                  )
              }
            >
              <option
                value=""
              >
                Select a saved recipe...
              </option>

              {recipes.map(
                recipe => (
                  <option
                    key={
                      recipe.id
                    }
                    value={
                      recipe.id
                    }
                  >
                    {recipe.favorite
                      ? "★ "
                      : ""}
                    {
                      recipe.name
                    }
                  </option>
                )
              )}
            </select>


            <button
              className="btn"
              type="button"
              disabled={
                !selectedDate ||
                !selectedRecipeId ||
                applyingRecipe
              }
              onClick={
                applySelectedRecipe
              }
            >
              {applyingRecipe
                ? "Adding..."
                : "Use recipe"}
            </button>
          </div>
        </div>


        <div
          style={{
            padding:
              "16px",

            border:
              "1px solid var(--border)",

            borderRadius:
              "var(--radius-md)",

            background:
              "var(--accent-soft)"
          }}
        >
          <div
            className="muted-small"
            style={{
              fontWeight:
                700,

              textTransform:
                "uppercase",

              letterSpacing:
                "0.05em"
            }}
          >
            Meal suggestion
          </div>


          {suggestedRecipe ? (
            <>
              <h3
                style={{
                  margin:
                    "7px 0 4px"
                }}
              >
                {
                  suggestedRecipe.name
                }
              </h3>

              {suggestedRecipe.description && (
                <p
                  style={{
                    margin:
                      "0 0 12px",

                    fontSize:
                      "12px"
                  }}
                >
                  {
                    suggestedRecipe.description
                  }
                </p>
              )}


              <div
                style={{
                  display:
                    "flex",

                  gap:
                    "8px",

                  flexWrap:
                    "wrap"
                }}
              >
                <button
                  className="btn"
                  type="button"
                  onClick={
                    useSuggestion
                  }
                  disabled={
                    applyingRecipe
                  }
                >
                  Use this meal
                </button>

                <button
                  className="btn secondary"
                  type="button"
                  onClick={
                    getSuggestion
                  }
                >
                  Suggest another
                </button>
              </div>
            </>
          ) : (
            <button
              className="btn secondary"
              type="button"
              onClick={
                getSuggestion
              }
              disabled={
                recipes.length ===
                0
              }
              style={{
                marginTop:
                  "10px"
              }}
            >
              ✦ Suggest a meal
            </button>
          )}
        </div>
      </div>


      <div
        className="meal-week-grid"
      >
        {days.map(
          date => {
            const value =
              dateValue(
                date
              );


            const meal =
              meals.find(
                item =>
                  item.meal_date ===
                  value
              );


            return (
              <button
                key={
                  value
                }
                type="button"
                className={
                  selectedDate ===
                  value
                    ? "meal-day selected"
                    : "meal-day"
                }
                onClick={() =>
                  chooseDay(
                    date
                  )
                }
              >
                <span
                  className="muted-small"
                >
                  {date.toLocaleDateString(
                    [],
                    {
                      weekday:
                        "short"
                    }
                  )}
                </span>

                <strong>
                  {date.toLocaleDateString(
                    [],
                    {
                      month:
                        "short",
                      day:
                        "numeric"
                    }
                  )}
                </strong>

                <div
                  className="meal-day-name"
                >
                  {meal
                    ? meal.meal_name
                    : "No meal planned"}
                </div>
              </button>
            );
          }
        )}
      </div>


      {selectedDate && (
        <div
          className="meal-editor-grid"
        >
          <form
            className="form-card"
            onSubmit={
              saveMeal
            }
          >
            <h3>
              Dinner
            </h3>


            <input
              value={
                mealName
              }
              onChange={
                event =>
                  setMealName(
                    event.target.value
                  )
              }
              placeholder="Chicken Mediterranean bowls"
              required
            />


            <textarea
              value={
                notes
              }
              onChange={
                event =>
                  setNotes(
                    event.target.value
                  )
              }
              rows={3}
              placeholder="Sides, prep notes..."
            />


            <button
              className="btn"
              type="submit"
              disabled={
                savingMeal
              }
            >
              {savingMeal
                ? "Saving..."
                : "Save meal"}
            </button>
          </form>


          <div
            className="form-card"
          >
            <div
              className="section-header"
            >
              <div>
                <h3>
                  Ingredients
                </h3>

                <div
                  className="muted-small"
                >
                  {currentIngredients.length} ingredient
                  {currentIngredients.length ===
                  1
                    ? ""
                    : "s"}
                </div>
              </div>


              {currentIngredients.length >
                0 && (
                <button
                  className="btn"
                  type="button"
                  onClick={
                    addIngredientsToShopping
                  }
                  disabled={
                    addingToShopping
                  }
                >
                  {addingToShopping
                    ? "Adding..."
                    : "Add to Shopping"}
                </button>
              )}
            </div>


            {!currentMeal ? (
              <p>
                Save the meal or use
                a recipe first, then
                add ingredients.
              </p>
            ) : (
              <>
                <form
                  className="ingredient-form"
                  onSubmit={
                    addIngredient
                  }
                >
                  <input
                    value={
                      ingredientName
                    }
                    onChange={
                      event =>
                        setIngredientName(
                          event.target.value
                        )
                    }
                    placeholder="Ingredient"
                    required
                  />


                  <input
                    value={
                      ingredientQuantity
                    }
                    onChange={
                      event =>
                        setIngredientQuantity(
                          event.target.value
                        )
                    }
                    placeholder="Qty"
                  />


                  <select
                    value={
                      ingredientCategory
                    }
                    onChange={
                      event =>
                        setIngredientCategory(
                          event.target.value
                        )
                    }
                  >
                    {categories.map(
                      item => (
                        <option
                          key={
                            item
                          }
                          value={
                            item
                          }
                        >
                          {
                            item
                          }
                        </option>
                      )
                    )}
                  </select>


                  <button
                    className="btn"
                    type="submit"
                    disabled={
                      addingIngredient
                    }
                  >
                    {addingIngredient
                      ? "..."
                      : "+"}
                  </button>
                </form>


                {currentIngredients.length ===
                0 ? (
                  <p
                    className="muted-small"
                    style={{
                      marginTop:
                        "12px"
                    }}
                  >
                    No ingredients
                    added yet.
                  </p>
                ) : (
                  currentIngredients.map(
                    ingredient => (
                      <div
                        key={
                          ingredient.id
                        }
                        className="ingredient-row"
                      >
                        <div
                          style={{
                            flex: 1
                          }}
                        >
                          <strong>
                            {
                              ingredient.name
                            }
                          </strong>

                          <div
                            className="muted-small"
                          >
                            {ingredient.quantity ||
                              "No quantity"}
                            {" · "}
                            {
                              ingredient.category
                            }
                          </div>
                        </div>


                        <button
                          className="icon-button"
                          type="button"
                          onClick={() =>
                            deleteIngredient(
                              ingredient.id
                            )
                          }
                        >
                          ✕
                        </button>
                      </div>
                    )
                  )
                )}
              </>
            )}
          </div>
        </div>
      )}


      {message && (
        <div
          className="status-message"
        >
          {message}
        </div>
      )}


      <RecipeLibrary
        recipes={
          recipes
        }
        ingredients={
          recipeIngredients
        }
        reload={
          loadData
        }
      />
    </div>
  );
}
