"use client";

import {
  FormEvent,
  useEffect,
  useState
} from "react";

import {
  createClient,
  Session
} from "@supabase/supabase-js";

const supabaseUrl =
  "https://wotovotafnfxgljbigju.supabase.co";

const supabaseAnonKey =
  "sb_publishable__S0fvT24O7SwwW6d62txlg_-r7EdF3J";

const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

type Meal = {
  id: string;
  user_id: string;
  meal_date: string;
  meal_name: string;
  notes: string | null;
};

export default function MealPlanner() {
  const [session, setSession] =
    useState<Session | null>(null);

  const [meals, setMeals] =
    useState<Meal[]>([]);

  const [mealDate, setMealDate] =
    useState("");

  const [mealName, setMealName] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  function dateToInput(date: Date) {
    const year = date.getFullYear();
    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function getWeekDates() {
    const today = new Date();

    const monday =
      new Date(today);

    const day =
      monday.getDay();

    const difference =
      day === 0
        ? -6
        : 1 - day;

    monday.setDate(
      monday.getDate() +
        difference
    );

    monday.setHours(
      0,
      0,
      0,
      0
    );

    return Array.from(
      { length: 7 },
      (_, index) => {
        const date =
          new Date(monday);

        date.setDate(
          monday.getDate() +
            index
        );

        return date;
      }
    );
  }

  const weekDates =
    getWeekDates();

  async function loadMeals() {
    setLoading(true);

    const start =
      dateToInput(
        weekDates[0]
      );

    const end =
      dateToInput(
        weekDates[6]
      );

    const {
      data,
      error
    } =
      await supabase
        .from("meal_plans")
        .select("*")
        .gte(
          "meal_date",
          start
        )
        .lte(
          "meal_date",
          end
        )
        .order(
          "meal_date",
          {
            ascending: true
          }
        );

    if (error) {
      console.error(
        "Unable to load meals:",
        error
      );

      setMeals([]);
    } else {
      setMeals(
        (data || []) as Meal[]
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    const start =
      async () => {
        const {
          data
        } =
          await supabase.auth.getSession();

        setSession(
          data.session
        );

        if (
          data.session
        ) {
          await loadMeals();
        } else {
          setLoading(false);
        }
      };

    start();

    const {
      data: {
        subscription
      }
    } =
      supabase.auth.onAuthStateChange(
        async (
          _event,
          currentSession
        ) => {
          setSession(
            currentSession
          );

          if (
            currentSession
          ) {
            await loadMeals();
          } else {
            setMeals([]);
            setLoading(false);
          }
        }
      );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function saveMeal(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !session ||
      !mealDate ||
      !mealName.trim()
    ) {
      return;
    }

    const {
      error
    } =
      await supabase
        .from("meal_plans")
        .upsert(
          {
            user_id:
              session.user.id,

            meal_date:
              mealDate,

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
              "user_id,meal_date"
          }
        );

    if (error) {
      console.error(
        "Unable to save meal:",
        error
      );

      alert(
        "Meal could not be saved."
      );

      return;
    }

    setMealName("");
    setNotes("");

    await loadMeals();
  }

  async function deleteMeal(
    meal: Meal
  ) {
    const {
      error
    } =
      await supabase
        .from("meal_plans")
        .delete()
        .eq(
          "id",
          meal.id
        );

    if (!error) {
      await loadMeals();
    }
  }

  function mealForDate(
    date: Date
  ) {
    const value =
      dateToInput(date);

    return meals.find(
      meal =>
        meal.meal_date ===
        value
    );
  }

  function selectDay(
    date: Date
  ) {
    const value =
      dateToInput(date);

    const existing =
      mealForDate(date);

    setMealDate(value);

    setMealName(
      existing?.meal_name ||
        ""
    );

    setNotes(
      existing?.notes ||
        ""
    );
  }

  if (!session) {
    return (
      <div>
        <h2>Meals</h2>

        <p>
          Sign in to use meal
          planning.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div>
        <h2>
          Weekly meals
        </h2>

        <p
          style={{
            opacity: 0.7
          }}
        >
          Plan dinner for the
          week.
        </p>
      </div>

      {loading ? (
        <p>
          Loading meals...
        </p>
      ) : (
        <div
          className="meal-week-grid"
          style={{
            marginTop:
              "20px"
          }}
        >
          {weekDates.map(
            date => {
              const meal =
                mealForDate(
                  date
                );

              const selected =
                mealDate ===
                dateToInput(
                  date
                );

              return (
                <button
                  key={
                    dateToInput(
                      date
                    )
                  }
                  onClick={() =>
                    selectDay(
                      date
                    )
                  }
                  style={{
                    textAlign:
                      "left",
                    border:
                      selected
                        ? "2px solid currentColor"
                        : "1px solid rgba(128,128,128,.2)",
                    borderRadius:
                      "12px",
                    padding:
                      "14px",
                    background:
                      "transparent",
                    cursor:
                      "pointer",
                    minHeight:
                      "120px"
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "12px",
                      opacity:
                        0.65
                    }}
                  >
                    {date.toLocaleDateString(
                      [],
                      {
                        weekday:
                          "short"
                      }
                    )}
                  </div>

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
                    style={{
                      marginTop:
                        "12px"
                    }}
                  >
                    {meal ? (
                      <>
                        <strong>
                          {
                            meal.meal_name
                          }
                        </strong>

                        {meal.notes && (
                          <div
                            style={{
                              fontSize:
                                "12px",
                              opacity:
                                0.65,
                              marginTop:
                                "4px"
                            }}
                          >
                            {
                              meal.notes
                            }
                          </div>
                        )}
                      </>
                    ) : (
                      <span
                        style={{
                          opacity:
                            0.45
                        }}
                      >
                        No meal
                        planned
                      </span>
                    )}
                  </div>
                </button>
              );
            }
          )}
        </div>
      )}

      {mealDate && (
        <form
          onSubmit={
            saveMeal
          }
          style={{
            marginTop:
              "24px",
            padding:
              "18px",
            border:
              "1px solid rgba(128,128,128,.2)",
            borderRadius:
              "12px"
          }}
        >
          <h3>
            {new Date(
              `${mealDate}T12:00:00`
            ).toLocaleDateString(
              [],
              {
                weekday:
                  "long",
                month:
                  "long",
                day:
                  "numeric"
              }
            )}
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
            placeholder="Dinner"
            required
            style={{
              width:
                "100%",
              boxSizing:
                "border-box",
              padding:
                "10px",
              marginTop:
                "10px"
            }}
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
            placeholder="Notes, sides, prep..."
            rows={3}
            style={{
              width:
                "100%",
              boxSizing:
                "border-box",
              padding:
                "10px",
              marginTop:
                "10px"
            }}
          />

          <div
            style={{
              display:
                "flex",
              gap:
                "10px",
              marginTop:
                "10px"
            }}
          >
            <button
              className="btn"
              type="submit"
            >
              Save meal
            </button>

            {meals.some(
              meal =>
                meal.meal_date ===
                mealDate
            ) && (
              <button
                type="button"
                onClick={() => {
                  const meal =
                    meals.find(
                      item =>
                        item.meal_date ===
                        mealDate
                    );

                  if (meal) {
                    deleteMeal(
                      meal
                    );

                    setMealName(
                      ""
                    );

                    setNotes(
                      ""
                    );
                  }
                }}
                style={{
                  border:
                    "none",
                  background:
                    "transparent",
                  cursor:
                    "pointer"
                }}
              >
                Remove
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
