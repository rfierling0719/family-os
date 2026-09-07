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

type ShoppingItem = {
  id: string;
  user_id: string;
  name: string;
  quantity: string | null;
  category: string;
  completed: boolean;
  created_at: string;
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

export default function ShoppingList() {
  const [session, setSession] =
    useState<Session | null>(null);

  const [items, setItems] =
    useState<ShoppingItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [name, setName] =
    useState("");

  const [quantity, setQuantity] =
    useState("");

  const [category, setCategory] =
    useState("Other");

  async function loadItems() {
    setLoading(true);

    const { data, error } =
      await supabase
        .from("shopping_items")
        .select("*")
        .order("completed", {
          ascending: true
        })
        .order("category", {
          ascending: true
        })
        .order("created_at", {
          ascending: false
        });

    if (error) {
      console.error(error);
      setItems([]);
    } else {
      setItems(
        (data || []) as ShoppingItem[]
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    const start = async () => {
      const { data } =
        await supabase.auth.getSession();

      setSession(data.session);

      if (data.session) {
        await loadItems();
      } else {
        setLoading(false);
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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function addItem(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !session ||
      !name.trim()
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("shopping_items")
        .insert({
          user_id:
            session.user.id,
          name:
            name.trim(),
          quantity:
            quantity.trim() ||
            null,
          category,
          completed:
            false
        });

    if (error) {
      alert(
        "Unable to add shopping item."
      );
      return;
    }

    setName("");
    setQuantity("");
    setCategory("Other");

    await loadItems();
  }

  async function toggleItem(
    item: ShoppingItem
  ) {
    const { error } =
      await supabase
        .from("shopping_items")
        .update({
          completed:
            !item.completed,
          updated_at:
            new Date().toISOString()
        })
        .eq("id", item.id);

    if (!error) {
      setItems(
        current =>
          current.map(existing =>
            existing.id === item.id
              ? {
                  ...existing,
                  completed:
                    !existing.completed
                }
              : existing
          )
      );
    }
  }

  async function deleteItem(
    item: ShoppingItem
  ) {
    const { error } =
      await supabase
        .from("shopping_items")
        .delete()
        .eq("id", item.id);

    if (!error) {
      setItems(
        current =>
          current.filter(
            existing =>
              existing.id !== item.id
          )
      );
    }
  }

  async function clearPurchased() {
    if (!session) {
      return;
    }

    await supabase
      .from("shopping_items")
      .delete()
      .eq("completed", true);

    await loadItems();
  }

  const activeItems =
    items.filter(
      item => !item.completed
    );

  const completedItems =
    items.filter(
      item => item.completed
    );

  const grouped =
    categories
      .map(categoryName => ({
        category: categoryName,
        items:
          activeItems.filter(
            item =>
              item.category ===
              categoryName
          )
      }))
      .filter(
        group =>
          group.items.length > 0
      );

  if (!session) {
    return (
      <div>
        <h2>Shopping</h2>
        <p>
          Sign in to use the
          household shopping list.
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
          <h2>Shopping</h2>

          <p>
            {activeItems.length} item
            {activeItems.length === 1
              ? ""
              : "s"}{" "}
            left to buy
          </p>
        </div>

        {completedItems.length >
          0 && (
          <button
            className="btn"
            onClick={
              clearPurchased
            }
          >
            Clear purchased
          </button>
        )}
      </div>

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
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "2fr 1fr 1fr auto",
            gap: "10px"
          }}
        >
          <input
            value={name}
            onChange={
              event =>
                setName(
                  event.target.value
                )
            }
            placeholder="Add an item..."
            style={{
              padding: "10px"
            }}
          />

          <input
            value={quantity}
            onChange={
              event =>
                setQuantity(
                  event.target.value
                )
            }
            placeholder="Qty"
            style={{
              padding: "10px"
            }}
          />

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
              option => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              )
            )}
          </select>

          <button
            className="btn"
            type="submit"
          >
            + Add
          </button>
        </div>
      </form>

      {loading ? (
        <p>Loading shopping list...</p>
      ) : activeItems.length === 0 ? (
        <div
          style={{
            marginTop: "30px"
          }}
        >
          <h3>Shopping list is clear 🎉</h3>

          <p>
            Add groceries or household
            supplies above.
          </p>
        </div>
      ) : (
        <div
          style={{
            marginTop: "24px"
          }}
        >
          {grouped.map(group => (
            <section
              key={group.category}
              style={{
                marginBottom:
                  "26px"
              }}
            >
              <h3>
                {group.category}
              </h3>

              {group.items.map(
                item => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems:
                        "center",
                      padding:
                        "10px 0",
                      borderBottom:
                        "1px solid rgba(128,128,128,.15)"
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
                        {item.name}
                      </strong>

                      {item.quantity && (
                        <span
                          style={{
                            opacity:
                              0.65,
                            marginLeft:
                              "8px"
                          }}
                        >
                          {item.quantity}
                        </span>
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
                )
              )}
            </section>
          ))}
        </div>
      )}

      {completedItems.length >
        0 && (
        <details
          style={{
            marginTop: "20px"
          }}
        >
          <summary>
            Purchased (
            {completedItems.length})
          </summary>

          {completedItems.map(
            item => (
              <div
                key={item.id}
                style={{
                  padding: "8px 0",
                  opacity: 0.55,
                  textDecoration:
                    "line-through"
                }}
              >
                {item.name}
              </div>
            )
          )}
        </details>
      )}
    </div>
  );
}
