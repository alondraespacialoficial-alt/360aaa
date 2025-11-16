export function waLink(base: string, msg: string) {
  const encoded = encodeURIComponent(msg);
  // base ya incluye ?phone=...; agregamos &text=
  if (base.includes("text=")) return base; // por si ya viene prearmado
  return `${base}&text=${encoded}`;
}
