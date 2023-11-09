import Image from "next/image";
import editIcon from "../assets/edit-icon.svg";

export default function EditIcon() {
  return (
    <Image
      src={editIcon}
      width="24"
      height="24"
      alt="edit icon"
      className="text-green hover:text-blue transition-all group-hover:translate-y-0.5"
    />
  );
}
