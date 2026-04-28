interface Props {
  src?: string | null;
  name?: string | null;
  size?: number;
}

export default function Avatar({ src, name, size = 36 }: Props) {
  const initial = (name || "?")[0].toUpperCase();
  return src ? (
    <img
      src={src}
      alt={name ?? ""}
      className="grp-avatar"
      style={{ width: size, height: size }}
      loading="lazy"
    />
  ) : (
    <span
      className="grp-avatar grp-avatar--fallback"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </span>
  );
}
