"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState
} from "react";

import {
  Session
} from "@supabase/supabase-js";

import {
  supabase
} from "./lib/supabase";

export type Household = {
  id: string;
  name: string;
  invite_code: string;
  owner_user_id: string | null;
};

export type HouseholdMember = {
  household_id: string;
  user_id: string;
  role: "owner" | "member";
  display_name: string | null;
  email: string | null;
};

type FamilyContextValue = {
  session: Session | null;
  household: Household | null;
  householdId: string | null;
  members: HouseholdMember[];
  loading: boolean;
  refreshHousehold: () => Promise<void>;
};

const FamilyContext =
  createContext<FamilyContextValue | null>(
    null
  );

export default function FamilyProvider({
  children
}: {
  children: ReactNode;
}) {
  const [
    session,
    setSession
  ] =
    useState<Session | null>(
      null
    );

  const [
    household,
    setHousehold
  ] =
    useState<Household | null>(
      null
    );

  const [
    members,
    setMembers
  ] =
    useState<
      HouseholdMember[]
    >([]);

  const [
    loading,
    setLoading
  ] =
    useState(true);

  async function loadHousehold(
    currentSession:
      Session | null
  ) {
    if (!currentSession) {
      setHousehold(null);
      setMembers([]);
      setLoading(false);

      return;
    }

    setLoading(true);

    const {
      data: householdId,
      error: ensureError
    } =
      await supabase.rpc(
        "ensure_household"
      );

    if (
      ensureError ||
      !householdId
    ) {
      console.error(
        "Unable to initialize household:",
        ensureError
      );

      setLoading(false);
      return;
    }

    const [
      householdResult,
      membersResult
    ] =
      await Promise.all([
        supabase
          .from("households")
          .select(
            "id,name,invite_code,owner_user_id"
          )
          .eq(
            "id",
            householdId
          )
          .single(),

        supabase
          .from(
            "household_members"
          )
          .select(
            "household_id,user_id,role,display_name,email"
          )
          .eq(
            "household_id",
            householdId
          )
          .order(
            "created_at",
            {
              ascending: true
            }
          )
      ]);

    if (
      householdResult.error
    ) {
      console.error(
        "Unable to load household:",
        householdResult.error
      );
    } else {
      setHousehold(
        householdResult.data
      );
    }

    if (
      membersResult.error
    ) {
      console.error(
        "Unable to load members:",
        membersResult.error
      );

      setMembers([]);
    } else {
      setMembers(
        (membersResult.data ||
          []) as HouseholdMember[]
      );
    }

    setLoading(false);
  }

  async function refreshHousehold() {
    await loadHousehold(
      session
    );
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
            "Unable to load session:",
            error
          );

          setLoading(false);
          return;
        }

        setSession(
          data.session
        );

        await loadHousehold(
          data.session
        );
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

          await loadHousehold(
            currentSession
          );
        }
      );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <FamilyContext.Provider
      value={{
        session,
        household,
        householdId:
          household?.id ||
          null,
        members,
        loading,
        refreshHousehold
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context =
    useContext(
      FamilyContext
    );

  if (!context) {
    throw new Error(
      "useFamily must be used inside FamilyProvider."
    );
  }

  return context;
}
