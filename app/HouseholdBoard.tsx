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

type HouseholdItem = {
  id: string;
  title: string;
  category: string;
  due_date: string | null;
  recurrence: string;
  notes: string | null;
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
  const {
    session,
    householdId
  } =
    useFamily();

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
    if (!householdId) {
      return;
    }

    const {
      data,
      error
    } =
      await supabase
        .from(
          "household_items"
        )
        .select(
          "id,title,category,due_date,recurrence,notes,completed"
        )
        .eq(
          "household_id",
          householdId
        )
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
    if (!householdId) {
      return;
    }

    loadItems();

    const channel =
      supabase
        .channel(
          `home-${householdId}`
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
          loadItems
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [householdId]);

  async function addItem(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !session ||
      !householdId ||
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

          household_id:
            householdId,

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

  function nextDueDate(
    item: HouseholdItem
  ) {
    const date =
      item.due_date
        ? new Date(
            `${item.due_date}T12:00:00`
          )
        : new Date();

    if (
      item.recurrence ===
      "monthly"
    ) {
      date.setMonth(
        date.getMonth() +
          1
      );
    }

    if (
      item.recurrence ===
      "quarterly"
    ) {
      date.setMonth(
        date.getMonth() +
          3
      );
    }

    if (
      item.recurrence ===
      "semiannual"
    ) {
      date.setMonth(
        date.getMonth() +
          6
      );
    }

    if (
      item.recurrence ===
      "annual"
    ) {
      date.setFullYear(
        date.getFullYear() +
          1
      );
    }

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

  async function completeItem(
    item: HouseholdItem
  ) {
    if (
      item.recurrence !==
      "none"
    ) {
      await supabase
        .from(
          "household_items"
        )
        .update({
          due_date:
            nextDueDate(
              item
            ),
          completed:
            false,
          updated_at:
            new Date().toISOString()
        })
        .eq(
          "id",
          item.id
        );

      return;
    }

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

    await supabase
      .from(
        "household_items"
      )
      .delete()
      .eq(
        "id",
        item.id
      );
  }

  function dateLabel(
    value:
      string | null
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

  function overdue(
    item: HouseholdItem
  ) {
    if (
      !item.due_date ||
      item.completed
    ) {
      return false;
    }

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    return (
      new Date(
        `${item.due_date}T12:00:00`
      ) < today
    );
  }

  const open =
    items.filter(
      item =>
        !item.completed
    );

  return (
    <div>
      <div
        className="section-header"
      >
        <div>
          <h2>Home</h2>

          <p>
            Maintenance, repairs
            and recurring jobs.
          </p>
        </div>

        <button
          className="btn"
          onClick={() =>
            setShowForm(
              value =>
                !value
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
            rows={3}
            placeholder="Notes..."
          />

          <button
            className="btn"
            type="submit"
          >
            Save
          </button>
        </form>
      )}

      {open.length ===
      0 ? (
        <div
          className="empty-state"
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
          {open.map(
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
                    className="task-meta"
                  >
                    <span>
                      {
                        item.category
                      }
                    </span>

                    <span
                      className={
                        overdue(
                          item
                        )
                          ? "overdue"
                          : ""
                      }
                    >
                      {overdue(
                        item
                      )
                        ? "⚠ Overdue · "
                        : ""}

                      {dateLabel(
                        item.due_date
                      )}
                    </span>

                    {item.recurrence !==
                      "none" && (
                      <span>
                        🔁{" "}
                        {
                          item.recurrence
                        }
                      </span>
                    )}
                  </div>

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
    </div>
  );
}
