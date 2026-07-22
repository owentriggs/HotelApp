import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApi } from "../../lib/api";
import { centsToInput, inputToCents } from "../../lib/money";
import NewBookingWizard from "./NewBookingWizard";
import type { Booking, ChargeType, Guest, Room } from "@shared/types";

const STATUS_LABELS: Record<Booking["status"], string> = {
  booked: "Booked",
  checked_in: "Checked in",
  checked_out: "Checked out",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export default function BookingsPage() {
  const [showWizard, setShowWizard] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);

  const bookingsQuery = useQuery(["bookings"], () => getApi().bookings.list());
  const guestsQuery = useQuery(["guests", ""], () => getApi().guests.list());
  const roomsQuery = useQuery(["rooms"], () => getApi().rooms.list());

  const guestsById = new Map<number, Guest>((guestsQuery.data ?? []).map((g) => [g.id, g]));
  const roomsById = new Map<number, Room>((roomsQuery.data ?? []).map((r) => [r.id, r]));

  return (
    <div>
      <div className="toolbar">
        <h2 className="page-title">Bookings</h2>
        <button className="btn" onClick={() => setShowWizard(true)}>
          New booking
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Guest</th>
            <th>Room</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {(bookingsQuery.data ?? []).map((b) => (
            <tr key={b.id} style={{ cursor: "pointer" }} onClick={() => setSelectedBookingId(b.id)}>
              <td>{b.bookingNumber}</td>
              <td>{guestsById.get(b.guestId)?.name ?? "-"}</td>
              <td>{roomsById.get(b.roomId)?.number ?? "-"}</td>
              <td>{b.checkInDate}</td>
              <td>{b.checkOutDate}</td>
              <td>{STATUS_LABELS[b.status]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {bookingsQuery.data && bookingsQuery.data.length === 0 && <p>No bookings yet.</p>}

      {showWizard && <NewBookingWizard onClose={() => setShowWizard(false)} />}
      {selectedBookingId !== null && (
        <BookingDetailModal bookingId={selectedBookingId} onClose={() => setSelectedBookingId(null)} />
      )}
    </div>
  );
}

const CHARGE_TYPES: ChargeType[] = ["room", "food", "service", "adjustment"];

function BookingDetailModal({ bookingId, onClose }: { bookingId: number; onClose: () => void }) {
  const queryClient = useQueryClient();
  const bookingsQuery = useQuery(["bookings"], () => getApi().bookings.list());
  const booking = bookingsQuery.data?.find((b) => b.id === bookingId);
  const guestsQuery = useQuery(["guests", ""], () => getApi().guests.list());
  const roomsQuery = useQuery(["rooms"], () => getApi().rooms.list());
  const chargesQuery = useQuery(["folioCharges", bookingId], () =>
    getApi().bookings.listFolioCharges(bookingId)
  );

  const guest = guestsQuery.data?.find((g) => g.id === booking?.guestId);
  const room = roomsQuery.data?.find((r) => r.id === booking?.roomId);

  const [chargeDescription, setChargeDescription] = useState("");
  const [chargeAmount, setChargeAmount] = useState("0");
  const [chargeType, setChargeType] = useState<ChargeType>("service");

  const invalidateAll = () => {
    queryClient.invalidateQueries(["bookings"]);
    queryClient.invalidateQueries(["rooms"]);
    queryClient.invalidateQueries(["folioCharges", bookingId]);
  };

  const checkIn = useMutation(() => getApi().bookings.checkIn(bookingId), { onSuccess: invalidateAll });
  const checkOut = useMutation(() => getApi().bookings.checkOut(bookingId), { onSuccess: invalidateAll });
  const cancel = useMutation(() => getApi().bookings.cancel(bookingId), { onSuccess: invalidateAll });
  const addCharge = useMutation(
    () => getApi().bookings.addFolioCharge(bookingId, chargeType, chargeDescription, inputToCents(chargeAmount)),
    {
      onSuccess: () => {
        invalidateAll();
        setChargeDescription("");
        setChargeAmount("0");
      },
    }
  );

  if (!booking) return null;

  const total = (chargesQuery.data ?? []).reduce((sum, c) => sum + c.amountCents, 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 500 }} onClick={(e) => e.stopPropagation()}>
        <h3>
          Booking {booking.bookingNumber} — {STATUS_LABELS[booking.status]}
        </h3>
        <p>
          <strong>{guest?.name}</strong> — Room {room?.number}
          <br />
          {booking.checkInDate} &rarr; {booking.checkOutDate}
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {booking.status === "booked" && (
            <>
              <button className="btn" onClick={() => checkIn.mutate()}>
                Check in
              </button>
              <button className="btn danger" onClick={() => cancel.mutate()}>
                Cancel booking
              </button>
            </>
          )}
          {booking.status === "checked_in" && (
            <button className="btn" onClick={() => checkOut.mutate()}>
              Check out
            </button>
          )}
        </div>

        <h4>Folio</h4>
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(chargesQuery.data ?? []).map((c) => (
              <tr key={c.id}>
                <td>{c.type}</td>
                <td>{c.description}</td>
                <td>{centsToInput(c.amountCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ textAlign: "right" }}>
          <strong>Total: {centsToInput(total)}</strong>
        </p>

        <h4>Add charge</h4>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={chargeType} onChange={(e) => setChargeType(e.target.value as ChargeType)}>
            {CHARGE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            placeholder="Description"
            value={chargeDescription}
            onChange={(e) => setChargeDescription(e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            type="number"
            step="0.01"
            value={chargeAmount}
            onChange={(e) => setChargeAmount(e.target.value)}
            style={{ width: 90 }}
          />
          <button className="btn" disabled={!chargeDescription} onClick={() => addCharge.mutate()}>
            Add
          </button>
        </div>

        <button className="btn secondary" style={{ marginTop: 20 }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
