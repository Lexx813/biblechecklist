import SongCard from "./SongCard";
import type { Song } from "../../api/songs";

type Props = {
  songs: Song[];
  lang: "en" | "es";
};

export default function SongGrid({ songs, lang }: Props) {
  if (!songs.length) return null;
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {songs.map((song) => (
        <li key={song.id}>
          <SongCard song={song} lang={lang} />
        </li>
      ))}
    </ul>
  );
}
