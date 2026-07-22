import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApi } from "../../lib/api";
import type { Room, RoomStatus, RoomType } from "@shared/types";

const STATUS_LABELS: Record<RoomStatus, string> = {
  vacant: "Vacant",
  occupied: "Occupied",
  dirty: "Dirty",
  clean: "Clean",
  maintenance: "Maintenance",
  out_of_order: "Out of order",
};

export default function RoomsPage() {
  const queryClient = useQueryClient();
  const roomTypesQuery = useQuery(["roomTypes"], () => getApi().roomTypes.list());
  const roomsQuery = useQuery(["rooms"], () => getApi().rooms.list());

  const [showRoomTypeModal, setShowRoomTypeModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const updateStatus = useMutation(
    (vars: { id: number; status: RoomStatus }) => getApi().rooms.updateStatus(vars.id, vars.status),
    { onSuccess: () => queryClient.invalidateQueries(["rooms"]) }
  );

  const roomTypesById = new Map<number, RoomType>(
    (roomTypesQuery.data ?? []).map((rt) => [rt.id, rt])
  );

  return (
    <div>
      <div className="toolbar">
        <h2 className="page-title">Rooms</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn secondary" onClick={() => setShowRoomTypeModal(true)}>
            Manage room types
          </button>
          <button className="btn" onClick={() => setShowRoomModal(true)}>
            Add room
          </button>
        </div>
      </div>

      {roomsQuery.isLoading && <p>Loading rooms...</p>}
      {roomsQuery.data && roomsQuery.data.length === 0 && (
        <div className="card">
          No rooms yet. Add a room type first, then add rooms.
        </div>
      )}

      <div className="room-grid">
        {(roomsQuery.data ?? []).map((room) => (
          <div
            key={room.id}
            className={`room-tile ${room.status}`}
            onClick={() => setSelectedRoom(room)}
          >
            <strong>{room.number}</strong>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>
              {roomTypesById.get(room.roomTypeId)?.name ?? "Unknown type"}
            </div>
            <div className="status">{STATUS_LABELS[room.status]}</div>
          </div>
        ))}
      </div>

      {selectedRoom && (
        <div className="modal-backdrop" onClick={() => setSelectedRoom(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Room {selectedRoom.number}</h3>
            <div className="form-row">
              <label>Status</label>
              <select
                value={selectedRoom.status}
                onChange={(e) => {
                  const status = e.target.value as RoomStatus;
                  updateStatus.mutate({ id: selectedRoom.id, status });
                  setSelectedRoom({ ...selectedRoom, status });
                }}
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn secondary" onClick={() => setSelectedRoom(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {showRoomTypeModal && (
        <RoomTypeModal
          roomTypes={roomTypesQuery.data ?? []}
          onClose={() => setShowRoomTypeModal(false)}
        />
      )}
      {showRoomModal && (
        <RoomModal roomTypes={roomTypesQuery.data ?? []} onClose={() => setShowRoomModal(false)} />
      )}
    </div>
  );
}

function RoomTypeModal({
  roomTypes,
  onClose,
}: {
  roomTypes: RoomType[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [rate, setRate] = useState("0");
  const [maxOccupancy, setMaxOccupancy] = useState("2");

  const createRoomType = useMutation(
    () =>
      getApi().roomTypes.create({
        name,
        description: null,
        baseRateCents: Math.round(parseFloat(rate || "0") * 100),
        maxOccupancy: parseInt(maxOccupancy || "1", 10),
        amenities: null,
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["roomTypes"]);
        setName("");
        setRate("0");
        setMaxOccupancy("2");
      },
    }
  );

  const deleteRoomType = useMutation((id: number) => getApi().roomTypes.delete(id), {
    onSuccess: () => queryClient.invalidateQueries(["roomTypes"]),
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Room types</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Rate</th>
              <th>Max occ.</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {roomTypes.map((rt) => (
              <tr key={rt.id}>
                <td>{rt.name}</td>
                <td>{(rt.baseRateCents / 100).toFixed(2)}</td>
                <td>{rt.maxOccupancy}</td>
                <td>
                  <button
                    className="btn danger"
                    onClick={() => deleteRoomType.mutate(rt.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4>Add room type</h4>
        <div className="form-row">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Standard Double" />
        </div>
        <div className="form-row">
          <label>Base rate (per night)</label>
          <input value={rate} onChange={(e) => setRate(e.target.value)} type="number" step="0.01" />
        </div>
        <div className="form-row">
          <label>Max occupancy</label>
          <input
            value={maxOccupancy}
            onChange={(e) => setMaxOccupancy(e.target.value)}
            type="number"
            min="1"
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn"
            disabled={!name || createRoomType.isLoading}
            onClick={() => createRoomType.mutate()}
          >
            Add
          </button>
          <button className="btn secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function RoomModal({ roomTypes, onClose }: { roomTypes: RoomType[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [number, setNumber] = useState("");
  const [roomTypeId, setRoomTypeId] = useState<number | "">(roomTypes[0]?.id ?? "");
  const [floor, setFloor] = useState("");

  const createRoom = useMutation(
    () =>
      getApi().rooms.create({
        number,
        roomTypeId: Number(roomTypeId),
        floor: floor || null,
        status: "vacant",
        notes: null,
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["rooms"]);
        onClose();
      },
    }
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add room</h3>
        {roomTypes.length === 0 ? (
          <p>Create a room type first.</p>
        ) : (
          <>
            <div className="form-row">
              <label>Room number/name</label>
              <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="101" />
            </div>
            <div className="form-row">
              <label>Room type</label>
              <select
                value={roomTypeId}
                onChange={(e) => setRoomTypeId(Number(e.target.value))}
              >
                {roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>Floor (optional)</label>
              <input value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="1" />
            </div>
          </>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn"
            disabled={!number || !roomTypeId || createRoom.isLoading}
            onClick={() => createRoom.mutate()}
          >
            Add
          </button>
          <button className="btn secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
