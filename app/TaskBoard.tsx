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

type Assignee =
  | "me"
  | "wife"
  | "family";

type Priority =
  | "low"
  | "normal"
  | "high";

type Task = {
  id: string;
  user_id: string;
  title: string;
  assignee: Assignee;
  category: string;
  priority: Priority;
  due_date: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export default function TaskBoard() {
  const [session, setSession] =
    useState<Session | null>(null);

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [title, setTitle] =
    useState("");

  const [assignee, setAssignee] =
    useState<Assignee>("me");

  const [priority, setPriority] =
    useState<Priority>("normal");

  const [dueDate, setDueDate] =
    useState("");

  const [showAddTask, setShowAddTask] =
    useState(false);

  async function loadTasks(
    currentSession: Session
  ) {
    setLoading(true);

    const {
      data,
      error
    } = await supabase
      .from("tasks")
      .select("*")
      .order(
        "completed",
        {
          ascending: true
        }
      )
      .order(
        "due_date",
        {
          ascending: true,
          nullsFirst: false
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
        "Unable to load tasks:",
        error
      );

      setTasks([]);
    } else {
      setTasks(
        (data || []) as Task[]
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    const start =
      async () => {
        const {
          data,
          error
        } =
          await supabase.auth.getSession();

        if (error) {
          console.error(
            "Unable to read session:",
            error
          );

          setLoading(false);
          return;
        }

        setSession(
          data.session
        );

        if (data.session) {
          await loadTasks(
            data.session
          );
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
            await loadTasks(
              currentSession
            );
          } else {
            setTasks([]);
            setLoading(false);
          }
        }
      );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function addTask(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !session ||
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

          title:
            title.trim(),

          assignee,

          category:
            "general",

          priority,

          due_date:
            dueDate || null,

          completed:
            false
        });

    if (error) {
      console.error(
        "Unable to create task:",
        error
      );

      alert(
        "The task could not be created."
      );

      setSaving(false);
      return;
    }

    setTitle("");
    setDueDate("");
    setPriority("normal");
    setAssignee("me");
    setShowAddTask(false);

    await loadTasks(
      session
    );

    setSaving(false);
  }

  async function toggleTask(
    task: Task
  ) {
    if (!session) {
      return;
    }

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

    if (error) {
      console.error(
        "Unable to update task:",
        error
      );

      return;
    }

    setTasks(
      currentTasks =>
        currentTasks.map(
          currentTask =>
            currentTask.id ===
            task.id
              ? {
                  ...currentTask,
                  completed:
                    !currentTask.completed
                }
              : currentTask
        )
    );
  }

  async function deleteTask(
    task: Task
  ) {
    if (!session) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${task.title}"?`
      );

    if (!confirmed) {
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

    if (error) {
      console.error(
        "Unable to delete task:",
        error
      );

      return;
    }

    setTasks(
      currentTasks =>
        currentTasks.filter(
          currentTask =>
            currentTask.id !==
            task.id
        )
    );
  }

  function formatDueDate(
    value: string | null
  ) {
    if (!value) {
      return null;
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

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const tomorrow =
      new Date(today);

    tomorrow.setDate(
      tomorrow.getDate() + 1
    );

    if (
      date.getTime() ===
      today.getTime()
    ) {
      return "Today";
    }

    if (
      date.getTime() ===
      tomorrow.getTime()
    ) {
      return "Tomorrow";
    }

    return date.toLocaleDateString(
      [],
      {
        month: "short",
        day: "numeric"
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

    const [
      year,
      month,
      day
    ] =
      task.due_date
        .split("-")
        .map(Number);

    const due =
      new Date(
        year,
        month - 1,
        day
      );

    return due < today;
  }

  function priorityLabel(
    priorityValue: Priority
  ) {
    if (
      priorityValue ===
      "high"
    ) {
      return "🔴 High";
    }

    if (
      priorityValue ===
      "low"
    ) {
      return "Low";
    }

    return "";
  }

  function renderTask(
    task: Task
  ) {
    const due =
      formatDueDate(
        task.due_date
      );

    return (
      <div
        key={task.id}
        style={{
          display: "flex",
          alignItems:
            "flex-start",
          gap: "10px",
          padding:
            "10px 0",
          borderBottom:
            "1px solid rgba(128,128,128,0.18)"
        }}
      >
        <input
          type="checkbox"
          checked={
            task.completed
          }
          onChange={() =>
            toggleTask(task)
          }
          style={{
            marginTop: "4px"
          }}
        />

        <div
          style={{
            flex: 1
          }}
        >
          <div
            style={{
              fontWeight: 600,
              textDecoration:
                task.completed
                  ? "line-through"
                  : "none",
              opacity:
                task.completed
                  ? 0.5
                  : 1
            }}
          >
            {task.title}
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginTop: "4px",
              fontSize: "12px",
              opacity: 0.72
            }}
          >
            {due && (
              <span
                style={{
                  fontWeight:
                    isOverdue(task)
                      ? 700
                      : 400
                }}
              >
                {isOverdue(task)
                  ? `⚠ Overdue · ${due}`
                  : `📅 ${due}`}
              </span>
            )}

            {priorityLabel(
              task.priority
            ) && (
              <span>
                {priorityLabel(
                  task.priority
                )}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() =>
            deleteTask(task)
          }
          title="Delete task"
          style={{
            border: "none",
            background:
              "transparent",
            cursor: "pointer",
            opacity: 0.55,
            fontSize: "15px"
          }}
        >
          ✕
        </button>
      </div>
    );
  }

  const activeTasks =
    tasks.filter(
      task =>
        !task.completed
    );

  const myTasks =
    activeTasks.filter(
      task =>
        task.assignee ===
        "me"
    );

  const wifeTasks =
    activeTasks.filter(
      task =>
        task.assignee ===
        "wife"
    );

  const familyTasks =
    activeTasks.filter(
      task =>
        task.assignee ===
        "family"
    );

  const completedTasks =
    tasks.filter(
      task =>
        task.completed
    );

  if (!session) {
    return (
      <>
        <h3>Tasks</h3>

        <p>
          Connect Google Calendar
          to sign in before
          adding household tasks.
        </p>
      </>
    );
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: "12px"
        }}
      >
        <div>
          <h3
            style={{
              marginBottom:
                "4px"
            }}
          >
            Household tasks
          </h3>

          <span
            style={{
              fontSize: "12px",
              opacity: 0.65
            }}
          >
            {
              activeTasks.length
            }{" "}
            open
          </span>
        </div>

        <button
          className="btn"
          onClick={() =>
            setShowAddTask(
              current =>
                !current
            )
          }
        >
          {showAddTask
            ? "Cancel"
            : "+ Add task"}
        </button>
      </div>

      {showAddTask && (
        <form
          onSubmit={addTask}
          style={{
            marginTop: "18px",
            padding:
              "14px",
            border:
              "1px solid rgba(128,128,128,0.2)",
            borderRadius:
              "10px"
          }}
        >
          <input
            type="text"
            value={title}
            onChange={
              event =>
                setTitle(
                  event.target
                    .value
                )
            }
            placeholder="What needs to be done?"
            required
            style={{
              width: "100%",
              boxSizing:
                "border-box",
              padding:
                "10px",
              marginBottom:
                "10px"
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "8px"
            }}
          >
            <select
              value={
                assignee
              }
              onChange={
                event =>
                  setAssignee(
                    event.target
                      .value as Assignee
                  )
              }
              style={{
                padding:
                  "9px"
              }}
            >
              <option value="me">
                Me
              </option>

              <option value="wife">
                Wife
              </option>

              <option value="family">
                Family
              </option>
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
              style={{
                padding:
                  "9px"
              }}
            >
              <option value="low">
                Low priority
              </option>

              <option value="normal">
                Normal
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
              style={{
                padding:
                  "9px"
              }}
            />
          </div>

          <button
            className="btn"
            type="submit"
            disabled={
              saving
            }
            style={{
              marginTop:
                "10px"
            }}
          >
            {saving
              ? "Saving..."
              : "Add task"}
          </button>
        </form>
      )}

      {loading ? (
        <p
          style={{
            marginTop:
              "16px"
          }}
        >
          Loading tasks...
        </p>
      ) : (
        <>
          <TaskSection
            title="Your attention"
            emptyText="Nothing waiting on you."
          >
            {myTasks.map(
              renderTask
            )}
          </TaskSection>

          <TaskSection
            title="Wife's attention"
            emptyText="Nothing assigned to your wife."
          >
            {wifeTasks.map(
              renderTask
            )}
          </TaskSection>

          <TaskSection
            title="Family"
            emptyText="No shared family tasks."
          >
            {familyTasks.map(
              renderTask
            )}
          </TaskSection>

          {completedTasks.length >
            0 && (
            <details
              style={{
                marginTop:
                  "20px"
              }}
            >
              <summary
                style={{
                  cursor:
                    "pointer",
                  fontWeight:
                    600
                }}
              >
                Completed (
                {
                  completedTasks.length
                }
                )
              </summary>

              <div
                style={{
                  marginTop:
                    "8px"
                }}
              >
                {completedTasks.map(
                  renderTask
                )}
              </div>
            </details>
          )}
        </>
      )}
    </>
  );
}

function TaskSection({
  title,
  emptyText,
  children
}: {
  title: string;
  emptyText: string;
  children:
    React.ReactNode;
}) {
  const childCount =
    Array.isArray(children)
      ? children.length
      : children
        ? 1
        : 0;

  return (
    <div
      style={{
        marginTop: "20px"
      }}
    >
      <strong>
        {title}
      </strong>

      {childCount === 0 ? (
        <p
          style={{
            fontSize:
              "13px",
            opacity: 0.65
          }}
        >
          {emptyText}
        </p>
      ) : (
        <div>
          {children}
        </div>
      )}
    </div>
  );
}
