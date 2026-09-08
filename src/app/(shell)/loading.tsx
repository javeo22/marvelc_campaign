export default function Loading() {
  return (
    <section className="comic-panel" aria-busy="true">
      <span className="caption-box">Loading</span>
      <h1>Preparing panel</h1>
      <p>Campaign content is being staged from the local app bundle.</p>
    </section>
  );
}
