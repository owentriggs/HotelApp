import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApi } from "../../lib/api";
import { centsToInput, inputToCents } from "../../lib/money";
import type { GeneralSettings, NumberingSequence, TaxRate, UserRole } from "@shared/types";

const TABS = ["General", "Numbering", "Currencies", "Taxes", "Payment methods", "Users", "Backup & data"] as const;
type Tab = (typeof TABS)[number];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("General");
  return (
    <div>
      <h2 className="page-title">Settings</h2>
      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ width: 180, display: "flex", flexDirection: "column", gap: 2 }}>
          {TABS.map((t) => (
            <button
              key={t}
              className="btn secondary"
              style={{
                textAlign: "left",
                background: tab === t ? "var(--accent)" : "transparent",
                color: tab === t ? "var(--accent-contrast)" : "var(--text)",
                border: tab === t ? "none" : "1px solid var(--border)",
              }}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          {tab === "General" && <GeneralTab />}
          {tab === "Numbering" && <NumberingTab />}
          {tab === "Currencies" && <CurrenciesTab />}
          {tab === "Taxes" && <TaxesTab />}
          {tab === "Payment methods" && <PaymentMethodsTab />}
          {tab === "Users" && <UsersTab />}
          {tab === "Backup & data" && <BackupTab />}
        </div>
      </div>
    </div>
  );
}

function GeneralTab() {
  const queryClient = useQueryClient();
  const query = useQuery(["settings", "general"], () => getApi().settings.getGeneral());
  const [form, setForm] = useState<GeneralSettings | null>(null);
  const settings = form ?? query.data ?? null;

  const save = useMutation((input: GeneralSettings) => getApi().settings.updateGeneral(input), {
    onSuccess: () => queryClient.invalidateQueries(["settings", "general"]),
  });

  if (!settings) return <p>Loading...</p>;

  const set = <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) =>
    setForm({ ...settings, [key]: value });

  return (
    <div className="card">
      <div className="form-row">
        <label>Hotel name</label>
        <input value={settings.hotelName} onChange={(e) => set("hotelName", e.target.value)} />
      </div>
      <div className="form-row">
        <label>Address</label>
        <input value={settings.address} onChange={(e) => set("address", e.target.value)} />
      </div>
      <div className="form-row">
        <label>Phone</label>
        <input value={settings.phone} onChange={(e) => set("phone", e.target.value)} />
      </div>
      <div className="form-row">
        <label>Email</label>
        <input value={settings.email} onChange={(e) => set("email", e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div className="form-row" style={{ flex: 1 }}>
          <label>Default check-in time</label>
          <input type="time" value={settings.defaultCheckInTime} onChange={(e) => set("defaultCheckInTime", e.target.value)} />
        </div>
        <div className="form-row" style={{ flex: 1 }}>
          <label>Default check-out time</label>
          <input type="time" value={settings.defaultCheckOutTime} onChange={(e) => set("defaultCheckOutTime", e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <label>Theme</label>
        <select value={settings.theme} onChange={(e) => set("theme", e.target.value as GeneralSettings["theme"])}>
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <button className="btn" onClick={() => save.mutate(settings)}>
        {save.isLoading ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

function NumberingTab() {
  const queryClient = useQueryClient();
  const query = useQuery(["numbering"], () => getApi().numbering.list());
  const save = useMutation(
    (vars: { key: string; input: Pick<NumberingSequence, "prefix" | "padding" | "resetRule" | "nextValue"> }) =>
      getApi().numbering.update(vars.key, vars.input),
    { onSuccess: () => queryClient.invalidateQueries(["numbering"]) }
  );

  return (
    <div className="card">
      <table className="data-table">
        <thead>
          <tr>
            <th>Sequence</th>
            <th>Prefix</th>
            <th>Next number</th>
            <th>Padding</th>
            <th>Reset</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(query.data ?? []).map((seq) => (
            <NumberingRow key={seq.key} seq={seq} onSave={(input) => save.mutate({ key: seq.key, input })} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NumberingRow({
  seq,
  onSave,
}: {
  seq: NumberingSequence;
  onSave: (input: Pick<NumberingSequence, "prefix" | "padding" | "resetRule" | "nextValue">) => void;
}) {
  const [prefix, setPrefix] = useState(seq.prefix);
  const [padding, setPadding] = useState(seq.padding);
  const [resetRule, setResetRule] = useState(seq.resetRule);
  const [nextValue, setNextValue] = useState(seq.nextValue);

  return (
    <tr>
      <td>{seq.key}</td>
      <td>
        <input style={{ width: 70 }} value={prefix} onChange={(e) => setPrefix(e.target.value)} />
      </td>
      <td>
        <input
          type="number"
          style={{ width: 70 }}
          value={nextValue}
          onChange={(e) => setNextValue(parseInt(e.target.value || "1", 10))}
        />
      </td>
      <td>
        <input
          type="number"
          style={{ width: 60 }}
          value={padding}
          onChange={(e) => setPadding(parseInt(e.target.value || "1", 10))}
        />
      </td>
      <td>
        <select value={resetRule} onChange={(e) => setResetRule(e.target.value as NumberingSequence["resetRule"])}>
          <option value="never">Never</option>
          <option value="yearly">Yearly</option>
          <option value="monthly">Monthly</option>
        </select>
      </td>
      <td>
        <button className="btn" onClick={() => onSave({ prefix, padding, resetRule, nextValue })}>
          Save
        </button>
      </td>
    </tr>
  );
}

function CurrenciesTab() {
  const queryClient = useQueryClient();
  const query = useQuery(["currencies"], () => getApi().currencies.list());
  const [code, setCode] = useState("");
  const [symbol, setSymbol] = useState("");
  const [rate, setRate] = useState("1");

  const setBase = useMutation((c: string) => getApi().currencies.setBase(c), {
    onSuccess: () => queryClient.invalidateQueries(["currencies"]),
  });
  const updateRate = useMutation((vars: { code: string; rate: number }) => getApi().currencies.updateRate(vars.code, vars.rate), {
    onSuccess: () => queryClient.invalidateQueries(["currencies"]),
  });
  const create = useMutation(
    () => getApi().currencies.create({ code, symbol, isBase: false, exchangeRate: parseFloat(rate || "1") }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["currencies"]);
        setCode("");
        setSymbol("");
        setRate("1");
      },
    }
  );
  const del = useMutation((c: string) => getApi().currencies.delete(c), {
    onSuccess: () => queryClient.invalidateQueries(["currencies"]),
  });

  return (
    <div className="card">
      <table className="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Symbol</th>
            <th>Rate vs base</th>
            <th>Base?</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(query.data ?? []).map((c) => (
            <tr key={c.code}>
              <td>{c.code}</td>
              <td>{c.symbol}</td>
              <td>
                {c.isBase ? (
                  "1.00"
                ) : (
                  <input
                    type="number"
                    step="0.0001"
                    style={{ width: 90 }}
                    defaultValue={c.exchangeRate}
                    onBlur={(e) => updateRate.mutate({ code: c.code, rate: parseFloat(e.target.value || "1") })}
                  />
                )}
              </td>
              <td>
                {c.isBase ? "Yes" : <button className="btn secondary" onClick={() => setBase.mutate(c.code)}>Make base</button>}
              </td>
              <td>
                {!c.isBase && (
                  <button className="btn danger" onClick={() => del.mutate(c.code)}>
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4>Add currency</h4>
      <div style={{ display: "flex", gap: 8 }}>
        <input placeholder="Code (EUR)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} style={{ width: 90 }} />
        <input placeholder="Symbol (€)" value={symbol} onChange={(e) => setSymbol(e.target.value)} style={{ width: 90 }} />
        <input placeholder="Rate" type="number" step="0.0001" value={rate} onChange={(e) => setRate(e.target.value)} style={{ width: 90 }} />
        <button className="btn" disabled={!code || !symbol} onClick={() => create.mutate()}>
          Add
        </button>
      </div>
    </div>
  );
}

const APPLIES_TO: TaxRate["appliesTo"][] = ["rooms", "pos", "both"];

function TaxesTab() {
  const queryClient = useQueryClient();
  const query = useQuery(["taxRates"], () => getApi().taxRates.list());
  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState("0");
  const [appliesTo, setAppliesTo] = useState<TaxRate["appliesTo"]>("both");

  const create = useMutation(
    () => getApi().taxRates.create({ name, percentage: parseFloat(percentage || "0"), appliesTo }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["taxRates"]);
        setName("");
        setPercentage("0");
      },
    }
  );
  const del = useMutation((id: number) => getApi().taxRates.delete(id), {
    onSuccess: () => queryClient.invalidateQueries(["taxRates"]),
  });

  return (
    <div className="card">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>%</th>
            <th>Applies to</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(query.data ?? []).map((t) => (
            <tr key={t.id}>
              <td>{t.name}</td>
              <td>{t.percentage}%</td>
              <td>{t.appliesTo}</td>
              <td>
                <button className="btn danger" onClick={() => del.mutate(t.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h4>Add tax rate</h4>
      <div style={{ display: "flex", gap: 8 }}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="number" step="0.01" value={percentage} onChange={(e) => setPercentage(e.target.value)} style={{ width: 80 }} />
        <select value={appliesTo} onChange={(e) => setAppliesTo(e.target.value as TaxRate["appliesTo"])}>
          {APPLIES_TO.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <button className="btn" disabled={!name} onClick={() => create.mutate()}>
          Add
        </button>
      </div>
    </div>
  );
}

function PaymentMethodsTab() {
  const queryClient = useQueryClient();
  const query = useQuery(["paymentMethods"], () => getApi().settings.getPaymentMethods());
  const [newMethod, setNewMethod] = useState("");

  const save = useMutation((methods: string[]) => getApi().settings.updatePaymentMethods(methods), {
    onSuccess: () => queryClient.invalidateQueries(["paymentMethods"]),
  });

  const methods = query.data ?? [];

  return (
    <div className="card">
      <ul>
        {methods.map((m, i) => (
          <li key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
            {m}
            <button className="btn danger" onClick={() => save.mutate(methods.filter((_, idx) => idx !== i))}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={newMethod} onChange={(e) => setNewMethod(e.target.value)} placeholder="e.g. Bank transfer" />
        <button
          className="btn"
          disabled={!newMethod}
          onClick={() => {
            save.mutate([...methods, newMethod]);
            setNewMethod("");
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

const ROLES: UserRole[] = ["admin", "manager", "front_desk", "pos_staff"];

function UsersTab() {
  const queryClient = useQueryClient();
  const query = useQuery(["users"], () => getApi().users.list());
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("front_desk");

  const create = useMutation(() => getApi().users.create({ name, username, password, role }), {
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      setName("");
      setUsername("");
      setPassword("");
    },
  });
  const setActive = useMutation((vars: { id: number; active: boolean }) => getApi().users.setActive(vars.id, vars.active), {
    onSuccess: () => queryClient.invalidateQueries(["users"]),
  });
  const setRole_ = useMutation((vars: { id: number; role: UserRole }) => getApi().users.setRole(vars.id, vars.role), {
    onSuccess: () => queryClient.invalidateQueries(["users"]),
  });

  return (
    <div className="card">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Role</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {(query.data ?? []).map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.username}</td>
              <td>
                <select value={u.role} onChange={(e) => setRole_.mutate({ id: u.id, role: e.target.value as UserRole })}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input type="checkbox" checked={u.active} onChange={(e) => setActive.mutate({ id: u.id, active: e.target.checked })} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4>Add user</h4>
      <div className="form-row">
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <button className="btn" disabled={!name || !username || !password} onClick={() => create.mutate()}>
        Add user
      </button>
    </div>
  );
}

function BackupTab() {
  const dbPathQuery = useQuery(["backup", "dbPath"], () => getApi().backup.getDbPath());
  const [message, setMessage] = useState<string | null>(null);

  const backupNow = useMutation(() => getApi().backup.backupNow(), {
    onSuccess: (path) => setMessage(path ? `Backup saved to ${path}` : "Backup cancelled"),
  });
  const restore = useMutation(() => getApi().backup.restore(), {
    onSuccess: (ok) => setMessage(ok ? "Restored. Restart the app to see the restored data." : "Restore cancelled"),
  });

  return (
    <div className="card">
      <p>
        Database file: <code>{dbPathQuery.data}</code>
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn" onClick={() => backupNow.mutate()}>
          Backup now
        </button>
        <button className="btn secondary" onClick={() => getApi().backup.revealDbFolder()}>
          Reveal in folder
        </button>
        <button className="btn danger" onClick={() => restore.mutate()}>
          Restore from backup...
        </button>
      </div>
      {message && <p style={{ marginTop: 12 }}>{message}</p>}
    </div>
  );
}
