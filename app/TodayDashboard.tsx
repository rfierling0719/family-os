"use client";

import {
  useEffect,
  useState
} from "react";

import CalendarSummary
  from "./CalendarSummary";

import {
  supabase
} from "./lib/supabase";

import {
  useFamily
} from "./FamilyProvider";

type Task = {
  id: string;
  title: string;
  due_date: string | null;
  priority: string;
};

type HomeItem = {
  id: string;
  title: string;
  category: string;
  due_date: string | null;
};

type Meal = {
  id: string;
  meal_name: string;
  notes: string | null;
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
  const {
    householdId
  } =
    useFamily();

  const [
    tasks,
    setTasks
  ] =
    useState<Task[]>([]);

  const [
    homeItems,
    setHomeItems
  ] =
    useState<HomeItem[]>([]);

  const [
    shoppingCount,
    setShoppingCount
  ] =
    useState(0);

  const [
    meal,
    setMeal
  ] =
    useState<Meal | null>(
      null
    );

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
    if (!householdId) {
      return;
    }

    const today =
      todayValue();

    const [
      taskResult,
      homeResult,
      shoppingResult,
      mealResult
    ] =
      await Promise.all([
        supabase
          .from("tasks")
          .select(
            "id,title,due_date,priority"
          )
          .eq(
            "household_id",
            householdId
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
            "id,title,category,due_date"
          )
          .eq(
            "household_id",
            householdId
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
            "due_date"
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
            "household_id",
            householdId
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
            "id,meal_name,notes"
          )
          .eq(
            "household_id",
            householdId
          )
          .eq(
            "meal_date",
            today
          )
          .maybeSingle()
      ]);

    setTasks(
      (taskResult.data ||
        []) as Task[]
    );

    setHomeItems(
      (homeResult.data ||
        []) as HomeItem[]
    );

    setShoppingCount(
      shoppingResult.count ||
        0
    );

    setMeal(
      (mealResult.data as Meal) ||
        null
    );
  }

  useEffect(() => {
    if (!householdId) {
      return;
    }

    loadDashboard();

    const channel =
      supabase
        .channel(
          `today-${householdId}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema:
              "public",
            table:
              "tasks",
            filter:
              `household_id=eq.${householdId}`
          },
          loadDashboard
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema:
              "public",
            table:
              "shopping_items",
            filter:
              `household_id=eq.${householdId}`
          },
          loadDashboard
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema:
              "public",
            table:
              "household_items",
            filter:
              `household_id=eq.${householdId}`
          },
          loadDashboard
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
          loadDashboard
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [householdId]);

  return (
    <>
      <div
        className="today-heading"
      >
        <h1>
          Good morning
        </h1>

        <p>
          Here&apos;s what your
          household needs today.
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

          {tasks.length ===
            0 &&
          homeItems.length ===
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

              {homeItems.map(
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
              homeItems.length
            }
          </div>

          <p>
            overdue or due today
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
