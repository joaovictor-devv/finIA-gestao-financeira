export default function Icon({ name, className = "" }) {
  return <span aria-hidden="true" className={"material-symbols-outlined " + className}>{name}</span>;
}
