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

type ShoppingItem = {
  id: string;
  name: string;
  quantity: string | null;
  category: string;
  completed: boolean;
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
  const {
    session,
    householdId,
    loading: familyLoading
  } = useFamily();

  const [
    items,
    setItems
  ] = useState<ShoppingItem[]>([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    saving,
    setSaving
  ] = useState(false);

  const [
    name,
    setName
  ] = useState("");

  const [
    quantity,
    setQuantity
  ] = useState("");

  const [
    category,
    setCategory
  ] = useState("Other");

  const [
    message,
    setMessage
  ] = useState("");

  async function loadItems() {
    if (!householdId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const {
      data,
      error
    } = await supabase
      .from("shopping_items")
      .select(
        "id,name,quantity,category,completed"
      )
      .eq(
        "household_id",
        householdId
      )
      .order(
        "completed",
        {
          ascending: true
        }
      )
      .order(
        "category",
        {
          ascending: true
        }
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );

    if (error) {
      console.error(
        "Unable to load shopping items:",
        error
      );

      setMessage(
        `Unable to load shopping list: ${error.message}`
      );

      setItems([]);
    } else {
      setItems(
        (data || []) as ShoppingItem[]
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!householdId) {
      return;
    }

    loadItems();

    const channel = supabase
      .channel(
        `shopping-${householdId}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shopping_items",
          filter:
            `household_id=eq.${householdId}`
        },
        () => {
          loadItems();
        }
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

    if (!name.trim()) {
      setMessage(
        "Enter an item first."
      );
      return;
    }

    setSaving(true);

    const {
      error
    } = await supabase
      .from("shopping_items")
      .insert({
        user_id:
          session.user.id,

        household_id:
          householdId,

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
      console.error(
        "Unable to add shopping item:",
        error
      );

      setMessage(
        `Unable to add shopping item: ${error.message}`
      );

      setSaving(false);
      return;
    }

    setName("");
    setQuantity("");
    setCategory("Other");

    setMessage(
      "Item added."
    );

    await loadItems();

    setSaving(false);
  }

  async function toggleItem(
    item: ShoppingItem
  ) {
    setMessage("");

    const {
      error
    } = await supabase
      .from("shopping_items")
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

    if (error) {
      console.error(
        "Unable to update shopping item:",
        error
      );

      setMessage(
        `Unable to update item: ${error.message}`
      );
    } else {
      await loadItems();
    }
  }

  async function deleteItem(
    item: ShoppingItem
  ) {
    if (
      !window.confirm(
        `Delete "${item.name}"?`
      )
    ) {
      return;
    }

    setMessage("");

    const {
      error
    } = await supabase
      .from("shopping_items")
      .delete()
      .eq(
        "id",
        item.id
      );

    if (error) {
      console.error(
        "Unable to delete shopping item:",
        error
      );

      setMessage(
        `Unable to delete item: ${error.message}`
      );
    } else {
      await loadItems();
    }
  }

  async function clearPurchased() {
    if (!householdId) {
      return;
    }

    setMessage("");

    const {
      error
    } = await supabase
      .from("shopping_items")
      .delete()
      .eq(
        "household_id",
        householdId
      )
      .eq(
        "completed",
        true
      );

    if (error) {
      console.error(
        "Unable to clear purchased items:",
        error
      );

      setMessage(
        `Unable to clear purchased items: ${error.message}`
      );
    } else {
      setMessage(
        "Purchased items cleared."
      );

      await loadItems();
    }
  }

  if (familyLoading) {
    return (
      <div>
        <h2>
          Shopping
        </h2>

        <p>
          Loading household...
        </p>
      </div>
    );
  }

  const active =
    items.filter(
      item =>
        !item.completed
    );

  const purchased =
    items.filter(
      item =>
        item.completed
    );

  const grouped =
    categories
      .map(
        categoryName => ({
          category:
            categoryName,

          items:
            active.filter(
              item =>
                item.category ===
                categoryName
            )
        })
      )
      .filter(
        group =>
          group.items.length >
          0
      );

  return (
    <div>
      <div
        className="section-header"
      >
        <div>
          <h2>
            Shopping
          </h2>

          <p>
            {active.length} item
            {active.length === 1
              ? ""
              : "s"}{" "}
            left to buy
          </p>
        </div>

        {purchased.length > 0 && (
          <button
            className="btn secondary"
            onClick={
              clearPurchased
            }
          >
            Clear purchased
          </button>
        )}
      </div>

      <form
        className="shopping-add"
        onSubmit={
          addItem
        }
      >
        <input
          value={
            name
          }
          onChange={
            event =>
              setName(
                event.target.value
              )
          }
          placeholder="Add an item..."
          required
        />

        <input
          value={
            quantity
          }
          onChange={
            event =>
              setQuantity(
                event.target.value
              )
          }
          placeholder="Qty"
        />

        <select
          value={
            category
          }
          onChange={
            event =>
              setCategory(
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
                {item}
              </option>
            )
          )}
        </select>

        <button
          className="btn"
          type="submit"
          disabled={
            saving
          }
        >
          {saving
            ? "Adding..."
            : "+ Add"}
        </button>
      </form>

      {message && (
        <div
          className="status-message"
        >
          {message}
        </div>
      )}

      {loading ? (
        <p>
          Loading shopping...
        </p>
      ) : active.length === 0 ? (
        <div
          className="empty-state"
        >
          <h3>
            Shopping list is
            clear 🎉
          </h3>
        </div>
      ) : (
        <div
          style={{
            marginTop:
              "26px"
          }}
        >
          {grouped.map(
            group => (
              <section
                key={
                  group.category
                }
                className="shopping-group"
              >
                <h3>
                  {
                    group.category
                  }
                </h3>

                {group.items.map(
                  item => (
                    <div
                      key={
                        item.id
                      }
                      className="shopping-row"
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
                          {
                            item.name
                          }
                        </strong>

                        {item.quantity && (
                          <div
                            className="muted-small"
                          >
                            {
                              item.quantity
                            }
                          </div>
                        )}
                      </div>

                      <button
                        className="icon-button"
                        type="button"
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
              </section>
            )
          )}
        </div>
      )}

      {purchased.length > 0 && (
        <details
          style={{
            marginTop:
              "24px"
          }}
        >
          <summary>
            Purchased (
            {purchased.length})
          </summary>

          {purchased.map(
            item => (
              <div
                key={
                  item.id
                }
                className="completed-row"
              >
                <input
                  type="checkbox"
                  checked
                  onChange={() =>
                    toggleItem(
                      item
                    )
                  }
                />

                <span>
                  {
                    item.name
                  }
                </span>

                <button
                  className="icon-button"
                  type="button"
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
        </details>
      )}
    </div>
  );
}
