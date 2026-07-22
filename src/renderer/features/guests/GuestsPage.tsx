import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApi } from "../../lib/api";
import type { Guest } from "@shared/types";

export default function GuestsPage() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const guestsQuery = useQuery(["guests", search], () => getApi().guests.list(search || undefined));

  return (
    <div>
      <div className="toolbar">
        <h2 className="page-title">Guests</h2>
        <button className="btn" onClick={() => setShowAdd(true)}>
          Add guest
        </button>
      </div>

      <div className="form-row" style={{ maxWidth: 320 }}>
        <input
          placeholder="Search by name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Flags</th>
          </tr>
        </thead>
        <tbody>
          {(guestsQuery.data ?? []).map((g) => (
            <tr key={g.id}>
              <td>{g.name}</td>
              <td>{g.email ?? "-"}</td>
              <td>{g.phone ?? "-"}</td>
              <td>
                {g.vip && <span style={{ color: "var(--warning)" }}>VIP </span>}
                {g.blacklisted && <span style={{ color: "var(--danger)" }}>Blacklisted</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {guestsQuery.data && guestsQuery.data.length === 0 && <p>No guests found.</p>}

      {showAdd && <AddGuestModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

export function AddGuestModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated?: (guest: Guest) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");

  const createGuest = useMutation(
    () =>
      getApi().guests.create({
        name,
        email: email || null,
        phone: phone || null,
        idNumber: idNumber || null,
        address: null,
        notes: null,
        vip: false,
        blacklisted: false,
      }),
    {
      onSuccess: (guest) => {
        queryClient.invalidateQueries(["guests"]);
        onCreated?.(guest);
        onClose();
      },
    }
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add guest</h3>
        <div className="form-row">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-row">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-row">
          <label>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="form-row">
          <label>ID/passport number</label>
          <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" disabled={!name} onClick={() => createGuest.mutate()}>
            Save
          </button>
          <button className="btn secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
