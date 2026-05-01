import SongCard from "./SongCard";
import type { Song } from "../../api/songs";

type Props = {
  songs: Song[];
  lang: "en" | "es";
};

export default function SongGrid({ songs, lang }: Props) {
  if (!songs.length) return null;
  return (
    <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
      {songs.map((song) => (
        <li key={song.id} className="m-0 p-0">
          <SongCard song={song} lang={lang} />
        </li>
      ))}
    </ul>
  );
}
