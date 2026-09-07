export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="logo-grid" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="text-[30px] font-extrabold tracking-[-1.7px]">
        trio<span className="text-accent">.</span>
      </span>
    </span>
  );
}
