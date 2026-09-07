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
  const [session, setSession] =
    useState<Session | null>(null);

  const [items, setItems] =
    useState<HouseholdItem[]>([]);

  const [title, setTitle] =
    useState("");

  const [category, setCategory] =
    useState("General");

  const [dueDate, setDueDate] =
    useState("");

  const [recurrence, setRecurrence] =
    useState("none");

  const [notes, setNotes] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  async function loadItems() {
    const { data, error } =
      await supabase
        .from("household_items")
        .select("*")
        .order("completed", {
          ascending: true
        })
        .order("due_date", {
          ascending: true,
          nullsFirst: false
        });

    if (!error) {
      setItems(
        (data || []) as HouseholdItem[]
      );
    }
  }

  useEffect(() => {
    const start = async () => {
      const { data } =
        await supabase.auth.getSession();

      setSession(data.session);

      if (data.session) {
        await loadItems();
      }
    };

    start();

    const {
      data: { subscription }
    } =
      supabase.auth.onAuthStateChange(
        async (_event, currentSession) => {
          setSession(currentSession);

          if (currentSession) {
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

    const { error } =
      await supabase
        .from("household_items")
        .insert({
          user_id:
            session.user.id,
          title:
            title.trim(),
          category,
          due_date:
            dueDate || null,
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
      setCategory("General");
      setRecurrence("none");
      setShowForm(false);

      await loadItems();
    }
  }

  async function toggleItem(
    item: HouseholdItem
  ) {
    const { error } =
      await supabase
        .from("household_items")
        .update({
          completed:
            !item.completed,
          updated_at:
            new Date().toISOString()
        })
        .eq("id", item.id);

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

    const { error } =
      await supabase
        .from("household_items")
        .delete()
        .eq("id", item.id);

    if (!error) {
      await loadItems();
    }
  }

  function formatDueDate(
    value: string | null
  ) {
    if (!value) {
      return "No due date";
    }

    const [
      year,
      month,
      day
    ] =
      value
        .split("-")
        .map(Number);

    const date =
      new Date(
        year,
        month - 1,
        day
      );

    return date.toLocaleDateString(
      [],
      {
        month: "short",
        day: "numeric",
        year: "numeric"
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

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const [
      year,
      month,
      day
    ] =
      item.due_date
        .split("-")
        .map(Number);

    return (
      new Date(
        year,
        month - 1,
        day
      ) < today
    );
  }

  const openItems =
    items.filter(
      item => !item.completed
    );

  const completedItems =
    items.filter(
      item => item.completed
    );

  if (!session) {
    return (
      <div>
        <h2>Home</h2>
        <p>
          Sign in to manage household
          maintenance.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "12px"
        }}
      >
        <div>
          <h2>Home</h2>

          <p>
            Maintenance, repairs and
            recurring household jobs.
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
          onSubmit={addItem}
          style={{
            marginTop: "20px",
            padding: "16px",
            border:
              "1px solid rgba(128,128,128,.2)",
            borderRadius: "12px"
          }}
        >
          <input
            value={title}
            onChange={
              event =>
                setTitle(
                  event.target.value
                )
            }
            placeholder="What needs attention?"
            style={{
              width: "100%",
              boxSizing:
                "border-box",
              padding: "10px",
              marginBottom:
                "10px"
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr 1fr",
              gap: "10px"
            }}
          >
            <select
              value={category}
              onChange={
                event =>
                  setCategory(
                    event.target.value
                  )
              }
              style={{
                padding: "10px"
              }}
            >
              {categories.map(
                item => (
                  <option
                    key={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>

            <input
              type="date"
              value={dueDate}
              onChange={
                event =>
                  setDueDate(
                    event.target.value
                  )
              }
              style={{
                padding: "10px"
              }}
            />

            <select
              value={recurrence}
              onChange={
                event =>
                  setRecurrence(
                    event.target.value
                  )
              }
              style={{
                padding: "10px"
              }}
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
            value={notes}
            onChange={
              event =>
                setNotes(
                  event.target.value
                )
            }
            placeholder="Notes..."
            rows={3}
            style={{
              width: "100%",
              boxSizing:
                "border-box",
              padding: "10px",
              marginTop: "10px"
            }}
          />

          <button
            className="btn"
            type="submit"
            style={{
              marginTop: "10px"
            }}
          >
            Save
          </button>
        </form>
      )}

      {openItems.length === 0 ? (
        <div
          style={{
            marginTop: "30px"
          }}
        >
          <h3>
            Nothing needs attention 🎉
          </h3>
        </div>
      ) : (
        <div
          style={{
            marginTop: "24px"
          }}
        >
          {openItems.map(item => (
            <div
              key={item.id}
              style={{
                padding:
                  "14px 0",
                borderBottom:
                  "1px solid rgba(128,128,128,.15)"
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "10px"
                }}
              >
                <input
                  type="checkbox"
                  checked={
                    item.completed
                  }
                  onChange={() =>
                    toggleItem(
                      item
                    )
                  }
                />

                <div
                  style={{
                    flex: 1
                  }}
                >
                  <strong>
                    {item.title}
                  </strong>

                  <div
                    style={{
                      fontSize:
                        "13px",
                      marginTop:
                        "4px"
                    }}
                  >
                    {item.category}
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
                      style={{
                        fontSize:
                          "12px",
                        opacity:
                          0.65,
                        marginTop:
                          "3px"
                      }}
                    >
                      🔁{" "}
                      {
                        item.recurrence
                      }
                    </div>
                  )}

                  {item.notes && (
                    <p
                      style={{
                        fontSize:
                          "13px"
                      }}
                    >
                      {item.notes}
                    </p>
                  )}
                </div>

                <button
                  onClick={() =>
                    deleteItem(
                      item
                    )
                  }
                  style={{
                    border: "none",
                    background:
                      "transparent",
                    cursor:
                      "pointer"
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {completedItems.length >
        0 && (
        <details
          style={{
            marginTop: "24px"
          }}
        >
          <summary>
            Completed maintenance (
            {completedItems.length})
          </summary>

          {completedItems.map(
            item => (
              <div
                key={item.id}
                style={{
                  padding:
                    "8px 0",
                  opacity:
                    0.55
                }}
              >
                {item.title}
              </div>
            )
          )}
        </details>
      )}
    </div>
  );
}
