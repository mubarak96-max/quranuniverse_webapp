import type { RowItem } from "@/lib/data";

export function BoxRow({ row }: { row: RowItem[] }) {
  return (
    <div className="row">
      {row.map((item, i) =>
        "conn" in item ? (
          <div key={i} className="conn">
            <i>{item.conn}</i>
          </div>
        ) : (
          <div
            key={i}
            className={["box", `box-${item.box}`, item.strike && "strike", item.num && "num"].filter(Boolean).join(" ")}
          >
            <b>{item.title}</b>
            {item.sub?.map((s, j) => <span key={j}>{s}</span>)}
          </div>
        ),
      )}
    </div>
  );
}
