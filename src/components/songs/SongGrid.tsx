import SongCard from "./SongCard";
import type { Song } from "../../api/songs";

type Props = {
  songs: Song[];
  lang: "en" | "es";
};

export default function SongGrid({ songs, lang }: Props) {
  if (!songs.length) return null;
  return (
    <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {songs.map((song) => (
        <li key={song.id}>
          <SongCard song={song} lang={lang} />
        </li>
      ))}
    </ul>
  );
}
