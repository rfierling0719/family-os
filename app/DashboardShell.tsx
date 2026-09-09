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
    icon: "⌂"
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: "◫"
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: "✓"
  },
  {
    id: "meals",
    label: "Meals",
    icon: "◉"
  },
  {
    id: "shopping",
    label: "Shopping",
    icon: "◈"
  },
  {
    id: "home",
    label: "Home",
    icon: "◇"
  },
  {
    id: "assistant",
    label: "Assistant",
    icon: "✦"
  }
];

const sectionTitles: Record<
  Section,
  {
    title: string;
    subtitle: string;
  }
> = {
  today: {
    title: "Today",
    subtitle:
      "A quick look at what your household needs."
  },

  calendar: {
    title: "Calendar",
    subtitle:
      "Upcoming events and family schedule."
  },

  tasks: {
    title: "Tasks",
    subtitle:
      "Keep track of what needs to get done."
  },

  meals: {
    title: "Meals",
    subtitle:
      "Plan dinners and build your shopping list."
  },

  shopping: {
    title: "Shopping",
    subtitle:
      "Everything your household needs to pick up."
  },

  home: {
    title: "Home",
    subtitle:
      "Maintenance, repairs and recurring household jobs."
  },

  assistant: {
    title: "Assistant",
    subtitle:
      "Your household overview and planning assistant."
  },

  settings: {
    title: "Settings",
    subtitle:
      "Manage your household, members and account."
  }
};

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
          () => {
            loadCounts();
          }
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
          () => {
            loadCounts();
          }
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
          () => {
            loadCounts();
          }
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
        <div
          className="startup-logo"
        >
          F
        </div>

        <h2>
          Family OS
        </h2>

        <p>
          Loading your household...
        </p>

        <style jsx global>{`
          body {
            margin: 0;
            background: #f7f8fa;
            color: #18202b;
            font-family:
              Inter,
              ui-sans-serif,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
          }

          .startup-screen {
            min-height: 100vh;
            display: grid;
            place-content: center;
            text-align: center;
          }

          .startup-logo {
            width: 54px;
            height: 54px;
            margin: 0 auto 16px;
            display: grid;
            place-items: center;
            border-radius: 16px;
            background: #172033;
            color: white;
            font-weight: 800;
            font-size: 22px;
          }
        `}</style>
      </main>
    );
  }

  function renderSection() {
    switch (
      activeSection
    ) {
      case "calendar":
        return (
          <div
            className="workspace-card"
          >
            <CalendarSummary />
          </div>
        );

      case "tasks":
        return (
          <div
            className="workspace-card"
          >
            <TaskBoard />
          </div>
        );

      case "shopping":
        return (
          <div
            className="workspace-card"
          >
            <ShoppingList />
          </div>
        );

      case "home":
        return (
          <div
            className="workspace-card"
          >
            <HouseholdBoard />
          </div>
        );

      case "meals":
        return (
          <div
            className="workspace-card"
          >
            <MealPlanner />
          </div>
        );

      case "settings":
        return (
          <div
            className="workspace-card"
          >
            <HouseholdSettings />
          </div>
        );

      case "assistant":
        return (
          <div
            className="workspace-card"
          >
            <div
              className="assistant-intro"
            >
              <div
                className="assistant-icon"
              >
                ✦
              </div>

              <div>
                <h2>
                  Family Assistant
                </h2>

                <p>
                  A quick view of what
                  is currently happening
                  across your household.
                </p>
              </div>
            </div>

            <div
              className="assistant-summary"
            >
              <div
                className="metric-card"
              >
                <span
                  className="metric-label"
                >
                  Open tasks
                </span>

                <strong>
                  {
                    counts.tasks
                  }
                </strong>

                <button
                  className="text-button"
                  onClick={() =>
                    navigate(
                      "tasks"
                    )
                  }
                >
                  View tasks
                </button>
              </div>

              <div
                className="metric-card"
              >
                <span
                  className="metric-label"
                >
                  Shopping items
                </span>

                <strong>
                  {
                    counts.shopping
                  }
                </strong>

                <button
                  className="text-button"
                  onClick={() =>
                    navigate(
                      "shopping"
                    )
                  }
                >
                  Open shopping
                </button>
              </div>

              <div
                className="metric-card"
              >
                <span
                  className="metric-label"
                >
                  Home items
                </span>

                <strong>
                  {
                    counts.home
                  }
                </strong>

                <button
                  className="text-button"
                  onClick={() =>
                    navigate(
                      "home"
                    )
                  }
                >
                  View home
                </button>
              </div>
            </div>
          </div>
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

  const sectionInfo =
    sectionTitles[
      activeSection
    ];

  const displayName =
    session?.user
      ?.user_metadata
      ?.full_name ||
    session?.user.email
      ?.split("@")[0] ||
    "Account";

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
              className="brand-mark"
            >
              F
            </div>

            <div
              className="brand-copy"
            >
              <strong>
                Family OS
              </strong>

              <span>
                {household?.name ||
                  "Our Home"}
              </span>
            </div>
          </button>

          <div
            className="sidebar-label"
          >
            Workspace
          </div>

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
                      className="nav-label"
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
                  ? "account-button active"
                  : "account-button"
              }
              onClick={() =>
                navigate(
                  "settings"
                )
              }
            >
              <div
                className="account-avatar"
              >
                {displayName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div
                className="account-copy"
              >
                <strong>
                  {
                    displayName
                  }
                </strong>

                <span>
                  Settings
                </span>
              </div>

              <span
                className="account-arrow"
              >
                ›
              </span>
            </button>
          </div>
        </aside>

        <section
          className="family-main"
        >
          {activeSection !==
            "today" && (
            <header
              className="page-header"
            >
              <div>
                <div
                  className="page-eyebrow"
                >
                  {
                    household?.name
                  }
                </div>

                <h1>
                  {
                    sectionInfo.title
                  }
                </h1>

                <p>
                  {
                    sectionInfo.subtitle
                  }
                </p>
              </div>

              <div
                className="household-pill"
              >
                <span
                  className="household-status"
                />

                {
                  household?.name ||
                  "Our Home"
                }
              </div>
            </header>
          )}

          <div
            className="page-content"
          >
            {renderSection()}
          </div>
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
              <span
                className="mobile-icon"
              >
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
          <span
            className="mobile-icon"
          >
            ⚙
          </span>

          <small>
            Settings
          </small>
        </button>
      </nav>

      <style jsx global>{`
        :root {
          --bg: #f6f7f9;
          --surface: #ffffff;
          --surface-soft: #fafbfc;

          --border: #e6e9ee;
          --border-strong: #d9dee6;

          --text: #18202b;
          --text-soft: #566273;
          --text-muted: #8791a0;

          --navy: #172033;
          --navy-hover: #222e46;

          --accent: #3157d5;
          --accent-soft: #eef2ff;

          --success: #2a7d5f;
          --danger: #b94646;

          --shadow-sm:
            0 1px 2px rgba(
              16,
              24,
              40,
              0.03
            );

          --shadow-md:
            0 8px 30px rgba(
              22,
              32,
              51,
              0.06
            );

          --radius-sm: 9px;
          --radius-md: 14px;
          --radius-lg: 18px;
        }

        * {
          box-sizing: border-box;
        }

        html {
          background:
            var(--bg);
        }

        body {
          margin: 0;
          background:
            var(--bg);
          color:
            var(--text);

          font-family:
            Inter,
            ui-sans-serif,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          font-size: 14px;
          line-height: 1.5;
          -webkit-font-smoothing:
            antialiased;
        }

        button,
        input,
        select,
        textarea {
          font: inherit;
        }

        button {
          color: inherit;
        }

        h1,
        h2,
        h3 {
          margin-top: 0;
          color:
            var(--text);
          letter-spacing:
            -0.02em;
        }

        h1 {
          margin-bottom: 6px;
          font-size: 30px;
          line-height: 1.2;
          font-weight: 750;
        }

        h2 {
          margin-bottom: 6px;
          font-size: 22px;
          line-height: 1.25;
          font-weight: 720;
        }

        h3 {
          margin-bottom: 5px;
          font-size: 15px;
          font-weight: 700;
        }

        p {
          color:
            var(--text-soft);
        }

        input:not(
          [type="checkbox"]
        ):not(
          [type="radio"]
        ),
        select,
        textarea {
          width: 100%;
          min-height: 42px;

          border:
            1px solid
            var(--border-strong);

          border-radius:
            var(--radius-sm);

          background:
            var(--surface);

          color:
            var(--text);

          padding:
            9px 11px;

          outline: none;

          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease,
            background 0.15s ease;
        }

        input[type="checkbox"] {
          width: 17px;
          height: 17px;

          min-width: 17px;
          min-height: 17px;

          flex: 0 0 17px;

          margin: 0;

          padding: 0;

          cursor: pointer;

          accent-color:
            var(--accent);
        }

        input[type="radio"] {
          width: 17px;
          height: 17px;

          min-width: 17px;
          min-height: 17px;

          margin: 0;

          padding: 0;

          cursor: pointer;

          accent-color:
            var(--accent);
        }

        textarea {
          resize: vertical;
        }

        input::placeholder,
        textarea::placeholder {
          color:
            #a2aab5;
        }

        input:not(
          [type="checkbox"]
        ):not(
          [type="radio"]
        ):focus,
        select:focus,
        textarea:focus {
          border-color:
            #8fa5ea;

          box-shadow:
            0 0 0 3px
            rgba(
              49,
              87,
              213,
              0.1
            );
        }

        .family-shell {
          display: grid;

          grid-template-columns:
            244px
            minmax(0, 1fr);

          min-height: 100vh;
        }

        .family-sidebar {
          position: sticky;
          top: 0;

          height: 100vh;

          padding:
            22px 14px 16px;

          background:
            var(--surface);

          border-right:
            1px solid
            var(--border);

          display: flex;
          flex-direction: column;
        }

        .brand {
          width: 100%;

          display: flex;
          align-items: center;

          gap: 11px;

          padding:
            4px 7px 18px;

          border: none;

          background:
            transparent;

          cursor: pointer;

          text-align: left;
        }

        .brand-mark {
          width: 38px;
          height: 38px;

          display: grid;
          place-items: center;

          border-radius:
            11px;

          background:
            var(--navy);

          color:
            white;

          font-size: 16px;
          font-weight: 800;

          box-shadow:
            0 5px 14px
            rgba(
              23,
              32,
              51,
              0.15
            );
        }

        .brand-copy {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .brand-copy strong {
          font-size: 15px;
          font-weight: 760;

          color:
            var(--text);
        }

        .brand-copy span {
          margin-top: 1px;

          font-size: 11px;

          color:
            var(--text-muted);

          white-space: nowrap;
          overflow: hidden;

          text-overflow:
            ellipsis;
        }

        .sidebar-label {
          padding:
            8px 11px 7px;

          color:
            var(--text-muted);

          font-size: 10px;
          font-weight: 700;

          letter-spacing:
            0.08em;

          text-transform:
            uppercase;
        }

        .sidebar-nav {
          display: grid;
          gap: 3px;
        }

        .nav-button {
          width: 100%;
          min-height: 42px;

          display: flex;
          align-items: center;

          gap: 10px;

          padding:
            9px 10px;

          border: none;

          border-radius:
            10px;

          background:
            transparent;

          cursor: pointer;
          text-align: left;

          color:
            var(--text-soft);

          transition:
            background 0.14s ease,
            color 0.14s ease,
            transform 0.14s ease;
        }

        .nav-button:hover {
          background:
            #f3f5f7;

          color:
            var(--text);
        }

        .nav-button.active {
          background:
            var(--accent-soft);

          color:
            var(--accent);

          font-weight: 700;
        }

        .nav-icon {
          width: 24px;
          height: 24px;

          display: grid;
          place-items: center;

          border-radius:
            7px;

          font-size: 15px;
          font-weight: 700;
        }

        .nav-button.active
        .nav-icon {
          background:
            rgba(
              49,
              87,
              213,
              0.08
            );
        }

        .nav-label {
          flex: 1;
        }

        .nav-badge {
          min-width: 23px;
          height: 23px;

          padding: 0 6px;

          display: grid;
          place-items: center;

          border-radius:
            999px;

          background:
            #eef0f4;

          color:
            var(--text-soft);

          font-size: 10px;
          font-weight: 700;
        }

        .nav-button.active
        .nav-badge {
          background:
            white;

          color:
            var(--accent);
        }

        .sidebar-account {
          margin-top: auto;

          padding-top: 14px;

          border-top:
            1px solid
            var(--border);
        }

        .account-button {
          width: 100%;

          display: flex;
          align-items: center;

          gap: 10px;

          padding:
            8px 9px;

          border: none;

          border-radius:
            11px;

          background:
            transparent;

          cursor: pointer;
          text-align: left;

          transition:
            background 0.14s ease;
        }

        .account-button:hover,
        .account-button.active {
          background:
            #f3f5f7;
        }

        .account-avatar {
          width: 34px;
          height: 34px;

          flex: 0 0 auto;

          display: grid;
          place-items: center;

          border-radius:
            10px;

          background:
            var(--navy);

          color: white;

          font-size: 13px;
          font-weight: 800;
        }

        .account-copy {
          min-width: 0;
          flex: 1;

          display: flex;

          flex-direction:
            column;
        }

        .account-copy strong {
          font-size: 12px;

          white-space:
            nowrap;

          overflow: hidden;

          text-overflow:
            ellipsis;
        }

        .account-copy span {
          font-size: 10px;

          color:
            var(--text-muted);
        }

        .account-arrow {
          color:
            var(--text-muted);

          font-size: 18px;
        }

        .family-main {
          width: 100%;
          min-width: 0;

          padding:
            30px 36px 50px;
        }

        .page-header {
          max-width: 1320px;

          margin:
            0 auto 22px;

          display: flex;

          align-items:
            flex-end;

          justify-content:
            space-between;

          gap: 20px;
        }

        .page-header h1 {
          margin:
            2px 0 4px;
        }

        .page-header p {
          margin: 0;

          font-size: 13px;
        }

        .page-eyebrow {
          color:
            var(--accent);

          font-size: 10px;

          font-weight: 750;

          letter-spacing:
            0.08em;

          text-transform:
            uppercase;
        }

        .household-pill {
          display: flex;
          align-items: center;

          gap: 8px;

          padding:
            7px 11px;

          border:
            1px solid
            var(--border);

          border-radius:
            999px;

          background:
            rgba(
              255,
              255,
              255,
              0.7
            );

          color:
            var(--text-soft);

          font-size: 11px;

          font-weight: 600;
        }

        .household-status {
          width: 7px;
          height: 7px;

          border-radius:
            50%;

          background:
            #39a378;

          box-shadow:
            0 0 0 3px
            rgba(
              57,
              163,
              120,
              0.12
            );
        }

        .page-content {
          max-width: 1320px;

          margin: 0 auto;
        }

        .workspace-card {
          min-height:
            calc(
              100vh - 150px
            );

          padding: 26px;

          border:
            1px solid
            var(--border);

          border-radius:
            var(--radius-lg);

          background:
            var(--surface);

          box-shadow:
            var(--shadow-sm);
        }

        .today-heading {
          margin-bottom: 20px;
        }

        .today-heading h1 {
          margin-bottom: 4px;
        }

        .today-heading p {
          margin: 0;

          font-size: 13px;
        }

        .today-primary-grid {
          display: grid;

          grid-template-columns:
            minmax(0, 1.25fr)
            minmax(300px, 0.75fr);

          gap: 18px;
        }

        .today-primary-grid
        > article,
        .today-secondary-grid
        > article {
          padding: 22px;

          border:
            1px solid
            var(--border);

          border-radius:
            var(--radius-lg);

          background:
            var(--surface);

          box-shadow:
            var(--shadow-sm);

          transition:
            box-shadow 0.18s ease,
            transform 0.18s ease;
        }

        .today-primary-grid
        > article:hover,
        .today-secondary-grid
        > article:hover {
          box-shadow:
            var(--shadow-md);
        }

        .today-secondary-grid {
          display: grid;

          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );

          gap: 18px;

          margin-top: 18px;
        }

        .section-header,
        .card-heading {
          display: flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap: 14px;
        }

        .section-header p,
        .card-heading p {
          margin:
            2px 0 0;
        }

        .muted-small {
          color:
            var(--text-muted);

          font-size: 11px;
        }

        .mini-row,
        .task-row,
        .shopping-row,
        .maintenance-row,
        .ingredient-row,
        .member-row,
        .completed-row {
          display: flex;

          align-items:
            center;

          gap: 11px;

          padding:
            12px 2px;

          border-bottom:
            1px solid
            var(--border);

          transition:
            background 0.12s ease;
        }

        .task-row:hover,
        .shopping-row:hover,
        .maintenance-row:hover,
        .ingredient-row:hover {
          background:
            var(--surface-soft);
        }

        .maintenance-row {
          align-items:
            flex-start;
        }

        .task-meta {
          display: flex;
          flex-wrap: wrap;

          gap:
            5px 12px;

          margin-top: 5px;

          color:
            var(--text-muted);

          font-size: 11px;
        }

        .overdue {
          color:
            var(--danger);

          font-weight: 700;
        }

        .big-number {
          margin-top: 14px;

          color:
            var(--text);

          font-size: 38px;

          font-weight: 760;

          line-height: 1;

          letter-spacing:
            -0.04em;
        }

        .text-button {
          padding: 0;

          border: none;

          background:
            transparent;

          color:
            var(--accent);

          cursor: pointer;

          font-size: 12px;

          font-weight: 700;
        }

        .text-button:hover {
          text-decoration:
            underline;
        }

        .icon-button {
          width: 30px;
          height: 30px;

          display: grid;
          place-items: center;

          flex: 0 0 auto;

          border: none;

          border-radius:
            8px;

          background:
            transparent;

          color:
            var(--text-muted);

          cursor: pointer;

          transition:
            background 0.13s ease,
            color 0.13s ease;
        }

        .icon-button:hover {
          background:
            #f1f3f6;

          color:
            var(--danger);
        }

        .btn {
          min-height: 40px;

          padding:
            9px 14px;

          border: none;

          border-radius:
            9px;

          background:
            var(--navy);

          color:
            #ffffff;

          cursor: pointer;

          font-size: 12px;

          font-weight: 700;

          box-shadow:
            0 1px 2px
            rgba(
              16,
              24,
              40,
              0.08
            );

          transition:
            background 0.15s ease,
            transform 0.12s ease,
            box-shadow 0.15s ease;
        }

        .btn:hover {
          background:
            var(--navy-hover);

          box-shadow:
            0 4px 12px
            rgba(
              23,
              32,
              51,
              0.15
            );

          transform:
            translateY(-1px);
        }

        .btn:active {
          transform:
            translateY(0);
        }

        .btn:disabled {
          opacity: 0.5;

          cursor:
            not-allowed;

          transform: none;

          box-shadow: none;
        }

        .btn.secondary {
          border:
            1px solid
            var(--border-strong);

          background:
            var(--surface);

          color:
            var(--text-soft);

          box-shadow:
            none;
        }

        .btn.secondary:hover {
          background:
            var(--surface-soft);

          color:
            var(--text);
        }

        .form-card {
          margin-top: 20px;

          padding: 18px;

          display: grid;

          gap: 11px;

          border:
            1px solid
            var(--border);

          border-radius:
            var(--radius-md);

          background:
            var(--surface-soft);
        }

        .form-grid-3 {
          display: grid;

          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );

          gap: 10px;
        }

        .shopping-add {
          display: grid;

          grid-template-columns:
            2fr
            0.7fr
            1fr
            auto;

          gap: 10px;

          margin-top: 20px;

          padding: 14px;

          border:
            1px solid
            var(--border);

          border-radius:
            var(--radius-md);

          background:
            var(--surface-soft);
        }

        .shopping-add input,
        .shopping-add select {
          min-width: 0;
        }

        .shopping-group {
          margin-bottom: 24px;
        }

        .shopping-group h3 {
          padding-bottom: 8px;

          border-bottom:
            1px solid
            var(--border);

          color:
            var(--text-soft);

          font-size: 11px;

          letter-spacing:
            0.06em;

          text-transform:
            uppercase;
        }

        details {
          margin-top: 20px;

          border-top:
            1px solid
            var(--border);

          padding-top: 16px;
        }

        summary {
          cursor: pointer;

          color:
            var(--text-soft);

          font-size: 12px;

          font-weight: 700;
        }

        .meal-week-grid {
          display: grid;

          grid-template-columns:
            repeat(
              7,
              minmax(
                125px,
                1fr
              )
            );

          gap: 10px;

          overflow-x: auto;

          margin-top: 20px;

          padding-bottom: 5px;
        }

        .meal-day {
          min-height: 126px;

          padding: 13px;

          display: flex;

          flex-direction:
            column;

          gap: 3px;

          text-align: left;

          border:
            1px solid
            var(--border);

          border-radius:
            var(--radius-md);

          background:
            var(--surface);

          cursor: pointer;

          color:
            var(--text);

          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease,
            transform 0.15s ease;
        }

        .meal-day:hover {
          border-color:
            #cbd2dc;

          box-shadow:
            0 4px 16px
            rgba(
              22,
              32,
              51,
              0.06
            );

          transform:
            translateY(-1px);
        }

        .meal-day.selected {
          border-color:
            var(--accent);

          background:
            var(--accent-soft);

          box-shadow:
            0 0 0 2px
            rgba(
              49,
              87,
              213,
              0.08
            );
        }

        .meal-day-name {
          margin-top: auto;

          color:
            var(--text-soft);

          font-size: 12px;

          line-height: 1.4;
        }

        .meal-editor-grid {
          display: grid;

          grid-template-columns:
            minmax(0, 1fr)
            minmax(0, 1fr);

          gap: 18px;
        }

        .ingredient-form {
          display: grid;

          grid-template-columns:
            2fr
            0.7fr
            1fr
            auto;

          gap: 8px;
        }

        .ingredient-form input,
        .ingredient-form select {
          min-width: 0;
        }

        .complete-circle {
          width: 31px;
          height: 31px;

          flex: 0 0 auto;

          display: grid;

          place-items: center;

          border:
            1px solid
            var(--border-strong);

          border-radius:
            50%;

          background:
            var(--surface);

          color:
            var(--text-muted);

          cursor: pointer;

          transition:
            background 0.14s ease,
            border-color 0.14s ease,
            color 0.14s ease;
        }

        .complete-circle:hover {
          background:
            #edf8f3;

          border-color:
            #a8d9c7;

          color:
            var(--success);
        }

        .empty-state {
          margin-top: 26px;

          padding:
            34px 20px;

          border:
            1px dashed
            var(--border-strong);

          border-radius:
            var(--radius-md);

          background:
            var(--surface-soft);

          text-align: center;
        }

        .empty-state h3 {
          margin: 0;

          color:
            var(--text-soft);

          font-size: 14px;
        }

        .settings-grid {
          display: grid;

          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );

          gap: 18px;
        }

        .settings-panel {
          padding: 20px;

          border:
            1px solid
            var(--border);

          border-radius:
            var(--radius-md);

          background:
            var(--surface-soft);
        }

        .field-label {
          display: block;

          margin-bottom: 6px;

          color:
            var(--text-soft);

          font-size: 11px;

          font-weight: 650;
        }

        .invite-code {
          margin:
            10px 0 14px;

          color:
            var(--navy);

          font-size: 28px;

          font-weight: 800;

          letter-spacing:
            5px;
        }

        .member-avatar {
          width: 38px;
          height: 38px;

          display: grid;

          place-items: center;

          flex: 0 0 auto;

          border-radius:
            11px;

          background:
            var(--navy);

          color: white;

          font-size: 13px;

          font-weight: 800;
        }

        .member-role {
          margin-left: auto;

          padding:
            4px 7px;

          border-radius:
            999px;

          background:
            #eef0f4;

          color:
            var(--text-muted);

          font-size: 9px;

          font-weight: 750;

          text-transform:
            uppercase;

          letter-spacing:
            0.05em;
        }

        .status-message {
          margin-top: 16px;

          padding:
            11px 13px;

          border:
            1px solid
            var(--border);

          border-radius:
            9px;

          background:
            #f8f9fb;

          color:
            var(--text-soft);

          font-size: 12px;
        }

        .assistant-intro {
          display: flex;

          align-items:
            flex-start;

          gap: 14px;
        }

        .assistant-icon {
          width: 42px;
          height: 42px;

          display: grid;

          place-items: center;

          flex: 0 0 auto;

          border-radius:
            12px;

          background:
            var(--accent-soft);

          color:
            var(--accent);

          font-size: 20px;
        }

        .assistant-intro p {
          margin: 0;
        }

        .assistant-summary {
          display: grid;

          grid-template-columns:
            repeat(
              3,
              minmax(0, 1fr)
            );

          gap: 14px;

          margin-top: 26px;
        }

        .metric-card {
          padding: 18px;

          border:
            1px solid
            var(--border);

          border-radius:
            var(--radius-md);

          background:
            var(--surface-soft);
        }

        .metric-card strong {
          display: block;

          margin:
            6px 0 16px;

          color:
            var(--text);

          font-size: 34px;

          line-height: 1;

          letter-spacing:
            -0.04em;
        }

        .metric-label {
          color:
            var(--text-muted);

          font-size: 10px;

          font-weight: 700;

          text-transform:
            uppercase;

          letter-spacing:
            0.06em;
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

        @media (
          max-width: 900px
        ) {
          .family-shell {
            display: block;
          }

          .family-sidebar {
            display: none;
          }

          .family-main {
            padding:
              20px 14px 92px;
          }

          .page-header {
            margin-bottom: 18px;

            align-items:
              flex-start;
          }

          .household-pill {
            display: none;
          }

          .workspace-card {
            min-height: auto;

            padding: 20px;
          }

          .today-primary-grid,
          .today-secondary-grid,
          .meal-editor-grid,
          .settings-grid {
            grid-template-columns:
              1fr;
          }

          .form-grid-3,
          .shopping-add,
          .ingredient-form {
            grid-template-columns:
              1fr;
          }

          .assistant-summary {
            grid-template-columns:
              repeat(
                3,
                1fr
              );
          }

          .mobile-nav {
            position: fixed;

            left: 10px;
            right: 10px;
            bottom: 10px;

            z-index: 100;

            display: flex;

            padding: 6px;

            border:
              1px solid
              var(--border-strong);

            border-radius:
              16px;

            background:
              rgba(
                255,
                255,
                255,
                0.96
              );

            box-shadow:
              0 12px 36px
              rgba(
                22,
                32,
                51,
                0.14
              );

            backdrop-filter:
              blur(18px);

            overflow-x: auto;
          }

          .mobile-nav-item {
            min-width: 54px;

            flex: 1;

            padding:
              7px 3px;

            display: grid;

            place-items: center;

            gap: 2px;

            border: none;

            border-radius:
              10px;

            background:
              transparent;

            color:
              var(--text-muted);

            cursor: pointer;
          }

          .mobile-nav-item.active {
            background:
              var(--accent-soft);

            color:
              var(--accent);

            font-weight: 700;
          }

          .mobile-icon {
            font-size: 17px;

            font-weight: 700;
          }

          .mobile-nav-item small {
            font-size: 9px;
          }
        }

        @media (
          max-width: 560px
        ) {
          .family-main {
            padding-left: 11px;
            padding-right: 11px;
          }

          .page-header h1 {
            font-size: 26px;
          }

          .workspace-card,
          .today-primary-grid
          > article,
          .today-secondary-grid
          > article {
            padding: 17px;

            border-radius:
              14px;
          }

          .section-header,
          .card-heading {
            align-items:
              flex-start;
          }

          .assistant-summary {
            grid-template-columns:
              1fr;
          }

          .invite-code {
            font-size: 22px;

            letter-spacing:
              3px;
          }
        }
      `}</style>
    </>
  );
}
