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

import TaskBoard
  from "./TaskBoard";

import ShoppingList
  from "./ShoppingList";

import HouseholdBoard
  from "./HouseholdBoard";

import MealPlanner
  from "./MealPlanner";

import TodayDashboard
  from "./TodayDashboard";

const supabase = createClient(
  "https://wotovotafnfxgljbigju.supabase.co",
  "sb_publishable__S0fvT24O7SwwW6d62txlg_-r7EdF3J"
);

type Section =
  | "today"
  | "calendar"
  | "tasks"
  | "meals"
  | "shopping"
  | "home"
  | "assistant";

type Counts = {
  tasks: number;
  shopping: number;
  home: number;
};

const navItems: {
  id: Section;
  label: string;
  icon: string;
}[] = [
  {
    id: "today",
    label: "Today",
    icon: "🏠"
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: "📅"
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: "✅"
  },
  {
    id: "meals",
    label: "Meals",
    icon: "🍽️"
  },
  {
    id: "shopping",
    label: "Shopping",
    icon: "🛒"
  },
  {
    id: "home",
    label: "Home",
    icon: "🏡"
  },
  {
    id: "assistant",
    label: "Assistant",
    icon: "🧠"
  }
];

export default function DashboardShell() {
  const [
    activeSection,
    setActiveSection
  ] =
    useState<Section>(
      "today"
    );

  const [
    counts,
    setCounts
  ] =
    useState<Counts>({
      tasks: 0,
      shopping: 0,
      home: 0
    });

  async function loadCounts() {
    const [
      taskResult,
      shoppingResult,
      homeResult
    ] =
      await Promise.all([
        supabase
          .from("tasks")
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
            "household_items"
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
          )
      ]);

    setCounts({
      tasks:
        taskResult.count ||
        0,

      shopping:
        shoppingResult.count ||
        0,

      home:
        homeResult.count ||
        0
    });
  }

  useEffect(() => {
    loadCounts();

    const interval =
      window.setInterval(
        loadCounts,
        15000
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, []);

  useEffect(() => {
    loadCounts();
  }, [activeSection]);

  function badgeFor(
    section: Section
  ) {
    if (
      section ===
      "tasks"
    ) {
      return counts.tasks;
    }

    if (
      section ===
      "shopping"
    ) {
      return counts.shopping;
    }

    if (
      section ===
      "home"
    ) {
      return counts.home;
    }

    return 0;
  }

  function navigate(
    section: Section
  ) {
    setActiveSection(
      section
    );

    window.scrollTo({
      top: 0,
      behavior:
        "smooth"
    });
  }

  function renderSection() {
    switch (
      activeSection
    ) {
      case "calendar":
        return (
          <article
            className="workspace-card"
          >
            <CalendarSummary />
          </article>
        );

      case "tasks":
        return (
          <article
            className="workspace-card"
          >
            <TaskBoard />
          </article>
        );

      case "shopping":
        return (
          <article
            className="workspace-card"
          >
            <ShoppingList />
          </article>
        );

      case "home":
        return (
          <article
            className="workspace-card"
          >
            <HouseholdBoard />
          </article>
        );

      case "meals":
        return (
          <article
            className="workspace-card"
          >
            <MealPlanner />
          </article>
        );

      case "assistant":
        return (
          <article
            className="workspace-card"
          >
            <h2>
              Family Assistant
            </h2>

            <p>
              This section will
              eventually combine
              your calendar,
              tasks, shopping,
              meals and home
              maintenance into
              recommendations and
              reminders.
            </p>

            <div
              style={{
                marginTop:
                  "24px"
              }}
            >
              <h3>
                Current household
              </h3>

              <p>
                ✅{" "}
                {counts.tasks} open
                tasks
              </p>

              <p>
                🛒{" "}
                {counts.shopping}{" "}
                shopping items
              </p>

              <p>
                🏡{" "}
                {counts.home} home
                items
              </p>
            </div>
          </article>
        );

      default:
        return (
          <TodayDashboard
            navigate={
              section =>
                navigate(
                  section
                )
            }
          />
        );
    }
  }

  return (
    <>
      <main
        className="family-shell"
      >
        <aside
          className="family-sidebar"
        >
          <div
            className="brand"
          >
            <div
              className="brand-icon"
            >
              🏠
            </div>

            <div>
              <strong>
                Family OS
              </strong>

              <div
                className="muted-small"
              >
                Command centre
              </div>
            </div>
          </div>

          <nav
            className="sidebar-nav"
          >
            {navItems.map(
              item => {
                const badge =
                  badgeFor(
                    item.id
                  );

                return (
                  <button
                    key={
                      item.id
                    }
                    className={
                      activeSection ===
                      item.id
                        ? "nav-button active"
                        : "nav-button"
                    }
                    onClick={() =>
                      navigate(
                        item.id
                      )
                    }
                  >
                    <span
                      className="nav-icon"
                    >
                      {
                        item.icon
                      }
                    </span>

                    <span
                      style={{
                        flex: 1
                      }}
                    >
                      {
                        item.label
                      }
                    </span>

                    {badge >
                      0 && (
                      <span
                        className="nav-badge"
                      >
                        {badge >
                        99
                          ? "99+"
                          : badge}
                      </span>
                    )}
                  </button>
                );
              }
            )}
          </nav>
        </aside>

        <section
          className="family-main"
        >
          {renderSection()}
        </section>
      </main>

      <nav
        className="mobile-nav"
      >
        {navItems
          .filter(
            item =>
              item.id !==
              "assistant"
          )
          .map(
            item => (
              <button
                key={
                  item.id
                }
                className={
                  activeSection ===
                  item.id
                    ? "mobile-nav-item active"
                    : "mobile-nav-item"
                }
                onClick={() =>
                  navigate(
                    item.id
                  )
                }
              >
                <span>
                  {
                    item.icon
                  }
                </span>

                <small>
                  {
                    item.label
                  }
                </small>
              </button>
            )
          )}
      </nav>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        .family-shell {
          display: grid;
          grid-template-columns: 240px minmax(0, 1fr);
          min-height: 100vh;
        }

        .family-sidebar {
          padding: 24px 16px;
          border-right: 1px solid rgba(128, 128, 128, 0.18);
          position: sticky;
          top: 0;
          height: 100vh;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 8px;
        }

        .brand-icon {
          font-size: 25px;
        }

        .sidebar-nav {
          margin-top: 28px;
          display: grid;
          gap: 5px;
        }

        .nav-button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          border: none;
          background: transparent;
          border-radius: 10px;
          padding: 11px 12px;
          cursor: pointer;
          text-align: left;
          font: inherit;
        }

        .nav-button:hover {
          background: rgba(128, 128, 128, 0.10);
        }

        .nav-button.active {
          background: rgba(128, 128, 128, 0.18);
          font-weight: 700;
        }

        .nav-icon {
          width: 22px;
          text-align: center;
        }

        .nav-badge {
          min-width: 24px;
          height: 24px;
          padding: 0 7px;
          border-radius: 99px;
          display: grid;
          place-items: center;
          font-size: 11px;
          background: rgba(128, 128, 128, 0.2);
        }

        .family-main {
          width: 100%;
          max-width: 1400px;
          padding: 34px;
        }

        article,
        .workspace-card {
          border: 1px solid rgba(128, 128, 128, 0.18);
          border-radius: 16px;
          padding: 22px;
        }

        .workspace-card {
          min-height: calc(100vh - 68px);
        }

        .today-primary-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.8fr);
          gap: 18px;
        }

        .today-secondary-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-top: 18px;
        }

        .meal-week-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(120px, 1fr));
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 6px;
        }

        .card-heading,
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .muted-small {
          font-size: 12px;
          opacity: 0.62;
        }

        .mini-row {
          display: flex;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(128, 128, 128, 0.14);
        }

        .big-number {
          font-size: 38px;
          font-weight: 700;
          line-height: 1;
          margin-top: 10px;
        }

        .text-button,
        .icon-button {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px;
          font: inherit;
        }

        .text-button {
          font-weight: 600;
        }

        .form-card {
          margin-top: 20px;
          padding: 16px;
          border: 1px solid rgba(128, 128, 128, 0.2);
          border-radius: 12px;
          display: grid;
          gap: 10px;
        }

        .form-card input,
        .form-card select,
        .form-card textarea {
          width: 100%;
          padding: 10px;
        }

        .form-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .maintenance-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid rgba(128, 128, 128, 0.14);
        }

        .complete-circle {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1px solid rgba(128, 128, 128, 0.4);
          background: transparent;
          cursor: pointer;
        }

        .mobile-nav {
          display: none;
        }

        @media (max-width: 900px) {
          .family-shell {
            display: block;
          }

          .family-sidebar {
            display: none;
          }

          .family-main {
            padding: 20px 16px 92px;
          }

          .workspace-card {
            min-height: auto;
          }

          .today-primary-grid,
          .today-secondary-grid {
            grid-template-columns: 1fr;
          }

          .form-grid-3 {
            grid-template-columns: 1fr;
          }

          .mobile-nav {
            display: flex;
            position: fixed;
            left: 10px;
            right: 10px;
            bottom: 10px;
            z-index: 100;
            border: 1px solid rgba(128, 128, 128, 0.22);
            border-radius: 16px;
            padding: 7px;
            background: Canvas;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
            overflow-x: auto;
          }

          .mobile-nav-item {
            flex: 1;
            min-width: 58px;
            border: none;
            background: transparent;
            border-radius: 10px;
            padding: 7px 4px;
            display: grid;
            place-items: center;
            gap: 2px;
            cursor: pointer;
          }

          .mobile-nav-item.active {
            background: rgba(128, 128, 128, 0.18);
            font-weight: 700;
          }

          .mobile-nav-item span {
            font-size: 19px;
          }

          .mobile-nav-item small {
            font-size: 9px;
          }
        }

        @media (max-width: 560px) {
          .family-main {
            padding-left: 12px;
            padding-right: 12px;
          }

          article,
          .workspace-card {
            padding: 17px;
            border-radius: 14px;
          }

          .section-header,
          .card-heading {
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
}
