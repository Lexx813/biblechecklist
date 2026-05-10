import { DayPicker, type DayPickerProps } from "react-day-picker";
import "react-day-picker/style.css";

export default function LazyDayPicker(props: DayPickerProps) {
  return <DayPicker {...props} />;
}
