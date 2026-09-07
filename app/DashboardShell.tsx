"use client";

import {
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

type Section =
  | "today"
  | "calendar"
  | "tasks"
  | "meals"
  | "shopping"
  | "home"
  | "assistant";

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
    useState<Section>("today");

  function renderSection() {
    if (
      activeSection ===
      "calendar"
    ) {
      return (
        <Workspace>
          <CalendarSummary />
        </Workspace>
      );
    }

    if (
      activeSection ===
      "tasks"
    ) {
      return (
        <Workspace>
          <TaskBoard />
        </Workspace>
      );
    }

    if (
      activeSection ===
      "shopping"
    ) {
      return (
        <Workspace>
          <ShoppingList />
        </Workspace>
      );
    }

    if (
      activeSection ===
      "home"
    ) {
      return (
        <Workspace>
          <HouseholdBoard />
        </Workspace>
      );
    }

    if (
      activeSection ===
      "meals"
    ) {
      return (
        <Workspace>
          <h2>Meals</h2>

          <p>
            Weekly meal planning is
            the next module we'll
            connect.
          </p>
        </Workspace>
      );
    }

    if (
      activeSection ===
      "assistant"
    ) {
      return (
        <Workspace>
          <h2>
            Family Assistant
          </h2>

          <p>
            Eventually this will
            combine calendar, tasks,
            meals, shopping and home
            maintenance into one
            household briefing.
          </p>
        </Workspace>
      );
    }

    return (
      <>
        <div
          style={{
            marginBottom:
              "20px"
          }}
        >
          <h1>
            Good morning
          </h1>

          <p
            style={{
              opacity: 0.7
            }}
          >
            Here's what your family
            needs today.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "18px"
          }}
        >
          <Workspace>
            <CalendarSummary />
          </Workspace>

          <Workspace>
            <TaskBoard />
          </Workspace>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "18px",
            marginTop: "18px"
          }}
        >
          <QuickCard
            title="Shopping"
            text="Open the shopping list to add groceries and household supplies."
            button="Open shopping"
            onClick={() =>
              setActiveSection(
                "shopping"
              )
            }
          />

          <QuickCard
            title="Home"
            text="Track filters, repairs, maintenance and recurring household jobs."
            button="Open home"
            onClick={() =>
              setActiveSection(
                "home"
              )
            }
          />

          <QuickCard
            title="Meals"
            text="Meal planning will live here next."
            button="Open meals"
            onClick={() =>
              setActiveSection(
                "meals"
              )
            }
          />
        </div>
      </>
    );
  }

  return (
    <main className="shell">
      <aside>
        <h2>
          🏠 Family OS
        </h2>

        <small>
          Family command center
        </small>

        <nav
          style={{
            marginTop: "28px",
            display: "grid",
            gap: "6px"
          }}
        >
          {navItems.map(
            item => (
              <button
                key={item.id}
                onClick={() =>
                  setActiveSection(
                    item.id
                  )
                }
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems:
                    "center",
                  gap: "10px",
                  textAlign:
                    "left",
                  padding:
                    "11px 12px",
                  borderRadius:
                    "8px",
                  border:
                    "none",
                  cursor:
                    "pointer",

                  background:
                    activeSection ===
                    item.id
                      ? "rgba(128,128,128,.18)"
                      : "transparent",

                  fontWeight:
                    activeSection ===
                    item.id
                      ? 700
                      : 500
                }}
              >
                <span>
                  {item.icon}
                </span>

                {item.label}
              </button>
            )
          )}
        </nav>
      </aside>

      <section className="main">
        {renderSection()}
      </section>
    </main>
  );
}

function Workspace({
  children
}: {
  children:
    React.ReactNode;
}) {
  return (
    <article
      style={{
        padding: "22px"
      }}
    >
      {children}
    </article>
  );
}

function QuickCard({
  title,
  text,
  button,
  onClick
}: {
  title: string;
  text: string;
  button: string;
  onClick: () => void;
}) {
  return (
    <article>
      <h3>{title}</h3>

      <p>{text}</p>

      <button
        className="btn"
        onClick={onClick}
      >
        {button}
      </button>
    </article>
  );
}
