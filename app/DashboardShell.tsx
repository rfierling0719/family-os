"use client";

import {
  useEffect,
  useState
} from "react";

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

import HouseholdSettings
  from "./HouseholdSettings";

import {
  supabase
} from "./lib/supabase";

import {
  useFamily
} from "./FamilyProvider";

type Section =
  | "today"
  | "calendar"
  | "tasks"
  | "meals"
  | "shopping"
  | "home"
  | "assistant"
  | "settings";

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
  const {
    session,
    household,
    householdId,
    loading
  } =
    useFamily();

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
    if (!householdId) {
      return;
    }

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
            "household_id",
            householdId
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
            "household_id",
            householdId
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
            "household_id",
            householdId
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
    if (!householdId) {
      return;
    }

    loadCounts();

    const channel =
      supabase
        .channel(
          `nav-${householdId}`
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
          loadCounts
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
          loadCounts
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
          loadCounts
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [householdId]);

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

  function badge(
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

  if (loading) {
    return (
      <main
        className="startup-screen"
      >
        <h2>
          🏠 Family OS
        </h2>

        <p>
          Loading your household...
        </p>
      </main>
    );
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

      case "settings":
        return (
          <article
            className="workspace-card"
          >
            <HouseholdSettings />
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
              This will become the
              proactive layer over
              your household data.
            </p>

            <div
              className="assistant-summary"
            >
              <div>
                <strong>
                  {
                    counts.tasks
                  }
                </strong>

                <span>
                  Open tasks
                </span>
              </div>

              <div>
                <strong>
                  {
                    counts.shopping
                  }
                </strong>

                <span>
                  Shopping items
                </span>
              </div>

              <div>
                <strong>
                  {
                    counts.home
                  }
                </strong>

                <span>
                  Home items
                </span>
              </div>
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
          <button
            className="brand"
            onClick={() =>
              navigate(
                "today"
              )
            }
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
                {household?.name ||
                  "Our Home"}
              </div>
            </div>
          </button>

          <nav
            className="sidebar-nav"
          >
            {navItems.map(
              item => {
                const count =
                  badge(
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

                    {count >
                      0 && (
                      <span
                        className="nav-badge"
                      >
                        {count >
                        99
                          ? "99+"
                          : count}
                      </span>
                    )}
                  </button>
                );
              }
            )}
          </nav>

          <div
            className="sidebar-account"
          >
            <button
              className={
                activeSection ===
                "settings"
                  ? "nav-button active"
                  : "nav-button"
              }
              onClick={() =>
                navigate(
                  "settings"
                )
              }
            >
              <span
                className="nav-icon"
              >
                ⚙️
              </span>

              <span>
                Settings
              </span>
            </button>

            <div
              className="account-email"
            >
              {session?.user.email}
            </div>
          </div>
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
        {[
          navItems[0],
          navItems[2],
          navItems[3],
          navItems[4],
          navItems[5]
        ].map(
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

        <button
          className={
            activeSection ===
            "settings"
              ? "mobile-nav-item active"
              : "mobile-nav-item"
          }
          onClick={() =>
            navigate(
              "settings"
            )
          }
        >
          <span>⚙️</span>
          <small>
            Settings
          </small>
        </button>
      </nav>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        button,
        input,
        select,
        textarea {
          font: inherit;
        }

        .family-shell {
          display: grid;
          grid-template-columns: 240px minmax(0, 1fr);
          min-height: 100vh;
        }

        .family-sidebar {
          padding: 20px 14px;
          border-right: 1px solid rgba(128, 128, 128, 0.18);
          position: sticky;
          top: 0;
          height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 8px;
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
        }

        .brand-icon {
          font-size: 26px;
        }

        .sidebar-nav {
          margin-top: 26px;
          display: grid;
          gap: 5px;
        }

        .sidebar-account {
          margin-top: auto;
          border-top: 1px solid rgba(128, 128, 128, 0.15);
          padding-top: 12px;
        }

        .account-email {
          padding: 8px 12px 0;
          font-size: 10px;
          opacity: 0.5;
          overflow: hidden;
          text-overflow: ellipsis;
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
        }

        .nav-button:hover {
          background: rgba(128, 128, 128, 0.1);
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

        .today-heading {
          margin-bottom: 22px;
        }

        .today-heading p {
          opacity: 0.65;
        }

        .today-primary-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1.2fr)
            minmax(300px, 0.8fr);
          gap: 18px;
        }

        .today-secondary-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-top: 18px;
        }

        .section-header,
        .card-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .muted-small {
          font-size: 12px;
          opacity: 0.62;
        }

        .mini-row,
        .task-row,
        .shopping-row,
        .maintenance-row,
        .ingredient-row,
        .member-row,
        .completed-row {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 11px 0;
          border-bottom: 1px solid rgba(128, 128, 128, 0.14);
        }

        .maintenance-row {
          align-items: flex-start;
        }

        .task-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 14px;
          margin-top: 4px;
          font-size: 12px;
          opacity: 0.7;
        }

        .overdue {
          font-weight: 700;
        }

        .big-number {
          font-size: 38px;
          font-weight: 700;
          line-height: 1;
          margin-top: 10px;
        }

        .text-button,
        .icon-button {
          border: none;
          background: transparent;
          cursor: pointer;
        }

        .text-button {
          font-weight: 600;
        }

        .btn {
          border: none;
          border-radius: 9px;
          padding: 10px 14px;
          cursor: pointer;
          font-weight: 600;
        }

        .btn.secondary {
          background: rgba(128, 128, 128, 0.15);
        }

        .form-card,
        .settings-panel {
          margin-top: 20px;
          padding: 18px;
          border: 1px solid rgba(128, 128, 128, 0.18);
          border-radius: 12px;
        }

        .form-card {
          display: grid;
          gap: 10px;
        }

        .form-card input,
        .form-card select,
        .form-card textarea,
        .settings-panel input {
          width: 100%;
          padding: 10px;
        }

        .form-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .shopping-add {
          display: grid;
          grid-template-columns: 2fr 0.7fr 1fr auto;
          gap: 10px;
          margin-top: 20px;
        }

        .shopping-add input,
        .shopping-add select {
          min-width: 0;
          padding: 10px;
        }

        .shopping-group {
          margin-bottom: 24px;
        }

        .meal-week-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(120px, 1fr));
          gap: 10px;
          overflow-x: auto;
          margin-top: 20px;
          padding-bottom: 5px;
        }

        .meal-day {
          min-height: 120px;
          text-align: left;
          background: transparent;
          border: 1px solid rgba(128, 128, 128, 0.2);
          border-radius: 12px;
          padding: 13px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .meal-day.selected {
          border-width: 2px;
        }

        .meal-day-name {
          margin-top: 12px;
          font-size: 13px;
        }

        .meal-editor-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .ingredient-form {
          display: grid;
          grid-template-columns: 2fr 0.7fr 1fr auto;
          gap: 8px;
        }

        .ingredient-form input,
        .ingredient-form select {
          min-width: 0;
          padding: 9px;
        }

        .complete-circle {
          flex: 0 0 auto;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1px solid rgba(128, 128, 128, 0.4);
          background: transparent;
          cursor: pointer;
        }

        .empty-state {
          margin-top: 28px;
          text-align: center;
          padding: 25px;
          opacity: 0.75;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .field-label {
          display: block;
          font-size: 12px;
          margin-bottom: 6px;
          opacity: 0.7;
        }

        .invite-code {
          font-size: 27px;
          font-weight: 700;
          letter-spacing: 4px;
          margin: 8px 0 12px;
        }

        .member-avatar {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(128, 128, 128, 0.18);
          font-weight: 700;
        }

        .member-role {
          margin-left: auto;
          font-size: 11px;
          text-transform: capitalize;
          opacity: 0.6;
        }

        .status-message {
          margin-top: 18px;
          padding: 12px 14px;
          border-radius: 10px;
          background: rgba(128, 128, 128, 0.12);
        }

        .assistant-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-top: 24px;
        }

        .assistant-summary div {
          padding: 18px;
          border: 1px solid rgba(128, 128, 128, 0.16);
          border-radius: 12px;
        }

        .assistant-summary strong {
          display: block;
          font-size: 30px;
        }

        .assistant-summary span {
          font-size: 12px;
          opacity: 0.65;
        }

        .startup-screen {
          min-height: 100vh;
          display: grid;
          place-content: center;
          text-align: center;
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
          .today-secondary-grid,
          .meal-editor-grid,
          .settings-grid {
            grid-template-columns: 1fr;
          }

          .form-grid-3,
          .shopping-add,
          .ingredient-form {
            grid-template-columns: 1fr;
          }

          .assistant-summary {
            grid-template-columns: repeat(3, 1fr);
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
            min-width: 55px;
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
            font-size: 18px;
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

          .assistant-summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
