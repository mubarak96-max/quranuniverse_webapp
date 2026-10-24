// The side panel before anything is picked in the Library or Empires views.
export function LibraryHint({ view }: { view: "library" | "empires" }) {
  return (
    <section className="panel ip" aria-label={view === "library" ? "Library" : "Empires"}>
      <div className="ip-body">
        <p className="eyebrow">{view === "library" ? "Library" : "Who lived at the same time?"}</p>
        {view === "library" ? (
          <>
            <h2 className="ip-title lh-title">Everyone in the story</h2>
            <p className="ip-lede">
              The people the Quran names, the angels and the unseen, the Prophet&apos;s ﷺ family and Companions, the scholars, the kings,
              the nations and the places. Pick anyone to see what the Quran and hadith say, who came before and after, and who lived
              alongside them.
            </p>
          </>
        ) : (
          <>
            <h2 className="ip-title lh-title">Prophets, powers and people side by side</h2>
            <p className="ip-lede">
              Each lane is a line of history running in parallel. Pick an era above, then any bar: a prophet, an empire, a caliph, a
              scholar or a villain. The world and the Muslim story share one clock.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
