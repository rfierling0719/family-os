"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
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

type ViewMode =
  | "list"
  | "gantt";

type Task = {
  id: string;
  user_id: string;
  household_id: string;
  title: string;
  priority: Priority;
  start_date: string | null;
  due_date: string | null;
  completed: boolean;
  assigned_to: string | null;
  created_at: string;
};

const DAY_WIDTH = 42;

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
    startDate,
    setStartDate
  ] =
    useState("");

  const [
    endDate,
    setEndDate
  ] =
    useState("");

  const [
    viewMode,
    setViewMode
  ] =
    useState<ViewMode>(
      "list"
    );

  const [
    showCompletedInGantt,
    setShowCompletedInGantt
  ] =
    useState(false);

  const [
    message,
    setMessage
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
          "id,user_id,household_id,title,priority,start_date,due_date,completed,assigned_to,created_at"
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
          "start_date",
          {
            ascending:
              true,
            nullsFirst:
              false
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

      setMessage(
        `Unable to load tasks: ${error.message}`
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

    setMessage("");

    if (
      !session ||
      !householdId ||
      !title.trim()
    ) {
      return;
    }

    if (
      startDate &&
      endDate &&
      startDate > endDate
    ) {
      setMessage(
        "The end date cannot be before the start date."
      );

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

          start_date:
            startDate ||
            null,

          due_date:
            endDate ||
            null,

          completed:
            false
        });

    if (error) {
      console.error(
        "Unable to add task:",
        error
      );

      setMessage(
        `Task could not be created: ${error.message}`
      );
    } else {
      setTitle("");
      setStartDate("");
      setEndDate("");
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
    setMessage("");

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
      setMessage(
        `Unable to update task: ${error.message}`
      );

      return;
    }

    await loadTasks();
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

    setMessage("");

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
      setMessage(
        `Unable to delete task: ${error.message}`
      );

      return;
    }

    await loadTasks();
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

  function parseDate(
    value: string
  ) {
    const [
      year,
      month,
      day
    ] =
      value
        .split("-")
        .map(Number);

    return new Date(
      year,
      month - 1,
      day
    );
  }

  function dateValue(
    date: Date
  ) {
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

  function formatDate(
    value:
      string | null
  ) {
    if (!value) {
      return null;
    }

    return parseDate(
      value
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

  function formatFullDate(
    value:
      string | null
  ) {
    if (!value) {
      return null;
    }

    return parseDate(
      value
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
      parseDate(
        task.due_date
      ) < today
    );
  }

  function daysBetween(
    start: Date,
    end: Date
  ) {
    const startUtc =
      Date.UTC(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      );

    const endUtc =
      Date.UTC(
        end.getFullYear(),
        end.getMonth(),
        end.getDate()
      );

    return Math.round(
      (
        endUtc -
        startUtc
      ) /
      86400000
    );
  }

  function addDays(
    date: Date,
    amount: number
  ) {
    const result =
      new Date(date);

    result.setDate(
      result.getDate() +
        amount
    );

    return result;
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

  const ganttTasks =
    showCompletedInGantt
      ? tasks
      : openTasks;

  const ganttRange =
    useMemo(
      () => {
        const datedTasks =
          ganttTasks.filter(
            task =>
              task.start_date ||
              task.due_date
          );

        const today =
          new Date();

        today.setHours(
          0,
          0,
          0,
          0
        );

        if (
          datedTasks.length ===
          0
        ) {
          return {
            start:
              addDays(
                today,
                -3
              ),

            end:
              addDays(
                today,
                17
              )
          };
        }

        const starts =
          datedTasks.map(
            task =>
              parseDate(
                task.start_date ||
                task.due_date!
              )
          );

        const ends =
          datedTasks.map(
            task =>
              parseDate(
                task.due_date ||
                task.start_date!
              )
          );

        let minimum =
          new Date(
            Math.min(
              ...starts.map(
                date =>
                  date.getTime()
              ),
              today.getTime()
            )
          );

        let maximum =
          new Date(
            Math.max(
              ...ends.map(
                date =>
                  date.getTime()
              ),
              today.getTime()
            )
          );

        minimum =
          addDays(
            minimum,
            -2
          );

        maximum =
          addDays(
            maximum,
            2
          );

        if (
          daysBetween(
            minimum,
            maximum
          ) < 13
        ) {
          maximum =
            addDays(
              minimum,
              13
            );
        }

        return {
          start:
            minimum,
          end:
            maximum
        };
      },
      [
        ganttTasks,
        showCompletedInGantt
      ]
    );

  const ganttDays =
    useMemo(
      () => {
        const length =
          daysBetween(
            ganttRange.start,
            ganttRange.end
          ) + 1;

        return Array.from(
          {
            length
          },
          (
            _,
            index
          ) =>
            addDays(
              ganttRange.start,
              index
            )
        );
      },
      [
        ganttRange
      ]
    );

  const todayValue =
    dateValue(
      new Date()
    );

  function taskStart(
    task: Task
  ) {
    return (
      task.start_date ||
      task.due_date
    );
  }

  function taskEnd(
    task: Task
  ) {
    return (
      task.due_date ||
      task.start_date
    );
  }

  function ganttPosition(
    task: Task
  ) {
    const start =
      taskStart(
        task
      );

    const end =
      taskEnd(
        task
      );

    if (
      !start ||
      !end
    ) {
      return null;
    }

    const startOffset =
      daysBetween(
        ganttRange.start,
        parseDate(
          start
        )
      );

    const duration =
      Math.max(
        1,
        daysBetween(
          parseDate(
            start
          ),
          parseDate(
            end
          )
        ) + 1
      );

    return {
      left:
        startOffset *
        DAY_WIDTH,

      width:
        duration *
        DAY_WIDTH
    };
  }

  function priorityLabel(
    value: Priority
  ) {
    if (
      value ===
      "high"
    ) {
      return "High";
    }

    if (
      value ===
      "low"
    ) {
      return "Low";
    }

    return "Normal";
  }

  if (
    familyLoading ||
    !session
  ) {
    return (
      <div>
        <h2>
          Tasks
        </h2>

        <p>
          Loading tasks...
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
          <h2>
            Household tasks
          </h2>

          <p>
            {openTasks.length} open
          </p>
        </div>

        <div
          className="task-toolbar"
        >
          <div
            className="task-view-toggle"
          >
            <button
              type="button"
              className={
                viewMode ===
                "list"
                  ? "task-view-button active"
                  : "task-view-button"
              }
              onClick={() =>
                setViewMode(
                  "list"
                )
              }
            >
              ☰ List
            </button>

            <button
              type="button"
              className={
                viewMode ===
                "gantt"
                  ? "task-view-button active"
                  : "task-view-button"
              }
              onClick={() =>
                setViewMode(
                  "gantt"
                )
              }
            >
              ▦ Gantt
            </button>
          </div>

          <button
            className="btn"
            type="button"
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
      </div>

      {showAdd && (
        <form
          className="form-card"
          onSubmit={
            addTask
          }
        >
          <div>
            <label
              className="task-field-label"
            >
              Task
            </label>

            <input
              value={
                title
              }
              onChange={
                event =>
                  setTitle(
                    event.target.value
                  )
              }
              placeholder="What needs to be done?"
              required
            />
          </div>

          <div
            className="task-form-grid"
          >
            <div>
              <label
                className="task-field-label"
              >
                Assigned to
              </label>

              <select
                value={
                  assignedTo
                }
                onChange={
                  event =>
                    setAssignedTo(
                      event.target.value
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
            </div>

            <div>
              <label
                className="task-field-label"
              >
                Priority
              </label>

              <select
                value={
                  priority
                }
                onChange={
                  event =>
                    setPriority(
                      event.target.value as Priority
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
            </div>

            <div>
              <label
                className="task-field-label"
              >
                Start date
              </label>

              <input
                type="date"
                value={
                  startDate
                }
                onChange={
                  event => {
                    const value =
                      event.target.value;

                    setStartDate(
                      value
                    );

                    if (
                      value &&
                      endDate &&
                      endDate <
                        value
                    ) {
                      setEndDate(
                        value
                      );
                    }
                  }
                }
              />
            </div>

            <div>
              <label
                className="task-field-label"
              >
                End date
              </label>

              <input
                type="date"
                value={
                  endDate
                }
                min={
                  startDate ||
                  undefined
                }
                onChange={
                  event =>
                    setEndDate(
                      event.target.value
                    )
                }
              />
            </div>
          </div>

          <div
            className="task-form-footer"
          >
            <span
              className="muted-small"
            >
              Dates are optional. Tasks with dates will appear on the Gantt timeline.
            </span>

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
          </div>
        </form>
      )}

      {message && (
        <div
          className="status-message"
        >
          {message}
        </div>
      )}

      {loading ? (
        <p>
          Loading tasks...
        </p>
      ) : viewMode ===
        "gantt" ? (
        <div
          className="gantt-section"
        >
          <div
            className="gantt-topbar"
          >
            <div>
              <h3>
                Task workload
              </h3>

              <p>
                See how household work overlaps across time.
              </p>
            </div>

            <label
              className="gantt-completed-toggle"
            >
              <input
                type="checkbox"
                checked={
                  showCompletedInGantt
                }
                onChange={
                  event =>
                    setShowCompletedInGantt(
                      event.target.checked
                    )
                }
              />

              <span>
                Show completed
              </span>
            </label>
          </div>

          {ganttTasks.length ===
          0 ? (
            <div
              className="empty-state"
            >
              <h3>
                No tasks to display.
              </h3>
            </div>
          ) : (
            <div
              className="gantt-frame"
            >
              <div
                className="gantt-scroll"
              >
                <div
                  className="gantt-table"
                  style={{
                    width:
                      270 +
                      ganttDays.length *
                        DAY_WIDTH
                  }}
                >
                  <div
                    className="gantt-header-row"
                  >
                    <div
                      className="gantt-task-heading"
                    >
                      Task
                    </div>

                    <div
                      className="gantt-calendar"
                      style={{
                        width:
                          ganttDays.length *
                          DAY_WIDTH
                      }}
                    >
                      {ganttDays.map(
                        day => {
                          const value =
                            dateValue(
                              day
                            );

                          const weekend =
                            day.getDay() ===
                              0 ||
                            day.getDay() ===
                              6;

                          return (
                            <div
                              key={
                                value
                              }
                              className={[
                                "gantt-day-header",
                                weekend
                                  ? "weekend"
                                  : "",
                                value ===
                                todayValue
                                  ? "today"
                                  : ""
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  " "
                                )}
                              style={{
                                width:
                                  DAY_WIDTH
                              }}
                            >
                              <span>
                                {day.toLocaleDateString(
                                  [],
                                  {
                                    weekday:
                                      "narrow"
                                  }
                                )}
                              </span>

                              <strong>
                                {day.getDate()}
                              </strong>

                              {day.getDate() ===
                                1 && (
                                <small>
                                  {day.toLocaleDateString(
                                    [],
                                    {
                                      month:
                                        "short"
                                    }
                                  )}
                                </small>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {ganttTasks.map(
                    task => {
                      const position =
                        ganttPosition(
                          task
                        );

                      return (
                        <div
                          key={
                            task.id
                          }
                          className={
                            task.completed
                              ? "gantt-row completed"
                              : "gantt-row"
                          }
                        >
                          <div
                            className="gantt-task-cell"
                          >
                            <div
                              className="gantt-task-title-row"
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
                                className="gantt-task-copy"
                              >
                                <strong
                                  title={
                                    task.title
                                  }
                                >
                                  {
                                    task.title
                                  }
                                </strong>

                                <span>
                                  {memberName(
                                    task.assigned_to
                                  )}
                                  {" · "}
                                  {priorityLabel(
                                    task.priority
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div
                            className="gantt-timeline-row"
                            style={{
                              width:
                                ganttDays.length *
                                DAY_WIDTH
                            }}
                          >
                            {ganttDays.map(
                              day => {
                                const value =
                                  dateValue(
                                    day
                                  );

                                const weekend =
                                  day.getDay() ===
                                    0 ||
                                  day.getDay() ===
                                    6;

                                return (
                                  <div
                                    key={
                                      value
                                    }
                                    className={[
                                      "gantt-grid-day",
                                      weekend
                                        ? "weekend"
                                        : "",
                                      value ===
                                      todayValue
                                        ? "today"
                                        : ""
                                    ]
                                      .filter(
                                        Boolean
                                      )
                                      .join(
                                        " "
                                      )}
                                    style={{
                                      width:
                                        DAY_WIDTH
                                    }}
                                  />
                                );
                              }
                            )}

                            {position ? (
                              <div
                                className={[
                                  "gantt-bar",
                                  `priority-${task.priority}`,
                                  task.completed
                                    ? "is-completed"
                                    : "",
                                  isOverdue(
                                    task
                                  )
                                    ? "is-overdue"
                                    : ""
                                ]
                                  .filter(
                                    Boolean
                                  )
                                  .join(
                                    " "
                                  )}
                                style={{
                                  left:
                                    position.left +
                                    4,

                                  width:
                                    Math.max(
                                      30,
                                      position.width -
                                        8
                                    )
                                }}
                                title={`${task.title} · ${formatFullDate(
                                  taskStart(
                                    task
                                  )
                                )} – ${formatFullDate(
                                  taskEnd(
                                    task
                                  )
                                )}`}
                              >
                                <span>
                                  {
                                    task.title
                                  }
                                </span>
                              </div>
                            ) : (
                              <div
                                className="gantt-no-date"
                              >
                                No dates
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          )}

          <div
            className="gantt-legend"
          >
            <span>
              <i className="legend-dot low" />
              Low
            </span>

            <span>
              <i className="legend-dot normal" />
              Normal
            </span>

            <span>
              <i className="legend-dot high" />
              High
            </span>

            <span>
              The red vertical line marks today.
            </span>
          </div>
        </div>
      ) : openTasks.length ===
        0 ? (
        <div
          className="empty-state"
        >
          <h3>
            Everything is handled 🎉
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

                    {task.start_date && (
                      <span>
                        ▶{" "}
                        {formatDate(
                          task.start_date
                        )}
                      </span>
                    )}

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
                        ■{" "}
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

                    {task.priority ===
                      "low" && (
                      <span>
                        Low priority
                      </span>
                    )}
                  </div>
                </div>

                <button
                  className="icon-button"
                  type="button"
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

      {viewMode ===
        "list" &&
        completed.length >
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

                  <div
                    style={{
                      flex: 1
                    }}
                  >
                    <span>
                      {
                        task.title
                      }
                    </span>

                    {(task.start_date ||
                      task.due_date) && (
                      <div
                        className="muted-small"
                      >
                        {task.start_date
                          ? formatDate(
                              task.start_date
                            )
                          : "No start"}
                        {" → "}
                        {task.due_date
                          ? formatDate(
                              task.due_date
                            )
                          : "No end"}
                      </div>
                    )}
                  </div>

                  <button
                    className="icon-button"
                    type="button"
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
          </details>
        )}

      <style jsx global>{`
        .task-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .task-view-toggle {
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 3px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--surface-soft);
        }

        .task-view-button {
          min-height: 34px;
          padding: 6px 11px;
          border: none;
          border-radius: 7px;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
        }

        .task-view-button:hover {
          color: var(--text);
        }

        .task-view-button.active {
          background: var(--surface);
          color: var(--accent);
          box-shadow: 0 1px 3px rgba(16,24,40,.08);
        }

        .task-field-label {
          display: block;
          margin-bottom: 6px;
          color: var(--text-soft);
          font-size: 11px;
          font-weight: 700;
        }

        .task-form-grid {
          display: grid;
          grid-template-columns:
            minmax(0,1fr)
            minmax(0,1fr)
            minmax(0,1fr)
            minmax(0,1fr);
          gap: 10px;
        }

        .task-form-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .gantt-section {
          margin-top: 22px;
        }

        .gantt-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 14px;
        }

        .gantt-topbar h3 {
          margin-bottom: 3px;
        }

        .gantt-topbar p {
          margin: 0;
          font-size: 12px;
        }

        .gantt-completed-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-soft);
          font-size: 11px;
          font-weight: 650;
          cursor: pointer;
          white-space: nowrap;
        }

        .gantt-frame {
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: 13px;
          background: var(--surface);
        }

        .gantt-scroll {
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
        }

        .gantt-table {
          min-width: 100%;
        }

        .gantt-header-row {
          position: sticky;
          top: 0;
          z-index: 4;
          display: flex;
          min-height: 58px;
          border-bottom: 1px solid var(--border);
          background: var(--surface-soft);
        }

        .gantt-task-heading {
          position: sticky;
          left: 0;
          z-index: 6;
          width: 270px;
          min-width: 270px;
          display: flex;
          align-items: center;
          padding: 0 14px;
          border-right: 1px solid var(--border);
          background: var(--surface-soft);
          color: var(--text-muted);
          font-size: 10px;
          font-weight: 750;
          letter-spacing: .06em;
          text-transform: uppercase;
        }

        .gantt-calendar {
          display: flex;
          flex: 0 0 auto;
        }

        .gantt-day-header {
          position: relative;
          flex: 0 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-right: 1px solid var(--border);
          color: var(--text-muted);
          font-size: 9px;
          line-height: 1.05;
        }

        .gantt-day-header strong {
          margin-top: 4px;
          color: var(--text-soft);
          font-size: 12px;
        }

        .gantt-day-header small {
          position: absolute;
          top: 3px;
          left: 3px;
          color: var(--accent);
          font-size: 7px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .gantt-day-header.weekend {
          background: #f6f7f9;
        }

        .gantt-day-header.today::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: 0;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #d84d4d;
          transform: translateX(-50%);
        }

        .gantt-row {
          display: flex;
          min-height: 58px;
          border-bottom: 1px solid var(--border);
        }

        .gantt-row:last-child {
          border-bottom: none;
        }

        .gantt-row.completed {
          opacity: .58;
        }

        .gantt-task-cell {
          position: sticky;
          left: 0;
          z-index: 3;
          width: 270px;
          min-width: 270px;
          display: flex;
          align-items: center;
          padding: 9px 12px;
          border-right: 1px solid var(--border);
          background: var(--surface);
        }

        .gantt-task-title-row {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
        }

        .gantt-task-copy {
          min-width: 0;
          display: flex;
          flex: 1;
          flex-direction: column;
        }

        .gantt-task-copy strong {
          overflow: hidden;
          color: var(--text);
          font-size: 11px;
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .gantt-task-copy span {
          margin-top: 2px;
          overflow: hidden;
          color: var(--text-muted);
          font-size: 9px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .gantt-timeline-row {
          position: relative;
          display: flex;
          flex: 0 0 auto;
          min-height: 58px;
        }

        .gantt-grid-day {
          flex: 0 0 auto;
          min-height: 58px;
          border-right: 1px solid var(--border);
          background: var(--surface);
        }

        .gantt-grid-day.weekend {
          background: #fafbfc;
        }

        .gantt-grid-day.today {
          border-left: 2px solid rgba(216,77,77,.72);
        }

        .gantt-bar {
          position: absolute;
          top: 13px;
          z-index: 2;
          height: 32px;
          display: flex;
          align-items: center;
          overflow: hidden;
          padding: 0 9px;
          border-radius: 7px;
          box-shadow: 0 1px 3px rgba(16,24,40,.09);
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          white-space: nowrap;
        }

        .gantt-bar span {
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .gantt-bar.priority-low {
          background: #719084;
        }

        .gantt-bar.priority-normal {
          background: #3157d5;
        }

        .gantt-bar.priority-high {
          background: #c95858;
        }

        .gantt-bar.is-overdue {
          box-shadow:
            0 0 0 2px rgba(185,70,70,.16),
            0 1px 3px rgba(16,24,40,.09);
        }

        .gantt-bar.is-completed {
          text-decoration: line-through;
        }

        .gantt-no-date {
          position: absolute;
          left: 12px;
          top: 19px;
          z-index: 2;
          padding: 3px 7px;
          border: 1px dashed var(--border-strong);
          border-radius: 6px;
          background: var(--surface-soft);
          color: var(--text-muted);
          font-size: 9px;
        }

        .gantt-legend {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 14px;
          margin-top: 11px;
          color: var(--text-muted);
          font-size: 9px;
        }

        .gantt-legend > span {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          display: inline-block;
          border-radius: 3px;
        }

        .legend-dot.low {
          background: #719084;
        }

        .legend-dot.normal {
          background: #3157d5;
        }

        .legend-dot.high {
          background: #c95858;
        }

        @media (max-width: 800px) {
          .task-toolbar {
            align-items: stretch;
            flex-direction: column-reverse;
          }

          .task-view-toggle {
            width: 100%;
          }

          .task-view-button {
            flex: 1;
          }

          .task-form-grid {
            grid-template-columns: 1fr 1fr;
          }

          .gantt-task-heading,
          .gantt-task-cell {
            width: 210px;
            min-width: 210px;
          }

          .gantt-table {
            width: auto !important;
          }

          .gantt-topbar {
            align-items: flex-start;
          }
        }

        @media (max-width: 560px) {
          .task-form-grid {
            grid-template-columns: 1fr;
          }

          .task-form-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .task-form-footer .btn {
            width: 100%;
          }

          .gantt-task-heading,
          .gantt-task-cell {
            width: 180px;
            min-width: 180px;
          }

          .gantt-topbar {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
