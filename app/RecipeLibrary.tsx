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

export type Recipe = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  favorite: boolean;
};

export type RecipeIngredient = {
  id: string;
  recipe_id: string;
  name: string;
  quantity: string | null;
  category: string;
};

const recipeCategories = [
  "Dinner",
  "Lunch",
  "Breakfast",
  "Slow Cooker",
  "BBQ",
  "Pasta",
  "Soup",
  "Takeout / Easy",
  "Other"
];

const ingredientCategories = [
  "Produce",
  "Meat",
  "Dairy",
  "Bakery",
  "Pantry",
  "Frozen",
  "Household",
  "Other"
];

type Props = {
  recipes: Recipe[];
  ingredients: RecipeIngredient[];
  reload: () => Promise<void>;
};

export default function RecipeLibrary({
  recipes,
  ingredients,
  reload
}: Props) {
  const {
    session,
    householdId
  } = useFamily();

  const [
    selectedRecipeId,
    setSelectedRecipeId
  ] = useState<string | null>(
    null
  );

  const [
    recipeName,
    setRecipeName
  ] = useState("");

  const [
    recipeDescription,
    setRecipeDescription
  ] = useState("");

  const [
    recipeCategory,
    setRecipeCategory
  ] = useState("Dinner");

  const [
    ingredientName,
    setIngredientName
  ] = useState("");

  const [
    ingredientQuantity,
    setIngredientQuantity
  ] = useState("");

  const [
    ingredientCategory,
    setIngredientCategory
  ] = useState("Other");

  const [
    message,
    setMessage
  ] = useState("");

  const [
    savingRecipe,
    setSavingRecipe
  ] = useState(false);

  const [
    savingIngredient,
    setSavingIngredient
  ] = useState(false);

  useEffect(() => {
    if (
      selectedRecipeId &&
      recipes.some(
        recipe =>
          recipe.id ===
          selectedRecipeId
      )
    ) {
      return;
    }

    if (
      recipes.length > 0
    ) {
      setSelectedRecipeId(
        recipes[0].id
      );
    } else {
      setSelectedRecipeId(
        null
      );
    }
  }, [
    recipes,
    selectedRecipeId
  ]);

  const selectedRecipe =
    recipes.find(
      recipe =>
        recipe.id ===
        selectedRecipeId
    ) || null;

  const selectedIngredients =
    selectedRecipe
      ? ingredients.filter(
          ingredient =>
            ingredient.recipe_id ===
            selectedRecipe.id
        )
      : [];

  async function createRecipe(
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

    if (
      !recipeName.trim()
    ) {
      setMessage(
        "Enter a recipe name."
      );

      return;
    }

    setSavingRecipe(
      true
    );

    const {
      data,
      error
    } =
      await supabase
        .from(
          "recipes"
        )
        .insert({
          household_id:
            householdId,

          created_by:
            session.user.id,

          name:
            recipeName.trim(),

          description:
            recipeDescription.trim() ||
            null,

          category:
            recipeCategory,

          favorite:
            false
        })
        .select(
          "id"
        )
        .single();

    if (error) {
      console.error(
        "Unable to create recipe:",
        error
      );

      setMessage(
        `Unable to save recipe: ${error.message}`
      );

      setSavingRecipe(
        false
      );

      return;
    }

    setRecipeName("");
    setRecipeDescription("");
    setRecipeCategory(
      "Dinner"
    );

    setSelectedRecipeId(
      data.id
    );

    setMessage(
      "Recipe saved. You can add its ingredients now."
    );

    await reload();

    setSavingRecipe(
      false
    );
  }

  async function toggleFavorite(
    recipe: Recipe
  ) {
    setMessage("");

    const {
      error
    } =
      await supabase
        .from(
          "recipes"
        )
        .update({
          favorite:
            !recipe.favorite,

          updated_at:
            new Date().toISOString()
        })
        .eq(
          "id",
          recipe.id
        );

    if (error) {
      setMessage(
        `Unable to update recipe: ${error.message}`
      );

      return;
    }

    await reload();
  }

  async function deleteRecipe(
    recipe: Recipe
  ) {
    const confirmed =
      window.confirm(
        `Delete "${recipe.name}" from your recipe library?`
      );

    if (!confirmed) {
      return;
    }

    setMessage("");

    const {
      error
    } =
      await supabase
        .from(
          "recipes"
        )
        .delete()
        .eq(
          "id",
          recipe.id
        );

    if (error) {
      setMessage(
        `Unable to delete recipe: ${error.message}`
      );

      return;
    }

    setSelectedRecipeId(
      null
    );

    await reload();
  }

  async function addIngredient(
    event: FormEvent
  ) {
    event.preventDefault();

    setMessage("");

    if (!householdId) {
      setMessage(
        "Your household could not be loaded."
      );

      return;
    }

    if (!selectedRecipe) {
      setMessage(
        "Select a recipe first."
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

    setSavingIngredient(
      true
    );

    const {
      error
    } =
      await supabase
        .from(
          "recipe_ingredients"
        )
        .insert({
          household_id:
            householdId,

          recipe_id:
            selectedRecipe.id,

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
        "Unable to add recipe ingredient:",
        error
      );

      setMessage(
        `Unable to add ingredient: ${error.message}`
      );

      setSavingIngredient(
        false
      );

      return;
    }

    setIngredientName("");
    setIngredientQuantity("");
    setIngredientCategory(
      "Other"
    );

    await reload();

    setSavingIngredient(
      false
    );
  }

  async function deleteIngredient(
    ingredient: RecipeIngredient
  ) {
    const {
      error
    } =
      await supabase
        .from(
          "recipe_ingredients"
        )
        .delete()
        .eq(
          "id",
          ingredient.id
        );

    if (error) {
      setMessage(
        `Unable to delete ingredient: ${error.message}`
      );

      return;
    }

    await reload();
  }

  return (
    <div
      style={{
        marginTop:
          "34px"
      }}
    >
      <div
        className="section-header"
      >
        <div>
          <h2>
            Recipe library
          </h2>

          <p>
            Save the meals your
            family already enjoys
            so you only have to
            enter them once.
          </p>
        </div>
      </div>

      <div
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "minmax(280px, 0.75fr) minmax(0, 1.25fr)",

          gap:
            "18px",

          marginTop:
            "20px"
        }}
      >
        <div>
          <form
            className="form-card"
            onSubmit={
              createRecipe
            }
            style={{
              marginTop: 0
            }}
          >
            <div>
              <h3>
                Add a recipe
              </h3>

              <div
                className="muted-small"
              >
                Add the meals you
                regularly make at
                home.
              </div>
            </div>

            <input
              value={
                recipeName
              }
              onChange={
                event =>
                  setRecipeName(
                    event.target.value
                  )
              }
              placeholder="Chicken souvlaki bowls"
              required
            />

            <select
              value={
                recipeCategory
              }
              onChange={
                event =>
                  setRecipeCategory(
                    event.target.value
                  )
              }
            >
              {recipeCategories.map(
                category => (
                  <option
                    key={
                      category
                    }
                    value={
                      category
                    }
                  >
                    {category}
                  </option>
                )
              )}
            </select>

            <textarea
              rows={3}
              value={
                recipeDescription
              }
              onChange={
                event =>
                  setRecipeDescription(
                    event.target.value
                  )
              }
              placeholder="Optional notes, sides or prep instructions..."
            />

            <button
              className="btn"
              type="submit"
              disabled={
                savingRecipe
              }
            >
              {savingRecipe
                ? "Saving..."
                : "+ Add recipe"}
            </button>
          </form>

          <div
            style={{
              marginTop:
                "18px"
            }}
          >
            <h3>
              Your recipes
            </h3>

            {recipes.length ===
            0 ? (
              <div
                className="empty-state"
                style={{
                  marginTop:
                    "10px"
                }}
              >
                <h3>
                  No recipes saved
                  yet.
                </h3>
              </div>
            ) : (
              <div
                style={{
                  borderTop:
                    "1px solid var(--border)"
                }}
              >
                {recipes.map(
                  recipe => (
                    <button
                      key={
                        recipe.id
                      }
                      type="button"
                      onClick={() =>
                        setSelectedRecipeId(
                          recipe.id
                        )
                      }
                      style={{
                        width:
                          "100%",

                        display:
                          "flex",

                        alignItems:
                          "center",

                        gap:
                          "10px",

                        padding:
                          "12px 8px",

                        border:
                          "none",

                        borderBottom:
                          "1px solid var(--border)",

                        background:
                          selectedRecipeId ===
                          recipe.id
                            ? "var(--accent-soft)"
                            : "transparent",

                        color:
                          "var(--text)",

                        cursor:
                          "pointer",

                        textAlign:
                          "left",

                        borderRadius:
                          selectedRecipeId ===
                          recipe.id
                            ? "9px"
                            : "0"
                      }}
                    >
                      <span
                        style={{
                          flex: 1
                        }}
                      >
                        <strong>
                          {recipe.favorite
                            ? "★ "
                            : ""}
                          {
                            recipe.name
                          }
                        </strong>

                        <span
                          className="muted-small"
                          style={{
                            display:
                              "block",

                            marginTop:
                              "2px"
                          }}
                        >
                          {
                            recipe.category
                          }
                        </span>
                      </span>

                      <span
                        className="muted-small"
                      >
                        {
                          ingredients.filter(
                            ingredient =>
                              ingredient.recipe_id ===
                              recipe.id
                          ).length
                        }{" "}
                        items
                      </span>
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          {!selectedRecipe ? (
            <div
              className="empty-state"
              style={{
                marginTop: 0
              }}
            >
              <h3>
                Select a recipe to
                manage its
                ingredients.
              </h3>
            </div>
          ) : (
            <div
              className="form-card"
              style={{
                marginTop: 0
              }}
            >
              <div
                className="section-header"
              >
                <div>
                  <div
                    className="muted-small"
                  >
                    {
                      selectedRecipe.category
                    }
                  </div>

                  <h2
                    style={{
                      marginTop:
                        "3px"
                    }}
                  >
                    {
                      selectedRecipe.name
                    }
                  </h2>

                  {selectedRecipe.description && (
                    <p
                      style={{
                        margin:
                          "5px 0 0"
                      }}
                    >
                      {
                        selectedRecipe.description
                      }
                    </p>
                  )}
                </div>

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
                    type="button"
                    className="btn secondary"
                    onClick={() =>
                      toggleFavorite(
                        selectedRecipe
                      )
                    }
                  >
                    {selectedRecipe.favorite
                      ? "★ Favorite"
                      : "☆ Favorite"}
                  </button>

                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() =>
                      deleteRecipe(
                        selectedRecipe
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div
                style={{
                  marginTop:
                    "18px"
                }}
              >
                <h3>
                  Ingredients
                </h3>

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
                    {ingredientCategories.map(
                      category => (
                        <option
                          key={
                            category
                          }
                          value={
                            category
                          }
                        >
                          {
                            category
                          }
                        </option>
                      )
                    )}
                  </select>

                  <button
                    className="btn"
                    type="submit"
                    disabled={
                      savingIngredient
                    }
                  >
                    {savingIngredient
                      ? "..."
                      : "+"}
                  </button>
                </form>

                {selectedIngredients.length ===
                0 ? (
                  <p
                    className="muted-small"
                    style={{
                      marginTop:
                        "14px"
                    }}
                  >
                    No ingredients
                    added yet.
                  </p>
                ) : (
                  <div
                    style={{
                      marginTop:
                        "10px"
                    }}
                  >
                    {selectedIngredients.map(
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
                                ingredient
                              )
                            }
                          >
                            ✕
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

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
