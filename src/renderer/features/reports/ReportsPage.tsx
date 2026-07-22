import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApi } from "../../lib/api";
import { formatCents } from "../../lib/money";

function todayIso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(todayIso(-30));
  const [dateTo, setDateTo] = useState(todayIso());

  const revenueQuery = useQuery(["reports", "revenue", dateFrom, dateTo], () =>
    getApi().reports.revenue(dateFrom, dateTo)
  );
  const occupancyQuery = useQuery(["reports", "occupancy", dateFrom, dateTo], () =>
    getApi().reports.occupancy(dateFrom, dateTo)
  );

  async function exportRevenueCsv() {
    const r = revenueQuery.data;
    if (!r) return;
    const lines = [
      "Category,Amount",
      `Room,${(r.roomCents / 100).toFixed(2)}`,
      `Food,${(r.foodCents / 100).toFixed(2)}`,
      `Service,${(r.serviceCents / 100).toFixed(2)}`,
      `Adjustment,${(r.adjustmentCents / 100).toFixed(2)}`,
      `Total,${(r.totalCents / 100).toFixed(2)}`,
      "",
      "Payment method,Amount",
      ...r.paymentsByMethod.map((p) => `${p.method},${(p.amountCents / 100).toFixed(2)}`),
    ];
    await getApi().reports.exportCsv(`revenue-${dateFrom}-to-${dateTo}.csv`, lines.join("\n"));
  }

  return (
    <div>
      <h2 className="page-title">Reports</h2>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "flex-end" }}>
        <div className="form-row">
          <label>From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="form-row">
          <label>To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        <div className="card" style={{ flex: 1 }}>
          <div className="toolbar">
            <h3 style={{ margin: 0 }}>Revenue</h3>
            <button className="btn secondary" onClick={exportRevenueCsv}>
              Export CSV
            </button>
          </div>
          {revenueQuery.data && (
            <table className="data-table">
              <tbody>
                <tr>
                  <td>Room</td>
                  <td>{formatCents(revenueQuery.data.roomCents)}</td>
                </tr>
                <tr>
                  <td>Food</td>
                  <td>{formatCents(revenueQuery.data.foodCents)}</td>
                </tr>
                <tr>
                  <td>Service</td>
                  <td>{formatCents(revenueQuery.data.serviceCents)}</td>
                </tr>
                <tr>
                  <td>Adjustment</td>
                  <td>{formatCents(revenueQuery.data.adjustmentCents)}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Total</strong>
                  </td>
                  <td>
                    <strong>{formatCents(revenueQuery.data.totalCents)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
          <h4>By payment method</h4>
          <table className="data-table">
            <tbody>
              {(revenueQuery.data?.paymentsByMethod ?? []).map((p) => (
                <tr key={p.method}>
                  <td>{p.method}</td>
                  <td>{formatCents(p.amountCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ flex: 1 }}>
          <h3 style={{ marginTop: 0 }}>Occupancy</h3>
          {occupancyQuery.data && (
            <>
              <p style={{ fontSize: 28, margin: "8px 0" }}>{occupancyQuery.data.occupancyPct}%</p>
              <p style={{ color: "var(--muted)" }}>
                {occupancyQuery.data.bookedRoomNights} of {occupancyQuery.data.totalRoomNights} room-nights booked
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
