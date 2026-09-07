"use client";

import {
  useEffect,
  useState
} from "react";

import {
  createClient
} from "@supabase/supabase-js";

import CalendarSummary
  from "./CalendarSummary";

const supabaseUrl =
  "https://wotovotafnfxgljbigju.supabase.co";

const supabaseAnonKey =
  "sb_publishable__S0fvT24O7SwwW6d62txlg_-r7EdF3J";

const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

type Task = {
  id: string;
  title: string;
  due_date: string | null;
  priority: string;
  completed: boolean;
};

type HouseholdItem = {
  id: string;
  title: string;
  due_date: string | null;
  category: string;
  completed: boolean;
};

type Meal = {
  id: string;
  meal_name: string;
  notes: string | null;
  meal_date: string;
};

export default function TodayDashboard({
  navigate
}: {
  navigate: (
    section:
      | "tasks"
      | "shopping"
      | "home"
      | "meals"
  ) => void;
}) {
  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [
    household,
    setHousehold
  ] =
    useState<HouseholdItem[]>([]);

  const [
    shoppingCount,
    setShoppingCount
  ] =
    useState(0);

  const [meal, setMeal] =
    useState<Meal | null>(null);

  const [loading, setLoading] =
    useState(true);

  function todayValue() {
    const date =
      new Date();

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

  async function loadDashboard() {
    setLoading(true);

    const today =
      todayValue();

    const [
      taskResult,
      householdResult,
      shoppingResult,
      mealResult
    ] =
      await Promise.all([
        supabase
          .from("tasks")
          .select(
            "id,title,due_date,priority,completed"
          )
          .eq(
            "completed",
            false
          )
          .order(
            "due_date",
            {
              ascending:
                true,
              nullsFirst:
                false
            }
          )
          .limit(5),

        supabase
          .from(
            "household_items"
          )
          .select(
            "id,title,due_date,category,completed"
          )
          .eq(
            "completed",
            false
          )
          .not(
            "due_date",
            "is",
            null
          )
          .lte(
            "due_date",
            today
          )
          .order(
            "due_date",
            {
              ascending:
                true
            }
          )
          .limit(5),

        supabase
          .from(
            "shopping_items"
          )
          .select(
            "*",
            {
              count:
                "exact",
              head:
                true
            }
          )
          .eq(
            "completed",
            false
          ),

        supabase
          .from(
            "meal_plans"
          )
          .select(
            "id,meal_name,notes,meal_date"
          )
          .eq(
            "meal_date",
            today
          )
          .maybeSingle()
      ]);

    if (
      taskResult.data
    ) {
      setTasks(
        taskResult.data
      );
    }

    if (
      householdResult.data
    ) {
      setHousehold(
        householdResult.data
      );
    }

    setShoppingCount(
      shoppingResult.count ||
        0
    );

    setMeal(
      mealResult.data ||
        null
    );

    setLoading(false);
  }

  useEffect(() => {
    const start =
      async () => {
        const {
          data
        } =
          await supabase.auth.getSession();

        if (
          data.session
        ) {
          await loadDashboard();
        } else {
          setLoading(false);
        }
      };

    start();
  }, []);

  return (
    <>
      <div
        style={{
          marginBottom:
            "22px"
        }}
      >
        <h1>
          Good morning
        </h1>

        <p
          style={{
            opacity: 0.65
          }}
        >
          Here&apos;s what
          your household needs
          today.
        </p>
      </div>

      <div
        className="today-primary-grid"
      >
        <article>
          <CalendarSummary />
        </article>

        <article>
          <div
            className="card-heading"
          >
            <div>
              <h3>
                Needs attention
              </h3>

              <span
                className="muted-small"
              >
                Tasks and home
              </span>
            </div>

            <button
              className="text-button"
              onClick={() =>
                navigate(
                  "tasks"
                )
              }
            >
              View tasks
            </button>
          </div>

          {loading ? (
            <p>
              Loading...
            </p>
          ) : (
            <>
              {tasks.length ===
                0 &&
              household.length ===
                0 ? (
                <p>
                  Nothing urgent
                  right now. 🎉
                </p>
              ) : (
                <>
                  {tasks.map(
                    task => (
                      <div
                        key={
                          task.id
                        }
                        className="mini-row"
                      >
                        <span>
                          {task.priority ===
                          "high"
                            ? "🔴"
                            : "✅"}
                        </span>

                        <div>
                          <strong>
                            {
                              task.title
                            }
                          </strong>

                          {task.due_date && (
                            <div
                              className="muted-small"
                            >
                              Due{" "}
                              {
                                task.due_date
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}

                  {household.map(
                    item => (
                      <div
                        key={
                          item.id
                        }
                        className="mini-row"
                      >
                        <span>
                          🔧
                        </span>

                        <div>
                          <strong>
                            {
                              item.title
                            }
                          </strong>

                          <div
                            className="muted-small"
                          >
                            {
                              item.category
                            }
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </>
              )}
            </>
          )}
        </article>
      </div>

      <div
        className="today-secondary-grid"
      >
        <article>
          <h3>
            Tonight
          </h3>

          {meal ? (
            <>
              <strong>
                {
                  meal.meal_name
                }
              </strong>

              {meal.notes && (
                <p>
                  {
                    meal.notes
                  }
                </p>
              )}
            </>
          ) : (
            <p>
              No dinner planned
              yet.
            </p>
          )}

          <button
            className="text-button"
            onClick={() =>
              navigate(
                "meals"
              )
            }
          >
            Plan meals →
          </button>
        </article>

        <article>
          <h3>
            Shopping
          </h3>

          <div
            className="big-number"
          >
            {shoppingCount}
          </div>

          <p>
            item
            {shoppingCount ===
            1
              ? ""
              : "s"}{" "}
            left to buy
          </p>

          <button
            className="text-button"
            onClick={() =>
              navigate(
                "shopping"
              )
            }
          >
            Open list →
          </button>
        </article>

        <article>
          <h3>
            Home
          </h3>

          <div
            className="big-number"
          >
            {
              household.length
            }
          </div>

          <p>
            overdue or due
            today
          </p>

          <button
            className="text-button"
            onClick={() =>
              navigate(
                "home"
              )
            }
          >
            View home →
          </button>
        </article>
      </div>
    </>
  );
}
