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

type Priority =
  | "low"
  | "normal"
  | "high";

type Task = {
  id: string;
  user_id: string;
  household_id: string;
  title: string;
  priority: Priority;
  due_date: string | null;
  completed: boolean;
  assigned_to: string | null;
  created_at: string;
};

export default function TaskBoard() {
  const {
    session,
    householdId,
    members,
    loading:
      familyLoading
  } =
    useFamily();

  const [
    tasks,
    setTasks
  ] =
    useState<Task[]>([]);

  const [
    loading,
    setLoading
  ] =
    useState(true);

  const [
    saving,
    setSaving
  ] =
    useState(false);

  const [
    showAdd,
    setShowAdd
  ] =
    useState(false);

  const [
    title,
    setTitle
  ] =
    useState("");

  const [
    assignedTo,
    setAssignedTo
  ] =
    useState("family");

  const [
    priority,
    setPriority
  ] =
    useState<Priority>(
      "normal"
    );

  const [
    dueDate,
    setDueDate
  ] =
    useState("");

  async function loadTasks() {
    if (!householdId) {
      return;
    }

    setLoading(true);

    const {
      data,
      error
    } =
      await supabase
        .from("tasks")
        .select(
          "id,user_id,household_id,title,priority,due_date,completed,assigned_to,created_at"
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
        )
        .order(
          "created_at",
          {
            ascending:
              false
          }
        );

    if (error) {
      console.error(
        "Unable to load tasks:",
        error
      );

      setTasks([]);
    } else {
      setTasks(
        (data ||
          []) as Task[]
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!householdId) {
      return;
    }

    loadTasks();

    const channel =
      supabase
        .channel(
          `tasks-${householdId}`
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
          () => {
            loadTasks();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [householdId]);

  async function addTask(
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

    setSaving(true);

    const {
      error
    } =
      await supabase
        .from("tasks")
        .insert({
          user_id:
            session.user.id,

          household_id:
            householdId,

          title:
            title.trim(),

          assignee:
            assignedTo ===
            "family"
              ? "family"
              : "me",

          assigned_to:
            assignedTo ===
            "family"
              ? null
              : assignedTo,

          category:
            "general",

          priority,

          due_date:
            dueDate ||
            null,

          completed:
            false
        });

    if (error) {
      console.error(
        "Unable to add task:",
        error
      );

      alert(
        "Task could not be created."
      );
    } else {
      setTitle("");
      setDueDate("");
      setPriority(
        "normal"
      );
      setAssignedTo(
        "family"
      );
      setShowAdd(
        false
      );

      await loadTasks();
    }

    setSaving(false);
  }

  async function toggleTask(
    task: Task
  ) {
    const {
      error
    } =
      await supabase
        .from("tasks")
        .update({
          completed:
            !task.completed,
          updated_at:
            new Date().toISOString()
        })
        .eq(
          "id",
          task.id
        );

    if (!error) {
      await loadTasks();
    }
  }

  async function deleteTask(
    task: Task
  ) {
    if (
      !window.confirm(
        `Delete "${task.title}"?`
      )
    ) {
      return;
    }

    const {
      error
    } =
      await supabase
        .from("tasks")
        .delete()
        .eq(
          "id",
          task.id
        );

    if (!error) {
      await loadTasks();
    }
  }

  function memberName(
    userId:
      string | null
  ) {
    if (!userId) {
      return "Family";
    }

    const member =
      members.find(
        item =>
          item.user_id ===
          userId
      );

    if (
      userId ===
      session?.user.id
    ) {
      return "You";
    }

    return (
      member?.display_name ||
      member?.email ||
      "Family member"
    );
  }

  function formatDate(
    value:
      string | null
  ) {
    if (!value) {
      return null;
    }

    return new Date(
      `${value}T12:00:00`
    ).toLocaleDateString(
      [],
      {
        month:
          "short",
        day:
          "numeric"
      }
    );
  }

  function isOverdue(
    task: Task
  ) {
    if (
      !task.due_date ||
      task.completed
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
        `${task.due_date}T12:00:00`
      ) < today
    );
  }

  if (
    familyLoading ||
    !session
  ) {
    return (
      <div>
        <h2>Tasks</h2>
        <p>Loading tasks...</p>
      </div>
    );
  }

  const openTasks =
    tasks.filter(
      task =>
        !task.completed
    );

  const completed =
    tasks.filter(
      task =>
        task.completed
    );

  return (
    <div>
      <div
        className="section-header"
      >
        <div>
          <h2>
            Household tasks
          </h2>

          <p>
            {openTasks.length} open
          </p>
        </div>

        <button
          className="btn"
          onClick={() =>
            setShowAdd(
              value =>
                !value
            )
          }
        >
          {showAdd
            ? "Cancel"
            : "+ Add task"}
        </button>
      </div>

      {showAdd && (
        <form
          className="form-card"
          onSubmit={
            addTask
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
            placeholder="What needs to be done?"
            required
          />

          <div
            className="form-grid-3"
          >
            <select
              value={
                assignedTo
              }
              onChange={
                event =>
                  setAssignedTo(
                    event.target
                      .value
                  )
              }
            >
              <option value="family">
                Family
              </option>

              {members.map(
                member => (
                  <option
                    key={
                      member.user_id
                    }
                    value={
                      member.user_id
                    }
                  >
                    {member.user_id ===
                    session.user.id
                      ? "Me"
                      : member.display_name ||
                        member.email ||
                        "Family member"}
                  </option>
                )
              )}
            </select>

            <select
              value={
                priority
              }
              onChange={
                event =>
                  setPriority(
                    event.target
                      .value as Priority
                  )
              }
            >
              <option value="low">
                Low priority
              </option>

              <option value="normal">
                Normal priority
              </option>

              <option value="high">
                High priority
              </option>
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
          </div>

          <button
            className="btn"
            type="submit"
            disabled={
              saving
            }
          >
            {saving
              ? "Saving..."
              : "Add task"}
          </button>
        </form>
      )}

      {loading ? (
        <p>
          Loading tasks...
        </p>
      ) : openTasks.length ===
        0 ? (
        <div
          className="empty-state"
        >
          <h3>
            Everything is
            handled 🎉
          </h3>
        </div>
      ) : (
        <div
          style={{
            marginTop:
              "20px"
          }}
        >
          {openTasks.map(
            task => (
              <div
                key={
                  task.id
                }
                className="task-row"
              >
                <input
                  type="checkbox"
                  checked={
                    task.completed
                  }
                  onChange={() =>
                    toggleTask(
                      task
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
                      task.title
                    }
                  </strong>

                  <div
                    className="task-meta"
                  >
                    <span>
                      👤{" "}
                      {memberName(
                        task.assigned_to
                      )}
                    </span>

                    {task.due_date && (
                      <span
                        className={
                          isOverdue(
                            task
                          )
                            ? "overdue"
                            : ""
                        }
                      >
                        📅{" "}
                        {isOverdue(
                          task
                        )
                          ? "Overdue · "
                          : ""}

                        {formatDate(
                          task.due_date
                        )}
                      </span>
                    )}

                    {task.priority ===
                      "high" && (
                      <span>
                        🔴 High
                      </span>
                    )}
                  </div>
                </div>

                <button
                  className="icon-button"
                  onClick={() =>
                    deleteTask(
                      task
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

      {completed.length >
        0 && (
        <details
          style={{
            marginTop:
              "24px"
          }}
        >
          <summary>
            Completed (
            {completed.length})
          </summary>

          {completed.map(
            task => (
              <div
                key={
                  task.id
                }
                className="completed-row"
              >
                <input
                  type="checkbox"
                  checked
                  onChange={() =>
                    toggleTask(
                      task
                    )
                  }
                />

                <span>
                  {
                    task.title
                  }
                </span>
              </div>
            )
          )}
        </details>
      )}
    </div>
  );
}
