"use client";

import {
  FormEvent,
  useState
} from "react";

import {
  supabase
} from "./lib/supabase";

import {
  useFamily
} from "./FamilyProvider";

export default function HouseholdSettings() {
  const {
    session,
    household,
    members,
    refreshHousehold
  } =
    useFamily();

  const [
    householdName,
    setHouseholdName
  ] =
    useState(
      household?.name ||
        "Our Home"
    );

  const [
    joinCode,
    setJoinCode
  ] =
    useState("");

  const [
    message,
    setMessage
  ] =
    useState("");

  const [
    saving,
    setSaving
  ] =
    useState(false);

  if (
    !session ||
    !household
  ) {
    return (
      <div>
        <h2>
          Household settings
        </h2>

        <p>
          Loading household...
        </p>
      </div>
    );
  }

  const isOwner =
    household.owner_user_id ===
    session.user.id;

  async function renameHousehold(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !isOwner ||
      !householdName.trim()
    ) {
      return;
    }

    setSaving(true);

    const {
      error
    } =
      await supabase
        .from("households")
        .update({
          name:
            householdName.trim(),
          updated_at:
            new Date().toISOString()
        })
        .eq(
          "id",
          household.id
        );

    if (error) {
      setMessage(
        "Unable to rename household."
      );
    } else {
      setMessage(
        "Household name updated."
      );

      await refreshHousehold();
    }

    setSaving(false);
  }

  async function copyInviteCode() {
    try {
      await navigator.clipboard.writeText(
        household.invite_code
      );

      setMessage(
        "Invite code copied."
      );
    } catch {
      setMessage(
        `Invite code: ${household.invite_code}`
      );
    }
  }

  async function joinHousehold(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !joinCode.trim()
    ) {
      return;
    }

    setSaving(true);
    setMessage("");

    const {
      error
    } =
      await supabase.rpc(
        "join_household",
        {
          p_invite_code:
            joinCode.trim()
        }
      );

    if (error) {
      console.error(
        "Unable to join household:",
        error
      );

      setMessage(
        "That invite code could not be found."
      );

      setSaving(false);
      return;
    }

    setMessage(
      "Household joined."
    );

    setJoinCode("");

    await refreshHousehold();

    window.location.reload();
  }

  async function signOut() {
    await supabase.auth.signOut();

    window.location.reload();
  }

  return (
    <div>
      <div
        className="section-header"
      >
        <div>
          <h2>
            Household settings
          </h2>

          <p>
            Manage your family,
            sharing and account.
          </p>
        </div>
      </div>

      <div
        className="settings-grid"
      >
        <section
          className="settings-panel"
        >
          <h3>
            Your household
          </h3>

          <form
            onSubmit={
              renameHousehold
            }
          >
            <label
              className="field-label"
            >
              Household name
            </label>

            <input
              value={
                householdName
              }
              disabled={
                !isOwner
              }
              onChange={
                event =>
                  setHouseholdName(
                    event.target
                      .value
                  )
              }
            />

            {isOwner && (
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
                Save name
              </button>
            )}
          </form>

          <div
            style={{
              marginTop:
                "24px"
            }}
          >
            <label
              className="field-label"
            >
              Family invite code
            </label>

            <div
              className="invite-code"
            >
              {
                household.invite_code
              }
            </div>

            <button
              className="btn secondary"
              onClick={
                copyInviteCode
              }
            >
              Copy invite code
            </button>

            <p
              className="muted-small"
              style={{
                marginTop:
                  "10px"
              }}
            >
              Have your wife sign in
              with her own Google
              account, then enter this
              code below on her
              account.
            </p>
          </div>
        </section>

        <section
          className="settings-panel"
        >
          <h3>
            Family members
          </h3>

          <div
            style={{
              marginTop:
                "14px"
            }}
          >
            {members.map(
              member => (
                <div
                  key={
                    member.user_id
                  }
                  className="member-row"
                >
                  <div
                    className="member-avatar"
                  >
                    {(
                      member.display_name ||
                      member.email ||
                      "?"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <strong>
                      {member.display_name ||
                        member.email ||
                        "Family member"}
                    </strong>

                    {member.email && (
                      <div
                        className="muted-small"
                      >
                        {
                          member.email
                        }
                      </div>
                    )}
                  </div>

                  <span
                    className="member-role"
                  >
                    {
                      member.role
                    }
                  </span>
                </div>
              )
            )}
          </div>
        </section>

        <section
          className="settings-panel"
        >
          <h3>
            Join another household
          </h3>

          <p>
            Enter an invite code from
            another Family OS user.
          </p>

          <form
            onSubmit={
              joinHousehold
            }
          >
            <input
              value={
                joinCode
              }
              onChange={
                event =>
                  setJoinCode(
                    event.target
                      .value
                      .toUpperCase()
                  )
              }
              placeholder="Invite code"
              maxLength={8}
            />

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
              Join household
            </button>
          </form>
        </section>

        <section
          className="settings-panel"
        >
          <h3>
            Your account
          </h3>

          <p>
            {session.user.email}
          </p>

          <button
            className="btn secondary"
            onClick={
              signOut
            }
          >
            Sign out
          </button>
        </section>
      </div>

      {message && (
        <div
          className="status-message"
        >
          {message}
        </div>
      )}
    </div>
  );
}
