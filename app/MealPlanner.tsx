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

type Meal = {
  id: string;
  meal_date: string;
  meal_name: string;
  notes: string | null;
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
    useState<
      Ingredient[]
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

  function weekDates() {
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
    weekDates();

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

    const {
      data: mealData,
      error
    } =
      await supabase
        .from(
          "meal_plans"
        )
        .select(
          "id,meal_date,meal_name,notes"
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
        );

    if (error) {
      console.error(
        error
      );

      return;
    }

    const loadedMeals =
      (mealData ||
        []) as Meal[];

    setMeals(
      loadedMeals
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
        ingredientData
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
          `meals-${householdId}`
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
          loadData
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
          loadData
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

    setMessage("");
  }

  async function saveMeal(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !session ||
      !householdId ||
      !selectedDate ||
      !mealName.trim()
    ) {
      return;
    }

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
        error
      );

      setMessage(
        "Meal could not be saved."
      );
    } else {
      setMessage(
        "Meal saved."
      );

      await loadData();
    }
  }

  async function addIngredient(
    event: FormEvent
  ) {
    event.preventDefault();

    const meal =
      selectedMeal();

    if (
      !meal ||
      !householdId ||
      !ingredientName.trim()
    ) {
      return;
    }

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

    if (!error) {
      setIngredientName(
        ""
      );

      setIngredientQuantity(
        ""
      );

      setIngredientCategory(
        "Other"
      );

      await loadData();
    }
  }

  async function deleteIngredient(
    id: string
  ) {
    await supabase
      .from(
        "meal_ingredients"
      )
      .delete()
      .eq(
        "id",
        id
      );

    await loadData();
  }

  async function addIngredientsToShopping() {
    const meal =
      selectedMeal();

    if (
      !meal ||
      !session ||
      !householdId
    ) {
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
        "Ingredients could not be added."
      );
    } else {
      setMessage(
        `${mealIngredients.length} ingredient${
          mealIngredients.length ===
          1
            ? ""
            : "s"
        } added to Shopping.`
      );
    }
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

  return (
    <div>
      <h2>
        Weekly meals
      </h2>

      <p>
        Plan dinner and send
        ingredients directly to
        Shopping.
      </p>

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
                    event.target
                      .value
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
                    event.target
                      .value
                  )
              }
              rows={3}
              placeholder="Sides, prep notes..."
            />

            <button
              className="btn"
              type="submit"
            >
              Save meal
            </button>
          </form>

          <div
            className="form-card"
          >
            <div
              className="section-header"
            >
              <h3>
                Ingredients
              </h3>

              {currentIngredients.length >
                0 && (
                <button
                  className="btn secondary"
                  onClick={
                    addIngredientsToShopping
                  }
                >
                  Add to Shopping
                </button>
              )}
            </div>

            {!currentMeal ? (
              <p>
                Save the meal first,
                then add ingredients.
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
                          event.target
                            .value
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
                          event.target
                            .value
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
                          event.target
                            .value
                        )
                    }
                  >
                    {categories.map(
                      item => (
                        <option
                          key={
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
                  >
                    +
                  </button>
                </form>

                {currentIngredients.map(
                  ingredient => (
                    <div
                      key={
                        ingredient.id
                      }
                      className="ingredient-row"
                    >
                      <div>
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
    </div>
  );
}
