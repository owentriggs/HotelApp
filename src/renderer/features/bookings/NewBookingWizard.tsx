import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApi } from "../../lib/api";
import { centsToInput, inputToCents } from "../../lib/money";
import Wizard, { WizardStep } from "../../app/Wizard";
import { AddGuestModal } from "../guests/GuestsPage";
import type { Guest, Room, RoomType } from "@shared/types";

function todayIso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function NewBookingWizard({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const roomsQuery = useQuery(["rooms"], () => getApi().rooms.list());
  const roomTypesQuery = useQuery(["roomTypes"], () => getApi().roomTypes.list());

  const [checkInDate, setCheckInDate] = useState(todayIso());
  const [checkOutDate, setCheckOutDate] = useState(todayIso(1));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const [availableRoomIds, setAvailableRoomIds] = useState<number[] | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const [guestSearch, setGuestSearch] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const guestsQuery = useQuery(
    ["guests", guestSearch],
    () => getApi().guests.list(guestSearch || undefined),
    { enabled: guestSearch.length > 0 }
  );

  const [rateCents, setRateCents] = useState(0);
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");

  const rooms = roomsQuery.data ?? [];
  const roomTypesById = new Map<number, RoomType>((roomTypesQuery.data ?? []).map((rt) => [rt.id, rt]));

  useEffect(() => {
    let cancelled = false;
    setCheckingAvailability(true);
    setAvailableRoomIds(null);
    (async () => {
      const api = getApi();
      const results = await Promise.all(
        rooms.map(async (room) => ({
          id: room.id,
          available: await api.bookings.isRoomAvailable(room.id, checkInDate, checkOutDate),
        }))
      );
      if (!cancelled) {
        setAvailableRoomIds(results.filter((r) => r.available).map((r) => r.id));
        setCheckingAvailability(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkInDate, checkOutDate, rooms.length]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null;

  useEffect(() => {
    if (selectedRoom) {
      const rt = roomTypesById.get(selectedRoom.roomTypeId);
      if (rt) setRateCents(rt.baseRateCents);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoomId]);

  const nights = useMemo(() => {
    const ms = new Date(checkOutDate).getTime() - new Date(checkInDate).getTime();
    return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
  }, [checkInDate, checkOutDate]);

  const createBooking = useMutation(
    () =>
      getApi().bookings.create({
        guestId: selectedGuest!.id,
        roomId: selectedRoomId!,
        checkInDate,
        checkOutDate,
        rateCents,
        adults,
        children,
        source: source || null,
        notes: notes || null,
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["bookings"]);
        queryClient.invalidateQueries(["rooms"]);
        onClose();
      },
    }
  );

  const steps: WizardStep[] = [
    {
      id: "dates",
      title: "Dates",
      canProceed: new Date(checkOutDate) > new Date(checkInDate),
      render: () => (
        <div>
          <div className="form-row">
            <label>Check-in date</label>
            <input type="date" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Check-out date</label>
            <input type="date" value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div className="form-row" style={{ flex: 1 }}>
              <label>Adults</label>
              <input
                type="number"
                min={1}
                value={adults}
                onChange={(e) => setAdults(parseInt(e.target.value || "1", 10))}
              />
            </div>
            <div className="form-row" style={{ flex: 1 }}>
              <label>Children</label>
              <input
                type="number"
                min={0}
                value={children}
                onChange={(e) => setChildren(parseInt(e.target.value || "0", 10))}
              />
            </div>
          </div>
          {new Date(checkOutDate) <= new Date(checkInDate) && (
            <p style={{ color: "var(--danger)" }}>Check-out must be after check-in.</p>
          )}
        </div>
      ),
    },
    {
      id: "room",
      title: "Room",
      canProceed: selectedRoomId !== null,
      render: () => (
        <div>
          {checkingAvailability && <p>Checking availability...</p>}
          {!checkingAvailability && availableRoomIds && availableRoomIds.length === 0 && (
            <p>No rooms available for these dates.</p>
          )}
          <div className="room-grid">
            {rooms
              .filter((r) => availableRoomIds?.includes(r.id))
              .map((room) => {
                const rt = roomTypesById.get(room.roomTypeId);
                return (
                  <div
                    key={room.id}
                    className={`room-tile vacant`}
                    style={{
                      outline: selectedRoomId === room.id ? "2px solid var(--accent)" : "none",
                    }}
                    onClick={() => setSelectedRoomId(room.id)}
                  >
                    <strong>{room.number}</strong>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{rt?.name}</div>
                    <div style={{ fontSize: 12 }}>{rt ? centsToInput(rt.baseRateCents) : "-"}/night</div>
                  </div>
                );
              })}
          </div>
        </div>
      ),
    },
    {
      id: "guest",
      title: "Guest",
      canProceed: selectedGuest !== null,
      render: () => (
        <div>
          {selectedGuest ? (
            <div className="card">
              <strong>{selectedGuest.name}</strong>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {selectedGuest.email} {selectedGuest.phone}
              </div>
              <button className="btn secondary" style={{ marginTop: 8 }} onClick={() => setSelectedGuest(null)}>
                Change guest
              </button>
            </div>
          ) : (
            <div>
              <div className="form-row">
                <label>Search guests</label>
                <input value={guestSearch} onChange={(e) => setGuestSearch(e.target.value)} />
              </div>
              {(guestsQuery.data ?? []).map((g) => (
                <div key={g.id} className="card" style={{ marginBottom: 8, cursor: "pointer" }} onClick={() => setSelectedGuest(g)}>
                  <strong>{g.name}</strong>{" "}
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{g.email}</span>
                </div>
              ))}
              <button className="btn secondary" onClick={() => setShowAddGuest(true)}>
                + New guest
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "rate",
      title: "Rate",
      render: () => (
        <div>
          <div className="form-row">
            <label>Rate per night</label>
            <input
              type="number"
              step="0.01"
              value={centsToInput(rateCents)}
              onChange={(e) => setRateCents(inputToCents(e.target.value))}
            />
          </div>
          <p>
            {nights} night{nights === 1 ? "" : "s"} &times; {centsToInput(rateCents)} ={" "}
            <strong>{centsToInput(rateCents * nights)}</strong>
          </p>
          <div className="form-row">
            <label>Source (optional)</label>
            <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Walk-in, phone, website..." />
          </div>
          <div className="form-row">
            <label>Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
      ),
    },
    {
      id: "review",
      title: "Review",
      render: () => (
        <div>
          <p>
            <strong>{selectedGuest?.name}</strong> — Room {selectedRoom?.number}
          </p>
          <p>
            {checkInDate} &rarr; {checkOutDate} ({nights} night{nights === 1 ? "" : "s"})
          </p>
          <p>
            {adults} adult{adults === 1 ? "" : "s"}
            {children > 0 ? `, ${children} children` : ""}
          </p>
          <p>Total: {centsToInput(rateCents * nights)}</p>
        </div>
      ),
    },
  ];

  return (
    <>
      <Wizard
        title="New booking"
        steps={steps}
        onCancel={onClose}
        onFinish={async () => {
          await createBooking.mutateAsync();
        }}
        finishLabel="Create booking"
      />
      {showAddGuest && (
        <AddGuestModal
          onClose={() => setShowAddGuest(false)}
          onCreated={(guest) => setSelectedGuest(guest)}
        />
      )}
    </>
  );
}
