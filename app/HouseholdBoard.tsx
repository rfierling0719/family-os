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

type HouseholdItem = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  due_date:
    | string
    | null;
  recurrence: string;
  notes:
    | string
    | null;
  completed: boolean;
};

const categories = [
  "HVAC",
  "Plumbing",
  "Appliances",
  "Exterior",
  "Safety",
  "Cleaning",
  "Vehicle",
  "General"
];

export default function HouseholdBoard() {
  const [
    session,
    setSession
  ] =
    useState<
      Session | null
    >(null);

  const [
    items,
    setItems
  ] =
    useState<
      HouseholdItem[]
    >([]);

  const [
    title,
    setTitle
  ] =
    useState("");

  const [
    category,
    setCategory
  ] =
    useState(
      "General"
    );

  const [
    dueDate,
    setDueDate
  ] =
    useState("");

  const [
    recurrence,
    setRecurrence
  ] =
    useState(
      "none"
    );

  const [
    notes,
    setNotes
  ] =
    useState("");

  const [
    showForm,
    setShowForm
  ] =
    useState(false);

  async function loadItems() {
    const {
      data,
      error
    } =
      await supabase
        .from(
          "household_items"
        )
        .select("*")
        .order(
          "completed",
          {
            ascending:
              true
          }
        )
        .order(
          "due_date",
          {
            ascending:
              true,
            nullsFirst:
              false
          }
        );

    if (!error) {
      setItems(
        (data ||
          []) as HouseholdItem[]
      );
    }
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
          await loadItems();
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
            await loadItems();
          } else {
            setItems([]);
          }
        }
      );

    return () =>
      subscription.unsubscribe();
  }, []);

  async function addItem(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !session ||
      !title.trim()
    ) {
      return;
    }

    const {
      error
    } =
      await supabase
        .from(
          "household_items"
        )
        .insert({
          user_id:
            session.user.id,

          title:
            title.trim(),

          category,

          due_date:
            dueDate ||
            null,

          recurrence,

          notes:
            notes.trim() ||
            null,

          completed:
            false
        });

    if (!error) {
      setTitle("");
      setDueDate("");
      setNotes("");
      setCategory(
        "General"
      );
      setRecurrence(
        "none"
      );
      setShowForm(
        false
      );

      await loadItems();
    }
  }

  function getNextDueDate(
    item: HouseholdItem
  ) {
    const base =
      item.due_date
        ? new Date(
            `${item.due_date}T12:00:00`
          )
        : new Date();

    if (
      item.recurrence ===
      "monthly"
    ) {
      base.setMonth(
        base.getMonth() +
          1
      );
    }

    if (
      item.recurrence ===
      "quarterly"
    ) {
      base.setMonth(
        base.getMonth() +
          3
      );
    }

    if (
      item.recurrence ===
      "semiannual"
    ) {
      base.setMonth(
        base.getMonth() +
          6
      );
    }

    if (
      item.recurrence ===
      "annual"
    ) {
      base.setFullYear(
        base.getFullYear() +
          1
      );
    }

    const year =
      base.getFullYear();

    const month =
      String(
        base.getMonth() +
          1
      ).padStart(
        2,
        "0"
      );

    const day =
      String(
        base.getDate()
      ).padStart(
        2,
        "0"
      );

    return `${year}-${month}-${day}`;
  }

  async function completeItem(
    item: HouseholdItem
  ) {
    if (
      item.recurrence !==
      "none"
    ) {
      const nextDate =
        getNextDueDate(
          item
        );

      const {
        error
      } =
        await supabase
          .from(
            "household_items"
          )
          .update({
            due_date:
              nextDate,

            completed:
              false,

            updated_at:
              new Date().toISOString()
          })
          .eq(
            "id",
            item.id
          );

      if (!error) {
        await loadItems();
      }

      return;
    }

    const {
      error
    } =
      await supabase
        .from(
          "household_items"
        )
        .update({
          completed:
            !item.completed,

          updated_at:
            new Date().toISOString()
        })
        .eq(
          "id",
          item.id
        );

    if (!error) {
      await loadItems();
    }
  }

  async function deleteItem(
    item: HouseholdItem
  ) {
    if (
      !window.confirm(
        `Delete "${item.title}"?`
      )
    ) {
      return;
    }

    const {
      error
    } =
      await supabase
        .from(
          "household_items"
        )
        .delete()
        .eq(
          "id",
          item.id
        );

    if (!error) {
      await loadItems();
    }
  }

  function formatDueDate(
    value:
      | string
      | null
  ) {
    if (!value) {
      return "No due date";
    }

    return new Date(
      `${value}T12:00:00`
    ).toLocaleDateString(
      [],
      {
        month:
          "short",
        day:
          "numeric",
        year:
          "numeric"
      }
    );
  }

  function isOverdue(
    item: HouseholdItem
  ) {
    if (
      !item.due_date ||
      item.completed
    ) {
      return false;
    }

    const due =
      new Date(
        `${item.due_date}T12:00:00`
      );

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    return due < today;
  }

  function recurrenceLabel(
    value: string
  ) {
    const labels:
      Record<
        string,
        string
      > = {
        monthly:
          "Every month",
        quarterly:
          "Every 3 months",
        semiannual:
          "Every 6 months",
        annual:
          "Every year"
      };

    return (
      labels[value] ||
      value
    );
  }

  const openItems =
    items.filter(
      item =>
        !item.completed
    );

  const completedItems =
    items.filter(
      item =>
        item.completed
    );

  if (!session) {
    return (
      <div>
        <h2>Home</h2>

        <p>
          Sign in to manage
          household maintenance.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div
        className="section-header"
      >
        <div>
          <h2>Home</h2>

          <p>
            Maintenance,
            repairs and
            recurring jobs.
          </p>
        </div>

        <button
          className="btn"
          onClick={() =>
            setShowForm(
              current =>
                !current
            )
          }
        >
          {showForm
            ? "Cancel"
            : "+ Add item"}
        </button>
      </div>

      {showForm && (
        <form
          className="form-card"
          onSubmit={
            addItem
          }
        >
          <input
            value={
              title
            }
            onChange={
              event =>
                setTitle(
                  event.target
                    .value
                )
            }
            placeholder="What needs attention?"
            required
          />

          <div
            className="form-grid-3"
          >
            <select
              value={
                category
              }
              onChange={
                event =>
                  setCategory(
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
                    {item}
                  </option>
                )
              )}
            </select>

            <input
              type="date"
              value={
                dueDate
              }
              onChange={
                event =>
                  setDueDate(
                    event.target
                      .value
                  )
              }
            />

            <select
              value={
                recurrence
              }
              onChange={
                event =>
                  setRecurrence(
                    event.target
                      .value
                  )
              }
            >
              <option value="none">
                No repeat
              </option>

              <option value="monthly">
                Monthly
              </option>

              <option value="quarterly">
                Every 3 months
              </option>

              <option value="semiannual">
                Every 6 months
              </option>

              <option value="annual">
                Yearly
              </option>
            </select>
          </div>

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
            placeholder="Notes..."
            rows={3}
          />

          <button
            className="btn"
            type="submit"
          >
            Save
          </button>
        </form>
      )}

      {openItems.length ===
      0 ? (
        <div
          style={{
            marginTop:
              "28px"
          }}
        >
          <h3>
            Nothing needs
            attention 🎉
          </h3>
        </div>
      ) : (
        <div
          style={{
            marginTop:
              "22px"
          }}
        >
          {openItems.map(
            item => (
              <div
                key={
                  item.id
                }
                className="maintenance-row"
              >
                <button
                  className="complete-circle"
                  onClick={() =>
                    completeItem(
                      item
                    )
                  }
                  title={
                    item.recurrence ===
                    "none"
                      ? "Complete"
                      : "Complete and schedule next occurrence"
                  }
                >
                  ✓
                </button>

                <div
                  style={{
                    flex: 1
                  }}
                >
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
                    {" · "}

                    <span
                      style={{
                        fontWeight:
                          isOverdue(
                            item
                          )
                            ? 700
                            : 400
                      }}
                    >
                      {isOverdue(
                        item
                      )
                        ? "⚠ Overdue · "
                        : ""}

                      {formatDueDate(
                        item.due_date
                      )}
                    </span>
                  </div>

                  {item.recurrence !==
                    "none" && (
                    <div
                      className="muted-small"
                    >
                      🔁{" "}
                      {recurrenceLabel(
                        item.recurrence
                      )}
                    </div>
                  )}

                  {item.notes && (
                    <p>
                      {
                        item.notes
                      }
                    </p>
                  )}
                </div>

                <button
                  className="icon-button"
                  onClick={() =>
                    deleteItem(
                      item
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

      {completedItems.length >
        0 && (
        <details
          style={{
            marginTop:
              "24px"
          }}
        >
          <summary>
            Completed (
            {
              completedItems.length
            }
            )
          </summary>

          {completedItems.map(
            item => (
              <div
                key={
                  item.id
                }
                style={{
                  padding:
                    "8px 0",
                  opacity:
                    0.55
                }}
              >
                {
                  item.title
                }
              </div>
            )
          )}
        </details>
      )}
    </div>
  );
}
